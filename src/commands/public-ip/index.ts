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

import { CommandBase, CommandExecuteContext } from '../../contracts';
import { withSpinnerAsync, writeLine } from '../../util';
import * as publicIp from 'public-ip';

/**
 * Public-Ip command
 */
export class EgoCommand extends CommandBase {
    /** @inheritdoc */
    public readonly description = 'Print public ipv4 and ipv6 ip address.';

    /** @inheritdoc */
    public async execute(context: CommandExecuteContext): Promise<void> {
        await withSpinnerAsync(`Querying IPv4 from 'icanhazip.com' service...`, async (spinner) => {
            try {
                let ipv4 = await publicIp.v4({ onlyHttps: true });
                spinner.text = `IPv4: ${ipv4}`;
            } catch (error) {
                spinner.fail(`No ipv4 address found. (Error: ${error.message})`);
            }
        });

        await withSpinnerAsync(`Querying IPv6 from 'icanhazip.com' service...`, async (spinner) => {
            try {
                let ipv6 = await publicIp.v6({ onlyHttps: true });
                spinner.text = `IPv6: ${ipv6}`;
            } catch (error) {
                spinner.fail(`No ipv6 address found. (Error: ${error.message}`);
            }
        });
    }

    /** @inheritdoc */
    public async showHelp(): Promise<void> {
        writeLine(`Example:    ego public-ip`);
    }

    /** @inheritdoc */
    public readonly syntax = '[options]';
}