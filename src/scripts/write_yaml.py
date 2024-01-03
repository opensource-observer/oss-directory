import yaml


class MyDumper(yaml.Dumper):
    """
    Custom YAML dumper that ensures certain strings are quoted and aliases are ignored.
    """
    
    def __init__(self, *args, **kwargs):
        super(MyDumper, self).__init__(*args, **kwargs)
        self.add_representer(QuotedString, quoted_string_representer)

    def ignore_aliases(self, data):
        return True

    def increase_indent(self, flow=False, indentless=False):
        return super(MyDumper, self).increase_indent(flow, False)
    

class QuotedString(str):
    pass


def quoted_string_representer(dumper: yaml.Dumper, data: QuotedString) -> yaml.Node:
    """
    Custom representer for ensuring strings are quoted in the YAML output.

    Args:
    dumper (yaml.Dumper): The YAML dumper.
    data (QuotedString): The string data to be represented.

    Returns:
    yaml.Node: The YAML node representing the quoted string.
    """
    return dumper.represent_scalar('tag:yaml.org,2002:str', data, style='"')


def dump(yaml_data: dict, path: str) -> None:
    """
    Write data to a YAML file with custom formatting.

    Args:
    yaml_data (Any): The data to be written to the YAML file.
    path (str): The path to the output YAML file.
    """
    
    formatters = dict(default_flow_style=False, sort_keys=False, indent=2)
    with open(path, 'w') as outfile:
        yaml.dump(yaml_data, outfile, Dumper=MyDumper, **formatters)