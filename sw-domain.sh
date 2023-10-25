#!/bin/bash

# The PWA service worker file needs domain inserted
# So we read the origin from the local .env file and paste it into the build files on starting the app
# This is a bit hacky, but if I don't want to hardcode the URL, this is the way I could figure out

# Read the local variables
source .env

# Escape special characters in $ORIGIN
escaped_origin=$(echo "$ORIGIN" | perl -pe 's|\.|\\.|g; s|/|\\/|g')

# Define function to replace %%URLPATTERN%% with the escaped version of $ORIGIN in a file
replace_urlpattern() {
  local file="$1"
  perl -pi -e "s|%%URLPATTERN%%|$escaped_origin/|g" "$file"
}

# Call the function for each file
replace_urlpattern "build/client/service-worker.js"
replace_urlpattern "build/client/service-worker.js.map"
replace_urlpattern ".svelte-kit/output/client/service-worker.js"
replace_urlpattern ".svelte-kit/output/client/service-worker.js.map"