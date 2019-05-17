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
import * as fs from 'fs';
import * as minimist from 'minimist';
import * as path from 'path';
import { Command, CommandExecutionContext, PackageJSON, SUPPORTED_COMMANDS } from './contracts';
import { showHelp } from './help';
import { writeLine } from './util';


(async () => {
    const APP: PackageJSON = JSON.parse(
        fs.readFileSync(
            path.resolve(
                path.join(
                    __dirname, '../package.json'
                )
            ), 'utf8'
        )
    );

    const SHOW_HELP_SCREEN = process.argv.length < 3 ||
        '-h' === process.argv[2] ||
        '--help' === process.argv[2];

    if (SHOW_HELP_SCREEN) {
        showHelp(APP);

        process.exit(2);
    }

    const PRINT_VERSION = '-v' === process.argv[2] ||
        '--version' === process.argv[2];
    if (PRINT_VERSION) {
        writeLine(APP.version);

        process.exit(0);
    }

    let command = process.argv[2];
    if (_.isNil(command)) {
        command = '';
    }
    command = command.toLowerCase()
        .trim();

    if ('' === command) {
        console.warn('No command defined!');

        process.exit(4);
    }

    if (SUPPORTED_COMMANDS.indexOf(command) < 0) {
        console.warn(`Unknown '${command}' command!`);

        process.exit(5);
    }

    const MODULE_FILE = require.resolve(
        path.join(
            __dirname, 'commands', command, 'index.js'
        )
    );
    if (!fs.existsSync(MODULE_FILE)) {
        console.warn(`Module '${MODULE_FILE}' not found!`);

        process.exit(6);
    }

    const COMMAND_CLASS = require(MODULE_FILE).Command;
    if (_.isNil(COMMAND_CLASS)) {
        console.warn(`Command '${command}' not implemented!`);

        process.exit(7);
    }

    const COMMAND: Command = new COMMAND_CLASS();
    if (_.isNil(COMMAND.execute)) {
        console.warn(`Command '${command}'.execute() not implemented!`);

        process.exit(8);
    }

    const CTX: CommandExecutionContext = {
        args: minimist(
            process.argv.slice(3),
        ),
        package: APP,
        root: path.resolve(
            path.dirname(MODULE_FILE)
        ),
    };

    try {
        const EXIT_CODE = parseInt(
            String(
                await Promise.resolve(
                    COMMAND.execute(CTX)
                )
            ).trim()
        );

        if (isNaN(EXIT_CODE)) {
            process.exit(0);
        } else {
            process.exit(EXIT_CODE);
        }
    } catch (e) {
        console.error(e);

        process.exit(1);
    }
})();