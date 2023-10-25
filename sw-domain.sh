#!/bin/bash

# The PWA service worker file needs domain inserted
# So we read the origin from the local .env file and paste it into the build files on starting the app
# This is a bit hacky, but if I don't want to hardcode the URL, this is the way I could figure out

# Read the local variables
source .env

# Error out if no .env file
if [ ! -f .env ]; then
  echo "Error: .env file not found!"
  exit 1
fi

# Check if ORIGIN is set
if [ -z "$ORIGIN" ]; then
  echo "Error: ORIGIN environment variable is not set!"
  exit 1
fi

# Log the DOMAIN to Docker logs
echo "Domain set to: $ORIGIN"

# Escape special characters in $ORIGIN
escaped_origin=$(echo "$ORIGIN" | perl -pe 's|\.|\\.|g; s|/|\\/|g')

# Define function to replace %%URLPATTERN%% with the escaped version of $ORIGIN in a file
replace_urlpattern() {
  local file="$1"
  perl -pi -e "s|%%URLPATTERN%%|$escaped_origin/|g" "$file"
  # Log the file being modified to Docker logs
  echo "Replaced URL pattern in: $file"
}

# Call the function for each file
replace_urlpattern "build/client/service-worker.js"
replace_urlpattern "build/client/service-worker.js.map"
replace_urlpattern ".svelte-kit/output/client/service-worker.js"
replace_urlpattern ".svelte-kit/output/client/service-worker.js.map"
