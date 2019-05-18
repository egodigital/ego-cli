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

import * as inquirer from 'inquirer';
import { CommandBase, CommandExecuteContext } from '../../contracts';
import { eGO, getSTDIO, globalModuleExists, spawn, writeLine } from '../../util';


/**
 * e.GO Yeoman generator command.
 */
export class EgoCommand extends CommandBase {
    /** @inheritdoc */
    public readonly description = 'Starts the e.GO generator for Yeoman.';

    /** @inheritdoc */
    public async execute(ctx: CommandExecuteContext): Promise<void> {
        // Yeoman installed?
        if (!globalModuleExists('yo')) {
            const ANSWER = await inquirer.prompt([{
                type: 'confirm',
                name: 'ego_confirm',
                message: 'Install Yeoman generator?',
                default: true,
            }]);

            if (!ANSWER['ego_confirm']) {
                return;
            }

            spawn('npm', ['install', '-g', 'yo'], {
                cwd: ctx.cwd,
                stdio: getSTDIO(ctx),
            });
        }

        // e.GO generator installed?
        if (!globalModuleExists('generator-ego')) {
            const ANSWER = await inquirer.prompt([{
                type: 'confirm',
                name: 'ego_confirm',
                message: eGO('Install e.GO generator for Yeoman?'),
                default: true,
            }]);

            if (!ANSWER['ego_confirm']) {
                return;
            }

            spawn('npm', ['install', '-g', 'generator-ego'], {
                cwd: ctx.cwd,
                stdio: getSTDIO(ctx),
            });
        }

        // run e.GO generator
        spawn('yo', ['ego'], {
            cwd: ctx.cwd,
        });
    }

    /** @inheritdoc */
    public async showHelp(): Promise<void> {
        writeLine(`Options:`);
        writeLine(` -v, --verbose  # Verbose output.`);
        writeLine();

        writeLine(`Example:    ego new`);
    }
}
