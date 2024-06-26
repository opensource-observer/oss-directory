import tempfile
import contextlib
from git import Repo


@contextlib.contextmanager
def temp_clone_repo(repo_url):
    # Create a temporary directory
    with tempfile.TemporaryDirectory() as temp_dir:
        # Clone the repository into the temporary directory
        Repo.clone_from(repo_url, temp_dir)

        try:
            # Yield the path to the cloned repository
            yield temp_dir
        finally:
            # Clean up: the temporary directory and its contents will be deleted automatically
            pass
