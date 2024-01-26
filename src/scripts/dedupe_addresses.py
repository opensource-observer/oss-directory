import logging
import os
import sys

from map_artifacts import get_yaml_data_from_path, load_yaml_data
from write_yaml import dump, replace_single_quotes_with_double_quotes_in_file


LOCAL_PATH = os.path.join(os.path.dirname(__file__), "..", "..", "data", "projects")

logging.basicConfig(level=logging.INFO, filename="dedupe_addresses.log", filemode="w", datefmt="%Y-%m-%d %H:%M:%S", format="%(asctime)-15s %(levelname)-8s %(message)s")

def dedupe_contracts() -> None:
    """
    Deduplicate contracts in a project YAML file.

    """
    
    project_yaml_data = get_yaml_data_from_path(LOCAL_PATH)
    yaml_data = {data['slug']: data for data in project_yaml_data}

    for project_slug, project_data in yaml_data.items():
        project_path = os.path.join(LOCAL_PATH, project_slug[0], f"{project_slug}.yaml")
        if "blockchain" not in project_data:
            continue
        yaml_address_data = project_data.get("blockchain")
        addresses = []
        duplicates = []
        for entry in yaml_address_data:
            address = entry['address'].lower()
            if address in addresses:
                duplicates.append(entry)
                logging.info(f"Duplicate {address} in {project_path.replace(LOCAL_PATH, '')}")
            else:
                addresses.append(address)

        if duplicates:
            project_data["blockchain"] = [entry for entry in yaml_address_data if entry not in duplicates]
            dump(project_data, project_path)
            logging.info(f"Deduped {project_path.replace(LOCAL_PATH, '')}")
            replace_single_quotes_with_double_quotes_in_file(project_path)

if __name__ == "__main__":
    dedupe_contracts()