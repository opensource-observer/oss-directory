import os
import csv
import yaml
from typing import Dict, List


LOCAL_PATH = os.path.join(os.path.dirname(__file__), "..", "..", "data", "projects")
PACKAGE_SOURCES = {
    "NPM": {
        "yaml_key": "npm",
        "url_template": "https://www.npmjs.com/package/{name}"
    },
    "GO": {
        "yaml_key": "go",
        "url_template": "https://github.com/{name}",
        "transform": lambda name: name.replace("github.com/", "", 1) if name.startswith("github.com/") else None
    },
    "RUST": {
        "yaml_key": "crates",
        "url_template": "https://crates.io/crates/{name}"
    },
    "PYTHON": {
        "yaml_key": "pypi",
        "url_template": "https://pypi.org/project/{name}"
    },
    "PYPI": {
        "yaml_key": "pypi",
        "url_template": "https://pypi.org/project/{name}"
    },
    "PIP": {
        "yaml_key": "pypi",
        "url_template": "https://pypi.org/project/{name}"
    }
}

def get_package_url(source: str, name: str) -> str:
    """Generate the appropriate URL for a package based on its source."""
    source = source.upper()
    if source not in PACKAGE_SOURCES:
        raise ValueError(f"Unsupported package source: {source}")
    
    config = PACKAGE_SOURCES[source]
    
    if source == "GO" and not name.startswith("github.com/"):
        raise ValueError(f"Go package must be from github.com: {name}")
    
    package_name = config.get("transform", lambda x: x)(name)
    if package_name is None:
        raise ValueError(f"Invalid package name for {source}: {name}")
        
    return config["url_template"].format(name=package_name)

def get_yaml_key(source: str) -> str:
    """Get the appropriate YAML key for a package source."""
    source = source.upper()
    if source not in PACKAGE_SOURCES:
        raise ValueError(f"Unsupported package source: {source}")
    return PACKAGE_SOURCES[source]["yaml_key"]

def update_yaml_file(project_name: str, packages: Dict[str, List[str]]) -> None:
    """Update the YAML file for the given project with new package URLs."""
    first_letter = project_name[0].lower()
    file_path = os.path.join(LOCAL_PATH, first_letter, f"{project_name}.yaml")
    
    if not os.path.exists(file_path):
        print(f"Warning: Project file not found for {project_name}")
        return

    with open(file_path, 'r') as f:
        yaml_content = yaml.safe_load(f)

    for source, package_names in packages.items():
        yaml_key = get_yaml_key(source)
        
        if yaml_key not in yaml_content:
            yaml_content[yaml_key] = []

        existing_urls = {item['url'] for item in yaml_content[yaml_key]}
        package_names.sort()
        
        for package_name in package_names:
            url = get_package_url(source, package_name)
            if url not in existing_urls:
                yaml_content[yaml_key].append({"url": url})
                print(f"Added {url} to {project_name}")
        yaml_content[yaml_key].sort(key=lambda x: x['url'])

    with open(file_path, 'w') as f:
        yaml.dump(yaml_content, f, sort_keys=False, allow_unicode=True)

def process_csv(csv_path: str) -> None:
    """Process the CSV file and update YAML files with new packages."""
    project_packages: Dict[str, Dict[str, List[str]]] = {}
    
    with open(csv_path, 'r') as f:
        reader = csv.DictReader(f)
        for row in reader:
            project_name = row['project_name'].strip()
            source = row['package_artifact_source'].strip()
            package_name = row['package_artifact_name'].strip()
            
            if project_name not in project_packages:
                project_packages[project_name] = {}
            if source not in project_packages[project_name]:
                project_packages[project_name][source] = []
            
            project_packages[project_name][source].append(package_name)

    for project_name, packages in project_packages.items():
        try:
            update_yaml_file(project_name, packages)
        except Exception as e:
            print(f"Error processing {project_name}: {str(e)}")

def main():
    csv_path = input("Enter the path to your CSV file: ").strip()
    if not os.path.exists(csv_path):
        print("Error: File does not exist")
        return
    
    process_csv(csv_path)

if __name__ == "__main__":
    main()
