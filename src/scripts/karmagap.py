import os
import requests
import json

from eas import fetch_attestations

IPFS_GATEWAY = "https://ipfs.io/ipfs/"


def get_ipfs_data(cid):
    """
    Fetch data from IPFS by CID.

    Args:
    cid (str): The IPFS CID.

    Returns:
    dict: The JSON data fetched from IPFS.
    """

    url = f"{IPFS_GATEWAY}{cid}"
    try:
        response = requests.get(url)
        response.raise_for_status()
        return response.json()
    except (requests.exceptions.RequestException, json.JSONDecodeError) as e:
        print(f"Error fetching JSON data from URL: {url}. Error: {str(e)}")
        return None
    

def fetch_karma_projects(network):
    """
    Fetch all projects from the Karma Project Schema for a given network.

    Args:
    network (str): The blockchain network name.

    Returns:
    list: A list of fetched projects including metadata from IPFS.
    """

    # Lookup schema ID for network
    schema_mapping = {
        "arbitrum": "0x16bfe4783b7a9c743c401222c56a07ecb77ed42afc84b61ff1f62f5936c0b9d7",
        "optimism": "0x70a3f615f738fc6a4f56100692ada93d947c028b840940d97af7e7d6f0fa0577"
    }
    schema_id = schema_mapping.get(network)
    if not schema_id:
        print(f"Error: unknown network {network}")
        return
    
    # Fetch attestations from the EAS subgraph
    attestations = fetch_attestations(network=network, schema_id=schema_id)

    # Fetch IPFS data for every attestation
    for attestation in attestations:
        try:
            hash = attestation["json"].get("hash")
            if hash:
                ipfs_data = get_ipfs_data(hash)
                attestation.update({"ipfs_data": ipfs_data})
            else:
                print(f"Warning {attestation['id']} has no IPFS hash")
        except Exception as e:
            print(e)
            print(f"Error: {attestation}")
    
    # Dump to JSON file
    if not os.path.exists("temp"):
        os.makedirs("temp")
    export_path = f"temp/{network}-{schema_id}.json"
    with open(export_path, "w") as f:
        json.dump(attestations, f, indent=2)


def main():

    # Fetch projects for Arbitrum
    fetch_karma_projects("arbitrum")

    # Fetch projects for Optimism
    fetch_karma_projects("optimism")


if __name__ == "__main__":
    main()