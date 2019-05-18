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
import { CommandBase, CommandExecuteContext, PackageJSON } from '../../contracts';
import { getSTDIO, spawn, withSpinner, writeLine } from '../../util';


/**
 * Git-Pull command.
 */
export class EgoCommand extends CommandBase {
    /** @inheritdoc */
    public readonly description = "Shorthand for 'npm run build'.";

    /** @inheritdoc */
    public async execute(ctx: CommandExecuteContext): Promise<void> {
        const PACKAGE_JSON_FILE = path.resolve(
            path.join(
                ctx.cwd, 'package.json'
            )
        );
        if (!fs.existsSync(PACKAGE_JSON_FILE)) {
            console.warn(`'package.json' file not found!`);

            ctx.exit(1);
        }

        const PACKAGE_JSON: PackageJSON = JSON.parse(
            fs.readFileSync(
                PACKAGE_JSON_FILE, 'utf8'
            )
        );

        if (_.isNil(PACKAGE_JSON.scripts)) {
            console.warn(`No scripts defined in 'package.json'!`);

            ctx.exit(2);
        }

        if (_.isNil(PACKAGE_JSON.scripts.build)) {
            console.warn(`No 'build' script defined in 'package.json'!`);

            ctx.exit(3);
        }

        withSpinner(`Executing 'npm run build' ...`, (spinner) => {
            spawn('npm', ['run', 'build'], {
                cwd: ctx.cwd,
                stdio: getSTDIO(ctx),
            });

            spinner.succeed(`'npm run build' executed`);
        });
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
