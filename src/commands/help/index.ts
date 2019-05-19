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
import * as fs from 'fs';
import * as path from 'path';
import { Command, CommandBase, CommandExecuteContext, CommandShowHelpContext, REGEX_COMMAND_NAME } from '../../contracts';
import { eGO, exists, toStringSafe, writeLine } from '../../util';


/**
 * Help command.
 */
export class EgoCommand extends CommandBase {
    /** @inheritdoc */
    public readonly description = 'Shows the help screen for a command.';

    /** @inheritdoc */
    public async execute(ctx: CommandExecuteContext): Promise<void> {
        let command: Command;
        let commandName: string;

        if (ctx.args['_'].length < 1) {
            command = this;
            commandName = ctx.name;
        } else {
            const COMMAND_NAME = toStringSafe(ctx.args['_'][0])
                .toLowerCase()
                .trim();
            if ('' === COMMAND_NAME) {
                console.warn('No command defined!');

                ctx.exit(2);
            }

            if (!REGEX_COMMAND_NAME.test(COMMAND_NAME)) {
                console.warn(`Invalid command name ('${COMMAND_NAME}')!`);

                ctx.exit(3);
            }

            const MODULE_FILE = require.resolve(
                path.join(
                    __dirname, '../', COMMAND_NAME, 'index.js'
                )
            );
            if (!(await exists(MODULE_FILE))) {
                console.warn(`Unknown command '${COMMAND_NAME}'!`);

                ctx.exit(4);
            }

            const COMMAND_CLASS = require(MODULE_FILE).EgoCommand;
            if (_.isNil(COMMAND_CLASS)) {
                console.warn(`Command '${COMMAND_NAME}' not implemented!`);

                ctx.exit(5);
            }

            const COMMAND: Command = new COMMAND_CLASS();
            if (_.isNil(COMMAND.showHelp)) {
                console.warn(`Command '${COMMAND_NAME}'.showHelp() not implemented!`);

                ctx.exit(6);
            }

            command = COMMAND;
            commandName = COMMAND_NAME;
        }

        writeLine(eGO(command.description));
        writeLine();

        writeLine(`Syntax:    ego ${commandName} [options]`);
        writeLine();

        const CTX: CommandShowHelpContext = {
            package: ctx.package,
        };

        const EXIT_CODE = parseInt(
            toStringSafe(
                await Promise.resolve(
                    command.showHelp(CTX)
                )
            ).trim()
        );

        if (isNaN(EXIT_CODE)) {
            ctx.exit();
        } else {
            ctx.exit(EXIT_CODE);
        }
    }

    /** @inheritdoc */
    public async showHelp(): Promise<void> {
        writeLine(`Examples:    ego help new`);
        writeLine(`             ego help`);
    }
}
