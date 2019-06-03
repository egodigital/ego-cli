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
import { exists, getSTDIO, spawnAsync, withSpinnerAsync, writeLine } from '../../util';


/**
 * Node-Install command.
 */
export class EgoCommand extends CommandBase {
    /** @inheritdoc */
    public readonly description = "Removes the 'node_modules' subfolder and executes 'npm install'.";

    /** @inheritdoc */
    public async execute(ctx: CommandExecuteContext): Promise<void> {
        const PACKAGE_JSON = path.resolve(
            path.join(
                ctx.cwd, 'package.json'
            )
        );
        if (!(await exists(PACKAGE_JSON))) {
            console.warn(`'package.json' file not found!`);

            ctx.exit(1);
        }

        const USE_YARN = ctx.args['y'] ||
            ctx.args['yarn'] ||
            ctx.get('yarn');

        let installAction: () => Promise<void>;
        let updateAction: () => Promise<void>;
        if (USE_YARN) {
            installAction = async () => {
                await withSpinnerAsync(`Executing 'yarn install' ...`, async (spinner) => {
                    await spawnAsync('yarn', ['install'], {
                        cwd: ctx.cwd,
                        stdio: getSTDIO(ctx),
                    });

                    spinner.text = `'yarn install' executed`;
                });
            };

            updateAction = async () => {
                await withSpinnerAsync(`Executing 'yarn upgrade' ...`, async (spinner) => {
                    await spawnAsync('yarn', ['upgrade'], {
                        cwd: ctx.cwd,
                        stdio: getSTDIO(ctx),
                    });

                    spinner.text = `'yarn upgrade' executed`;
                });
            };
        } else {
            installAction = async () => {
                await withSpinnerAsync(`Executing 'npm install' ...`, async (spinner) => {
                    await spawnAsync('npm', ['install'], {
                        cwd: ctx.cwd,
                        stdio: getSTDIO(ctx),
                    });

                    spinner.text = `'npm install' executed`;
                });
            };

            updateAction = async () => {
                await withSpinnerAsync(`Executing 'npm update' ...`, async (spinner) => {
                    await spawnAsync('npm', ['update'], {
                        cwd: ctx.cwd,
                        stdio: getSTDIO(ctx),
                    });

                    spinner.text = `'npm update' executed`;
                });
            };
        }

        await withSpinnerAsync(`Removing 'node_modules' folder ...`, async (spinner) => {
            const NODE_MODULES_FOLDER = path.resolve(
                path.join(
                    ctx.cwd, 'node_modules'
                )
            );

            if (await exists(NODE_MODULES_FOLDER)) {
                const STAT = await fs.lstat(NODE_MODULES_FOLDER);

                if (STAT.isDirectory()) {
                    await fs.remove(NODE_MODULES_FOLDER);
                } else if (STAT.isSymbolicLink()) {
                    await fs.unlink(NODE_MODULES_FOLDER);
                }
            }

            spinner.text = `'node_modules' folder removed`;
        });

        await installAction();

        // update?
        if (ctx.args['u'] || ctx.args['update']) {
            await updateAction();
        }

        // npm audit fix?
        if (ctx.args['a'] || ctx.args['audit']) {
            await withSpinnerAsync(`Executing 'npm audit fix' ...`, async (spinner) => {
                await spawnAsync('npm', ['audit', 'fix'], {
                    cwd: ctx.cwd,
                    stdio: getSTDIO(ctx),
                });

                spinner.text = `'npm audit fix' executed`;
            });
        }
    }

    /** @inheritdoc */
    public async showHelp(): Promise<void> {
        writeLine(`Options:`);
        writeLine(` -a, --audit    # Runs 'npm audit fix' after successful execution.`);
        writeLine(` -u, --update   # Runs 'update' after successful execution.`);
        writeLine(` -v, --verbose  # Verbose output.`);
        writeLine(` -y, --yarn     # Use yarn instead.`);
        writeLine();

        writeLine(`Config:`);
        writeLine(` yarn   # Use yarn instead.`);
        writeLine();

        writeLine(`Examples:    ego node-install`);
        writeLine(`             ego node-install --yarn`);
        writeLine(`             ego node-install --audit`);
        writeLine(`             ego node-install --update --a`);
    }
}
