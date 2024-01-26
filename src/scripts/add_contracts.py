import logging
import json
import os
import pandas as pd
import sys

from map_artifacts import get_yaml_data_from_path, load_yaml_data, map_addresses_to_slugs
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
    
    project_yaml_data = get_yaml_data_from_path(LOCAL_PATH)
    yaml_data = {data['slug']: data for data in project_yaml_data}
    
    chain = chain.lower().strip()
    address_to_slug_map = map_addresses_to_slugs(project_yaml_data, chain)
    
    # load the Dune data
    dune_data = pd.read_csv(filepath, usecols=['namespace', 'name', 'from', 'address'])
    dune_data['from'] = dune_data['from'].str.lower()
    dune_data['address'] = dune_data['address'].str.lower()

    # filter out contracts for creating tokens and LPs
    dups = dune_data.groupby(['namespace', 'name', 'from'])['address'].nunique()
    dups = dups[dups > 1].index

    for _, row in dune_data.iterrows():
        namespace = row['namespace']
        name = row['name']
        from_address = row['from']
        if (namespace, name, from_address) in dups:
            continue
        contract_address = row['address']
        if from_address in address_to_slug_map:
            project_slug = address_to_slug_map[from_address]
            update_address(project_slug, contract_address, name, [chain], ['contract'])
            logging.info(f"Added {contract_address} ({name}) in {project_slug}.yaml")
        

if __name__ == "__main__":
    add_contracts_from_dune_export(sys.argv[1], sys.argv[2])
