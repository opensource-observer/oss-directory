import json
import requests


def get_endpoint(network):
    # https://docs.attest.sh/docs/developer-tools/api
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


def fetch_attestations(schema_id, network, time_created_after=0, query_limit=100):
  
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
        "schemaId": {
            "equals": schema_id
        },
        "skip": 0,
        "take": query_limit,
        "timeCreatedAfter": {"gt": time_created_after},
    }

    headers = {
        'Content-Type': 'application/json',
    }

    all_attestations = []

    while True:
        payload = {
            'query': query,
            'variables': variables
        }

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
    return all_attestations
