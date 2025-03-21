# Initial Setup

1. At the project root, create a virtual environment: `virtualenv .venv`
2. Activate it `source .venv/bin/activate`
3. Install the packages `pip install -r docs/scripts/docs-requirements.txt`
4. Run the screenshot generation: `python ./docs/scripts/screenshots.py`
5. Any new pages you wish to scrape can be added to the above script inside the Python dict `PAGES_TO_CAPTURE`
