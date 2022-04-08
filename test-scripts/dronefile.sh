#! /bin/bash
export AWS_SDK_LOAD_CONFIG=1
# # with params
# node cf-plan.js --template test-scripts/test-template.yml \
#   --stackname test-deploy \
#   --parameters test-scripts/params.json \
#   --tags test-scripts/tags.json \
#   --capabilities CAPABILITY_NAMED_IAM CAPABILITY_IAM \
#   -D

# without params
node cf-plan.js --template test-scripts/test-template-no-parameters.yml \
  --stackname test-deploy \
  --capabilities CAPABILITY_NAMED_IAM CAPABILITY_IAM \
  -D