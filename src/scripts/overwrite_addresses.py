import logging
import json
import os
import sys

from write_yaml import dump, replace_single_quotes_with_double_quotes_in_file
from map_artifacts import load_yaml_data


LOCAL_PATH = os.path.join(os.path.dirname(__file__), "..", "..", "data", "projects")

logging.basicConfig(level=logging.INFO, filename="overwrite_addresses.log", filemode="w", datefmt="%Y-%m-%d %H:%M:%S", format="%(asctime)-15s %(levelname)-8s %(message)s")


def update_project(project_slug, blockchain_data) -> bool:
    """
    Update an address in a project YAML file. The function only updates existing entries.

    Args:
    project_slug (str): The project slug.
    blockchain_data (list): A list of dictionaries containing address details.

    Returns:
    bool: True if the project was updated successfully, False otherwise.
    """

    project_path = os.path.join(LOCAL_PATH, project_slug[0], f"{project_slug}.yaml")
    if not os.path.exists(project_path):
        logging.warning(f"File {project_path} does not exist.")
        return False
    
    project_data = load_yaml_data(project_path)
    if not project_data:
        logging.error(f"Error loading YAML data at {project_path}.")
        return False
    
    logging.info(f"Updating {project_slug} with {len(blockchain_data)} addresses; previously project had {len(project_data['blockchain'])} addresses.")
    project_data["blockchain"] = blockchain_data

    dump(project_data, project_path)
    logging.info(f"Dumped YAML at {project_slug[0]}/{project_slug}.yaml")
    replace_single_quotes_with_double_quotes_in_file(project_path)

    return True
    

def overwrite_addresses_from_json(filepath: str) -> None:
    """
    Load address details from a JSON file and update YAML files for each address. Addresses are identified 
    by their checksummed format and slugs specified in the JSON file. The function only updates 
    existing entries.

    Args:
    filepath (str): The file path of the JSON file containing address details.
    """    
    if not os.path.exists(filepath):
        logging.error("File does not exist.")
        return
    
    with open(filepath, mode='r', encoding='utf-8') as file:
        data = json.load(file)
        for project_slug, addresses in data.items():
            blockchain_data = []
            for address, details in addresses.items():
                record = {
                    "address": address,                
                    "networks": details.get("networks", []),
                    "tags": details.get("tags", [])
                }
                if "name" in details:
                    record["name"] = details["name"]
                blockchain_data.append(record)
            update_project(project_slug, blockchain_data)
                
                

def main() -> None:
    inpath = sys.argv[1]
    logging.info(f"Processing {inpath}")
    overwrite_addresses_from_json(inpath)


if __name__ == "__main__":
    main()
