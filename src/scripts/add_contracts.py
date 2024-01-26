import logging
import json
import os
import pandas as pd
import sys

from map_artifacts import get_yaml_data_from_path, load_yaml_data
from update_project import update_address


LOCAL_PATH = os.path.join(os.path.dirname(__file__), "..", "..", "data", "projects")

logging.basicConfig(level=logging.INFO, filename="add_contracts.log", filemode="w", datefmt="%Y-%m-%d %H:%M:%S", format="%(asctime)-15s %(levelname)-8s %(message)s")


def add_contracts_from_dune_export(filepath: str, chain: str) -> None:
    """
    Add contracts from a Dune CSV dump to a project YAML file.

    Args:
    filepath (str): The file path of the Dune Analytics export.
    chain (str): The chain name.
    """

    if not os.path.exists(filepath):
        logging.error(f"File does not exist: {filepath}")
        return
    
    chain = chain.lower().strip()
    dune_data = pd.read_csv(filepath, usecols=['name', 'address', 'from'])

    project_yaml_data = get_yaml_data_from_path(LOCAL_PATH)
    yaml_data = {data['slug']: data for data in project_yaml_data}

    with open(filepath, 'r') as file:
        file_content = file.read()
        json_data = json.loads(file_content)
        contracts = json_data.get("data", [])
        for contract in contracts:
            name = contract.get("name", "")
            address = contract.get("address", "")
            networks = contract.get("networks", [])
            tags = contract.get("tags", [])
            update_address(project_slug, address, name, networks, tags)


