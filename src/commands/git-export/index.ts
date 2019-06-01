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
import { CommandBase, CommandExecuteContext } from '../../contracts';
import { exists, getSTDIO, spawnAsync, toStringSafe, withSpinnerAsync, writeLine } from '../../util';


/**
 * Git-Pull command.
 */
export class EgoCommand extends CommandBase {
    /** @inheritdoc */
    public readonly description = "Clones a repository to the working directory and removes the '.git' subfolder.";

    /** @inheritdoc */
    public async execute(ctx: CommandExecuteContext): Promise<void> {
        const REPO_URL = toStringSafe(
            ctx.args['_'][0]
        ).trim();
        if ('' === REPO_URL) {
            console.warn('Please define the URL of the repository, that should be exported!');

            ctx.exit(1);
        }

        await withSpinnerAsync(`Cloning repository '${REPO_URL}' ...`, async (spinner) => {
            await spawnAsync('git', ['clone', REPO_URL, '.'], {
                cwd: ctx.cwd,
                stdio: getSTDIO(ctx),
            });

            spinner.text = `Repository '${REPO_URL}' cloned`;
        });

        await withSpinnerAsync(`Removing '.git' folder ...`, async (spinner) => {
            const GIT_FOLDER = path.resolve(
                path.join(
                    ctx.cwd, '.git'
                )
            );

            if (await exists(GIT_FOLDER)) {
                const STAT = await fs.lstat(GIT_FOLDER);

                if (STAT.isDirectory()) {
                    await fs.remove(GIT_FOLDER);
                } else if (STAT.isSymbolicLink()) {
                    await fs.unlink(GIT_FOLDER);
                }
            }

            spinner.text = `'.git' folder removed`;
        });
    }

    /** @inheritdoc */
    public async showHelp(): Promise<void> {
        writeLine(`Options:`);
        writeLine(` -v, --verbose  # Verbose output.`);
        writeLine();

        writeLine(`Example:    ego git-export https://github.com/egodigital/generator-ego`);
    }

    /** @inheritdoc */
    public readonly syntax = 'URL [options]';
}
