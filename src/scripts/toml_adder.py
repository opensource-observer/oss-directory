import os
import toml
import yaml
import json
from tqdm import tqdm
import re

class CustomDumper(yaml.Dumper):
    def increase_indent(self, flow=False, indentless=False):
        return super(CustomDumper, self).increase_indent(flow, False)

def represent_str(dumper, data):
    if data.startswith("http"):
        return dumper.represent_scalar('tag:yaml.org,2002:str', data)
    elif re.match(r'^0x[a-fA-F0-9]{40}$', data):  # Match Ethereum addresses
        return dumper.represent_scalar('tag:yaml.org,2002:str', data, style='"')
    else:
        if any(c in data for c in ":{}[],&*#?|-<>=!%@\\"):
            return dumper.represent_scalar('tag:yaml.org,2002:str', data, style='"')
        return dumper.represent_scalar('tag:yaml.org,2002:str', data)

yaml.add_representer(str, represent_str, Dumper=CustomDumper)

def slugify(name):
    '''
    Converts a string into a 'slug' format suitable for file names or URLs.
    This includes converting to lowercase and replacing special characters with underscores.
    '''
    # Remove special characters at the start
    name = re.sub(r'^[^a-zA-Z0-9]+', '', name)
    # Replace remaining special characters with underscore
    name = re.sub(r'[<>:"/\\|?*]', '_', name)
    return name.lower()


def load_toml_file(file_path):
    '''
    Loads and parses a TOML file from the given file path.
    Returns the parsed data and an error message (if any).
    '''
    try:
        with open(file_path, 'r') as file:
            return toml.load(file), None
    except Exception as e:
        return None, str(e)
    
def load_yaml_file(file_path):
    '''
    Loads and parses a YAML file from the given file path using safe_load.
    Returns the parsed data and an error message (if any).
    '''
    try:
        with open(file_path, 'r') as file:
            return yaml.safe_load(file), None
    except Exception as e:
        return None, str(e)

def save_yaml_file(data, file_path):
    '''
    Saves the given data to a YAML file at the specified file path.
    It also performs post-processing to unquote the 'projects' list entries.
    '''
    try:
        os.makedirs(os.path.dirname(file_path), exist_ok=True)
        with open(file_path, 'w') as file:
            yaml_data = yaml.dump(data, Dumper=CustomDumper, allow_unicode=True, sort_keys=False, default_flow_style=False, indent=2)
            # Post-processing YAML data to unquote the 'projects' list entries
            yaml_data = unquote_projects(yaml_data)
            file.write(yaml_data)
        return True, None
    except Exception as e:
        return False, str(e)

def unquote_projects(yaml_data):
    # Regular expression to find and unquote projects list items
    unquoted_yaml_data = re.sub(r"-\s+\"([^\"]+)\"", r"- \1", yaml_data)
    return unquoted_yaml_data

def get_project_slug_from_url(url):
    '''
    Extracts and returns the last part of a URL, typically used to get a slug or identifier.
    '''
    parts = url.split('/')
    return parts[-1] if len(parts) > 0 else None


def update_yaml(yaml_data, new_urls):
    '''
    Updates the given YAML data with new URLs.
    Ensures that each URL is unique within the YAML data structure.
    '''
    existing_urls = {url['url'] for url in yaml_data.get('github', [])}
    yaml_data['github'] = yaml_data.get('github', [])
    for url in new_urls:
        if url not in existing_urls:
            yaml_data['github'].append({'url': url})
    return yaml_data
    
def write_yaml_file(file_path, data, action_summary, action_type, toml_file_title):
    '''
    Writes the given data to a YAML file and updates the action summary.
    This function is used to record actions (updates, additions, skips) on YAML files.
    '''
    file_exists = os.path.exists(file_path)
    action = 'UPDATES' if file_exists else 'ADDED'
    existing_data = {}
    if file_exists:
        with open(file_path, 'r', encoding='utf-8') as f:
            existing_data = yaml.safe_load(f) or {}
    if existing_data != data:
        with open(file_path, 'w', encoding='utf-8') as f:
            yaml.dump(data, f, Dumper=CustomDumper, sort_keys=False, default_flow_style=False, allow_unicode=True, width=float("inf"), indent=2)
        action_summary[action].append({'file_path': file_path, 'action': action_type, 'toml_file': toml_file_title})
    else:
        action_summary['SKIPPED'].append({'file_path': file_path, 'reason': 'No changes made', 'toml_file': toml_file_title})
        
def process_file(toml_data, projects_directory, action_summary):
    '''
    Processes a single TOML file. It reads project information from the TOML file,
    updates or creates corresponding YAML files in the projects directory,
    and records the actions taken in the action summary.
    '''
    title_slug = slugify(toml_data['title'])
    org_urls = [org.strip() for org in toml_data['github_organizations']]
    yaml_path = os.path.join(projects_directory, title_slug[0], f"{title_slug}.yaml")
    yaml_data = {'version': 3, 'slug': title_slug, 'name': toml_data['title'], 'github': [{'url': url} for url in org_urls]}
    if os.path.exists(yaml_path):
        with open(yaml_path, 'r', encoding='utf-8') as f:
            yaml_data = yaml.safe_load(f) or {}
        yaml_data = update_yaml(yaml_data, org_urls)
    os.makedirs(os.path.dirname(yaml_path), exist_ok=True)
    write_yaml_file(yaml_path, yaml_data, action_summary, 'overall_processing', toml_data['title'])

def process_sub_ecosystems(toml_data, projects_directory, action_summary):
    '''
    Processes sub-ecosystems defined in a TOML file. For each sub-ecosystem,
    it creates or updates a YAML file in the projects directory and updates the action summary.
    '''
    for sub_ecosystem_name in toml_data.get('sub_ecosystems', []):
        sub_ecosystem_slug = slugify(sub_ecosystem_name)
        sub_ecosystem_path = os.path.join(projects_directory, sub_ecosystem_slug[0], f"{sub_ecosystem_slug}.yaml")
        if os.path.exists(sub_ecosystem_path):
            with open(sub_ecosystem_path, 'r', encoding='utf-8') as f:
                sub_yaml_data = yaml.safe_load(f) or {}
            sub_yaml_data = update_yaml(sub_yaml_data, toml_data['github_organizations'])
            write_yaml_file(sub_ecosystem_path, sub_yaml_data, action_summary, 'sub_ecosystems_processing', toml_data['title'])
        else:
            pass

def process_ecosystem(ecosystem_data, collections_directory, report):
    '''
    Processes an ecosystem's data, creating or updating its YAML file in the collections directory.
    It also handles processing of any defined repositories and sub-ecosystems.
    Errors encountered during processing are added to the report.
    '''
    try:
        ecosystem_slug = slugify(ecosystem_data['title'])
        collection_path = os.path.join(collections_directory, f"{ecosystem_slug}.yaml")
        collection_data, _ = load_yaml_file(collection_path)

        if collection_data is None:
            collection_data = {'version': 3, 'slug': ecosystem_slug, 'name': ecosystem_data['title'], 'projects': []}

        for repo in ecosystem_data.get('repo', []):
            project_slug = get_project_slug_from_url(repo['url'])
            if project_slug and project_slug not in collection_data['projects']:
                collection_data['projects'].append(project_slug)

        for github_org in ecosystem_data.get('github_organizations', []):
            org_project_slug = get_project_slug_from_url(github_org)
            if org_project_slug and org_project_slug not in collection_data['projects']:
                collection_data['projects'].append(org_project_slug)

        for sub_ecosystem in ecosystem_data.get('sub_ecosystems', []):
            process_ecosystem(sub_ecosystem, collections_directory, report)

        success, error = save_yaml_file(collection_data, collection_path)
        if not success:
            report['errors'].append({'file': collection_path, 'error': str(error)})
    except Exception as e:
        report['errors'].append({'file': str(ecosystem_data), 'error': str(e)})


def process_ecosystems(ecosystems_path, collections_directory, report, progress_bar):
    '''
    Processes all ecosystems located at the given path. It iterates through each TOML file,
    processes the contained data, and updates the given report with any errors.
    A progress bar is used to display processing progress.
    '''
    for root, dirs, files in tqdm(os.walk(ecosystems_path), desc="Directories", leave=False):
        for file in tqdm(files, desc="Files", leave=False):
            if file.endswith(".toml"):
                toml_path = os.path.join(root, file)
                try:
                    ecosystem_data, error = load_toml_file(toml_path)
                    if ecosystem_data is None:
                        report['errors'].append({'file': toml_path, 'error': error})
                        continue

                    process_ecosystem(ecosystem_data, collections_directory, report)
                except Exception as e:
                    report['errors'].append({'file': toml_path, 'error': str(e)})
                finally:
                    progress_bar.update(1)
                    
def main(ecosystems_path, projects_directory, collections_directory):
    '''
    Main function that orchestrates the processing of ecosystems, projects, and collections.
    It initializes summaries and reports, processes each TOML file, and writes the results to JSON files.
    '''
    action_summary = {'UPDATES': [], 'ADDED': [], 'SKIPPED': []}
    report = {'errors': []}
    toml_files = [os.path.join(dp, f) for dp, dn, filenames in os.walk(ecosystems_path) for f in filenames if f.endswith('.toml')]
    
    total_files = len(toml_files)
    with tqdm(total=total_files, desc="Total Progress", unit="file") as progress_bar:
        for toml_file in toml_files:
            with open(toml_file, 'r', encoding='utf-8') as f:
                toml_data = toml.load(f)
            process_file(toml_data, projects_directory, action_summary)
            process_sub_ecosystems(toml_data, projects_directory, action_summary)
            process_ecosystem(toml_data, collections_directory, report)
            progress_bar.update(1)

    # Generate the JSON summary for action
    with open('action_summary.json', 'w', encoding='utf-8') as f:
        json.dump(action_summary, f, indent=4, ensure_ascii=False)

    with open('collection_operation_report.json', 'w', encoding='utf-8') as f:
        json.dump(report, f, indent=4, ensure_ascii=False)

def get_directory_input(prompt):
    path = input(prompt)
    while not os.path.isdir(path):
        print(f"The directory '{path}' does not exist. Please enter a valid directory.")
        path = input(prompt)
    return path

def save_report(action_summary, report_directory):
    report_path = os.path.join(report_directory, 'toml_adder_report.json')
    with open(report_path, 'w', encoding='utf-8') as f:
        json.dump(action_summary, f, indent=4)
    print(f"Report saved at: {report_path}")

if __name__ == "__main__":
    ecosystems_path = get_directory_input("Enter the path for the ecosystems directory: ")
    projects_directory = 'data/projects'
    collections_directory = 'data/collections'
    
    main(ecosystems_path, projects_directory, collections_directory)

    action_summary = {"UPDATES": [], "ADDED": [], "SKIPPED": []}

    save_report_option = input("Do you want to save a report? (yes/no): ").strip().lower()
    if save_report_option == 'yes':
        custom_directory = input("Enter a custom directory to save the report or leave blank to save at root: ").strip()
        if not custom_directory:
            custom_directory = os.getcwd()
        save_report(action_summary, custom_directory)
    else:
        print("Report not saved.")