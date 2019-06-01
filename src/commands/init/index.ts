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
import { CommandBase, CommandExecuteContext, EGO_FOLDER, STORAGE_FILE } from '../../contracts';
import { exists, withSpinnerAsync, writeLine } from '../../util';


/**
 * Init command.
 */
export class EgoCommand extends CommandBase {
    /** @inheritdoc */
    public readonly description = "Initializes an '.ego' subfolder in the current directory for local based settings and data.";

    /** @inheritdoc */
    public async execute(ctx: CommandExecuteContext): Promise<void> {
        const FORCE = ctx.args['f'] || ctx.args['force'];

        const EGO_FOLDER_PATH = path.resolve(
            path.join(
                ctx.cwd, EGO_FOLDER
            )
        );

        if (await exists(EGO_FOLDER_PATH)) {
            if (FORCE) {
                await withSpinnerAsync(`Removing existing '.ego' folder ...`, async (spinner) => {
                    const STAT = await fs.stat(EGO_FOLDER_PATH);
                    if (STAT.isDirectory()) {
                        await fs.remove(EGO_FOLDER_PATH);
                    } else {
                        await fs.unlink(EGO_FOLDER_PATH);
                    }

                    spinner.text = `Existing '.ego' folder removed`;
                });
            } else {
                console.warn(`'.ego' folder already exists!`);

                ctx.exit(1);
            }
        }

        await withSpinnerAsync(`Creating '.ego' folder ...`, async (spinner) => {
            await fs.mkdirs(EGO_FOLDER_PATH);

            spinner.text = `'.ego' folder created`;
        });

        const STORAGE_FILE_PATH = path.resolve(
            path.join(
                EGO_FOLDER_PATH, STORAGE_FILE
            )
        );

        await withSpinnerAsync(`Creating storage file ...`, async (spinner) => {
            await fs.writeFile(
                STORAGE_FILE_PATH,
                JSON.stringify({}),
                'utf8',
            );

            spinner.text = `Storage file created`;
        });
    }

    /** @inheritdoc */
    public async showHelp(): Promise<void> {
        writeLine(`Options:`);
        writeLine(` -f, --force    # Remove existing folder, if needed.`);
        writeLine();

        writeLine(`Examples:    ego init`);
        writeLine(`             ego init --force`);
    }
}
