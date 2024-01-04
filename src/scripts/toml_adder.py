import os
import toml
import yaml
from collections import OrderedDict
from datetime import datetime

# Determine the base directory relative to the script's location
base_directory = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
projects_directory = os.path.join(base_directory, 'data', 'projects')
collections_directory = os.path.join(base_directory, 'data', 'collections')

class CustomDumper(yaml.Dumper):
    def increase_indent(self, flow=False, indentless=False):
        return super(CustomDumper, self).increase_indent(flow, False)

def ordered_yaml():
    """Enable PyYAML to output OrderedDicts with proper indentation for lists."""
    yaml.add_representer(OrderedDict, lambda dumper, data: dumper.represent_dict(data.items()))
    yaml.add_representer(list, lambda dumper, data: dumper.represent_sequence('tag:yaml.org,2002:seq', data, flow_style=False))

def find_project_yaml(sub_ecosystem):
    """Find the YAML file for a given sub-ecosystem."""
    for root, dirs, files in os.walk(projects_directory):
        for file in files:
            if file.lower() == f'{sub_ecosystem.lower()}.yaml':
                return os.path.join(root, file)
    return None

def process_toml_file(toml_file_path, create_change_log=False):
    """Process a TOML file to update project and collection YAML files."""
    with open(toml_file_path, 'r') as file:
        data = toml.load(file)
        title = data.get('title', 'unknown').lower().replace(' ', '-')
        sub_ecosystems = data.get('sub_ecosystems', [])
        github_orgs = data.get('github_organizations', [])

    not_found = []
    no_changes = []
    changes_made = []

    ordered_yaml()

    for sub in sub_ecosystems:
        yaml_path = find_project_yaml(sub)
        if yaml_path:
            with open(yaml_path, 'r') as file:
                project_data = yaml.safe_load(file)

            existing_urls = [item['url'] for item in project_data.get('github', [])]
            new_urls = [url for url in github_orgs if url not in existing_urls]

            if new_urls:
                project_data.setdefault('github', []).extend([{'url': url} for url in new_urls])
                ordered_data = OrderedDict([
                    ('version', project_data['version']),
                    ('slug', project_data['slug']),
                    ('name', project_data['name']),
                    ('github', project_data['github']),
                    ('blockchain', project_data.get('blockchain', []))
                ])

                with open(yaml_path, 'w') as file:
                    yaml.dump(ordered_data, file, Dumper=CustomDumper, default_flow_style=False)
                changes_made.append(f"{sub}: Added {', '.join(new_urls)}")
            else:
                no_changes.append(sub)
        else:
            not_found.append(sub)

    change_log_file = os.path.join('changes_made.txt')
    if create_change_log:
        with open(change_log_file, 'w') as file:
            file.write(f"Execution Time: {datetime.now()}\n")
            file.write(f"TOML File Used: {toml_file_path}\n\n")

            file.write("Projects Not Found:\n")
            for sub in not_found:
                file.write(f"- {sub}\n")
            file.write("\n")

            file.write("Projects Found with No Changes Made:\n")
            for sub in no_changes:
                file.write(f"- {sub}\n")
            file.write("\n")

            file.write("Projects Found and Changes Made:\n")
            for change in changes_made:
                file.write(f"- {change}\n")

    collection_file = os.path.join(collections_directory, f'{title}.yaml')
    collection_data = OrderedDict([
        ('version', 3),
        ('slug', title),
        ('name', title.capitalize()),
        ('projects', [sub.lower() for sub in sub_ecosystems if sub not in not_found])
    ])

    with open(collection_file, 'w') as file:
        yaml.dump(collection_data, file, Dumper=CustomDumper, default_flow_style=False)

    return change_log_file if create_change_log else None
