'use-strict'
const fs = require('fs');
const { 
  CloudFormationClient, 
  CreateChangeSetCommand, 
  DescribeChangeSetCommand,
  DescribeStacksCommand,
  waitUntilChangeSetCreateComplete,
} = require("@aws-sdk/client-cloudformation");
const Table = require('./node_modules/easy-table');
const commander = require('commander');
commander
  .version('1.0.0', '-v, --version')
  .usage('[OPTIONS]...')
  .requiredOption('-t, --template <value>', 'Path to your Cloudformation template. Currently only supports Yaml.')
  .requiredOption('-s, --stackname <value>', 'The name of the stack you want to deploy or update.')
  .requiredOption('-c, --capabilities <value...>', 'List of Cloudformation capabilities needed to deploy resources.')
  .option('-P, --parameters <value>' , 'Parameter overrides to be used when deploying Cloudformation template. OPTIONAL')
  .option('-T, --tags <value>', 'Tags to be applied to your Cloudformation resources. OPTIONAL')
  .option('-D, --drone', 'Whether or not the drone-specific deployment method will be used. OPTIONAL')
  .parse(process.argv);

const options = commander.opts();
const template = fs.readFileSync(options.template, 'utf8');
const stackName = options.stackname;
const [capabilities] = options.capabilities;

const client = new CloudFormationClient();

const getBuildMeta = function (env) {
  let buildMeta = {};
  if (!options.drone) {
    buildMeta.repoName = stackName;
    buildMeta.repoBranch = "main";
    buildMeta.buildNo = "200";
  } else if (options.drone) {
    buildMeta.repoName = env.DRONE_REPO;
    buildMeta.repoBranch = env.DRONE_BRANCH;
    buildMeta.buildNo = env.DRONE_BUILD_NUMBER;
  };
  return buildMeta
};

const createParams = async function() {
  const buildMeta = getBuildMeta(process.env);
  let createChangeParams = {
    ChangeSetName: `${stackName}-changeset-${buildMeta.buildNo}`,
    StackName: stackName,
    Capabilities: [
      capabilities,
    ],
    TemplateBody: template
  };
  if (options.parameters) {
    createChangeParams.Parameters = JSON.parse(options.parameters);
  };
  if (options.tags) {
    createChangeParams.Tags = JSON.parse(options.tags);
  };
  const describeStackParams = {
    StackName: stackName
  };
  const describeStacks = new DescribeStacksCommand(describeStackParams);
  try {
    const response = await client.send(describeStacks);
    console.log(response);
    if (response.$metadata.httpStatusCode === 200) {
      for (stack in response.Stacks) {
        if (stack.StackName === createChangeParams.stackName && stack.StackStatus === 'REVIEW_IN_PROGRESS') {
          createChangeParams.ChangeSetType = "CREATE";
        } else if (stack.StackName === createChangeParams.stackName && stack.StackStatus != 'REVIEW_IN_PROGRESS') {
          createChangeParams.ChangeSetType = "UPDATE"
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
    console.log('INFO - Enumerating template\n');
    return createChangeParams;
  };
};

const createChangeSet = async function() {
  let changesetId;
  const changesetParams = await createParams();
  const create = new CreateChangeSetCommand(changesetParams);
  try {
    const response = await client.send(create);
    changesetId = response.Id;
  } catch (err) {
    console.error(`Error - ${err.$metadata.httpStatusCode} - changeset creation failed`);
  } finally {
    console.log('INFO - Generating Changeset\n');
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
    console.log('INFO - Contacting AWS to compare resources - please wait \n(this can take up to 30s) ...\n');
    await waitUntilChangeSetCreateComplete({ client }, describeParams);
    const response = await client.send(describe);
    changes = response;
  } catch (err) {
    console.error(err);
  } finally {
    return changes;
  };
};

// generate resource table from changeset
const printTable = function(deployment) {
  const t = new Table;
  deployment.forEach(function(item) {
    if (!item.ResourceChange.Replacement) item.ResourceChange.Replacement = "-";
    t.cell('Logical ID', item.ResourceChange.LogicalResourceId);
    t.cell('Resource Type', item.ResourceChange.ResourceType);
    t.cell('Action', item.ResourceChange.Action);
    t.cell('Replacement', item.ResourceChange.Replacement);
    t.newRow();
  });
  console.log(t.toString());
};

const buildDeployCmd = function(changeset) {
  const buildMeta = getBuildMeta(process.env);
  const deployCmd = `You will need at least AWS-CLI v1.15<, and your terminal session must be authenticated with IAM privileges allowing cloudformation:ExecuteChangeSet. 
Run the following command in your terminal:

aws cloudformation execute-change-set --change-set-name ${changeset.ChangeSetId} --no-disable-rollback`
  const mergeCmd = `You will need to create a pull request for your branch and merge to master.
Drone will automatically re-run the pipelines on a merge event and will echo the build command for you`
  let output;
  if (buildMeta.repoBranch == "master" || buildMeta.repoBranch == "main") {
    output = deployCmd;
  } else {
    output = mergeCmd;
  };
  return output;
};

// Print output
const renderOutput = async function() {
  const changes = await describeChangeSet();
  const deployInstruction = buildDeployCmd(changes);
  console.log(`You have ${changes.Changes.length} changes to deploy`);
  console.log("\n");
  printTable(changes.Changes);
  console.log("\nTo apply CF:");
  console.log(deployInstruction);
};
// RENDER OUTPUT TO TERMINAL
renderOutput();

// delete changeset and stack if creating a new stack via drone and not on master branch
