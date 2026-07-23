#!/usr/bin/env bash
set -e

PLUGIN_NAME="FlexTable"
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PLUGIN_DIR="$ROOT_DIR/$PLUGIN_NAME"
DIST_DIR="$ROOT_DIR/dist"
ARCHIVE_ZIP="$DIST_DIR/$PLUGIN_NAME.zip"
ARCHIVE_VIZ="$DIST_DIR/$PLUGIN_NAME.viz"

if [ ! -d "$PLUGIN_DIR" ]; then
    echo "Error: Plug-in directory was not found at $PLUGIN_DIR" >&2
    exit 1
fi

mkdir -p "$DIST_DIR"
rm -f "$ARCHIVE_ZIP" "$ARCHIVE_VIZ"

cd "$ROOT_DIR"
zip -r "$ARCHIVE_ZIP" "$PLUGIN_NAME" -q
cp "$ARCHIVE_ZIP" "$ARCHIVE_VIZ"

echo "Build Successful!"
echo "Created $ARCHIVE_ZIP"
echo "Created $ARCHIVE_VIZ"
