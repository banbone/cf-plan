#! /bin/sh
aws sts get-caller-identity > caller-id
account=$(jq -r '.Account' caller-id)
role="arn:aws:iam::$account:role/$1"
aws sts assume-role --role-arn "$role" \
	--session-name cf-plan
