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
import * as Enumerable from 'node-enumerable';
import * as inquirer from 'inquirer';
import { CommandBase, CommandExecuteContext } from '../../contracts';
import { getCurrentGitBranch, getGitBranches } from '../../git';
import { getSTDIO, spawnAsync, toStringSafe, withSpinnerAsync, writeLine } from '../../util';


/**
 * Git-delete command.
 */
export class EgoCommand extends CommandBase {
    /** @inheritdoc */
    public readonly description = "Deletes local branches, except 'master' and the current one.";

    /** @inheritdoc */
    public async execute(ctx: CommandExecuteContext): Promise<void> {
        const YES = ctx.args['y'] || ctx.args['yes'];

        let filterExpr: string = toStringSafe(ctx.args['f']);
        if ('' === filterExpr.trim()) {
            filterExpr = toStringSafe(ctx.args['filter']);
        }

        let filter: RegExp | false = false;
        if ('' !== filterExpr.trim()) {
            filter = new RegExp(filterExpr, 'i');
        }

        let currentBranch: string;
        await withSpinnerAsync('Detecting current branch ...', async (spinner) => {
            currentBranch = getCurrentGitBranch({
                cwd: ctx.cwd,
                verbose: ctx.verbose,
            });

            spinner.text = `Branch: '${currentBranch}'`;
        });

        let allBranches: string[];
        await withSpinnerAsync('Loading branches ...', async (spinner) => {
            allBranches = getGitBranches({
                cwd: ctx.cwd,
                verbose: ctx.verbose,
            });

            spinner.text = allBranches.length + ' branch(es) found';
        });

        // no 'master' and
        // not the current one
        const DELETABLE_BRANCHES = Enumerable.from(allBranches)
            .where(b => 'master' !== b)
            .where(b => currentBranch !== b)
            .where(b => {
                return filter ? filter.test(b) : true;
            })
            .distinct()
            .orderBy(b => toStringSafe(b).toLowerCase().trim())
            .toArray();

        if (!DELETABLE_BRANCHES.length) {
            return;
        }

        let selectedBranches: string[];
        if (YES) {
            selectedBranches = DELETABLE_BRANCHES;
        } else {
            // let the user select the branch(es)

            const CHECKBOX_SELECTIONS = await inquirer.prompt({
                type: 'checkbox',
                name: 'branches_to_delete',
                message: 'Please select the branches, you would like to delete:',
                choices: DELETABLE_BRANCHES.map(db => {
                    return {
                        checked: true,
                        name: db,
                    };
                }),
            });

            if (CHECKBOX_SELECTIONS) {
                selectedBranches = CHECKBOX_SELECTIONS['branches_to_delete'];
            }
        }

        if (!selectedBranches) {
            return;
        }

        for (const B of selectedBranches) {
            await withSpinnerAsync(`Deleting branch '${B}' ...`, async (spinner) => {
                await spawnAsync('git', ['branch', '-D', B], {
                    cwd: ctx.cwd,
                    stdio: getSTDIO(ctx),
                });

                spinner.text = `Branch '${B}' deleted`;
            });
        }
    }

    /** @inheritdoc */
    public async showHelp(): Promise<void> {
        writeLine(`Options:`);
        writeLine(` -f, --filter  # Regular expression, which filters the branches by name.`);
        writeLine(`               # Filters are case-insensitive.`);
        writeLine(` -y, --yes     # Do not ask the user to confirm the operation.`);
        writeLine();

        writeLine(`Examples:  ego git-delete`);
        writeLine(`           ego git-delete -y`);
        writeLine(`           ego git-delete --format="^(feature\\/)"`);
    }

    /** @inheritdoc */
    public readonly syntax = '[options]';
}
