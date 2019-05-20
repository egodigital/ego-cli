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

import * as _ from 'lodash';
import * as fs from 'fs-extra';
import * as path from 'path';
import { default as chalk } from 'chalk';
import { Command, PackageJSON } from './contracts';
import { compareValuesBy, eGO, writeLine } from './util';


interface CommandInfo {
    file: string;
    name: string;
    object: Command;
}


/**
 * Shows the common help screen.
 *
 * @param {PackageJSON} app The app information.
 */
export function showHelp(app: PackageJSON): void {
    showHelpHeader(app);

    writeLine(`Syntax:    ego COMMAND [options]`);
    writeLine();

    writeLine(`General options:`);
    writeLine(` -h, --help     # Prints this info and help screen.`);
    writeLine(` -v, --version  # Prints the version of that app.`);
    writeLine();

    writeLine(`Examples:    ego -v`);
    writeLine(`             ego new`);
    writeLine(`             ego help git-sync`);
    writeLine();

    writeLine(`Available commands:`);
    {
        const COMMANDS: CommandInfo[] = [];

        const COMMANDS_DIR = path.resolve(
            path.join(__dirname, 'commands')
        );

        for (const ITEM of fs.readdirSync(COMMANDS_DIR)) {
            const CMD_MODULE_FILE = require.resolve(
                path.join(
                    COMMANDS_DIR, ITEM, 'index.js'
                )
            );

            const STAT = fs.statSync(CMD_MODULE_FILE);
            if (STAT.isFile()) {
                const COMMAND_MODULE = require(CMD_MODULE_FILE);

                const COMMAND_CLASS = COMMAND_MODULE.EgoCommand;
                if (_.isNil(COMMAND_CLASS)) {
                    continue;
                }

                COMMANDS.push({
                    file: CMD_MODULE_FILE,
                    name: ITEM,
                    object: new COMMAND_CLASS(),
                });
            }
        }

        // sort commands by name
        const COMMANDS_SORTED = COMMANDS.sort((x, y) => {
            return compareValuesBy(x, y, (i) => {
                return i.name;
            });
        });

        let maxCommandNameLength = 0;
        COMMANDS_SORTED.forEach(c => {
            maxCommandNameLength = Math.max(maxCommandNameLength, c.name.length);
        });

        for (const CMD of COMMANDS_SORTED) {
            writeLine(` ${
                CMD.name
                }${
                ' '.repeat(maxCommandNameLength - CMD.name.length)
                }  # ${
                eGO(CMD.object.description)
                }`);
        }
    }
}

/**
 * Shows the common app header for help screen.
 *
 * @param {PackageJSON} app The app information.
 */
export function showHelpHeader(app: PackageJSON): void {
    writeLine(`${eGO(app.displayName)} (${app.name}) - Version ${app.version}`);
    writeLine(`by ${eGO() + chalk.reset(' Digital GmbH <') + chalk.white('https://e-go-digital.com') + chalk.reset('>')}`);
    writeLine();
}
