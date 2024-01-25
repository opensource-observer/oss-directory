import logging
import json
import os
import sys

from map_artifacts import get_yaml_data_from_path, load_yaml_data
from write_yaml import dump


LOCAL_PATH = os.path.join(os.path.dirname(__file__), "..", "..", "data", "projects")

logging.basicConfig(level=logging.INFO, filename="update_project.log", filemode="w", datefmt="%Y-%m-%d %H:%M:%S", format="%(asctime)-15s %(levelname)-8s %(message)s")

def replace_single_quotes_with_double_quotes_in_file(file_path):
    try:
        with open(file_path, 'r') as file:
            file_content = file.read()

        modified_content = file_content.replace("'", '"')

        with open(file_path, 'w') as file:
            file.write(modified_content)

        logging.info(f'Successfully replaced single quotes with double quotes in {file_path}')
    except Exception as e:
        logging.error(f'Error replacing single quotes with double quotes in {file_path}: {e}')


def append_github_urls(filepath: str, github_url: str) -> None:
    """
    Add GitHub URLs to YAML files for a given project YAML file. The function only updates existing entries.

    Args:
    filepath (str): The file path of the YAML file containing project details.
    github_url (str): The GitHub URL to add.
    """
    if not os.path.exists(filepath):
        logging.error(f"File does not exist: {filepath}")
        return
    
    project_data = load_yaml_data(filepath)
    if not project_data:
        logging.error(f"Error loading YAML data at {filepath}.")
        return

    yaml_url_data = project_data.get("urls", [])
    url = github_url.lower().strip().strip("/")
    if url in yaml_url_data:
        logging.warning(f"URL {url} already exists.")
        return
    
    yaml_url_data.append(url)
    project_data["urls"] = yaml_url_data
    dump(project_data, filepath)
    logging.info(f"Updated {filepath}")
    replace_single_quotes_with_double_quotes_in_file(filepath)


def update_addresses_from_json(filepath: str) -> None:
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
    
    
    project_yaml_data = get_yaml_data_from_path(LOCAL_PATH)
    yaml_data = {data['slug']: data for data in project_yaml_data}
    with open(filepath, mode='r', encoding='utf-8') as file:
        data = json.load(file)
        for slug, addresses in data.items():
            project_path = os.path.join(LOCAL_PATH, slug[0], f"{slug}.yaml")
            if not os.path.exists(project_path):
                logging.warning(f"File {project_path} does not exist.")
                continue
            
            project_data = yaml_data.get(slug)
            yaml_address_data = project_data.get("blockchain", [])
            for address, details in addresses.items():
                name = details.get("name")
                networks = details.get("networks")
                tags = details.get("tags")

                updated = False
                for entry in yaml_address_data:                    
                    if entry['address'].lower() == address.lower():
                        if name and not entry.get("name"):
                            entry["name"] = name
                        entry["networks"] = list(set(entry.get("networks", []) + networks))
                        entry["tags"] = list(set(entry.get("tags", []) + tags))
                        logging.info(f"Updated {address} in {project_path}")
                        updated = True
                        break
                if not updated:
                    entry = {
                        "address": address,
                        "networks": networks,
                        "tags": tags
                    }
                    if name:
                        entry["name"] = name
                    yaml_address_data.append(entry)
                    logging.info(f"Added {address} to {project_path}")

            dump(project_data, project_path)
            logging.info(f"Dumped YAML at {project_path}")
            replace_single_quotes_with_double_quotes_in_file(project_path)
                

def main() -> None:
    inpath = sys.argv[1]
    logging.info(f"Processing {inpath}")
    update_addresses_from_json(inpath)


if __name__ == "__main__":
    main()
