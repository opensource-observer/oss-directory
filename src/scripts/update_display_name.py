import os
import requests
import yaml
from typing import Optional

GITHUB_API_TOKEN = os.getenv("GITHUB_API_KEY")
HEADERS = {"Authorization": f"token {GITHUB_API_TOKEN}"} if GITHUB_API_TOKEN else {}
API_BASE = "https://api.github.com"
LOCAL_PATH = os.path.join(os.path.dirname(__file__), "..", "..", "data", "projects")

def get_github_org_name(github_url: str) -> Optional[str]:
    owner = github_url.split('/')[-1]
    print(f"Fetching organization name for owner: {owner}")
    response = requests.get(f"{API_BASE}/orgs/{owner}", headers=HEADERS)
    if response.status_code == 200:
        org_name = response.json().get('name')
        print(f"Organization name found: {org_name}")
        return org_name
    else:
        print(f"Failed to fetch organization name for {owner}. Status code: {response.status_code}")
        return None

def update_display_name(project_name: str) -> Optional[str]:
    project_path = os.path.join(LOCAL_PATH, project_name[0], f"{project_name}.yaml")
    print(f"Project path: {project_path}")
    if not os.path.exists(project_path):
        print(f"File does not exist: {project_path}")
        return None

    with open(project_path, 'r') as file:
        project_data = yaml.safe_load(file)

    github_urls = project_data.get('github', [])
    if not github_urls:
        print(f"No GitHub URL found in {project_path}")
        return None

    github_url = github_urls[0]['url']
    print(f"GitHub URL: {github_url}")
    org_name = get_github_org_name(github_url)
    
    if not org_name:
        print("Could not fetch organization name from GitHub.")
        manual_name = input(f"Please enter display name for {project_name} manually (or press Enter to skip): ").strip()
        if manual_name:
            org_name = manual_name
        else:
            return None

    project_data['display_name'] = org_name
    with open(project_path, 'w') as file:
        yaml.dump(project_data, file, sort_keys=False, allow_unicode=True)
    print(f"Updated display_name for {project_name} to {org_name}")
    return org_name

def main():
    import sys
    
    # Get project names from command line arguments
    project_names = sys.argv[1:] if len(sys.argv) > 1 else []
    
    # If no command line arguments, prompt for interactive input
    if not project_names:
        while True:
            project_name = input("Enter the project name (or press Enter to quit): ").strip()
            if not project_name:
                break
            update_display_name(project_name)
    else:
        # Process list of project names
        for project_name in project_names:
            print(f"\nProcessing {project_name}...")
            update_display_name(project_name)

if __name__ == "__main__":
    main() 