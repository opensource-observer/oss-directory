import os
import pandas as pd
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


def parse_url(url):
    parsed_url = urlparse(url)
    path = parsed_url.path
    path = path.strip("/")
    path = path.split("/")
    if len(path) == 1:
        slug = path[0]
    elif len(path) == 2:
        slug = path[1] + "-" + path[0]
    else:
        print(f"Invalid GitHub url: {url}")
        return None
    return slug


def get_repo_name():
    print("Enter a GitHub url:")
    url = input()
    url = url.lower().strip()
    slug = parse_url(url)
    return url, slug


def get_project_name():
    print("Enter a project name:")
    project_name = input()
    return project_name


def input_project():
    url, slug = get_repo_name()
    project_name = get_project_name()
    return generate_yaml(url, slug, project_name)


def generate_yaml(url, slug, project_name, version=3):
    if len(slug) < 2:
        print(f"Invalid or missing GitHub url {url} for project {project_name}")
        return False
    path = os.path.join("data/projects", slug[0], slug + ".yaml")
    if os.path.exists(path):
        print("File already exists")
        return False

    yaml_data = {
        "version": version,
        "slug": slug,
        "name": project_name,
        "github": [
            {
                "url": url
            }
        ]
    }

    formatters = dict(default_flow_style=False, sort_keys=False, indent=2)
    with open(path, 'w') as outfile:
        yaml.dump(yaml_data, outfile, Dumper=MyDumper, **formatters)

    return True


def load_from_csv(project_col='Project', github_col='GitHub'):
    print("Enter a CSV file path:")
    path = input()
    path = path.strip()
    if not os.path.exists(path):
        print("File does not exist")
        sys.exit()
    series = (
        pd.read_csv(path)
        .set_index(project_col)
        [github_col]
    )
    slugs = []
    for project, github in series.items():
        project = project.strip()
        if not isinstance(github, str) or len(github) < 2:
            continue
        url = github.lower().strip().strip("/")
        slug = parse_url(url)
        if slug:
            result = generate_yaml(url, slug, project)
            slugs.append(slug)
    for s in sorted(list(set(slugs))):
        print(f"- {s}")
    

def main():
    print("Add projects from a CSV file? (y/n)")
    response = input()
    if response.lower() == "y":
        load_from_csv()
        return

    while True:
        result = input_project()
        if not result:
            break
        print("Generate another YAML file? (y/n)")
        response = input()
        if response.lower() != "y":
            break


if __name__ == "__main__":
    main()