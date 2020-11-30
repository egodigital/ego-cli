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

// needs to be initialized at the beginning
require('moment');
require('moment-timezone');

import * as _ from 'lodash';
import * as fs from 'fs-extra';
import * as minimist from 'minimist';
import * as path from 'path';
import PQueue from 'p-queue';
import { Command, CommandExecuteContext, EGO_FOLDER, PackageJSON, REGEX_COMMAND_NAME, Storage, STORAGE_FILE } from './contracts';
import { showHelp, suggestCommand } from './help';
import { executeShellScriptCommand } from './scripts';
import { getStorage, normalizeStorageKey } from './storage';
import { exists, toStringSafe, writeLine } from './util';


(async () => {
    const APP: PackageJSON = JSON.parse(
        await fs.readFile(
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
        await showHelp(APP);

        process.exit(2);
    }

    const PRINT_VERSION = '-v' === process.argv[2] ||
        '--version' === process.argv[2];
    if (PRINT_VERSION) {
        writeLine(APP.version);

        process.exit(0);
    }

    const COMMAND_NAME = toStringSafe(process.argv[2])
        .toLowerCase()
        .trim();

    if ('' === COMMAND_NAME) {
        console.warn('No command defined!');

        process.exit(4);
    }

    if (!REGEX_COMMAND_NAME.test(COMMAND_NAME)) {
        console.warn(`Invalid command name ('${COMMAND_NAME}')!`);

        process.exit(5);
    }

    // bash script?
    if (executeShellScriptCommand(COMMAND_NAME, process.argv.slice(3))) {
        return;  // yes
    }

    const MODULE_FILE = path.resolve(
        path.join(
            __dirname, 'commands', COMMAND_NAME, 'index.js'
        )
    );
    if (!(await exists(MODULE_FILE))) {
        await suggestCommand(COMMAND_NAME);

        process.exit(6);
    }

    const COMMAND_CLASS = require(MODULE_FILE).EgoCommand;
    if (_.isNil(COMMAND_CLASS)) {
        console.warn(`Command '${COMMAND_NAME}' not implemented!`);

        process.exit(7);
    }

    const COMMAND: Command = new COMMAND_CLASS();
    if (_.isNil(COMMAND.execute)) {
        console.warn(`Command '${COMMAND_NAME}'.execute() not implemented!`);

        process.exit(8);
    }

    const RAW_ARGS = process.argv.slice(3);
    const PARSED_ARGS = minimist(RAW_ARGS);

    const CTX: CommandExecuteContext = {
        args: PARSED_ARGS,
        cwd: process.cwd(),
        exit: (code = 0) => {
            code = parseInt(
                toStringSafe(code)
                    .trim()
            );
            if (isNaN(code)) {
                code = 0;
            }

            process.exit(9 + code);
        },
        get: function (key: any, defaultValue?: any) {
            key = normalizeStorageKey(key);

            const STORAGES: Storage[] = [
                getStorage()
            ];

            const LOCAL_STORAGE_FILE_PATH = this.getFullPath(
                EGO_FOLDER + '/' + STORAGE_FILE
            );

            if (fs.existsSync(LOCAL_STORAGE_FILE_PATH)) {
                const STAT = fs.statSync(LOCAL_STORAGE_FILE_PATH);
                if (STAT.isFile()) {
                    STORAGES.push(
                        JSON.parse(
                            fs.readFileSync(
                                LOCAL_STORAGE_FILE_PATH,
                                'utf8',
                            )
                        )
                    );
                }
            }

            let value: any = defaultValue;

            for (const S of STORAGES) {
                if (!_.isObjectLike(S)) {
                    continue;
                }

                for (const PROP in S) {
                    const STORAGE_KEY = normalizeStorageKey(PROP);

                    if (key === STORAGE_KEY) {
                        value = S[PROP];
                    }
                }
            }

            return value;
        },
        getFullPath: function (p: any) {
            p = toStringSafe(p);
            if (!path.isAbsolute(p)) {
                p = path.join(
                    this.cwd, p
                );
            }

            return path.resolve(p);
        },
        name: COMMAND_NAME,
        package: APP,
        queue: new PQueue({
            autoStart: true,
            concurrency: 1,
        }),
        rawArgs: RAW_ARGS,
        require: (id: any) => {
            return require(toStringSafe(id));
        },
        root: path.resolve(
            path.dirname(MODULE_FILE)
        ),
        values: {},
        verbose: PARSED_ARGS['v'] || PARSED_ARGS['verbose'],
    };

    try {
        const EXIT_CODE = parseInt(
            toStringSafe(
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