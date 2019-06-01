[![npm](https://img.shields.io/npm/v/ego-cli.svg)](https://www.npmjs.com/package/ego-cli)

# ego-cli

Command Line Interface, which is designed to handle Dev(Op) tasks much faster.

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

## Custom commands

To implement a command, lets say `my-command`, create a `my-command.sh` (`my-command.cmd` on Windows) file inside the `.ego` subfolder of your home directory, give it enough rights to be executed and fill it with the code, you would like to execute.

To execute the new command, simply run

```bash
ego my-command ARG1 ARG2
```

All additional arguments, after `my-command`, will be passed to the shell / batch script.

## Contribute

The [contribution guide](./CONTRIBUTE.md) explains, how to implement a new command, work with the code and open a pull request.
