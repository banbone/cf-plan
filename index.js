'use-strict'
const Table = require('./node_modules/easy-table');
const AWS = require('./node_modules/aws-sdk');
const args = require('./node_modules/minimist')(process.argv.slice(2))
const template = args['template'];
const droneTag = args['dronetag'];
const stackName = args['stackname'];
const paramFile = args['parameters'];
const capabilities = args['capabilities']

// const readline = require('readline');
// const process = require('process');
// const changeset = require('temp/changeset.json');
// const changes = changeset.Changes;
// const chgNo = changes.length;

// console.log(template);
const cfn = new AWS.CloudFormation();

// generate changeset
const params = {
  ChangeSetName: `${stackName}-changeset-${droneTag}`,
  StackName: stackName,
  Capabilities: [
    capabilities,
  ],
  ChangeSetType: "",
  Parameters: paramFile.Parameters,
  RollbackConfiguration: {
    MonitoringTimeInMinutes: 'NUMBER_VALUE',
    RollbackTriggers: [
      {
        Arn: 'STRING_VALUE',
        Type: 'STRING_VALUE'
      },
    ]
  },
  Tags: paramFile.Tags,
  TemplateBody: template,
};

// find out if stack already exists and set changeset type
const stackParams = {
  StackName: stackName
};
cfn.describeStacks(stackParams, function (err) {
  if (err) {
    if (err.code === "ValidationError") {
      params.ChangeSetType = "CREATE";
    };
  } else {
    params.ChangeSetType = "UPDATE";
  };
});
console.log(params);
// cfn.createChangeSet(params, function(err, data) {
//   if (err) console.log(err, err.stack); // an error occurred
//   else     console.log(data);           // successful response
// });

// // generate resource table from changeset
// const printTable = function(deployment) {
//   const t = new Table;
//   deployment.forEach(function(item) {
//     t.cell('Logical ID', item.ResourceChange.LogicalResourceId);
//     t.cell('Resource Type', item.ResourceChange.ResourceType);
//     t.cell('Action', item.ResourceChange.Action);
//     t.newRow();
//   });
//   console.log(t.toString());
// };

// // RENDER OUTPUT TO TERMINAL
// console.log(`You have ${chgNo} changes to deploy.`);
// printTable(changes);