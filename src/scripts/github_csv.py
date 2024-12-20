import os
import csv
import requests
from typing import Dict, List, Optional
import yaml

# Constants
GITHUB_API_TOKEN = os.getenv("GITHUB_API_KEY")
HEADERS = {"Authorization": f"token {GITHUB_API_TOKEN}"} if GITHUB_API_TOKEN else {}
API_BASE = "https://api.github.com"
LOCAL_PATH = os.path.join(os.path.dirname(__file__), "..", "..", "data", "projects")
VERSION = 7

def get_github_entity_type(owner: str) -> tuple[str, Optional[str]]:
    """
    Determine if a GitHub account is an organization or user and get their display name.
    
    Returns:
    tuple[str, Optional[str]]: ('org'|'user', display_name)
    """
    # Try org endpoint first
    org_response = requests.get(f"{API_BASE}/orgs/{owner}", headers=HEADERS)
    if org_response.status_code == 200:
        return 'org', org_response.json().get('name', owner)

    # If not org, try user endpoint
    user_response = requests.get(f"{API_BASE}/users/{owner}", headers=HEADERS)
    if user_response.status_code == 200:
        return 'user', user_response.json().get('name', owner)

    raise ValueError(f"Could not find GitHub entity: {owner}")

def create_or_update_yaml_file(owner: str, repos: List[str], entity_type: str, display_name: str) -> None:
    """Create or update a YAML file for the given owner with their repositories."""
    first_letter = owner[0].lower()
    dir_path = os.path.join(LOCAL_PATH, first_letter)
    os.makedirs(dir_path, exist_ok=True)
    file_path = os.path.join(dir_path, f"{owner}.yaml")

    # Check if file already exists
    existing_content = {}
    if os.path.exists(file_path):
        with open(file_path, 'r') as f:
            existing_content = yaml.safe_load(f)
        
        # Skip if it's an organization
        if entity_type == 'org':
            print(f"Skipping existing organization: {owner}")
            return
        
        # For users, merge new repos with existing ones
        existing_urls = {item['url'] for item in existing_content.get('github', [])}
        new_repos = [repo for repo in repos 
                    if f"https://github.com/{owner}/{repo}" not in existing_urls]
        
        if not new_repos:
            print(f"No new repos to add for: {owner}")
            return
        
        # Add new repos to existing content
        for repo in new_repos:
            existing_content['github'].append({"url": f"https://github.com/{owner}/{repo}"})
        
        # Update version if needed
        existing_content['version'] = VERSION
        
        yaml_content = existing_content
    else:
        # Create new file with initial content
        yaml_content = {
            "version": VERSION,
            "name": owner,
            "display_name": display_name or owner,
            "github": []
        }

        if entity_type == 'org':
            yaml_content["github"].append({"url": f"https://github.com/{owner}"})
        else:
            for repo in repos:
                yaml_content["github"].append({"url": f"https://github.com/{owner}/{repo}"})

    # Write YAML file
    with open(file_path, 'w') as f:
        yaml.dump(yaml_content, f, sort_keys=False, allow_unicode=True)
    print(f"{'Updated' if existing_content else 'Created'} {file_path}")

def process_csv(csv_path: str) -> None:
    """Process the CSV file and create YAML files for each unique owner."""
    owners_repos: Dict[str, List[str]] = {}
    
    with open(csv_path, 'r') as f:
        reader = csv.DictReader(f)
        for row in reader:
            owner = row['owner'].strip()
            repo = row['repo'].strip()
            if owner not in owners_repos:
                owners_repos[owner] = []
            owners_repos[owner].append(repo)

    for owner, repos in owners_repos.items():
        try:
            entity_type, display_name = get_github_entity_type(owner)
            create_or_update_yaml_file(owner, repos, entity_type, display_name)
        except Exception as e:
            print(f"Error processing {owner}: {str(e)}")

def main():
    if not GITHUB_API_TOKEN:
        print("Warning: GITHUB_TOKEN environment variable not set. API rate limits will be restricted.")
    
    csv_path = input("Enter the path to your CSV file: ").strip()
    if not os.path.exists(csv_path):
        print("Error: File does not exist")
        return
    
    process_csv(csv_path)

if __name__ == "__main__":
    main()
    