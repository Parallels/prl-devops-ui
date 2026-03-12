#!/bin/bash
# cleanup-ghcr-tags.sh
#
# Deletes GHCR package versions whose tags match a given regex pattern.
# Uses the GitHub Packages REST API via the gh CLI.
#
# Usage:
#   cleanup-ghcr-tags.sh --package <name> --owner <owner> [options]
#
# Options:
#   --package      Package name (e.g. prl-devops-ui)
#   --owner        GitHub org or user owning the package
#   --owner-type   org (default) or user
#   --filter       Regex to match against version tags (e.g. '.*-canary.*')
#   --keep         Tag to preserve even if it matches the filter (the just-published tag)
#   --dry-run      Print what would be deleted without deleting
#   --verbose      Print all versions, not just matches

set -euo pipefail

PACKAGE_NAME=""
OWNER=""
OWNER_TYPE="org"
FILTER=""
KEEP=""
DRY_RUN="false"
VERBOSE="false"

while [[ $# -gt 0 ]]; do
  case $1 in
    --package)    PACKAGE_NAME="$2"; shift 2 ;;
    --owner)      OWNER="$2";        shift 2 ;;
    --owner-type) OWNER_TYPE="$2";   shift 2 ;;
    --filter)     FILTER="$2";       shift 2 ;;
    --keep)       KEEP="$2";         shift 2 ;;
    --dry-run)    DRY_RUN="true";    shift ;;
    --verbose)    VERBOSE="true";    shift ;;
    *) echo "Unknown argument: $1" >&2; exit 1 ;;
  esac
done

if [[ -z "$PACKAGE_NAME" || -z "$OWNER" || -z "$FILTER" ]]; then
  echo "Usage: cleanup-ghcr-tags.sh --package <name> --owner <owner> --filter <regex> [--keep <tag>] [--dry-run]" >&2
  exit 1
fi

# Build API path
ENCODED_PACKAGE=$(python3 -c "import urllib.parse; print(urllib.parse.quote('${PACKAGE_NAME}', safe=''))" 2>/dev/null || \
                  python -c "import urllib; print(urllib.quote('${PACKAGE_NAME}'))" 2>/dev/null || \
                  echo "$PACKAGE_NAME" | sed 's|/|%2F|g')

if [[ "$OWNER_TYPE" == "org" ]]; then
  API_BASE="/orgs/${OWNER}/packages/container/${ENCODED_PACKAGE}"
else
  API_BASE="/users/${OWNER}/packages/container/${ENCODED_PACKAGE}"
fi

echo "Fetching package versions for ${OWNER}/${PACKAGE_NAME} (filter: ${FILTER})..."

VERSIONS=$(gh api "${API_BASE}/versions" --paginate 2>/dev/null || echo "[]")
VERSION_COUNT=$(echo "$VERSIONS" | jq 'length')

if [[ "$VERSION_COUNT" == "0" ]]; then
  echo "No versions found or package does not exist — nothing to clean up."
  exit 0
fi

echo "Found ${VERSION_COUNT} total version(s)."

DELETED=0
SKIPPED=0
NOT_MATCHED=0

while IFS= read -r version_json; do
  VERSION_ID=$(echo "$version_json" | jq -r '.id')
  # Tags may be empty for untagged/digest-only versions
  TAGS=$(echo "$version_json" | jq -r '.metadata.container.tags // [] | .[]' 2>/dev/null || echo "")
  TAGS_DISPLAY=$(echo "$TAGS" | tr '\n' ',' | sed 's/,$//')

  # Check filter match
  MATCH="false"
  while IFS= read -r tag; do
    [[ -z "$tag" ]] && continue
    if echo "$tag" | grep -qE "$FILTER"; then
      MATCH="true"
      break
    fi
  done <<< "$TAGS"

  if [[ "$MATCH" == "false" ]]; then
    [[ "$VERBOSE" == "true" ]] && echo "  skip (no match): id=${VERSION_ID} tags=[${TAGS_DISPLAY}]"
    NOT_MATCHED=$((NOT_MATCHED + 1))
    continue
  fi

  # Check keep tag
  SHOULD_KEEP="false"
  if [[ -n "$KEEP" ]]; then
    while IFS= read -r tag; do
      [[ -z "$tag" ]] && continue
      if [[ "$tag" == "$KEEP" ]]; then
        SHOULD_KEEP="true"
        break
      fi
    done <<< "$TAGS"
  fi

  if [[ "$SHOULD_KEEP" == "true" ]]; then
    echo "  keep: id=${VERSION_ID} tags=[${TAGS_DISPLAY}] (matches --keep)"
    SKIPPED=$((SKIPPED + 1))
    continue
  fi

  if [[ "$DRY_RUN" == "true" ]]; then
    echo "  [dry-run] would delete: id=${VERSION_ID} tags=[${TAGS_DISPLAY}]"
    DELETED=$((DELETED + 1))
  else
    echo "  deleting: id=${VERSION_ID} tags=[${TAGS_DISPLAY}]"
    gh api --method DELETE "${API_BASE}/versions/${VERSION_ID}" && \
      DELETED=$((DELETED + 1)) || \
      echo "  WARNING: failed to delete version ${VERSION_ID}" >&2
  fi
done < <(echo "$VERSIONS" | jq -c '.[]')

echo ""
echo "Summary: deleted=${DELETED} kept=${SKIPPED} not-matched=${NOT_MATCHED}"
[[ "$DRY_RUN" == "true" ]] && echo "(dry-run mode — nothing was actually deleted)"
