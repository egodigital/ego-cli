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
import { getRunningDockerContainers } from '../../docker';
import { getSTDIO, spawnAsync, withSpinnerAsync, writeLine } from '../../util';


/**
 * Docker-Stop command.
 */
export class EgoCommand extends CommandBase {
    /** @inheritdoc */
    public readonly description = "Stops all running Docker containers.";

    /** @inheritdoc */
    public async execute(ctx: CommandExecuteContext): Promise<void> {
        let containers: string[];
        await withSpinnerAsync('Loading Docker containers ...', async (spinner) => {
            containers = getRunningDockerContainers({
                cwd: ctx.cwd,
                verbose: ctx.verbose,
            });

            spinner.text = containers.length + ' Docker container(s) found';
        });

        for (let i = 0; i < containers.length; i++) {
            const C = containers[i];

            await withSpinnerAsync(`Stopping '${C}' (${i + 1} / ${containers.length}) ...`, async (spinner) => {
                await spawnAsync('docker', ['stop', C], {
                    cwd: ctx.cwd,
                    stdio: getSTDIO(ctx),
                });

                spinner.text = `'${C}' stopped (${i + 1} / ${containers.length})`;
            });
        }
    }

    /** @inheritdoc */
    public async showHelp(): Promise<void> {
        writeLine(`Options:`);
        writeLine(` -v, --verbose  # Verbose output.`);
        writeLine();

        writeLine(`Example:  ego docker-stop`);
    }
}
