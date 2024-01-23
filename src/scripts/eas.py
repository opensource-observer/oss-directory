import json
import os
import requests
import sys


def get_endpoint(network):
    """
    Retrieve the API endpoint URL based on the specified network. 
    A complete list of networks can be found here: https://docs.attest.sh/docs/developer-tools/api

    Args:
    network (str): The blockchain network name (e.g., 'mainnet', 'ethereum', 'arbitrum', 'optimism').

    Returns:
    str: The corresponding endpoint URL for the given network.
    """
    default_endpoint = "https://easscan.org/graphql"
    endpoints = {
        "mainnet": default_endpoint,
        "ethereum": default_endpoint,
        "arbitrum":	"https://arbitrum.easscan.org/graphql",
        "optimism":	"https://optimism.easscan.org/graphql"
    }
    network = network.lower()
    endpoint = endpoints.get(network, default_endpoint)
    return endpoint


def parse_attestation_data(attestation):
    """
    Parse attestation data to extract key-value pairs, including nested JSON structures.

    Args:
    attestation (dict): The attestation data in dictionary format.

    Returns:
    dict: A dictionary of parsed key-value pairs.
    """
    data = {k: v for k, v in attestation.items() if k != "decodedDataJson"}

    if "decodedDataJson" in attestation:
        decoded_data = json.loads(attestation["decodedDataJson"])

        for item in decoded_data:
            name = item.get("name")
            value_obj = item.get("value", {})

            if isinstance(value_obj, dict) and 'value' in value_obj:
                if isinstance(value_obj['value'], str):
                    try:
                        nested_value = json.loads(value_obj['value'])
                    except json.JSONDecodeError:
                        nested_value = value_obj['value']
                else:
                    nested_value = value_obj['value']

                if name is not None:
                    data[name] = nested_value

    return data


def fetch_attestations(network, schema_id, time_created_after=0, query_limit=100):
    """
    Fetch attestations from the API based on the network and schema ID.

    Args:
    network (str): The blockchain network name.
    schema_id (str): The schema ID for which to fetch attestations.
    time_created_after (int, optional): Filter for attestations created after this time.
    query_limit (int, optional): The number of attestations to fetch per query.

    Returns:
    list: A list of fetched attestations.
    """
    url = get_endpoint(network)
    query = '''
    query Attestations($schemaId: StringFilter!, $skip: Int!, $take: Int!, $timeCreatedAfter: IntFilter) {
        attestations(where: {schemaId: $schemaId, timeCreated: $timeCreatedAfter}, take: $take, skip: $skip) {
            id
            attester
            recipient
            refUID
            revocable
            revocationTime
            expirationTime
            timeCreated 
            decodedDataJson    
        }
    }
    '''
    variables = {
        "schemaId": {"equals": schema_id},
        "skip": 0,
        "take": query_limit,
        "timeCreatedAfter": {"gt": time_created_after},
    }
    headers = {'Content-Type': 'application/json'}
    all_attestations = []

    while True:
        payload = {'query': query, 'variables': variables}

        try:
            response = requests.post(url, headers=headers, data=json.dumps(payload))
            response.raise_for_status()
            data = response.json()
            attestations = data.get('data', {}).get('attestations', [])
            all_attestations.extend(attestations)

            if len(attestations) < query_limit:
                break

            variables["skip"] += query_limit

        except (requests.exceptions.RequestException, json.JSONDecodeError) as e:
            print(f"Failed to fetch attestations for {schema_id} on {network}: {str(e)}")
            break

    print(f"Total attestations for Schema ID {schema_id} on {network}: {len(all_attestations)}")
    results = [parse_attestation_data(attestation) for attestation in all_attestations]
    return results


def main(network, schema_id):
    """
    Main function to fetch and parse attestations based on command line arguments.

    Args:
    network (str): The blockchain network name.    
    schema_id (str): The schema ID for which to fetch attestations.
    """
    results = fetch_attestations(network, schema_id)
    if not os.path.exists("temp"):
        os.makedirs("temp")
    export_path = f"temp/{network}-{schema_id}.json"
    with open(export_path, "w") as f:
        json.dump(results, f, indent=2)
    print(f"Data exported to {export_path}")


if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("Usage: script.py <network> <schema_id>")
    else:
        network = sys.argv[1]
        schema_id = sys.argv[2]        
        main(network, schema_id)


# Karma Optimism
# python src/scripts/eas.py optimism 0x70a3f615f738fc6a4f56100692ada93d947c028b840940d97af7e7d6f0fa0577
        
# Karma Arbitrum
# python src/scripts/eas.py arbitrum 0x16bfe4783b7a9c743c401222c56a07ecb77ed42afc84b61ff1f62f5936c0b9d7
        
# RPGF3        
# python src/scripts/eas.py optimism 0x76e98cce95f3ba992c2ee25cef25f756495147608a3da3aa2e5ca43109fe77cc