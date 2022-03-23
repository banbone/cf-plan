'use-strict'
const { 
  CloudFormationClient, 
  CreateChangeSetCommand, 
  DescribeChangeSetCommand,
  DescribeStacksCommand,
  waitUntilChangeSetCreateComplete
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

const createParams = async function() {
  const createChangeParams = {
    ChangeSetName: `${stackName}-changeset-${droneTag}`,
    StackName: stackName,
    Capabilities: [
      capabilities,
    ],
    Parameters: templateParams,
    Tags: templateTags,
    TemplateBody: template
  };
  const describeStackParams = {
    StackName: stackName
  };
  const describeStacks = new DescribeStacksCommand(describeStackParams);
  try {
    const response = await client.send(describeStacks);
    if (response.$metadata.httpStatusCode === 200) {
      for (stack in response.Stacks) {
        if (stack.StackName === createChangeParams.stackName) {
          createChangeParams.ChangeSetType = "UPDATE";
        };
      };
    } else {
      createChangeParams.ChangeSetType = "CREATE";
    };
  } catch (err) {
    if (err.Code === 'ValidationError') {
      createChangeParams.ChangeSetType = "CREATE";
    } else {
      console.error(`Client Error - code ${err.$metadata.httpStatusCode} - Failed to generate changeset.`);
    };
  } finally {
    console.log('INFO - Enumerating template');
    return createChangeParams;
  };
};

// createParams();
const createChangeSet = async function() {
  let changesetId;
  const changesetParams = await createParams();
  const create = new CreateChangeSetCommand(changesetParams);
  try {
    const response = await client.send(create);
    // console.log(response);
    changesetId = response.Id;
  } catch (err) {
    console.error(`Error - ${err.$metadata.httpStatusCode} - changeset creation failed`);
  } finally {
    console.log('INFO - Generating Changeset');
    return changesetId;
  };
};

// createChangeSet();
const describeChangeSet = async function() {
  let changes;
  const changesetId = await createChangeSet();
  const describeParams = {
    ChangeSetName: changesetId
  };
  const describe = new DescribeChangeSetCommand(describeParams);
  try {
    console.log('INFO - Contacting AWS to compare resources - please wait ...');
    await waitUntilChangeSetCreateComplete({ client }, describeParams);
    const response = await client.send(describe);
    changes = response.Changes;
  } catch (err) {
    console.error(err);
  } finally {
    return changes;
  };
};
// describeChangeSet();

// generate resource table from changeset
const printTable = function(deployment) {
  const t = new Table;
  deployment.forEach(function(item) {
    t.cell('Logical ID', item.ResourceChange.LogicalResourceId);
    t.cell('Resource Type', item.ResourceChange.ResourceType);
    t.cell('Action', item.ResourceChange.Action);
    t.newRow();
  });
  console.log(t.toString());
};

// Print output to terminal
const renderOutput = async function() {
  const changes = await describeChangeSet();
  console.log('---');
  console.log(`You have ${changes.length} changes to deploy`);
  console.log('---');
  printTable(changes);
};

// // RENDER OUTPUT TO TERMINAL
renderOutput();