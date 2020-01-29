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
import * as path from 'path';
const qrcode = require('qrcode');
import { CommandBase, CommandExecuteContext } from '../../contracts';
import { exists, toStringSafe, withSpinnerAsync, writeLine } from '../../util';


/**
 * Qr command.
 */
export class EgoCommand extends CommandBase {
    /** @inheritdoc */
    public readonly description = "Creates an image file with a QR code from a text.";

    /** @inheritdoc */
    public async execute(ctx: CommandExecuteContext): Promise<void> {
        const TEXT = toStringSafe(ctx.args['_'][0]);
        if ('' === TEXT) {
            console.warn("Please defined a text!");

            ctx.exit(1);
        }

        // margin
        let margin = parseInt(
            toStringSafe(ctx.args['m']).trim()
        );
        if (isNaN(margin)) {
            margin = parseInt(
                toStringSafe(ctx.args['margin']).trim()
            );
        }
        if (isNaN(margin)) {
            margin = 4;
        }

        // scale
        let scale = parseInt(
            toStringSafe(ctx.args['m']).trim()
        );
        if (isNaN(scale)) {
            scale = parseInt(
                toStringSafe(ctx.args['scale']).trim()
            );
        }
        if (isNaN(scale)) {
            scale = 4;
        }

        // width
        let width = parseInt(
            toStringSafe(ctx.args['w']).trim()
        );
        if (isNaN(width)) {
            width = parseInt(
                toStringSafe(ctx.args['width']).trim()
            );
        }
        if (isNaN(width)) {
            width = 1024;
        }

        let format = toStringSafe(ctx.args['f'])
            .toLowerCase()
            .trim();
        if ('' === format) {
            format = toStringSafe(ctx.args['format'])
                .toLowerCase()
                .trim();
        }

        let fileExt: string;
        switch (format) {
            case '':
            case 's':
            case 'svg':
                {
                    format = 'svg';
                    fileExt = 'svg';
                }
                break;

            case 'p':
            case 'png':
                {
                    format = 'png';
                    fileExt = 'png';
                }
                break;

            case 't':
            case 'text':
            case 'txt':
                {
                    format = 'utf8';
                    fileExt = 'txt';
                }
                break;

            default:
                {
                    console.warn(`Wrong format '${format}'!`);

                    ctx.exit(1);
                }
                break;
        }

        const QRCODE_OPTIONS: any = {
            margin,
            scale,
            type: format,
            width,
        };

        // search for unique filename
        let outputFile: string;
        await withSpinnerAsync(`Searching for output filename ...`, async (spinner) => {
            const BASE_NAME = 'qrcode';
            const FILE_EXT = '.' + fileExt;

            let fileName = BASE_NAME + FILE_EXT;
            let i = 0;
            do {
                spinner.text = `Searching for output filename ('${fileName}') ...`;

                outputFile = path.resolve(
                    path.join(ctx.cwd, fileName)
                );

                if (!(await exists(outputFile))) {
                    break;
                }

                ++i;
                fileName = `${BASE_NAME}-${i}${FILE_EXT}`;
            } while (true);

            spinner.text = `Found name for output file: '${fileName}'`;
        });

        // write to output file
        await withSpinnerAsync(`Creating QR code with '${TEXT}' ...`, async (spinner) => {
            await (() => {
                return new Promise((resolve, reject) => {
                    try {
                        qrcode.toFile(
                            outputFile, TEXT, QRCODE_OPTIONS,
                            (err: any) => {
                                if (err) {
                                    reject(err);
                                } else {
                                    resolve();
                                }
                            }
                        );
                    } catch (e) {
                        reject(e);
                    }
                });
            })();

            spinner.text = `Saved QR code with '${TEXT}' to '${outputFile}'`;
        });
    }

    /** @inheritdoc */
    public async showHelp(): Promise<void> {
        writeLine(`Options:`);
        writeLine(` -f, --format  # The output format. Default: svg`);
        writeLine(`               # Possible values: png, svg or txt`);
        writeLine(` -m, --margin  # The margin. Default: 4`);
        writeLine(` -s, --scale   # Scale factor (each factor is 1 pixel per dot). Default: 4`);
        writeLine(` -w, --width   # The width, in pixels. Default: 1024`);
        writeLine();

        writeLine(`Examples:    ego qr "https://e-go-digital.com"`);
        writeLine(`             ego qr "https://enterprisecockpit.e-go-digital.com" --format=png`);
        writeLine(`             ego qr "https://e-base.e-go-digital.com" --width=512`);
        writeLine(`             ego qr "https://github.com/egodigital/vscode-powertools" --margin=2`);
        writeLine(`             ego qr "https://github.com/egodigital/express-controllers" --scale=2`);
    }

    /** @inheritdoc */
    public readonly syntax = 'TEXT [options]';
}
