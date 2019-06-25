# Contribution guidelines

## Implement a command

### Get the code

Fork the repository https://github.com/egodigital/ego-cli, clone it

```bash
git clone https://github.com/YOUR-GITHUB-NAME/ego-cli
```

go to the root directory of the project

```bash
cd ego-cli
```

and run the following commands:

```bash
# install required modules
npm install

# build the project
npm run build

# make it available as
# global command
# (this may require admin rights, like sudo)
npm link
```

You should now be able to display the help screen, if you execute

```bash
ego
```

### Start implementation

First create a feature branch with the name of the new command:

```bash
git checkout -b my-new-command
```

Then create a subfolder, called `my-new-command`, inside the [/src/commands](./src/commands) directory with a `index.ts` file and use the following skeleton:

```typescript
/**
 * This file is part of the ego-cli distribution.
 * Copyright (c) e.GO Digital GmbH, Aachen, Germany (https://www.e-go-digital.com/)
 *
 * ego-cli is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Lesser General Public License as
 * published by the Free Software Foundation, version 3.
 *
 * ego-cli is distributed in the hope that it will be useful, but
 * WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU
 * Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public License
 * along with this program. If not, see <http://www.gnu.org/licenses/>.
 */

import { CommandBase, CommandExecuteContext } from '../../contracts';
import { writeLine } from '../../util';


/**
 * My-New-Command command
 */
export class EgoCommand extends CommandBase {
    /** @inheritdoc */
    public readonly description = '<A SHORT DESCRIPTION OF my-new-command>.';

    /** @inheritdoc */
    public async execute(context: CommandExecuteContext): Promise<void> {
        // context  =>  s. https://egodigital.github.io/ego-cli/interfaces/_contracts_.commandexecutecontext.html

        if (context.args['v'] || context.args['verbose']) {
            // -v or --verbose argument
            // is defined, s. showHelp()

            writeLine(`OK, you want some more output:`);
            writeLine();
            writeLine(`Ich bin der Geist, der stets verneint!
Und das mit Recht; denn alles, was entsteht,
Ist wert, daß es zugrunde geht;
Drum besser wär's, daß nichts entstünde.
So ist denn alles, was ihr Sünde,
Zerstörung, kurz, das Böse nennt,
Mein eigentliches Element.`);
        }

        writeLine('Hello, my-new-command!');
    }

    /** @inheritdoc */
    public async showHelp(): Promise<void> {
        // this is executed, if you run
        // ego help my-new-command

        writeLine(`Options:`);
        writeLine(` -v, --verbose  # Verbose output.`);
        writeLine();

        writeLine(`Example:    ego my-new-command`);
    }

    /** @inheritdoc */
    public readonly syntax = '[options]';  // Syntax, that is shown in help screen
}
```

To test the code, simply build the app by executing

```bash
npm run build
```

from the project's root folder and run

```bash
ego my-new-command
```

The command should output `Hello, my-new-command!` to the shell, where you are currently working.

To test the help screen, run

```bash
ego help my-new-command
```

which makes use of `showHelp()` method and `syntax` property in the `EgoCommand` class.

### Documentation

API documentation can be found [here](https://egodigital.github.io/ego-cli/).

### Open pull request

* commit your changes
* sync them with your forked repository
* open a [pull request](https://github.com/egodigital/ego-cli/pulls) from your branch to our [master](https://github.com/egodigital/ego-cli)
