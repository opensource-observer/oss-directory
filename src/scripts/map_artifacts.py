import os
from typing import List, Dict, Generator
import yaml


LOCAL_PATH = os.path.join(os.path.dirname(__file__), "..", "..", "data", "projects")


def get_yaml_files(path: str) -> List[str]:
    """Retrieve a list of YAML file paths from a given directory.

    Args:
    path (str): The directory path to search for YAML files.

    Returns:
    List[str]: A list of paths to YAML files.
    """
    return [os.path.join(root, file) for root, dirs, files in os.walk(path) for file in files if file.endswith(".yaml")]


def get_yaml_data(yaml_files: List[str]) -> Generator[Dict, None, None]:
    """Yield YAML data from a list of YAML file paths.

    Args:
    yaml_files (List[str]): A list of YAML file paths.

    Yields:
    Generator[Dict, None, None]: A generator that yields parsed YAML data.
    """
    for file in yaml_files:
        with open(file, 'r') as stream:
            try:
                data = yaml.safe_load(stream)
                if data:
                    yield data
            except yaml.YAMLError as exc:
                print(f"Error in {file}: {exc}")


def get_yaml_data_from_path(path: str = LOCAL_PATH) -> List[Dict]:
    """Retrieve YAML data from a predefined local path.

    Args:
    path (str, optional): The directory path to search for YAML files. Defaults to LOCAL_PATH.

    Returns:
    List[Dict]: A list of ingested YAML records.
    """
    yaml_files = get_yaml_files(path)
    if not yaml_files:
        print("No YAML files found.")
        return []

    print(f"Found {len(yaml_files)} yaml files.")
    return list(get_yaml_data(yaml_files))


def map_addresses_to_slugs(yaml_data: List[Dict], chain: str, lowercase: bool = True) -> Dict[str, str]:
    """
    Create a mapping of blockchain addresses to project slugs based on the YAML data.

    Args:
    yaml_data (List[Dict]): A list of dictionaries containing YAML data.
    chain (str): The name of the blockchain to filter addresses by.
    lowercase (bool, optional): Whether to convert addresses to lowercase. Defaults to True.

    Returns:
    Dict[str, str]: A dictionary mapping blockchain addresses to project slugs.
    """
    addresses = {}
    for data in yaml_data:
        if not data:
            continue
        slug = data.get('slug')
        if not slug:
            continue
        blockchain_entries = data.get('blockchain', [])
        for entry in blockchain_entries:
            if chain not in entry.get('networks', []):
                continue
            address = entry.get('address')
            if address:
                addresses[address.lower() if lowercase else address] = slug
    return addresses


def map_repos_to_slugs(yaml_data: List[Dict], lowercase: bool = True) -> Dict[str, str]:
    """
    Create a mapping of GitHub repository URLs to project slugs based on the YAML data.

    Args:
    yaml_data (List[Dict]): A list of dictionaries containing YAML data.
    lowercase (bool, optional): Whether to convert repository URLs to lowercase. Defaults to True.

    Returns:
    Dict[str, str]: A dictionary mapping GitHub repository URLs to project slugs.
    """
    repos = {}
    for data in yaml_data:
        if not data:
            continue
        slug = data.get('slug')
        if not slug:
            continue
        repo_entries = data.get('github', [])
        for entry in repo_entries:
            url = entry.get('url')
            if url and url.startswith('https://github.com/'):
                repos[url.lower().strip('/') if lowercase else url] = slug
    return repos


def generate_repo_snapshot(outpath: str) -> None:
    """
    Generate a YAML snapshot of the mapping between GitHub repositories and project slugs.

    Args:
    outpath (str): The file path to save the generated YAML snapshot.
    """
    yaml_data = get_yaml_data_from_path()
    repos = map_repos_to_slugs(yaml_data)
    with open(outpath, 'w') as outfile:
        yaml.dump(repos, outfile, default_flow_style=False, sort_keys=True, indent=2)
    print(f"Generated repo snapshot at {outpath} with {len(repos)} entries.")


def generate_address_snapshot(outpath: str, chain: str = 'mainnet') -> None:
    """
    Generate a YAML snapshot of the mapping between blockchain addresses and project slugs.

    Args:
    outpath (str): The file path to save the generated YAML snapshot.
    chain (str, optional): The blockchain name to use for filtering addresses. Defaults to 'mainnet'.
    """
    yaml_data = get_yaml_data_from_path()
    addresses = map_addresses_to_slugs(yaml_data, chain)
    with open(outpath, 'w') as outfile:
        yaml.dump(addresses, outfile, default_flow_style=False, sort_keys=True, indent=2)
    print(f"Generated address snapshot at {outpath} with {len(addresses)} entries.")


if __name__ == "__main__":
    generate_repo_snapshot('repo_snapshot.yaml')
    generate_address_snapshot('address_snapshot.yaml')