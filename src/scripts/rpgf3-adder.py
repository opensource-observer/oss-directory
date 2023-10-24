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


def get_artifact():
    print("Enter an artifact followed by a type:")
    entry = input()
    if not entry or ',' not in entry:
        return None
    artifact, artifact_type = entry.split(",")
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
    print("Enter a slug:")
    slug = input()
    return slug


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

    formatters = dict(default_flow_style=False, sort_keys=False, indent=2)
    with open(path, 'w') as outfile:
        yaml.dump(yaml_data, outfile, Dumper=MyDumper, **formatters)

    return True


def main():
    
    while True:
        result = generate_yaml()
        if not result:
            break
        print("Generate another YAML file? (y/n)")
        response = input()
        if response.lower() != "y":
            break


if __name__ == "__main__":
    main()