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
import { writeLine } from '../../util';
import * as publicIp from 'public-ip';

/**
 * Public-Ip command
 */
export class EgoCommand extends CommandBase {
    /** @inheritdoc */
    public readonly description = 'Print public ipv4 and ipv6 ip address.';

    /** @inheritdoc */
    public async execute(context: CommandExecuteContext): Promise<void> {
        writeLine('Querying icanhazip.com service...');

        writeLine();
        try {
            let ipv4 = await publicIp.v4({ https: true });
            writeLine(`IPv4: ${ipv4}`);
        } catch (error) {
            writeLine(`No ipv4 address found. (Error: ${error.message})`);
        }

        try {
            let ipv6 = await publicIp.v6({ https: true });
            writeLine(`IPv6: ${ipv6}`);
        } catch (error) {
            writeLine(`No ipv6 address found.`); // (Error: ${error.message})
        }
    }

    /** @inheritdoc */
    public async showHelp(): Promise<void> {
        // this is executed, if you run
        // ego help public-ip
        writeLine(`Example:    ego public-ip`);
    }
    
    /** @inheritdoc */
    public readonly syntax = '[options]';  // Syntax, that is shown in help screen
}