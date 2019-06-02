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

To list all available commands, simply run

```bash
ego
```

## Available commands

A (non complete) list of some interesting commands:

```
backup        # Backups the current directory.
build         # Shorthand for 'npm run build'.
docker-stop   # Stops all running Docker containers.
docker-up     # Shorthand for 'docker-compose up'.
git-checkout  # Checks out (to) a branch.
git-export    # Clones a repository to the working directory and removes the '.git' subfolder.
git-pull      # Pulls from all remotes to the current branch.
git-push      # Pushes the current branch to all remotes.
git-sync      # Syncs the current branch with all remotes.
new           # Starts the e.GO generator for Yeoman.
node-install  # Removes the 'node_modules' subfolder and executes 'npm install'.
run           # Runs one or more Node.js based script file(s).
serve         # Starts a HTTP server that shares files via a web interface.
```

## Custom commands

To implement a command, lets say `my-command`, create a `my-command.sh` (`my-command.cmd` on Windows) file inside the `.ego` subfolder of your home directory, give it enough rights to be executed and fill it with the code, you would like to execute.

To execute the new command, simply run

```bash
ego my-command ARG1 ARG2
```

All additional arguments, after `my-command`, will be passed to the shell / batch script.

### Scripts

With the help of `run` command, you can implement [Node.js]() based scripts.

Create a `.js` file, like `test.js`, and use the following skeleton:

```javascript
exports.execute = async (context) => {
    // context  =>  s. https://egodigital.github.io/ego-cli/interfaces/_contracts_.commandexecutecontext.html

    // context.args            =>  List of command line arguments, s. https://www.npmjs.com/package/minimist
    // context.cwd             =>  The full path of the current working directory
    // context.getFullPath()   =>  Returns the full version of a path, based on the value of 'cwd'
    // context.package         =>  The 'package.json' file of the e.GO CLI
    // context.queue           =>  A queue, that only executes 1 action at the same time, s. https://www.npmjs.com/package/p-queue
    // context.require         =>  Allows to include a NPM module of the e.GO CLI
    // context.values          =>  A key/value pair storage, that is available while the execution
    // context.verbose         =>  Indicates, if script should output additional information or not

    // docker utils, s. https://egodigital.github.io/ego-cli/modules/_docker_.html
    const docker = context.require('./docker');
    // git utils, s. https://egodigital.github.io/ego-cli/modules/_git_.html
    const git = context.require('./git');
    // common app utils, s. https://egodigital.github.io/ego-cli/modules/_util_.html
    const util = context.require('./util');

    util.writeLine('Hello, from ' + __filename);
};
```

You can run the script, by executing

```bash
ego run test.js
```

from the folder, that contains the file.

You are also able to store it globally, inside the `.ego` subfolder, inside your user's home directory (`${HOME}/.ego/test.js`).

## Contribute

The [contribution guide](./CONTRIBUTE.md) explains, how to implement a new command, work with the code and open a pull request.

## Copyright

That software makes use of free version of [MD Bootstrap](https://mdbootstrap.com/).
