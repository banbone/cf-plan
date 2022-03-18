'use-strict'
const { 
  CloudFormationClient, 
  CreateChangeSetCommand, 
  DescribeChangeSetCommand,
  DescribeStacksCommand 
} = require("@aws-sdk/client-cloudformation");
const Table = require('./node_modules/easy-table');
const args = require('./node_modules/minimist')(process.argv.slice(2))
const template = args['template'];
const droneTag = args['dronetag'];
const stackName = args['stackname'];
const capabilities = args['capabilities'];
const templateParams = JSON.parse(args['parameters']);
const templateTags = JSON.parse(args['tags']);

const client = new CloudFormationClient();

const describeStacks = async function() {
  const stackParams = {
    StackName: stackName
  };
  const stacks = new DescribeStacksCommand(stackParams);
  // const response = await client.send(stacks);
  try {
    const data = await client.send(stacks);
    console.log("UPDATE");
    return "UPDATE";
  } catch (error) {
    if (error.Code === "ValidationError") {
      console.log("CREATE");
      return "CREATE";
    } else {
      console.log(`Error - ${error.$metadata.httpStatusCode} - List stack operation failed`);
      return;
    }
  };
};
describeStacks();

// const createChangeSet = async function() {
//   const changeSetType = await describeStacks();
//   const createParams = {
//     ChangeSetName: `${stackName}-changeset-${droneTag}`,
//     StackName: stackName,
//     Capabilities: [
//       capabilities,
//     ],
//     ChangeSetType: changeSetType,
//     Parameters: templateParams,
//     Tags: templateTags,
//     TemplateBody: template
//   };
//   const create = new CreateChangeSetCommand(createParams);
//   const response = await client.send(create);
//   if (response.$metadata.httpStatusCode != 200) {
//     console.error(`Error - ${response.$metadata.httpStatusCode} - changeset create failed`);
//     return;
//   } else {
//     return response.Id;
//   };
// };

// const describeChangeSet = async function() {
//   const changesetId = await createChangeSet();
//   const describeParams = {
//     ChangeSetName: changesetId
//   };
//   const describe = new DescribeChangeSetCommand(describeParams);
//   const response = await client.send(describe);
//   if (response.$metadata.httpStatusCode != 200) {
//     console.error(`Error - ${response.$metadata.httpStatusCode} - describe operation failed`);
//     return;
//   } else {
//     return response.Changes;
//   };
// };

// // // generate resource table from changeset
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

// // Print output to terminal
// const renderOutput = async function() {
//   const changes = await describeChangeSet();
//   console.log(`You have ${changes.length} changes to deploy.`);
//   printTable(changes);
// };

// renderOutput();
// // // RENDER OUTPUT TO TERMINAL