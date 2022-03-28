#! /bin/bash
changesets=$(aws cloudformation list-change-sets \
	--stack-name $1 \
	| jq -r '.Summaries[].ChangeSetId')
for i in $changesets ;
do
	aws cloudformation delete-change-set \
		--change-set-name "$i" ;
done
aws cloudformation delete-stack \
	--stack-name "$1"
