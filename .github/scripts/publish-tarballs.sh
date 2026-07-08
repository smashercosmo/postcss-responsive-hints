#!/usr/bin/env bash

cd tarballs
jq -r '.plan[][] | [.name, .version, .tarball.path] | @tsv' publish-plan.json | \
while IFS=$'\t' read -r name version tarball_path; do
  echo "::notice:: Publishing $name@$version"
  pnpm stage publish "$tarball_path" \
  --no-git-checks \
  --access public \
  --provenance
done