import tempfile
import contextlib
from dataclasses import dataclass

from git import Repo


@dataclass
class TempClonedRepo:
    repo: Repo
    temp_dir: str


@contextlib.contextmanager
def temp_clone_repo(repo_url):
    # Create a temporary directory
    with tempfile.TemporaryDirectory() as temp_dir:
        # Clone the repository into the temporary directory
        repo = Repo.clone_from(repo_url, temp_dir)

        try:
            # Yield the path to the cloned repository
            yield TempClonedRepo(repo, temp_dir)
        finally:
            # Clean up: the temporary directory and its contents will be deleted automatically
            pass
