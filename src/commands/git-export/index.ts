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
import { spawn, toStringSafe, withSpinner, writeLine } from '../../util';


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

        withSpinner(`Cloning repository '${REPO_URL}' ...`, (spinner) => {
            spawn('git', ['clone', REPO_URL, '.'], {
                stdio: null,
            });

            spinner.text = `Repository '${REPO_URL}' cloned`;
        });

        withSpinner(`Removing '.git' folder ...`, (spinner) => {
            const GIT_FOLDER = path.resolve(
                path.join(
                    ctx.cwd, '.git'
                )
            );

            if (fs.existsSync(GIT_FOLDER)) {
                const STAT = fs.lstatSync(GIT_FOLDER);
                if (STAT.isDirectory()) {
                    fs.removeSync(GIT_FOLDER);
                } else if (STAT.isSymbolicLink()) {
                    fs.unlinkSync(GIT_FOLDER);
                }
            }

            if (fs.existsSync(GIT_FOLDER)) {
                spinner.warn(`'.git' folder could not be removed!`);
            } else {
                spinner.text = `'.git' folder removed`;
            }
        });

        withSpinner('Finishing ...', (spinner) => {
            spinner.text = 'Done';
        });
    }

    /** @inheritdoc */
    public async showHelp(): Promise<void> {
        writeLine('Example:    ego export https://github.com/egodigital/generator-ego');
    }
}
