import argparse
import csv
import json
import logging
import os
import requests
import time

from dotenv import load_dotenv
from ens import ENS
from web3 import Web3

from map_artifacts import get_yaml_data_from_path, map_addresses_to_slugs


# Configure logging
logging.basicConfig(
    filename='trace_contracts.log', 
    level=logging.INFO, 
    format='%(asctime)s - %(levelname)s - %(message)s'
)

# Load environment variables
load_dotenv()
ALCHEMY_API_KEY = os.environ['ALCHEMY_API_KEY']

# API configurations
APIS = {
    'arbitrum': {
        'etherscan': 'https://api.arbiscan.io/api',
        'etherscan_api_key': os.getenv("ARBISCAN_API_KEY"),
        'alchemy': f'https://arb-mainnet.g.alchemy.com/v2/{ALCHEMY_API_KEY}'
    },
    'optimism': {
        'etherscan': f'https://api-optimistic.etherscan.io/api',
        'etherscan_api_key': os.getenv("OP_ETHERSCAN_API_KEY"),
        'alchemy': f'https://opt-mainnet.g.alchemy.com/v2/{ALCHEMY_API_KEY}'
    },
    'mainnet': {
        'etherscan': 'https://api.etherscan.io/api',
        'etherscan_api_key': os.getenv("ETHERSCAN_API_KEY"),
        'alchemy': f'https://eth-mainnet.g.alchemy.com/v2/{ALCHEMY_API_KEY}'
    }
}
DEFAULT_API = APIS['mainnet']
W3 = Web3(Web3.HTTPProvider(DEFAULT_API['alchemy']))
NS = ENS.from_web3(W3)

# Avoid rate limiting
SLEEP_TIME = 0.5

# OSS Directory projects
LOCAL_PATH = os.path.join(os.path.dirname(__file__), "..", "..", "data", "projects")

def is_eoa(chain, address, sleep=SLEEP_TIME):
    
    api = APIS.get(chain, DEFAULT_API)
    url = api['alchemy']
    payload = {
        "id": 1,
        "jsonrpc": "2.0",
        "params": [address, "latest"],
        "method": "eth_getCode"
    }
    headers = {
        "accept": "application/json",
        "content-type": "application/json"
    }
    response = requests.post(url, json=payload, headers=headers)
    if response.status_code != 200:
        logging.error(f"{address} ({chain}) cannot be found on Alchemy")
        return None
    result = response.json()['result']
    time.sleep(sleep)
    return result == '0x'


def get_ens(addr):
    try:
        addr = Web3.toChecksumAddress(addr.lower())        
        name = NS.name(addr)
        logging.info(f"{addr} has ENS set to {name}")
        return name
    except:
        logging.error(f"{addr} cannot lookup ENS name")
        return None
    

def fetch_contract_name(chain, address, sleep=SLEEP_TIME):    
    
    try:
        api = APIS.get(chain, DEFAULT_API)
        url = api['etherscan']
        api_key = api['etherscan_api_key']
        params = {
            'module': 'contract',
            'action': 'getsourcecode',
            'address': address,
            'apikey': api_key
        }        
        response = requests.get(url, params=params)
        if response.json()['status'] != '1':
            logging.error(f"{address} ({chain}) cannot lookup a contract name")
            logging.error(response.text)            
            return None

        contract_name = response.json()['result'][0]['ContractName']
        if not contract_name:
            logging.warning(f"{address} ({chain}) does not have a contract name")
            return None
        
        logging.info(f"{address} ({chain}) -> {contract_name}")
        time.sleep(sleep)
        return contract_name    
    except:
        logging.error(f"{address} ({chain}) fatal error trying to lookup up a contract name")
        return None


def get_contract_creator(chain, address, sleep=SLEEP_TIME):
    try:
        api = APIS.get(chain, DEFAULT_API)
        url = api['etherscan']
        api_key = api['etherscan_api_key']
        params = {
            'module': 'contract',
            'action': 'getcontractcreation',
            'contractaddresses': address,
            'apikey': api_key
        }
        response = requests.get(url, params=params)
        response_json = response.json()
        if response_json.get('status') != '1':
            logging.error(f"{address} ({chain}) cannot lookup contract creator from etherscan: {response.text}")
            return None
        return response_json['result'][0]['contractCreator']
    except Exception as e:
        logging.error(f"{address} ({chain}) fatal error looking up contract creator from etherscan: {e}")
        return None


def get_txns_from_address(chain, address, action='txlist', sleep=SLEEP_TIME):
    try:
        api = APIS.get(chain, DEFAULT_API)
        url = api['etherscan']
        api_key = api['etherscan_api_key']
        params = {
            'module': 'account',
            'action': action,
            'address': address,
            'apikey': api_key
        }
        response = requests.get(url, params=params)
        response_json = response.json()
        if response_json.get('status') != '1':
            logging.error(f"{address} ({chain}) cannot lookup {action} from etherscan: {response.text}")
            return []
        return response_json['result']
    except Exception as e:
        logging.error(f"{address} ({chain}) fatal error looking up {action} from etherscan: {e}")
        return []


def analyze_address_tags(chain, address, sleep=SLEEP_TIME):

    is_eoa_addr = is_eoa(chain, address, sleep=0)
    result = get_txns_from_address(chain, address, action='txlist', sleep=sleep)
    if result:
        deployments = [tx['contractAddress'] for tx in result if not tx['to'] and tx['input'] and tx['isError'] == '0']
        if deployments:
            if is_eoa_addr:
                return ["eoa", "deployer"]
            else:
                return ["contract", "factory"]

    result = get_txns_from_address(chain, address, action='txlistinternal', sleep=sleep)
    if result:
        deployments = [tx['contractAddress'] for tx in result if not tx['to'] and tx['type'] == 'create' and tx['isError'] == '0']
        if deployments and not is_eoa_addr:
            return ["contract", "factory", "proxy"]
        
    if is_eoa_addr:
        return ["eoa"]
    return ["contract"]


def parse_csv(csv_path, address_col, project_col, chain):

    with open(csv_path, 'r') as f:
        reader = csv.DictReader(f)
        rows = [row for row in reader]
    logging.info(f"Found {len(rows)} rows in {csv_path}")

    yaml_data = get_yaml_data_from_path(path=LOCAL_PATH)
    mapping = map_addresses_to_slugs(yaml_data, chain='mainnet')
    mapping.update(map_addresses_to_slugs(yaml_data, chain='optimism'))
    logging.info(f"Found {len(mapping)} addresses in {LOCAL_PATH}")

    project_addresses = {}    
    for row in rows:
        address = row[address_col]
        project = row[project_col]

        if project in project_addresses:
            if address in project_addresses[project]:
                continue
            
        name = None
        is_address = Web3.isAddress(address)
        if not is_address:
            logging.warning(f"{address} ({chain}) {project} skipped because it's not a valid address.")
            continue

        tags = analyze_address_tags(chain, address, sleep=0)
        if "contract" in tags:
            contract_name = fetch_contract_name(chain, address, sleep=0)
            if contract_name:
                name = contract_name
        if "eoa" in tags:
            ens = get_ens(address)
            if ens:
                name = ens            

        slug = mapping.get(address)
        address_data = {
            address: {                
                "tags": tags,
                "networks": [chain],
                "name": name,
                "slug": slug
            }
        }
        if project not in project_addresses:
            project_addresses[project] = {}
        project_addresses[project].update(address_data)
        logging.info(f"{address} ({chain}): {project}  -> {tags}")
        time.sleep(SLEEP_TIME)
        
    return project_addresses


def dune_snapshot_to_json(csv_path, address_col, project_col, chain, outpath):
    project_addresses = parse_csv(csv_path, address_col, project_col, chain)
    with open(outpath, 'w') as json_file:
        json.dump(project_addresses, json_file, indent=4)
    logging.info(f"Saved to {outpath}")


def generate_ossd_update_json(json_inpath, json_outpath):
    with open(json_inpath, 'r') as f:
        data = json.load(f)
    results = {}
    for project, addresses in data.items():
        for address, address_data in addresses.items():
            if address_data.get('slug'):
                slug = address_data['slug']
                if slug not in results:
                    results[slug] = addresses
                else:
                    results[slug].update(addresses)
                break
    
    for slug, addresses in results.items():
        for address, address_data in addresses.items():
            del address_data['slug']
            if not address_data.get('name'):
                del address_data['name']
    
    with open(json_outpath, 'w') as json_file:
        json.dump(results, json_file, indent=4)
    logging.info(f"Saved to {json_outpath}")


def main(args):
    dune_snapshot_to_json(
        csv_path=args.csv_path,
        address_col=args.address_col,
        project_col=args.project_col,
        chain=args.chain,
        outpath=args.json_outpath
    )
    generate_ossd_update_json(
        json_inpath=args.json_outpath,
        json_outpath=args.ossd_outpath
    )

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description='Process CSV files and generate JSON outputs.')
    parser.add_argument('--csv_path', type=str, required=True, help='Path to the input CSV file')
    parser.add_argument('--address_col', type=str, required=True, help='Column name for addresses in CSV')
    parser.add_argument('--project_col', type=str, required=True, help='Column name for project names in CSV')
    parser.add_argument('--chain', type=str, required=True, help='Blockchain name (e.g., mainnet, optimism)')
    parser.add_argument('--json_outpath', type=str, required=True, help='Path for intermediate JSON output')
    parser.add_argument('--ossd_outpath', type=str, required=True, help='Path for final OSSD JSON output')
    args = parser.parse_args()

    main(args)

# python src/scripts/trace_contracts.py --csv_path "" --address_col "from" --project_col "namespace" --chain "" --json_outpath "" --ossd_outpath ""