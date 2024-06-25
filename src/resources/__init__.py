import os
import json
from typing import Iterable, Tuple

CURR_DIR = os.path.abspath(os.path.dirname(__file__))
SCHEMAS_DIR = os.path.join(CURR_DIR, "schema")


def get_schema_files() -> Iterable[Tuple[str, dict]]:
    return map(
        lambda a: (
            a,
            json.load(open(os.path.join(SCHEMAS_DIR, a))),
        ),
        filter(lambda a: a.endswith("json"), os.listdir(SCHEMAS_DIR)),
    )
