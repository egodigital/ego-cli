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

import * as fs from 'fs-extra';
import * as path from 'path';
import { CommandBase, CommandExecuteContext } from '../../contracts';
import { exists, getEGOFolder, spawnAsync, withSpinnerAsync, writeLine } from '../../util';


/**
 * Ssl-New command.
 */
export class EgoCommand extends CommandBase {
    /** @inheritdoc */
    public readonly description = 'Creates a new self-signed SSL certificate.';

    /** @inheritdoc */
    public async execute(ctx: CommandExecuteContext): Promise<void> {
        const OVERWRITE = ctx.args['o'] ||
            ctx.args['overwrite'];

        const EGO_FOLDER = getEGOFolder();

        let i = 0;
        let certFile: string;
        let keyFile: string;
        const UPDATE_FILES = () => {
            certFile = path.resolve(
                path.join(EGO_FOLDER, `server${0 !== i ? ('-' + i) : ''}.cert`)
            );
            keyFile = path.resolve(
                path.join(EGO_FOLDER, `server${0 !== i ? ('-' + i) : ''}.key`)
            );

            ++i;
        };

        await withSpinnerAsync(`Defining output files ...`, async (spinner) => {
            do {
                UPDATE_FILES();

                if (OVERWRITE) {
                    break;  // do not check for duplicate files
                }

                if (
                    !(await exists(certFile)) && !(await exists(keyFile))
                ) {
                    break;
                }
            } while (true);

            spinner.text = `Output files defined`;
        });

        if (OVERWRITE) {
            if (await exists(certFile)) {
                await fs.unlink(certFile);
            }

            if (await exists(keyFile)) {
                await fs.unlink(keyFile);
            }
        }

        // openssl req -nodes -newkey rsa:4096 -x509 -days 3650 -sha256 -keyout <keyFile> -out <certFile>
        const OPENSSL_ARGS: string[] = [
            'req', '-nodes', '-newkey', 'rsa:4096', '-x509', '-days', '3650', '-sha256',
            '-keyout', keyFile,
            '-out', certFile,
        ];
        if (ctx.verbose) {
            OPENSSL_ARGS.push('--verbose');
        }

        await spawnAsync(
            'openssl', OPENSSL_ARGS
        );

        writeLine();
        writeLine(`CERT file: ${certFile}`);
        writeLine(`KEY file: ${keyFile}`);
    }

    /** @inheritdoc */
    public async showHelp(): Promise<void> {
        writeLine(`Options:`);
        writeLine(` -o, --overwrite     # Overwrite existing files or not.`);
        writeLine(` -v, --verbose       # Verbose output.`);
        writeLine();

        writeLine(`Examples:    ego ssl-new`);
        writeLine(`             ego ssl-new -o`);
    }
}
