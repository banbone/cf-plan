#! /bin/bash
export AWS_SDK_LOAD_CONFIG=1
# with params
params=$(jq -r '.Parameters' test-scripts/params.json)
tags=$(jq -r '.Tags' test-scripts/params.json)
node cf-plan.js --template test-scripts/test-template.yml \
  --stackname test-deploy \
  --parameters "$params" \
  --tags "$tags" \
  --capabilities CAPABILITY_NAMED_IAM CAPABILITY_IAM \
  -D

# # without params
# node cf-plan.js --template test-scripts/test-template-no-parameters.yml \
#   --stackname test-deploy \
#   --capabilities CAPABILITY_NAMED_IAM CAPABILITY_IAM