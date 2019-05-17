/**
 * This file is part of the ego-cli distribution (https://github.com/egodigital/ego-cli).
 * Copyright (c) e.GO Digital GmbH, Aachen, Germany
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, version 3.
 *
 * This program is distributed in the hope that it will be useful, but
 * WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU
 * General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program. If not, see <http://www.gnu.org/licenses/>.
 */

import * as inquirer from 'inquirer';
import { CommandBase, CommandExecutionContext } from '../../contracts';
import { globalModuleExists, spawn } from '../../util';


/**
 * New command.
 */
export class Command extends CommandBase {
    /** @inheritdoc */
    public async execute(ctx: CommandExecutionContext): Promise<void> {
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

            spawn('npm', ['install', '-g', 'yo']);
        }

        if (!globalModuleExists('generator-ego')) {
            const ANSWER = await inquirer.prompt([{
                type: 'confirm',
                name: 'ego_confirm',
                message: 'Install e.GO generator for Yeoman?',
                default: true,
            }]);

            if (!ANSWER['ego_confirm']) {
                return;
            }

            spawn('npm', ['install', '-g', 'generator-ego']);
        }

        spawn('yo', ['ego']);
    }
}