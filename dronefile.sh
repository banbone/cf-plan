#! /bin/bash
export AWS_SDK_LOAD_CONFIG=1
template=$(cat test-template.yml)
params=$(jq -r '.Parameters' params.json)
tags=$(jq -r '.Tags' params.json)
node index.js --template "$template" \
  --stackname "test-deploy" \
  --parameters "$params" \
  --tags "$tags" \
  --capabilities "CAPABILITY_NAMED_IAM"