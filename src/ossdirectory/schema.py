"""
Configures validators for the various ossdirectory schemata
"""

import os
from dataclasses import dataclass
from typing import List, Any

from referencing import Registry, Resource
from referencing.jsonschema import DRAFT202012
from jsonschema import Draft202012Validator

CURR_DIR = os.path.abspath(os.path.dirname(__file__))
SCHEMAS_DIR = os.path.join(CURR_DIR, "../resources/schema")

# Due to how packaging works for this python library we need to attempt to
# import from one of two places. The first tries to import from inside the
# ossdirectory package. This will only work on an installation of the library.
# The other import is for local development only.
try:
    from ossdirectory.resources import get_schema_files  # type: ignore
except ModuleNotFoundError:
    from resources import get_schema_files

schemas = dict(
    map(
        lambda a: (a[0], Resource(contents=a[1], specification=DRAFT202012)),
        get_schema_files(),
    )
)

registry = Registry()
for name, schema in schemas.items():
    registry = registry.with_resource(uri=name, resource=schema)


@dataclass
class ValidationResponse:
    is_valid: bool
    errors: List[Any]


def validate_project(input: Any):
    validator = Draft202012Validator(
        schemas["project.json"].contents, registry=registry
    )
    errors = list(validator.iter_errors(input))
    return ValidationResponse(
        is_valid=len(errors) == 0,
        errors=errors,
    )


def validate_collection(input: Any):
    validator = Draft202012Validator(
        schemas["collection.json"].contents, registry=registry
    )
    errors = list(validator.iter_errors(input))
    return ValidationResponse(
        is_valid=len(errors) == 0,
        errors=errors,
    )
