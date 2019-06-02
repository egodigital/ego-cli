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
import { getCurrentGitBranch } from '../../git';
import { getSTDIO, spawnAsync, toStringSafe, withSpinnerAsync, writeLine } from '../../util';


/**
 * Git-Checkout command.
 */
export class EgoCommand extends CommandBase {
    /** @inheritdoc */
    public readonly description = "Checks out (to) a branch.";

    /** @inheritdoc */
    public async execute(ctx: CommandExecuteContext): Promise<void> {
        const TARGET_BRANCH = toStringSafe(
            ctx.args['_'][0]
        ).trim();
        if ('' === TARGET_BRANCH) {
            console.warn('Please define the branch, which you would like to checkout!');

            ctx.exit(1);
        }

        const MERGE_WITH_CURRENT = ctx.args['m'] || ctx.args['merge'];

        let currentBranch: string;
        if (MERGE_WITH_CURRENT) {
            await withSpinnerAsync('Detecting current branch ...', async (spinner) => {
                currentBranch = getCurrentGitBranch({
                    cwd: ctx.cwd,
                    verbose: ctx.verbose,
                });

                spinner.text = `Branch: '${currentBranch}'`;
            });
        }

        await withSpinnerAsync(`Checking out branch '${TARGET_BRANCH}' ...`, async (spinner) => {
            await spawnAsync('git', ['checkout', TARGET_BRANCH], {
                cwd: ctx.cwd,
                stdio: getSTDIO(ctx),
            });

            spinner.text = `Branch '${TARGET_BRANCH}' checked out`;
        });

        if (MERGE_WITH_CURRENT) {
            await withSpinnerAsync(`Merging with branch '${currentBranch}' ...`, async (spinner) => {
                await spawnAsync('git', ['merge', currentBranch], {
                    cwd: ctx.cwd,
                    stdio: getSTDIO(ctx),
                });

                spinner.text = `Merged with branch '${TARGET_BRANCH}'`;
            });
        }
    }

    /** @inheritdoc */
    public async showHelp(): Promise<void> {
        writeLine(`Options:`);
        writeLine(` -m, --merge    # After checkout, merge the current branch with the new one.`);
        writeLine(` -v, --verbose  # Verbose output.`);
        writeLine();

        writeLine(`Examples:    ego git-checkout dev`);
        writeLine(`             ego git-checkout dev --merge`);
    }

    /** @inheritdoc */
    public readonly syntax = 'BRANCH [options]';
}
