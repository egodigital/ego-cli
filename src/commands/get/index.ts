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
import * as cliHighlight from 'cli-highlight';
import * as fs from 'fs-extra';
import { CommandBase, CommandExecuteContext, Storage, STORAGE_FILE, EGO_FOLDER } from '../../contracts';
import { getStorage, normalizeStorageKey } from '../../storage';
import { asArray, sortObjectByKeys, writeLine, toStringSafe } from '../../util';


/**
 * Get command.
 */
export class EgoCommand extends CommandBase {
    /** @inheritdoc */
    public readonly description = "Lists one or more config value(s).";

    /** @inheritdoc */
    public async execute(ctx: CommandExecuteContext): Promise<void> {
        await ctx.queue.add(async () => {
            const GLOBAL = ctx.args['g'] || ctx.args['global'];
            const LOCAL = ctx.args['l'] || ctx.args['local'];
            const TABLE = ctx.args['t'] || ctx.args['table'];

            const STORAGES: Storage[] = [];
            const ADD_GLOBAL_STORAGE = () => {
                STORAGES.push(
                    getStorage()
                );
            };
            const ADD_LOCAL_STORAGE = () => {
                const LOCAL_STORAGE_FILE_PATH = ctx.getFullPath(
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
            };

            if (!GLOBAL && !LOCAL) {
                ADD_GLOBAL_STORAGE();
                ADD_LOCAL_STORAGE();
            } else {
                if (GLOBAL) {
                    ADD_GLOBAL_STORAGE();
                }

                if (LOCAL) {
                    ADD_LOCAL_STORAGE();
                }
            }

            let keyFilter: (key: string) => boolean;

            const FILTERS = asArray(ctx.args['_'])
                .map(x => toStringSafe(x))
                .filter(x => '' !== x.trim());
            if (FILTERS.length) {
                keyFilter = (key) => {
                    for (const F of FILTERS) {
                        const REGEX = new RegExp(F, 'i');
                        if (REGEX.test(key)) {
                            return true;
                        }
                    }

                    return false;
                };
            } else {
                keyFilter = () => true;
            }

            let keysFound = false;
            let filteredStorage: any = {};
            for (const S of STORAGES) {
                if (!_.isObjectLike(S)) {
                    continue;
                }

                for (const KEY in S) {
                    if (keyFilter(KEY)) {
                        filteredStorage[
                            normalizeStorageKey(KEY)
                        ] = S[KEY];
                        keysFound = true;
                    }
                }
            }

            filteredStorage = sortObjectByKeys(filteredStorage);

            if (TABLE) {
                for (const KEY in filteredStorage) {
                    writeLine(`${KEY}\t${JSON.stringify(
                        filteredStorage[KEY]
                    )}`);
                }
            } else {
                if (keysFound) {
                    writeLine(
                        cliHighlight.highlight(JSON.stringify(
                            filteredStorage,
                            null,
                            2
                        ), {
                                'language': 'json',
                            })
                    );
                }
            }
        });
    }

    /** @inheritdoc */
    public async showHelp(): Promise<void> {
        writeLine(`Options:`);
        writeLine(` -g, --global  # List only global values, if possible.`);
        writeLine(` -l, --local   # List only local values, if possible.`);
        writeLine(` -t, --table   # Outputs value(s) in a simple list.`);
        writeLine();

        writeLine(`Examples:  ego get`);
        writeLine(`           ego get email`);
        writeLine(`           ego get username email -tl`);
    }

    /** @inheritdoc */
    public readonly syntax = '[REGEX_FILTER*] [options]';
}
