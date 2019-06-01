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
import { CommandBase, CommandExecuteContext } from '../../contracts';
import { getStorage } from '../../storage';
import { asArray, writeLine, toStringSafe } from '../../util';


/**
 * Get command.
 */
export class EgoCommand extends CommandBase {
    /** @inheritdoc */
    public readonly description = "Lists one or more config value(s).";

    /** @inheritdoc */
    public async execute(ctx: CommandExecuteContext): Promise<void> {
        await ctx.queue.add(async () => {
            const STORAGE = getStorage();

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
            const FILTERED_STORAGE: any = {};
            if (!_.isNil(STORAGE)) {
                for (const KEY in STORAGE) {
                    if (keyFilter(KEY)) {
                        FILTERED_STORAGE[KEY] = STORAGE[KEY];
                        keysFound = true;
                    }
                }
            }

            if (keysFound) {
                writeLine(
                    cliHighlight.highlight(JSON.stringify(
                        FILTERED_STORAGE, null, 2
                    ), {
                            'language': 'json',
                        })
                );
            }
        });
    }

    /** @inheritdoc */
    public async showHelp(): Promise<void> {
        writeLine(`Examples:    ego get`);
        writeLine(`             ego get email`);
        writeLine(`             ego get username email`);
    }

    /** @inheritdoc */
    public readonly syntax = '[REGEX_FILTER*]';
}
