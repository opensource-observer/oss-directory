import os
from write_yaml import dump


LOCAL_PATH = os.path.join(os.path.dirname(__file__), "..", "..", "data", "collections")
VERSION = 7


def generate_collection_yaml(collection_slug: str, collection_name: str, project_slugs: list, version: int = VERSION) -> bool:
    """
    Generate a YAML file for a given collection. This function verifies if a YAML file 
    already exists for the given slug before proceeding to create a new YAML file.
    Returns:
    bool: True if the YAML file was created successfully, False otherwise (e.g., in case of duplicates or file already exists).
    """
    
    yaml_data = {
        "version": version, 
        "name": collection_slug, 
        "display_name": collection_name, 
        "projects": project_slugs
    }
    
    path = os.path.join(LOCAL_PATH, f"{collection_slug}.yaml")
    if os.path.exists(path):
        print("File already exists.")
        return False
    dump(yaml_data, path)    
    
    print(f"Generated YAML file at {path}")
    return True