#! /bin/bash
export AWS_SDK_LOAD_CONFIG=1
template=$(cat test-scripts/test-template.yml)
params=$(jq -r '.Parameters' test-scripts/params.json)
tags=$(jq -r '.Tags' test-scripts/params.json)
node index.js --template "$template" \
  --stackname "test-deploy" \
  --parameters "$params" \
  --tags "$tags" \
  --capabilities "CAPABILITY_NAMED_IAM"
