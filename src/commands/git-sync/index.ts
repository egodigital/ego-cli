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
import { getCurrentGitBranch, getGitRemotes } from '../../git';
import { getSTDIO, spawnAsync, withSpinnerAsync, writeLine } from '../../util';


/**
 * Git-Sync command.
 */
export class EgoCommand extends CommandBase {
    /** @inheritdoc */
    public readonly description = 'Syncs the current branch with all remotes.';

    /** @inheritdoc */
    public async execute(ctx: CommandExecuteContext): Promise<void> {
        let branch: string;
        await withSpinnerAsync('Detecting current branch ...', async (spinner) => {
            branch = getCurrentGitBranch({
                cwd: ctx.cwd,
                verbose: ctx.verbose,
            });

            spinner.text = `Branch: '${branch}'`;
        });

        let remotes: string[];
        await withSpinnerAsync('Loading remotes ...', async (spinner) => {
            remotes = getGitRemotes({
                cwd: ctx.cwd,
                verbose: ctx.verbose,
            });

            spinner.text = remotes.length + ' remote(s) found';
        });

        for (let i = 0; i < remotes.length; i++) {
            const R = remotes[i];

            await withSpinnerAsync(`Syncing with '${R}' (${i + 1} / ${remotes.length}) ...`, async (spinner) => {
                spinner.text = `Pulling from '${R}' (${i + 1} / ${remotes.length}) ...`;
                await spawnAsync('git', ['pull', R, branch], {
                    cwd: ctx.cwd,
                    stdio: getSTDIO(ctx),
                });

                spinner.text = `Pushing to '${R}' (${i + 1} / ${remotes.length}) ...`;
                await spawnAsync('git', ['push', R, branch], {
                    cwd: ctx.cwd,
                    stdio: getSTDIO(ctx),
                });

                spinner.text = `Synced with '${R}' (${i + 1} / ${remotes.length})`;
            });
        }
    }

    /** @inheritdoc */
    public async showHelp(): Promise<void> {
        writeLine(`Options:`);
        writeLine(` -v, --verbose  # Verbose output.`);
        writeLine();

        writeLine(`Example:  ego git-sync`);
    }
}
