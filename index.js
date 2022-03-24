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
const stackName = args['stackname'];
const capabilities = args['capabilities'];
const droneMeta = {
  repoName: process.env.DRONE_REPO,
  repoBranch: process.env.DRONE_BRANCH,
  buildNo: process.env.DRONE_BUILD_NUMBER
};
const templateParams = JSON.parse(args['parameters']);
const templateTags = JSON.parse(args['tags']);

const client = new CloudFormationClient();

const createParams = async function() {
  const createChangeParams = {
    ChangeSetName: `${stackName}-changeset-${droneMeta.buildNo}`,
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
    console.log('INFO - Contacting AWS to compare resources - please wait (this can take up to 30s) ...');
    await waitUntilChangeSetCreateComplete({ client }, describeParams);
    const response = await client.send(describe);
    changes = response;
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

const buildDeployCmd = function(changeset) {
  const deployCmd = `You will need at least AWS-CLI v1.15<, and your terminal session must be authenticated with IAM privileges allowing cloudformation:ExecuteChangeSet. 
Run the following command in your terminal:

aws cloudformation execute-change-set --change-set-name ${changeset.ChangeSetId} --no-disable-rollback`
  const mergeCmd = `You will need to create a pull request for your branch and merge to master.
Drone will automatically re-run the pipelines on a merge event - this is the drone build number you can deploy from`
  let output;
  if (droneMeta.repoBranch === "master") {
    output = deployCmd;
  } else {
    output = mergeCmd;
  };
  return output;
};
// Print output to terminal
const renderOutput = async function() {
  const changes = await describeChangeSet();
  const deployInstruction = buildDeployCmd(changes);
  console.log('---');
  console.log(`You have ${changes.Changes.length} changes to deploy`);
  console.log('---');
  printTable(changes.Changes);
  console.log('---');
  console.log("To apply CF:");
  console.log(deployInstruction);
};
// // RENDER OUTPUT TO TERMINAL
renderOutput();