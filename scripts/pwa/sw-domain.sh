#!/bin/bash

# Suppress the language warning
export PERL_BADLANG=0

# Resolve ORIGIN from env, then .env file, then sensible local default.
if [ -z "$ORIGIN" ] && [ -f ".env" ]; then
  set -a
  # shellcheck disable=SC1091
  . ./.env
  set +a
fi

if [ -z "$ORIGIN" ]; then
  ORIGIN="http://localhost:5173"
  echo "Warning: ORIGIN not set. Falling back to $ORIGIN for SW domain substitution."
fi

# Log the DOMAIN to Docker logs
echo "Domain set to: $ORIGIN"

# Escape special characters in $ORIGIN
escaped_origin=$(echo "$ORIGIN" | perl -pe 's|\.|\\.|g; s|/|\\/|g')

echo "Escaped Origin: $escaped_origin"

# Define function to replace %%URLPATTERN%% with the escaped version of $ORIGIN in a file
replace_urlpattern() {
  local file="$1"
  echo "---------- File: $file ----------"
  ORIGIN_ESCAPED="$escaped_origin" perl -pi -e 's|%%URLPATTERN%%|$ENV{ORIGIN_ESCAPED}|g' "$file"
  echo "Replaced URL pattern in: $file"
  echo "After substitution:"
  grep -C 2 'registerRoute' "$file" || echo "Pattern not replaced in $file"
  echo "---------------------------------"
}

# Call the function for each JS file (including .map)
replace_urlpattern "build/client/service-worker.js"
replace_urlpattern ".svelte-kit/output/client/service-worker.js"
replace_urlpattern "build/client/service-worker.js.map"
replace_urlpattern ".svelte-kit/output/client/service-worker.js.map"
