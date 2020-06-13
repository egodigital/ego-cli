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
import { CommandBase, CommandExecuteContext, Storage, EGO_FOLDER, STORAGE_FILE } from '../../contracts';
import { getStorageFile, normalizeStorageKey } from '../../storage';
import { writeLine } from '../../util';


/**
 * Set command.
 */
export class EgoCommand extends CommandBase {
    /** @inheritdoc */
    public readonly description = "Sets a config value.";

    /** @inheritdoc */
    public async execute(ctx: CommandExecuteContext): Promise<void> {
        await ctx.queue.add(async () => {
            const CONFIG_NAME = normalizeStorageKey(ctx.args['_'][0]);
            if ('' === CONFIG_NAME) {
                console.warn('No config name defined!');

                ctx.exit(1);
            }

            const GLOBAL = ctx.args['g'] || ctx.args['global'];

            let configValue: any = undefined;
            if (ctx.args['_'].length > 1) {
                const ALL_VALUES = ctx.args['_'].slice(1);
                if (1 === ALL_VALUES.length) {
                    configValue = ALL_VALUES[0];
                } else {
                    configValue = ALL_VALUES;
                }
            }

            let storageFilePath: string | false = false;
            if (!GLOBAL) {
                const LOCAL_EGO_DIR = ctx.getFullPath(EGO_FOLDER);
                if (fs.existsSync(LOCAL_EGO_DIR)) {
                    const STAT = fs.statSync(LOCAL_EGO_DIR);
                    if (STAT.isDirectory()) {
                        storageFilePath = path.resolve(
                            path.join(
                                LOCAL_EGO_DIR, STORAGE_FILE
                            )
                        );
                    }
                }
            }

            if (false === storageFilePath) {
                storageFilePath = getStorageFile();
            }

            let storage: Storage;

            if (fs.existsSync(storageFilePath)) {
                storage = JSON.parse(
                    fs.readFileSync(
                        storageFilePath, 'utf8'
                    )
                );
            }

            if (!_.isObjectLike(storage)) {
                storage = {};
            }

            if (_.isUndefined(configValue)) {
                delete storage[CONFIG_NAME];
            } else {
                storage[CONFIG_NAME] = configValue;
            }

            fs.writeFileSync(
                storageFilePath,
                JSON.stringify(
                    storage, null, 2
                ),
                'utf8'
            );
        });
    }

    /** @inheritdoc */
    public async showHelp(): Promise<void> {
        writeLine(`Options:`);
        writeLine(` -g, --global  # Sets the value globally.`);
        writeLine();

        writeLine(`Examples:  ego set email tanja.m@e-go-digital.com`);
        writeLine(`           ego set email marcel.k@e-go-digital.com --global`);
        writeLine(`           ego set email`);
    }

    /** @inheritdoc */
    public readonly syntax = 'NAME [VALUE*]';
}
