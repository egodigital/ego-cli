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

import * as moment from 'moment';
import 'moment-timezone';
import { Nilable } from '@egodigital/types';
import { CommandBase, CommandExecuteContext } from '../../contracts';
import { toStringSafe, write, writeLine } from '../../util';


/**
 * Clock command
 */
export class EgoCommand extends CommandBase {
    /** @inheritdoc */
    public readonly description = `Shows the current time or a clock value of another timezone`;

    /** @inheritdoc */
    public async execute(ctx: CommandExecuteContext): Promise<void> {
        // output format
        let outputFormat = '';
        if (ctx.args['f']) {
            outputFormat = toStringSafe(ctx.args['f']).trim();
        } else if (ctx.args['format']) {
            outputFormat = toStringSafe(ctx.args['format']).trim();
        }
        outputFormat = toStringSafe(outputFormat).trim();
        if (outputFormat === '') {
            outputFormat = 'HH:mm:ss';
        }

        const outputValue = (input: moment.Moment) => {
            write(input.format(outputFormat));
        };

        if (!ctx.args._?.length) {
            // output current time (UTC)
            outputValue(moment.utc());
        } else if (ctx.args._.length > 0) {
            // target timezone
            let targetTZ: string;
            if (ctx.args._.length > 1) {
                targetTZ = ctx.args._[1].trim();
            }
            targetTZ = toStringSafe(targetTZ).trim();
            if (targetTZ === '') {
                targetTZ = 'UTC';
            }

            // from timezone
            let fromTZ: Nilable<string>;
            if (ctx.args._.length > 2) {
                fromTZ = ctx.args._[2].trim();
            }
            fromTZ = toStringSafe(fromTZ).trim();
            if (fromTZ === '') {
                fromTZ = null;
            }

            // input value
            let value = ctx.args._[0].trim();
            if (value === '') {
                value = moment.utc().format('HH:mm:ss');
            }

            const from = fromTZ ? moment.tz(value, 'HH:mm:ss', fromTZ) : moment(value, 'HH:mm:ss');
            if (!from.isValid()) {
                console.warn('Invalid input value. Please you a value like 13:45:51');
                ctx.exit(1);

                return;
            }

            const to = moment.tz(from, targetTZ);

            outputValue(to);
        }
    }

    /** @inheritdoc */
    public async showHelp(): Promise<void> {
        writeLine(`Examples:  ego clock`);
        writeLine(`           ego clock 21:50`);
        writeLine(`           ego clock 21:50 --format="HH:mm"`);
        writeLine(`           ego clock 21:50 "America/New_York"`);
        writeLine(`           ego clock 21:50 "America/New_York" "UTC"`);
    }

    /** @inheritdoc */
    public readonly syntax = '[FROM-CLOCK?] [TO-TIMEZONE?] [FROM-TIMEZONE?] [options]';
}
