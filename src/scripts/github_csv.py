from dotenv import load_dotenv
import os
import csv
import requests
from typing import Dict, List, Optional
import yaml

# Constants
load_dotenv()
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

def create_yaml_file(owner: str, repos: List[str], entity_type: str, display_name: str) -> None:
    """Create a YAML file for the given owner with their repositories."""
    # Create directory if it doesn't exist
    first_letter = owner[0].lower()
    dir_path = os.path.join(LOCAL_PATH, first_letter)
    os.makedirs(dir_path, exist_ok=True)

    # Prepare YAML content
    yaml_content = {
        "version": VERSION,
        "name": owner,
        "display_name": display_name or owner,
        "github": []
    }

    if entity_type == 'org':
        # For organizations, just add the org URL
        yaml_content["github"].append({"url": f"https://github.com/{owner}"})
    else:
        # For users, add all their repos from the CSV
        for repo in repos:
            yaml_content["github"].append({"url": f"https://github.com/{owner}/{repo}"})

    # Write YAML file
    file_path = os.path.join(dir_path, f"{owner}.yaml")
    with open(file_path, 'w') as f:
        yaml.dump(yaml_content, f, sort_keys=False, allow_unicode=True)
    print(f"Created {file_path}")

def process_csv(csv_path: str) -> None:
    """Process the CSV file and create YAML files for each unique owner."""
    # Dictionary to collect repos by owner
    owners_repos: Dict[str, List[str]] = {}
    
    # Read CSV and collect repos by owner
    with open(csv_path, 'r') as f:
        reader = csv.DictReader(f)
        for row in reader:
            owner = row['owner'].strip()
            repo = row['repo'].strip()
            if owner not in owners_repos:
                owners_repos[owner] = []
            owners_repos[owner].append(repo)

    # Process each owner
    for owner, repos in owners_repos.items():
        try:
            entity_type, display_name = get_github_entity_type(owner)
            create_yaml_file(owner, repos, entity_type, display_name)
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