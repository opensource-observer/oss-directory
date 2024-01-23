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

    # Lookup schemas for each network
    projects_schema_map = {
        "optimism": "0x5b873b6e7a16207b526dde366e8164e95bcda2f009272306519667c5e94d2191",
        "arbitrum": "0xac2a06e955a7e25e6729efe1a6532237e3435b21ccd3dc827ae3c94e624d25b3"
    }
    updates_schema_map = {
        "arbitrum": "0x16bfe4783b7a9c743c401222c56a07ecb77ed42afc84b61ff1f62f5936c0b9d7",
        "optimism": "0x70a3f615f738fc6a4f56100692ada93d947c028b840940d97af7e7d6f0fa0577"
    }
    projects_schema = projects_schema_map.get(network)
    updates_schema = updates_schema_map.get(network)
    if not projects_schema or not updates_schema:
        print(f"Error: unknown network {network}")
        return
    
    # Fetch projects from the EAS subgraph
    projects = fetch_attestations(network=network, schema_id=projects_schema)

    # Fetch updates about projects from the EAS subgraph
    updates = fetch_attestations(network=network, schema_id=updates_schema)

    # Link updates to projects and fetch update data from IPFS
    for project in projects:
        if project["project"] != True:
            continue
        project["updates"] = []
        for update_attestation in updates:
            if project["id"] == update_attestation["refUID"]:
                try:
                    hash = update_attestation["json"].get("hash")
                    if hash:
                        ipfs_data = get_ipfs_data(hash)
                        update_attestation.update({"ipfs_data": ipfs_data})
                    else:
                        print(f"Warning {update_attestation['id']} has no IPFS hash")
                except Exception as e:
                    print(e)
                    print(f"Error: {update_attestation}")
                project["updates"].append(update_attestation)
    
    # Dump to JSON file
    if not os.path.exists("temp"):
        os.makedirs("temp")
    export_path = f"temp/{network}-karma-gap-projects.json"
    with open(export_path, "w") as f:
        json.dump(projects, f, indent=2)


def main():

    # Fetch projects for Arbitrum
    fetch_karma_projects("arbitrum")

    # Fetch projects for Optimism
    fetch_karma_projects("optimism")


if __name__ == "__main__":
    main()