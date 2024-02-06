# Spaghetti code to validate addresses and trace contract deployments

import os
import json
import logging
from typing import List, Dict, Any
import yaml

from map_artifacts import get_yaml_data_from_path
from trace_contracts import get_txns_from_address, is_eoa, get_contract_creator, fetch_contract_name, get_ens

# Define constants and configurations
PROJECTS_DATA_PATH = os.path.join(os.path.dirname(__file__), "..", "..", "data", "projects")
LOGGING_FORMAT = '%(asctime)s - %(levelname)s - %(message)s'

# Configure logging
logging.basicConfig(filename='validate_addresses.log', level=logging.INFO, format=LOGGING_FORMAT)


def read_json_file(file_path: str) -> List[Dict[str, Any]]:
    """Utility function to read data from a JSON file."""
    with open(file_path, "r") as file:
        return json.load(file)
    

def read_yaml_file(file_path: str) -> List[Dict[str, Any]]:
    """Utility function to read data from a YAML file."""
    with open(file_path, "r") as file:
        return yaml.safe_load(file)


def write_json_file(file_path: str, data: Any) -> None:
    """Utility function to write data to a JSON file."""
    with open(file_path, 'w') as json_file:
        json.dump(data, json_file, indent=2)
    logging.info(f"Data written to {file_path}")


def generate_addresses(
    address_type_filter: str = "eoa",
    required_address_tags: List[str] = ["deployer", "creator"],
    required_networks: List[str] = ["mainnet", "optimism", "arbitrum"],
    projects_directory: str = PROJECTS_DATA_PATH,
) -> List[Dict[str, Any]]:
    """Generates a list of addresses filtered by specified criteria."""

    project_data = get_yaml_data_from_path(projects_directory)
    filtered_addresses = []
    for project in project_data:
        for blockchain_entry in project.get('blockchain', []):
            address = blockchain_entry.get('address')
            if address and address_type_filter in blockchain_entry.get('tags', []) and any(network in required_networks for network in blockchain_entry.get('networks', [])) and any(tag in required_address_tags for tag in blockchain_entry.get('tags', [])):
                filtered_addresses.append({
                    'address': address, 
                    'slug': project.get('slug'),
                    'networks': blockchain_entry.get('networks', [])
                })

    filtered_addresses.sort(key=lambda entry: entry['slug'])
    logging.info(f"Generated address snapshot with {len(filtered_addresses)} entries.")
    return filtered_addresses


def trace_deployments(deployers: List[Dict[str, Any]], target_chains: List[str] = ["mainnet", "optimism", "arbitrum"]) -> List[Dict[str, Any]]:
    """Traces contract deployments from deployer addresses."""

    deployers_with_deployments = []
    for deployer in deployers:
        deployments_found = False
        for chain in target_chains:
            eoa_check = is_eoa(chain, deployer['address'])
            if not eoa_check:
                logging.warning(f"{deployer['address']} ({deployer['slug']}) is not an EOA on {chain}.")
                continue
            
            transactions = get_txns_from_address(chain, deployer['address'], action="txlist", sleep=0)
            if not transactions:
                logging.warning(f"{deployer['address']} ({deployer['slug']}) has no transactions on {chain}.")
                continue
            
            deployments = [tx['contractAddress'] for tx in transactions if not tx['to'] and tx['input'] and tx['isError'] == '0']
            if deployments:
                deployments_found = True
                if 'deployments' not in deployer:
                    deployer['deployments'] = {}
                deployer['deployments'][chain] = deployments
                logging.info(f"{deployer['address']} ({deployer['slug']}) deployed {len(deployments)} contracts on {chain}.")
            else:
                logging.warning(f"{deployer['address']} ({deployer['slug']}) did not deploy any contracts on {chain}.")
        
        if deployments_found:
            deployers_with_deployments.append(deployer)
    logging.info(f"Generated validated deployers snapshot with {len(deployers_with_deployments)} entries.")
    return deployers_with_deployments


def trace_to_deployer(contracts: List[Dict[str, Any]], chain: str) -> List[Dict[str, Any]]:
    """Traces contract deployments to deployer addresses."""
    contracts_with_deployers = []
    for contract in contracts:
        creator = get_contract_creator(chain, contract['address'], sleep=0)
        if not creator:
            logging.warning(f"{contract['address']} ({contract['slug']}) has no traceable creator on {chain}.")
            continue
        
        eoa_check = is_eoa(chain, creator)
        if not eoa_check:
            logging.warning(f"{creator} is not an EOA on {chain}.")
            continue
        
        contracts_with_deployers.append({
            'contract_address': contract['address'], 
            'deployer_address': creator,
            'slug': contract['slug'], 
            'chain': chain
        })
        logging.info(f"{contract['address']} ({contract['slug']}) was deployed by {creator} on {chain}.")
    logging.info(f"Generated validated contracts snapshot with {len(contracts_with_deployers)} entries.")
    return contracts_with_deployers


def add_ens_to_addresses(addresses: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Add ENS names to addresses based on their transaction history."""

    addresses_with_ens = []
    for address in addresses:
        ens = get_ens(address['address'])
        if ens:
            address['ens'] = ens
            logging.info(f"ENS added to {address['address']}: {ens}.")
        addresses_with_ens.append(address)
    return addresses_with_ens


def add_tags_to_contract(chain: str, address: str , sleep=.2) -> Dict[str, Any]:
    """Add tags to a contract address based on its transaction history."""

    result = {
        "address": address.lower(),
        "chain": chain,
        "tags": ["contract"],
        "name": "Unknown",
        "txn_count": 0,
        "txn_internal_count": 0,
        "deploy_count": 0,
        "deploy_internal_count": 0
    }
    name = fetch_contract_name(chain, address, sleep=sleep)
    if name:
        result['name'] = name

    txns = get_txns_from_address(chain, address, action='txlist', sleep=sleep)
    result['txn_count'] = len(txns) 
    deploys = [tx['contractAddress'] for tx in txns if not tx['to'] and tx['input'] and tx['isError'] == '0']
    result['deploy_count'] = len(deploys)
    
    txns_internal = get_txns_from_address(chain, address, action='txlistinternal', sleep=sleep)
    result['txn_internal_count'] = len(txns_internal)
    deploys_internal = [tx['contractAddress'] for tx in txns_internal if not tx['to'] and tx['type'] == 'create' and tx['isError'] == '0']
    result['deploy_internal_count'] = len(deploys_internal)

    if len(deploys) > 1 or len(deploys_internal):
        result['tags'].append('factory')
    if len(deploys_internal):
        result['tags'].append('proxy')

    logging.info(f"Tags added to {address} ({name}) on {chain}: {result['tags']}.")
    return result


def review_contracts_from_validated_deployers(validated_deployer_data: dict) -> List[Dict[str, Any]]:
    """Review contracts from validated deployers and add tags to them."""

    validated_contracts = []
    for deployer in validated_deployer_data:
        deployer_address = deployer['address']
        slug = deployer['slug']
        for chain, contract_list in deployer['deployments'].items():
            for contract in contract_list:
                result = add_tags_to_contract(chain, contract, sleep=0)
                result['deployer'] = deployer_address
                result['slug'] = slug
                validated_contracts.append(result)
    logging.info(f"Generated validated contracts snapshot with {len(validated_contracts)} entries.")
    return validated_contracts


def validate_safe(chain: str, address: str) -> bool:
    """Validate if an address is a known Safe wallet."""

    contract_name = fetch_contract_name(chain, address)
    if contract_name:
        contract_name = contract_name.lower()
        if 'safe' in contract_name or 'multisig' in contract_name:
            logging.info(f"{address} is a Safe wallet.")
            return True
        elif 'proxy' in contract_name and chain == 'mainnet':
            logging.info(f"{address} is a Safe proxy contract.")
            return True
    logging.warning(f"{address} is not a Safe wallet.")
    return False


if __name__ == "__main__":
    
    # Generate addresses and optionally save them to a file

    # deployers = generate_addresses(address_type_filter="eoa", required_address_tags=["deployer", "creator"])
    # write_json_file('temp/deployers.json', deployers)
    # factories = generate_addresses(address_type_filter="contract", required_address_tags=["factory"])
    # write_json_file('temp/factories.json', factories)
    # contracts = generate_addresses(address_type_filter="contract", required_address_tags=["contract"])
    # write_json_file('temp/contracts.json', contracts)

    # safe_wallets = generate_addresses(address_type_filter="safe", required_address_tags=["wallet"])
    # validated_safe_wallets = [safe for safe in safe_wallets if validate_safe(safe['networks'][0], safe['address'])]
    # write_json_file('temp/safe_wallets.json', validated_safe_wallets)

    eoa_wallets = generate_addresses(address_type_filter="eoa", required_address_tags=["wallet"])
    updated_wallets_data = add_ens_to_addresses(eoa_wallets)
    write_json_file('temp/eoa_wallets.json', eoa_wallets)
    

    # Trace deployments and optionally save them
    # deployers_data = read_yaml_file('temp/save/deployers.yaml')
    # deployers_data = [{"address": k, "slug": v} for k, v in deployers_data.items()]
    # deployments = trace_deployments(deployers_data)
    # write_json_file('temp/save/validated_deployers.json', deployments)

    # validated_deployers_data = read_json_file('temp/save/validated_deployers.json')
    # updated_deployers_data = add_ens_to_addresses(validated_deployers_data)
    # write_json_file('temp/save/validated_deployers.json', updated_deployers_data)

    #contracts = review_contracts_from_validated_deployers(validated_deployers_data)
    #write_json_file('temp/save/validated_contracts.json', contracts)


    # Example of tracing contracts to deployer

    # op_unmapped_deployers = read_json_file('temp/optimism_unmapped_factories.json')
    # deployers = trace_to_deployer(op_unmapped_deployers, 'optimism')
    # write_json_file('temp/optimism_factory_deployers.json', deployers)