import glob
import yaml
import os
from typing import Callable, List, Optional, Any
from dataclasses import dataclass

from .schema import validate_project, validate_collection, ValidationResponse
from .clone import temp_clone_repo


@dataclass
class OSSDirectory:
    collections: List[dict]
    projects: List[dict]


def load_yaml_files(
    directory, validator: Callable[[Any], ValidationResponse], pattern="**/*.yaml"
):
    # Construct the glob pattern to match YAML files
    search_pattern = os.path.join(directory, pattern)
    yaml_files = glob.glob(search_pattern, recursive=True)

    # List to hold parsed YAML data from all files
    all_yaml_data = []

    # Iterate over each YAML file found

    for file_path in yaml_files:
        with open(file_path, "r") as file:
            try:
                # Load YAML data from file
                yaml_data = yaml.safe_load(file)
                validation = validator(yaml_data)
                if not validation.is_valid:
                    raise Exception(f"{file_path} is invalid {validation.errors}")
                all_yaml_data.append(yaml_data)
            except yaml.YAMLError as exc:
                print(f"Error reading YAML from {file_path}: {exc}")

    return all_yaml_data


def _fetch_data(directory_path: str):
    # Example usage:
    projects_path = os.path.abspath(os.path.join(directory_path, "data/projects"))
    collections_path = os.path.abspath(os.path.join(directory_path, "data/collections"))
    projects = load_yaml_files(projects_path, validate_project)
    collections = load_yaml_files(collections_path, validate_collection)

    return OSSDirectory(collections=collections, projects=projects)


def fetch_data(
    directory_path: Optional[str] = None,
    repo_url: str = "https://github.com/opensource-observer/oss-directory",
):
    if directory_path:
        return _fetch_data(directory_path)
    else:
        with temp_clone_repo(repo_url) as directory_path:
            return _fetch_data(directory_path)
