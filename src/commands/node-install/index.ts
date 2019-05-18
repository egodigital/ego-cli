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
import { getSTDIO, spawn, withSpinner, writeLine } from '../../util';


/**
 * Git-Pull command.
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
        if (!fs.existsSync(PACKAGE_JSON)) {
            console.warn(`'package.json' file not found!`);

            ctx.exit(1);
        }

        withSpinner(`Removing 'node_modules' folder ...`, (spinner) => {
            const NODE_MODULES_FOLDER = path.resolve(
                path.join(
                    ctx.cwd, 'node_modules'
                )
            );

            if (fs.existsSync(NODE_MODULES_FOLDER)) {
                const STAT = fs.lstatSync(NODE_MODULES_FOLDER);
                if (STAT.isDirectory()) {
                    fs.removeSync(NODE_MODULES_FOLDER);
                } else if (STAT.isSymbolicLink()) {
                    fs.unlinkSync(NODE_MODULES_FOLDER);
                }
            }

            spinner.succeed(`'node_modules' folder removed`);
        });

        withSpinner(`Executing 'npm install' ...`, (spinner) => {
            spawn('npm', ['install'], {
                cwd: ctx.cwd,
                stdio: getSTDIO(ctx),
            });

            spinner.succeed(`'npm install' executed`);
        });

        // npm update?
        if (ctx.args['u'] || ctx.args['uodate']) {
            withSpinner(`Executing 'npm update' ...`, (spinner) => {
                spawn('npm', ['update'], {
                    cwd: ctx.cwd,
                    stdio: getSTDIO(ctx),
                });

                spinner.succeed(`'npm update' executed`);
            });
        }

        // npm audit fix?
        if (ctx.args['a'] || ctx.args['audit']) {
            withSpinner(`Executing 'npm audit fix' ...`, (spinner) => {
                spawn('npm', ['audit', 'fix'], {
                    cwd: ctx.cwd,
                    stdio: getSTDIO(ctx),
                });

                spinner.succeed(`'npm audit fix' executed`);
            });
        }
    }

    /** @inheritdoc */
    public async showHelp(): Promise<void> {
        writeLine(`Options:`);
        writeLine(` -a, --audit    # Runs 'npm audit fix' after successful execution.`);
        writeLine(` -u, --update   # Runs 'npm update' after successful execution.`);
        writeLine(` -v, --verbose  # Verbose output.`);
        writeLine();

        writeLine(`Examples:    ego node-install`);
        writeLine(`             ego node-install --audit`);
        writeLine(`             ego node-install --update --a`);
    }
}
