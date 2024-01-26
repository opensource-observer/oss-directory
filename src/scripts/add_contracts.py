import logging
import json
import os
import pandas as pd
import sys

from map_artifacts import get_yaml_data_from_path, load_yaml_data, map_addresses_to_slugs
from update_project import update_address


LOCAL_PATH = os.path.join(os.path.dirname(__file__), "..", "..", "data", "projects")

logging.basicConfig(level=logging.INFO, filename="add_contracts.log", filemode="w", datefmt="%Y-%m-%d %H:%M:%S", format="%(asctime)-15s %(levelname)-8s %(message)s")


temp_forks_to_ignore = {
  "arbitrum:0x74c764d41b77dbbb4fe771dab1939b00b146894a": [
    "a/abracadabra.yaml"
  ],
  "arbitrum:0xe9426fcf504d448cc2e39783f1d1111dc0d8e4e0": [
    "s/sperax.yaml",
    "p/plutusdao.yaml"
  ],
  "arbitrum:0x8df6efec5547e31b0eb7d1291b511ff8a2bf987c": [
    "b/balancer.yaml"
  ],
  "arbitrum:0x7dfdef5f355096603419239ce743bfaf1120312b": [
    "b/balancer.yaml"
  ],
  "arbitrum:0xef44d6786b2b4d544b7850fe67ce6381626bf2d6": [
    "b/balancer.yaml"
  ],
  "arbitrum:0x2433477a10fc5d31b9513c638f19ee85caed53fd": [
    "b/balancer.yaml"
  ],
  "arbitrum:0xcf0a32bbef8f064969f21f7e02328fb577382018": [
    "b/balancer.yaml"
  ],
  "arbitrum:0xf1665e19bc105be4edd3739f88315cc699cc5b65": [
    "b/balancer.yaml"
  ],
  "arbitrum:0xf23b4db826dba14c0e857029dff076b1c0264843": [
    "b/balancer.yaml"
  ]
}



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
        contract_address = row['address']
        if from_address in address_to_slug_map:
            if (namespace, name, from_address) in dups:
                continue
            if contract_address in address_to_slug_map:
                continue
            project_slug = address_to_slug_map[from_address]
            if f"{chain}:{contract_address}" in temp_forks_to_ignore:
                for fork in temp_forks_to_ignore[f"{chain}:{contract_address}"]:
                    if project_slug in fork:
                        logging.info(f"Ignoring {namespace} : {from_address} -> {contract_address} ({name})")
                        continue
                    
            update_address(project_slug, contract_address, name, [chain], ['contract'])

        logging.info(f"No YAML for {namespace} : {from_address} -> {contract_address} ({name})")            
        

if __name__ == "__main__":
    add_contracts_from_dune_export(sys.argv[1], sys.argv[2])
