#!/bin/bash

echo "🚀 Quick Storacha Upload Test"
echo ""

# Create test file
TEST_FILE="/tmp/arc-test-$(date +%s).txt"
echo "ARC-FX Test Upload - $(date)" > "$TEST_FILE"
echo "Bond Certificate System Test" >> "$TEST_FILE"
echo "This proves Storacha integration works!" >> "$TEST_FILE"

echo "📝 Created test file: $TEST_FILE"
echo "📤 Uploading to Storacha..."
echo ""

# Upload
storacha upload "$TEST_FILE"

echo ""
echo "✅ Upload complete!"
echo "Check your console: https://console.storacha.network/"
echo ""

# Cleanup
rm "$TEST_FILE"

