import csv
import os
import sys
from urllib.parse import urlparse
import yaml


class MyDumper(yaml.Dumper):
    
    def __init__(self, *args, **kwargs):
        super(MyDumper, self).__init__(*args, **kwargs)
        self.add_representer(QuotedString, quoted_string_representer)

    def ignore_aliases(self, data):
        return True

    def increase_indent(self, flow=False, indentless=False):
        return super(MyDumper, self).increase_indent(flow, False)
    

class QuotedString(str):
    pass


def quoted_string_representer(dumper, data):
    return dumper.represent_scalar('tag:yaml.org,2002:str', data, style='"')    


def get_path(slug):
    return os.path.join("data/projects", slug[0], slug + ".yaml")


def get_artifact():
    print("Enter an artifact followed by a type:")
    entry = input()
    if not entry or ',' not in entry:
        return None
    artifact, artifact_type = entry.split(",")[0:2]
    if 'github' in artifact_type:
        artifact = "https://github.com/" + artifact
        return ('github', {'url': artifact})
    if 'npm' in artifact_type:
        artifact = "https://www.npmjs.com/package/" + artifact
        return ('npm', {'url': artifact})
    if '0x' in artifact:
        return ('blockchain', {
                'address': artifact,
                'tags': artifact_type.split(" "),
                'networks': ['optimism']
            })

def get_project_name():
    print("Enter a project name:")
    project_name = input()
    return project_name


def get_slug():
    while True:
        print("Enter a slug or 'q' to quit:")
        slug = input().strip()
        
        if slug == "":
            print("Slug cannot be blank. Please enter again.")
            continue
        elif slug == "q":
            return None
        else:
            return slug


def replace_single_quotes_with_double_quotes_in_file(file_path):
    try:
        with open(file_path, 'r') as file:
            file_content = file.read()

        modified_content = file_content.replace("'", '"')

        with open(file_path, 'w') as file:
            file.write(modified_content)

        print(f'Successfully replaced single quotes with double quotes in {file_path}')
    except Exception as e:
        print(f'Error: {e}')


def dump_yaml_data(yaml_data, fix_quotes=True):

    slug = yaml_data['slug']
    path = get_path(slug)
    formatters = dict(default_flow_style=False, sort_keys=False, indent=2)
    with open(path, 'w') as outfile:
        yaml.dump(yaml_data, outfile, Dumper=MyDumper, **formatters)

    if fix_quotes:
        replace_single_quotes_with_double_quotes_in_file(path)


def update_yaml_file(slug, artifact=None):
    path = get_path(slug)
    if not os.path.exists(path):
        print(f"Path {path} does not exist")
        return False
    
    with open(path, 'r') as stream:
        try:
            yaml_data = yaml.safe_load(stream)
        except yaml.YAMLError as exc:
            print(exc)
            return False
    
    if artifact is not None:
        artifact_type = artifact[0]
        if artifact_type not in yaml_data:
            yaml_data[artifact_type] = []
        yaml_data[artifact_type].append(artifact[1])
    
    else:
        while True:
            artifact = get_artifact()
            if artifact is None:
                break
            artifact_type = artifact[0]
            if artifact_type not in yaml_data:
                yaml_data[artifact_type] = []
            yaml_data[artifact_type].append(artifact[1])    

    dump_yaml_data(yaml_data)
    return True


def generate_yaml(version=3):

    slug = get_slug()
    path = os.path.join("data/projects", slug[0], slug + ".yaml")
    if os.path.exists(path):
        print("File already exists")
        return False

    project_name = get_project_name()

    yaml_data = {
        "version": version,
        "slug": slug,
        "name": project_name,
        "github": [],
        "blockchain": [],
        "npm": []
    }
    
    while True:
        artifact = get_artifact()
        if artifact is None:
            break
        yaml_data[artifact[0]].append(artifact[1])

    yaml_data = {k: v for k, v in yaml_data.items() if v}

    dump_yaml_data(yaml_data)

    return True


def batch_process_from_csv(csv_path):
    with open(csv_path, 'r') as stream:
        csv_data = csv.DictReader(stream)
        for row in csv_data:
            if row['slug'] == '':
                continue
            artifact_type = row['type']
            artifact = row['artifact']            
            if 'wallet' in artifact_type:
                print(f"Would you like update {row['slug']} with {artifact} of type {artifact_type}? (y/n/q)")
                entry = input()
                if entry == 'q':
                    return
                if entry != 'y':
                    continue
                update_yaml_file(row['slug'], ('blockchain', {
                    'address': artifact,
                    'tags': artifact_type.split(" "),
                    'networks': ['optimism']
                }))        


def batch_add_or_update():
    while True:
        slug = get_slug()
        if slug is None:
            break

        path = get_path(slug)
        if os.path.exists(path):
            success = update_yaml_file(slug)
            if success:
                print(f"Project with slug '{slug}' updated successfully.")
            else:
                print(f"Project with slug '{slug}' not found.")
        else:
            result = generate_yaml()
            if not result:
                break


def main():
    local_path = "/Users/cerv1/Dropbox/Kariba/Github/oso/indexer/utilities/rpgf3-attestations/data/ossd_reviewer.csv"
    batch_process_from_csv(local_path)
    batch_add_or_update()


if __name__ == "__main__":
    main()