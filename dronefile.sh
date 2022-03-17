#! /bin/bash
export AWS_SDK_LOAD_CONFIG=1
template=$(cat test-template.yml)
params=$(cat params.json)
node index.js --template "$template" \
  --dronetag "12345" \
  --stackname "test-deploy" \
  --parameters "$params" \
  --capabilities "CAPABILITY_NAMED_IAM"