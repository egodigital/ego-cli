[![npm](https://img.shields.io/npm/v/ego-cli.svg)](https://www.npmjs.com/package/ego-cli)

# ego-cli

Command Line Interface, which is designed to handle things, like Dev(Op) tasks, much faster.

## Install

You can install it globally:

```bash
npm install -g ego-cli
```

Or for your project, from where your `package.json` file is stored:

```bash
npm install --save-dev ego-cli
```

## Execute

For example run the integrated [Yeoman generator](https://github.com/egodigital/generator-ego) by executing:

```bash
ego new
```

## Available commands

A (non complete) list of some interesting commands:

```
aptdate              # Runs 'apt-get update', 'apt-get upgrade' and 'apt-get autoremove' in one command.
api                  # Runs an Express.js based REST API from current directory.
backup               # Backups the current directory.
build                # Shorthand for 'npm run build'.
csv-split            # Splits one or more (huge) CSV file(s) into separates parts.
chuck                # Print a random Chuck Norris joke. Jep it is true! Just try it 😎
create               # Runs an e.GO creator module on npm.
devops-items-update  # Updates one or more Azure DevOps work items.
docker-stop          # Stops all running Docker containers.
docker-up            # Shorthand for 'docker-compose up'.
git-checkout         # Checks out (to) a branch.
git-delete           # Deletes local branches, except 'master' and the current one.
git-export           # Clones a repository to the working directory and removes the '.git' subfolder.
git-pull             # Pulls from all remotes to the current branch.
git-push             # Pushes the current branch to all remotes.
git-sync             # Syncs the current branch with all remotes.
job                  # Executes one or more scripts periodically.
new                  # Starts the e.GO generator for Yeoman.
node-install         # Removes the 'node_modules' subfolder and executes 'npm install'.
public-ip            # Print public ipv4 and ipv6 ip address.
pull-request         # Starts a pull request (Azure DevOps) for the branch of the current git repository.
qr                   # Creates an image file with a QR code from a text.
rn-run               # Runs the current React Native project.
run                  # Runs one or more Node.js based script file(s).
serve                # Starts a HTTP server that shares files via a web interface.
slack-post           # Posts a message to one or more Slack channels.
ssl-new              # Creates a new self-signed SSL certificate.
watch                # Runs one or more scripts for file changes.
```

To list all available commands, simply run

```bash
ego
```

## Wiki

Have a look at the [wiki](https://github.com/egodigital/ego-cli/wiki), which contains interesting articles and recipes like:

* [Running REST APIs](https://github.com/egodigital/ego-cli/wiki/APIs)
* [Running Scripts](https://github.com/egodigital/ego-cli/wiki/Scripts)
* [Implementing Custom commands](https://github.com/egodigital/ego-cli/wiki/Custom%20commands)

## Contribute

The [contribution guide](./CONTRIBUTION.md) explains, how to implement a new command, work with the code and open a pull request.

## Copyright

That software makes use of free version of [MD Bootstrap](https://mdbootstrap.com/).
