# cf-plan
A command line utility that acts as an enhanced simple front end for AWS Cloudformation. This is inspired in part by the plan function available in terraform, and also the annoying need to have to log in to the AWS management console for an easy view of your changes before you execute them.
## What does it do
The utility does the work of generating a changeset for you with a simplified interface compared with the AWS-CLI. It then queries your Cloudformation resources and prints a human-readable representation of your changeset in the terminal window.
## How to install
There are a few options for you, the easiest would be to download one of the distribution-appropriate pre-compiled binaries from the releases page when these become available.
Until then, you can download the source and compile it yourself using the pkg compiler, or just use it as a standalone script with the following commands:
```
git clone https://github.com/banbone/cf-plan.git
cd cf-plan
npm install
node cf-plan.js --help
```
You also need to ensure you export the following var to your env ```AWS_SDK_LOAD_CONFIG=1``` to allow the utility to access the aws account in your ".aws/config". To automatically apply this at login, consider adding a line to your shell profile, for example:
```bash
echo "export AWS_SDK_LOAD_CONFIG=1" >> ~/.bashrc
```
## Command-line Options
There are 3 minimum required fields that must be specified as command line arguments: 
* template - this is the path to the template specifying your Cloudformation resources
* stackname - the name of the stack you wish to create or update
* capabilities - this is explained in greater detail by the AWS Cloudformation documentation, so it's recommended to look there for more information. The available options are CAPABILITY_IAM, CAPABILITY_NAMED_IAM, and CAPABILITY_AUTO_EXPAND. These specify actions that are allowed by Cloudformation, therefore errors will be returned if incorrect capabilities are specified. If multiple capabilities are required then you can list them one after the other separated by spaces (commas not required)
There are also several optional arguments you can specify including parameter overrides, global tags and deployment methods. More information is available below.
```
Usage: cf-plan --template ... --stackname ... --capabilities ... OPTIONS...
### Options:
  -v, --version                 output the version number
  -t, --template value          Path to your Cloudformation template. Currently only supports Yaml.
  -s, --stackname value         The name of the stack you want to deploy or update.
  -c, --capabilities value...   List of Cloudformation capabilities needed to deploy resources.
  -P, --parameters value        Parameter overrides to be used when deploying Cloudformation template. OPTIONAL
  -T, --tags value              Tags to be applied to your Cloudformation resources. OPTIONAL
  -D, --drone                   Whether or not the drone-specific deployment method will be used. OPTIONAL
  -h, --help                    display help for command
```
## Parameters/Tags
To override values set in your template, you can specify parameters at the top of your Cloudformation template like so:
```yaml
Parameters:
  Foo:
    Type: String
    Description: A parameter
  An:
    Type: String
    Description: Another parameter
    NoEcho: True
...
```
You can then provide the values for these by adding a "Default" property under each, and/or externally with a parameter file. Please note that if you specify a parameter in your template and provide neither a default property, or external parameter source, changeset creation will fail. 
You should provide your parameters in an external file as a JSON array with the following syntax:
```json
[
  {
    "ParameterKey": "Foo",
    "ParameterValue": "Bar"
  },
  {
    "ParameterKey": "An",
    "ParameterValue": "Other"
  },
  ...
]
```
If you would like to apply global tags to your stack, you can supply these tags in a similar json array file with the following syntax:
```json
[
  {
    "Key": "Project",
    "Value": "cf-plan-example"
  },
  {
    "Key": "Version",
    "Value": "x.x.x"
  },
  ...
]
```
## Drone Mode
If you use drone as a CI tool or for testing and deployment, you can enable drone mode using the -D or --drone switches. This will read the environment var values from your drone runner agent config, and update your changeset with the unique build number and repo details.
The key functionality of drone mode is to effectively dry-run your changeset if you are not on your main/master branch. The changeset to be deployed will only be made available to deploy when drone re-runs your pipeline in the event of a merge into your main branch. The default values of "main" or "master" would need to be used as your main branch for this to function correctly. If you have a differently named branch, you would need to make edits to the following lines to accomodate this:
* 153
* 156
* 202
* 213
## Contributions
All contributions are welcome! Everything from compiling binaries for other systems, down to amending or clarifying the readme! All PR's encouraged :)