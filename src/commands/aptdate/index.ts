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
const isRoot = require('is-root');
import { CommandBase, CommandExecuteContext } from '../../contracts';
import { getSTDIO, spawnAsync, withSpinnerAsync, writeLine } from '../../util';


/**
 * Aptdate command.
 */
export class EgoCommand extends CommandBase {
    /** @inheritdoc */
    public readonly description = "Runs 'apt-get update', 'apt-get upgrade' and 'apt-get autoremove' in one command.";

    /** @inheritdoc */
    public async execute(ctx: CommandExecuteContext): Promise<void> {
        if ('linux' !== process.platform) {
            console.warn("You only can run the command with linux and 'apt-get'!");

            ctx.exit(1);
        }

        if (!isRoot()) {
            console.warn("You require root privileges (sudo)!");

            ctx.exit(3);
        }

        await withSpinnerAsync(`Checking for 'apt-get' ...`, async (spinner) => {
            try {
                await spawnAsync('apt-get', ['-v'], {
                    cwd: ctx.cwd,
                    stdio: getSTDIO(ctx),
                });

                spinner.text = `'apt-get' is installed`;
            } catch {
                spinner.warn(`'apt-get' is NOT installed`);

                ctx.exit(2);
            }
        });

        // apt-get update
        await withSpinnerAsync(`Executing 'apt-get -y update' ...`, async (spinner) => {
            await spawnAsync('apt-get', ['-y', 'update'], {
                cwd: ctx.cwd,
                stdio: getSTDIO(ctx),
            });

            spinner.text = `'apt-get -y update' executed`;
        });

        // apt-get upgrade
        await withSpinnerAsync(`Executing 'apt-get -y upgrade' ...`, async (spinner) => {
            await spawnAsync('apt-get', ['-y', 'upgrade'], {
                cwd: ctx.cwd,
                stdio: getSTDIO(ctx),
            });

            spinner.text = `'apt-get -y upgrade' executed`;
        });

        // apt-get autoremove
        await withSpinnerAsync(`Executing 'apt-get -y autoremove' ...`, async (spinner) => {
            await spawnAsync('apt-get', ['-y', 'autoremove'], {
                cwd: ctx.cwd,
                stdio: getSTDIO(ctx),
            });

            spinner.text = `'apt-get -y autoremove' executed`;
        });
    }

    /** @inheritdoc */
    public async showHelp(): Promise<void> {
        writeLine(`Options:`);
        writeLine(` -v, --verbose  # Verbose output.`);
        writeLine();

        writeLine(`Example:    ego aptdate`);
    }
}
