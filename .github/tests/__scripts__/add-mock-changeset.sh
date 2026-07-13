git checkout -B "$FEATURE_BRANCH_NAME"
    
# Run the command and capture the output
OUTPUT=$(pnpm changeset add --empty -m "$CHANGESET_DESCRIPTION")
echo "$OUTPUT"

# 1. Extract the exact markdown file path from the output string
CHANGESET_FILE=$(echo "$OUTPUT" | grep -oE '\.changeset/[a-zA-Z0-9-]+\.md')

# 2. Overwrite the file contents directly
cat > "$CHANGESET_FILE" << EOF
---
"postcss-responsive-hints": major
---

$CHANGESET_DESCRIPTION
EOF

# 3. Add the changes and amend the previous commit
git add "$CHANGESET_FILE"
git commit --amend --no-edit