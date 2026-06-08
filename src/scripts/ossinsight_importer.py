#!/usr/bin/env python3
"""
Script to import collections from OSS Insight API and create/update OSO project and collection files.

This script:
1. Lists all collections from OSS Insight
2. Allows user to select a collection
3. Fetches repositories for that collection
4. Creates/updates OSO project files for missing projects
5. Optionally creates a new OSO collection file
"""

import os
import sys
import requests
from typing import Dict, List, Optional, Tuple
from datetime import datetime
from tabulate import tabulate
from dotenv import load_dotenv

from map_artifacts import get_yaml_data_from_path, map_repos_to_names
from write_yaml import dump

load_dotenv()

OSSINSIGHT_API_BASE = "https://api.ossinsight.io/v1"
OSSINSIGHT_HEADERS = {"Accept": "application/json"}
GITHUB_API_BASE = "https://api.github.com"
GITHUB_API_TOKEN = os.getenv("GITHUB_API_KEY")
GITHUB_HEADERS = {"Authorization": f"token {GITHUB_API_TOKEN}"} if GITHUB_API_TOKEN else {}

LOCAL_PROJECTS_PATH = os.path.join(os.path.dirname(__file__), "..", "..", "data", "projects")
LOCAL_COLLECTIONS_PATH = os.path.join(os.path.dirname(__file__), "..", "..", "data", "collections")
VERSION = 7


def list_collections() -> List[Dict[str, str]]:
    """
    Fetch all collections from OSS Insight API.
    
    Returns:
        List[Dict[str, str]]: List of collections with 'id' and 'name' keys
    """
    url = f"{OSSINSIGHT_API_BASE}/collections/"
    
    try:
        response = requests.get(url, headers=OSSINSIGHT_HEADERS)
        response.raise_for_status()
        data = response.json()
        
        # OSS Insight returns SQL endpoint format
        if data.get("type") == "sql_endpoint" and "data" in data:
            rows = data["data"].get("rows", [])
            collections = []
            for row in rows:
                collections.append({
                    "id": str(row.get("id", "")),
                    "name": row.get("name", "")
                })
            return collections
        else:
            print("Unexpected API response format")
            return []
            
    except requests.exceptions.RequestException as e:
        print(f"Failed to fetch collections: {e}")
        return []


def get_collection_repos(collection_id: str) -> List[Dict[str, str]]:
    """
    Fetch repositories for a specific collection from OSS Insight API.
    
    Args:
        collection_id (str): The collection ID
        
    Returns:
        List[Dict[str, str]]: List of repos with 'repo_id' and 'repo_name' keys
    """
    url = f"{OSSINSIGHT_API_BASE}/collections/{collection_id}/repos/"
    
    try:
        response = requests.get(url, headers=OSSINSIGHT_HEADERS)
        response.raise_for_status()
        data = response.json()
        
        # OSS Insight returns SQL endpoint format
        if data.get("type") == "sql_endpoint" and "data" in data:
            rows = data["data"].get("rows", [])
            repos = []
            for row in rows:
                repos.append({
                    "repo_id": str(row.get("repo_id", "")),
                    "repo_name": row.get("repo_name", "")
                })
            return repos
        else:
            print("Unexpected API response format")
            return []
            
    except requests.exceptions.RequestException as e:
        print(f"Failed to fetch collection repos: {e}")
        return []


def display_collections_table(collections: List[Dict[str, str]]) -> None:
    """
    Display collections in a formatted table.

    Args:
        collections (List[Dict[str, str]]): List of collections with 'id' and 'name' keys
    """
    if not collections:
        print("No collections found.")
        return

    table_data = [[col["id"], col["name"]] for col in collections]
    print("\n" + tabulate(table_data, headers=["ID", "Collection Name"], tablefmt="grid") + "\n")


def filter_collections(collections: List[Dict[str, str]], keywords: List[str]) -> List[Dict[str, str]]:
    """
    Filter collections by keywords (case-insensitive substring match on name).

    Args:
        collections (List[Dict[str, str]]): All collections
        keywords (List[str]): Keywords to filter by (OR logic — any match included)

    Returns:
        List[Dict[str, str]]: Filtered collections
    """
    if not keywords:
        return collections
    lower_keywords = [kw.lower() for kw in keywords]
    return [
        col for col in collections
        if any(kw in col["name"].lower() for kw in lower_keywords)
    ]


def prompt_batch_collection_ids(collections: List[Dict[str, str]]) -> List[str]:
    """
    Show filtered collections and let the user confirm or edit the selection.

    Args:
        collections (List[Dict[str, str]]): Pre-filtered collections to present

    Returns:
        List[str]: Confirmed collection IDs to process
    """
    valid_ids = {col["id"] for col in collections}
    id_to_col = {col["id"]: col for col in collections}

    display_collections_table(collections)
    print(f"{len(collections)} collection(s) matched.")

    while True:
        print("\nOptions:")
        print("  [Enter]           — process all listed collections")
        print("  comma-sep IDs     — process only those IDs (e.g. 1,3,7)")
        print("  q                 — quit")
        raw = input("Your choice: ").strip()

        if raw.lower() == "q":
            return []

        if raw == "":
            return [col["id"] for col in collections]

        chosen = [t.strip() for t in raw.split(",") if t.strip()]
        invalid = [c for c in chosen if c not in valid_ids]
        if invalid:
            print(f"Unknown IDs: {', '.join(invalid)}. Valid IDs are: {', '.join(sorted(valid_ids))}")
            continue

        print("\nYou selected:")
        display_collections_table([id_to_col[c] for c in chosen])
        confirm = input("Confirm? (y/n): ").strip().lower()
        if confirm == "y":
            return chosen


def get_github_entity_type(owner: str) -> Tuple[str, Optional[str]]:
    """
    Determine if a GitHub account is an organization or user and get their display name.
    
    Args:
        owner (str): The GitHub owner (org or username)
    
    Returns:
        Tuple[str, Optional[str]]: ('org'|'user', display_name)
    
    Raises:
        ValueError: If the entity cannot be found or API authentication fails
    """
    org_response = requests.get(f"{GITHUB_API_BASE}/orgs/{owner}", headers=GITHUB_HEADERS)
    if org_response.status_code == 200:
        return 'org', org_response.json().get('name', owner)
    
    if org_response.status_code == 401:
        error_msg = org_response.json().get('message', 'Unauthorized')
        raise ValueError(f"GitHub API authentication failed (401): {error_msg}. Please check your GITHUB_API_KEY.")
    if org_response.status_code == 403:
        error_data = org_response.json()
        error_msg = error_data.get('message', 'Forbidden')
        if 'rate limit' in error_msg.lower():
            raise ValueError("GitHub API rate limit exceeded. Please try again later.")
            raise ValueError(f"GitHub API access forbidden (403): {error_msg}")

    user_response = requests.get(f"{GITHUB_API_BASE}/users/{owner}", headers=GITHUB_HEADERS)
    if user_response.status_code == 200:
        return 'user', user_response.json().get('name', owner)
    
    if user_response.status_code == 401:
        error_msg = user_response.json().get('message', 'Unauthorized')
        raise ValueError(f"GitHub API authentication failed (401): {error_msg}. Please check your GITHUB_API_KEY.")
    if user_response.status_code == 403:
        error_data = user_response.json()
        error_msg = error_data.get('message', 'Forbidden')
        if 'rate limit' in error_msg.lower():
            raise ValueError("GitHub API rate limit exceeded. Please try again later.")
            raise ValueError(f"GitHub API access forbidden (403): {error_msg}")

    raise ValueError(f"Could not find GitHub entity: {owner} (org: {org_response.status_code}, user: {user_response.status_code})")


def get_user_repos(username: str) -> List[str]:
    """
    Fetch all public repositories for a GitHub user.
    
    Args:
        username (str): The GitHub username
        
    Returns:
        List[str]: List of repository names
    """
    repos = []
    page = 1
    per_page = 100
    
    while True:
        url = f"{GITHUB_API_BASE}/users/{username}/repos"
        params = {"page": page, "per_page": per_page, "type": "all"}
        
        try:
            response = requests.get(url, headers=GITHUB_HEADERS, params=params)
            response.raise_for_status()
            page_repos = response.json()
            
            if not page_repos:
                break
                
            repos.extend([repo["name"] for repo in page_repos])
            
            if len(page_repos) < per_page:
                break
                
            page += 1
            
        except requests.exceptions.RequestException as e:
            print(f"Error fetching repos for {username}: {e}")
            break
    
    return repos


def normalize_github_url(url: str) -> str:
    """
    Normalize a GitHub URL (lowercase, strip trailing slashes).
    
    Args:
        url (str): The GitHub URL
        
    Returns:
        str: Normalized URL
    """
    return url.lower().strip().rstrip("/")


def find_existing_project(owner: str, repo_url: str, project_names: set, repo_to_name_mapping: Dict[str, str]) -> Optional[str]:
    """
    Check if a project already exists by name or URL.
    
    Args:
        owner (str): The GitHub owner (org or username)
        repo_url (str): The GitHub repository URL
        project_names (set): Set of existing project names
        repo_to_name_mapping (Dict[str, str]): Mapping of GitHub URLs to project names
        
    Returns:
        Optional[str]: The existing project name if found, None otherwise
    """
    if owner in project_names:
        return owner
    
    normalized_url = normalize_github_url(repo_url)
    if normalized_url in repo_to_name_mapping:
        return repo_to_name_mapping[normalized_url]
    
    org_url = normalize_github_url(f"https://github.com/{owner}")
    if org_url in repo_to_name_mapping:
        return repo_to_name_mapping[org_url]
    
    return None


def create_org_project(owner: str, display_name: str) -> bool:
    """
    Create a project file for a GitHub organization.
    
    Args:
        owner (str): The GitHub organization name
        display_name (str): The display name for the project
        
    Returns:
        bool: True if created successfully, False otherwise
    """
    owner_lower = owner.lower()
    first_char = owner_lower[0]
    project_dir = os.path.join(LOCAL_PROJECTS_PATH, first_char)
    os.makedirs(project_dir, exist_ok=True)
    
    file_path = os.path.join(project_dir, f"{owner_lower}.yaml")
    
    if os.path.exists(file_path):
        print(f"Project file already exists: {file_path}")
        return False
    
    github_url = f"https://github.com/{owner}"
    yaml_data = {
        "version": VERSION,
        "name": owner_lower,
        "display_name": display_name or owner,
        "github": [{"url": github_url}]
    }
    
    dump(yaml_data, file_path)
    print(f"Created organization project: {file_path}")
    return True


def create_user_project(owner: str, display_name: str, repos: List[str]) -> bool:
    """
    Create a project file for a GitHub user with all their repositories.
    
    Args:
        owner (str): The GitHub username
        display_name (str): The display name for the project
        repos (List[str]): List of repository names
        
    Returns:
        bool: True if created successfully, False otherwise
    """
    owner_lower = owner.lower()
    first_char = owner_lower[0]
    project_dir = os.path.join(LOCAL_PROJECTS_PATH, first_char)
    os.makedirs(project_dir, exist_ok=True)
    
    file_path = os.path.join(project_dir, f"{owner_lower}.yaml")
    
    if os.path.exists(file_path):
        print(f"Project file already exists: {file_path}")
        return False
    
    github_urls = [{"url": f"https://github.com/{owner}/{repo}"} for repo in repos]
    
    yaml_data = {
        "version": VERSION,
        "name": owner_lower,
        "display_name": display_name or owner,
        "github": github_urls
    }
    
    dump(yaml_data, file_path)
    print(f"Created user project with {len(repos)} repos: {file_path}")
    return True


def create_collection_file(collection_name: str, collection_display_name: str, project_names: List[str]) -> bool:
    """
    Create a new OSO collection file.
    
    Args:
        collection_name (str): The collection name (slug)
        collection_display_name (str): The display name for the collection
        project_names (List[str]): List of project names to include
        
    Returns:
        bool: True if created successfully, False otherwise
    """
    collection_slug = f"ossinsight-{collection_name.lower().replace(' ', '-')}"
    file_path = os.path.join(LOCAL_COLLECTIONS_PATH, f"{collection_slug}.yaml")
    
    if os.path.exists(file_path):
        print(f"Collection file already exists: {file_path}")
        response = input("Do you want to update it? (y/n): ").lower().strip()
        if response != 'y':
            return False
        
        import yaml
        with open(file_path, 'r') as f:
            existing_data = yaml.safe_load(f)
        
        existing_projects = set(existing_data.get("projects", []))
        new_projects = set(project_names)
        all_projects = sorted(list(existing_projects | new_projects))
        
        yaml_data = {
            "version": VERSION,
            "name": collection_slug,
            "display_name": collection_display_name,
            "projects": all_projects
        }
    else:
        yaml_data = {
            "version": VERSION,
            "name": collection_slug,
            "display_name": collection_display_name,
            "projects": sorted(project_names)
        }
    
    dump(yaml_data, file_path)
    print(f"Created/updated collection file: {file_path}")
    return True


def process_collection(
    collection_id: str,
    collection_name: str,
    project_names: set,
    repo_to_name_mapping: Dict[str, str],
) -> Tuple[List[str], List[str], List[str]]:
    """
    Fetch repos for one collection, create missing projects, return project lists.

    Args:
        collection_id (str): OSS Insight collection ID
        collection_name (str): Human-readable collection name (for logging)
        project_names (set): Mutable set of known project names (updated in-place)
        repo_to_name_mapping (Dict[str, str]): Mutable URL→name mapping (updated in-place)

    Returns:
        Tuple of (processed_projects, existing_projects_found, new_projects_created)
    """
    print(f"\nFetching repositories for '{collection_name}' (id={collection_id})...")
    repos = get_collection_repos(collection_id)

    if not repos:
        print("  No repositories found — skipping.")
        return [], [], []

    print(f"  Found {len(repos)} repositories.")

    processed_projects: List[str] = []
    existing_projects_found: List[str] = []
    new_projects_created: List[str] = []
    processed_owners: set = set()

    for repo_info in repos:
        repo_name = repo_info.get("repo_name", "")
        if not repo_name or "/" not in repo_name:
            continue

        owner, repo = repo_name.split("/", 1)
        owner_lower = owner.lower()
        repo_url = f"https://github.com/{owner}/{repo}"

        if owner_lower in processed_owners:
            continue

        existing_project = find_existing_project(owner, repo_url, project_names, repo_to_name_mapping)

        if existing_project:
            print(f"  ✓ Found existing project '{existing_project}' for {repo_name}")
            existing_projects_found.append(existing_project)
            if existing_project not in processed_projects:
                processed_projects.append(existing_project)
            processed_owners.add(owner_lower)
        else:
            try:
                entity_type, display_name = get_github_entity_type(owner)

                if entity_type == "org":
                    if create_org_project(owner, display_name):
                        processed_projects.append(owner_lower)
                        new_projects_created.append(owner_lower)
                        project_names.add(owner_lower)
                        repo_to_name_mapping[normalize_github_url(f"https://github.com/{owner}")] = owner_lower
                        processed_owners.add(owner_lower)
                else:
                    user_repos = get_user_repos(owner)
                    if user_repos:
                        if create_user_project(owner, display_name, user_repos):
                            processed_projects.append(owner_lower)
                            new_projects_created.append(owner_lower)
                            project_names.add(owner_lower)
                            for user_repo in user_repos:
                                repo_to_name_mapping[
                                    normalize_github_url(f"https://github.com/{owner}/{user_repo}")
                                ] = owner_lower
                            processed_owners.add(owner_lower)
                    else:
                        print(f"  ⚠ No repositories found for user {owner}, skipping")
                        processed_owners.add(owner_lower)

            except Exception as e:
                print(f"  ⚠ Error processing {repo_name}: {e}")
                processed_owners.add(owner_lower)
                continue

    return processed_projects, existing_projects_found, new_projects_created


def main():
    """Main workflow function."""
    print("OSS Insight Collection Importer")
    print("=" * 50)

    print("\nFetching collections from OSS Insight...")
    collections = list_collections()

    if not collections:
        print("No collections found. Exiting.")
        return

    # --- keyword filter ---
    raw_keywords = input(
        "\nEnter keyword(s) to filter collections (comma-separated, or leave blank for all): "
    ).strip()
    keywords = [k.strip() for k in raw_keywords.split(",") if k.strip()] if raw_keywords else []

    filtered = filter_collections(collections, keywords)
    if not filtered:
        print("No collections matched your keywords. Exiting.")
        return

    # --- batch confirmation / selection ---
    selected_ids = prompt_batch_collection_ids(filtered)
    if not selected_ids:
        print("No collections selected. Exiting.")
        return

    id_to_col = {col["id"]: col for col in collections}

    # --- load existing projects once ---
    print("\nLoading existing OSO projects...")
    yaml_data = get_yaml_data_from_path(path=LOCAL_PROJECTS_PATH)
    repo_to_name_mapping = map_repos_to_names(yaml_data)
    project_names = {data.get("name") for data in yaml_data if data.get("name")}
    print(f"Found {len(project_names)} existing projects.")

    # --- process each collection ---
    batch_results: List[Dict] = []

    for collection_id in selected_ids:
        col = id_to_col[collection_id]
        processed, existing, created = process_collection(
            collection_id, col["name"], project_names, repo_to_name_mapping
        )
        batch_results.append({
            "id": collection_id,
            "name": col["name"],
            "processed": processed,
            "existing": existing,
            "created": created,
        })

    # --- summary ---
    print("\n" + "=" * 50)
    print("Batch Summary:")
    summary_rows = [
        [r["name"], len(r["existing"]), len(r["created"]), len(r["processed"])]
        for r in batch_results
    ]
    print(
        tabulate(
            summary_rows,
            headers=["Collection", "Existing", "New", "Total"],
            tablefmt="grid",
        )
    )

    # --- collection file creation ---
    print("\n" + "=" * 50)
    current_date = datetime.now()
    month_year = current_date.strftime("%b %Y")

    for result in batch_results:
        if not result["processed"]:
            print(f"\nNo projects for '{result['name']}' — skipping collection file.")
            continue

        response = input(
            f"\nCreate OSO collection file for '{result['name']}'? (y/n): "
        ).lower().strip()

        if response == "y":
            collection_display_name = f"{result['name']} (ossinsight, {month_year})"
            unique_projects = sorted(set(result["processed"]))
            create_collection_file(result["name"], collection_display_name, unique_projects)
            print("  ✓ Collection file created/updated.")
        else:
            print("  Skipped.")


if __name__ == "__main__":
    if not GITHUB_API_TOKEN:
        print("Warning: GITHUB_API_KEY environment variable not set.")
        print("GitHub API rate limits will be restricted and some features may not work.")
        response = input("Continue anyway? (y/n): ").lower().strip()
        if response != 'y':
            sys.exit(1)
    
    main()

