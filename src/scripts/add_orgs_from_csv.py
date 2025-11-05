#!/usr/bin/env python3
"""
Script to automatically add GitHub organization projects from a CSV file.

The CSV should have a column with organization names (one per row).
Each org will be created as a project file with:
- Appropriate path based on first letter (e.g., datachainlab -> projects/d/datachainlab.yaml)
- GitHub org URL artifact
- Display name matching the project name
"""

import csv
import os
import sys
from typing import Set, Dict

from map_artifacts import get_yaml_data_from_path, map_repos_to_names
from write_yaml import dump


LOCAL_PATH = os.path.join(os.path.dirname(__file__), "..", "..", "data", "projects")
VERSION = 7


def generate_org_yaml(org_name: str, repo_to_name_mapping: Dict[str, str]) -> bool:
    """
    Generate a YAML file for a GitHub organization.
    
    Args:
        org_name (str): The GitHub organization name (e.g., 'datachainlab')
        repo_to_name_mapping (dict): Dictionary mapping GitHub URLs to names for duplicate checking
        
    Returns:
        bool: True if the YAML file was created successfully, False otherwise
    """
    # Normalize the org name (lowercase, strip whitespace)
    org_name = org_name.lower().strip()
    
    if not org_name:
        print("Empty org name, skipping...")
        return False
    
    # Build the GitHub org URL
    github_url = f"https://github.com/{org_name}"
    
    # Check if this URL already exists
    if github_url in repo_to_name_mapping:
        print(f"⚠️  {org_name}: {github_url} already exists at: {repo_to_name_mapping[github_url]}")
        return False
    
    # Determine the directory based on first character
    first_char = org_name[0]
    project_dir = os.path.join(LOCAL_PATH, first_char)
    
    # Create directory if it doesn't exist
    if not os.path.exists(project_dir):
        os.makedirs(project_dir)
        print(f"📁 Created directory: {first_char}/")
    
    # Build the file path
    file_path = os.path.join(project_dir, f"{org_name}.yaml")
    
    # Check if file already exists
    if os.path.exists(file_path):
        print(f"⚠️  File already exists: {first_char}/{org_name}.yaml")
        return False
    
    # Create the YAML data structure
    yaml_data = {
        "version": VERSION,
        "name": org_name,
        "display_name": org_name,
        "github": [{"url": github_url}]
    }
    
    # Write the YAML file
    dump(yaml_data, file_path)
    print(f"✅ Created: {first_char}/{org_name}.yaml")
    
    # Update the mapping to track this URL
    repo_to_name_mapping[github_url] = org_name
    
    return True


def load_orgs_from_csv(csv_filepath: str, column_name: str = None) -> None:
    """
    Load organization names from a CSV file and generate YAML files for each.
    
    Args:
        csv_filepath (str): Path to the CSV file
        column_name (str, optional): Name of the column containing org names. 
                                    If None, uses the first column.
    """
    if not os.path.exists(csv_filepath):
        print(f"❌ Error: CSV file not found at: {csv_filepath}")
        sys.exit(1)
    
    # Load existing projects to check for duplicates
    print("📋 Loading existing projects...")
    repo_to_name_mapping = map_repos_to_names(get_yaml_data_from_path(path=LOCAL_PATH))
    print(f"   Found {len(repo_to_name_mapping)} existing projects")
    
    created_orgs: Set[str] = set()
    skipped_count = 0
    
    try:
        with open(csv_filepath, mode='r', encoding='utf-8') as file:
            reader = csv.DictReader(file)
            
            # If no column name specified, use the first column
            if column_name is None:
                column_name = reader.fieldnames[0]
                print(f"🔍 Using column: '{column_name}'")
            
            if column_name not in reader.fieldnames:
                print(f"❌ Error: Column '{column_name}' not found in CSV")
                print(f"   Available columns: {', '.join(reader.fieldnames)}")
                sys.exit(1)
            
            print("\n🚀 Processing organizations...\n")
            
            for row_num, row in enumerate(reader, start=2):  # start=2 because row 1 is header
                org_name = row[column_name].strip()
                
                if not org_name:
                    continue
                
                if generate_org_yaml(org_name, repo_to_name_mapping):
                    created_orgs.add(org_name)
                else:
                    skipped_count += 1
                    
    except Exception as e:
        print(f"❌ Error processing CSV file: {e}")
        sys.exit(1)
    
    # Print summary
    print(f"\n{'='*60}")
    print("📊 Summary:")
    print(f"   ✅ Created: {len(created_orgs)} project(s)")
    print(f"   ⚠️  Skipped: {skipped_count} (already exist or invalid)")
    print(f"{'='*60}")
    
    if created_orgs:
        print("\n📝 Created projects:")
        for org in sorted(created_orgs):
            print(f"   - {org}")


def main():
    """Main entry point for the script."""
    if len(sys.argv) < 2:
        print("Usage: python add_orgs_from_csv.py <csv_file_path> [column_name]")
        print("\nExample:")
        print("  python add_orgs_from_csv.py new_projects.csv")
        print("  python add_orgs_from_csv.py new_projects.csv org_name")
        print("\nIf column_name is not provided, the first column will be used.")
        sys.exit(1)
    
    csv_filepath = sys.argv[1]
    column_name = sys.argv[2] if len(sys.argv) > 2 else None
    
    load_orgs_from_csv(csv_filepath, column_name)


if __name__ == "__main__":
    main()

