# Docs Scripts

To generate updated docs from the scripts below, just run `pnpm docs:build`.

## Screenshots

### Setup

1. At the project root, create a virtual environment: `virtualenv .venv`
2. Activate it `source .venv/bin/activate`
3. Install the packages `pip install -r docs/scripts/docs-requirements.txt`
4. Make sure the _.env_ file `ORIGIN` is set to the same URL as the demo server.

### Running the script

1. Get the demo server running `pnpm dev`
2. In a separate shell to the server, run the screenshot generation: `pnpm docs:screen`

- Any new pages you wish to scrape can be added to the above script inside the Python dict `PAGES_TO_CAPTURE`
- Files are currently exported to _docs/images_

## JSDocs Generate

1. Run `pnpm docs:jsdocs`
