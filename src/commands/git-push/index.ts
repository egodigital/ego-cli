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
import { CommandBase, CommandExecuteContext } from '../../contracts';
import { getGitRemotes } from '../../git';
import { getSTDIO, spawnAsync, withSpinnerAsync, writeLine } from '../../util';


/**
 * Git-Push command.
 */
export class EgoCommand extends CommandBase {
    /** @inheritdoc */
    public readonly description = 'Pushes the current branch to all remotes.';

    /** @inheritdoc */
    public async execute(ctx: CommandExecuteContext): Promise<void> {
        let remotes: string[];
        await withSpinnerAsync('Loading remotes ...', async (spinner) => {
            remotes = getGitRemotes({
                cwd: ctx.cwd,
                verbose: ctx.verbose,
            });

            spinner.succeed(remotes.length + ' remote(s) found');
        });

        for (let i = 0; i < remotes.length; i++) {
            const R = remotes[i];

            await withSpinnerAsync(`Pushing to '${R}' (${i + 1} / ${remotes.length}) ...`, async (spinner) => {
                await spawnAsync('git', ['push', R], {
                    cwd: ctx.cwd,
                    stdio: getSTDIO(ctx),
                });

                spinner.succeed(`Pushed to '${R}' (${i + 1} / ${remotes.length})`);
            });
        }
    }

    /** @inheritdoc */
    public async showHelp(): Promise<void> {
        writeLine(`Options:`);
        writeLine(` -v, --verbose  # Verbose output.`);
        writeLine();

        writeLine(`Example:    ego git-push`);
    }
}
