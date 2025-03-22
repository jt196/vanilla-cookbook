# Initial Setup

1. At the project root, create a virtual environment: `virtualenv .venv`
2. Activate it `source .venv/bin/activate`
3. Install the packages `pip install -r docs/scripts/docs-requirements.txt`
4. Get the demo server running `pnpm dev`
5. Make sure the _.env_ file `ORIGIN` is set to the same URL as the demo server.
6. In a separate shell to the server, run the screenshot generation: `python ./docs/scripts/screenshots.py`
7. Any new pages you wish to scrape can be added to the above script inside the Python dict `PAGES_TO_CAPTURE`
