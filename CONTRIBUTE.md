# Contribution guidelines

## Implement a command

### Get the code

Clone the repository

```bash
git clone https://github.com/egodigital/ego-cli
```

and go to the root directory of the project

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
    public async execute(ctx: CommandExecuteContext): Promise<void> {
        // ctx.args => command line arguments, s. https://github.com/substack/minimist
        // ctx.cwd => current working directory
        // ctx.verbose => is '-v' / '--verbose' flag set or not

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
}
```

To test the code, simply build the code by executing

```bash
npm run build
```

from the project's root folder and run

```bash
ego my-new-command
```

The command should output `Hello, my-new-command!` to the shell, where you are currently working.
