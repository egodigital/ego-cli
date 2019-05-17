/**
 * This file is part of the ego-cli distribution (https://github.com/egodigital/ego-cli).
 * Copyright (c) e.GO Digital GmbH, Aachen, Germany
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, version 3.
 *
 * This program is distributed in the hope that it will be useful, but
 * WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU
 * General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program. If not, see <http://www.gnu.org/licenses/>.
 */

import * as _ from 'lodash';
import * as fs from 'fs';
import * as path from 'path';
import * as ego_contracts from './contracts';


const ALLOWED_COMMANDS = [
    'new',
];


(async () => {
    let command = process.argv[2];
    if (_.isNil(command)) {
        command = '';
    }
    command = command.toLowerCase()
        .trim();

    if ('' === command) {
        console.warn('No command defined!');

        process.exit(2);
    }

    if (ALLOWED_COMMANDS.indexOf(command) < 0) {
        console.warn(`Unknown '${command}'!`);

        process.exit(3);
    }

    const MODULE_FILE = require.resolve(
        path.join(
            __dirname, 'commands', command, 'index.js'
        )
    );
    if (!fs.existsSync(MODULE_FILE)) {
        console.warn(`Module '${MODULE_FILE}' not found!`);

        process.exit(4);
    }

    const COMMAND_CLASS = require(MODULE_FILE).Command;
    if (_.isNil(COMMAND_CLASS)) {
        console.warn(`Command '${command}' not implemented!`);

        process.exit(5);
    }

    const COMMAND: ego_contracts.Command = new COMMAND_CLASS();
    if (_.isNil(COMMAND.execute)) {
        console.warn(`Command '${command}'.execute() not implemented!`);

        process.exit(6);
    }

    const CTX: ego_contracts.CommandExecutionContext = {
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