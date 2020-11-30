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
import * as cliProgress from 'cli-progress';
import * as csvParser from 'csv-parser';
import * as fs from 'fs-extra';
import * as path from 'path';
import * as progressStream from 'progress-stream';
import { CommandBase, CommandExecuteContext } from '../../contracts';
import { asArray, toStringSafe, writeLine } from '../../util';


/**
 * Csv-Split command.
 */
export class EgoCommand extends CommandBase {
    /** @inheritdoc */
    public readonly description = "Splits one or more (huge) CSV file(s) into separates parts.";

    /** @inheritdoc */
    public async execute(ctx: CommandExecuteContext): Promise<void> {
        const FILES: string[] = asArray(
            ctx.args['_']
        ).map(a => toStringSafe(a))
            .filter(a => '' !== a.trim());
        if (!FILES.length) {
            console.warn('Please define a least one CSV file, you would like to handle!');

            ctx.exit(1);
        }

        for (const F of FILES) {
            const BAR = new cliProgress.Bar({
                barsize: 20,
                format: trimFilenameIfNeeded(F) + '    [{bar}] {percentage}%  |  ETA: {eta}s',
                barIncompleteChar: ' ',
            });
            try {
                BAR.start(100, 0);

                await this.splitCSVFile(ctx, F, (progress) => {
                    BAR.update(progress.percentage);
                });
            } finally {
                BAR.stop();
            }
        }
    }

    /** @inheritdoc */
    public async showHelp(): Promise<void> {
        writeLine(`Options:`);
        writeLine(` --e, --escape      # The escape string to use. Default: quote string`);
        writeLine(` --enc, --encoding  # The encoding to use. Default: utf8`);
        writeLine(` --l, --lines       # Maximum number of lines per file. Default: 10000`);
        writeLine(` -lf, --line-feed   # Use LF instead of CRLF for new lines. Default: (false)`);
        writeLine(` --o, --out         # The output directory. Default: current working directory`);
        writeLine(` --q, --quote       # Specifies a single-character string to denote a quoted string. Default: ,`);
        writeLine(` --s, --separator   # The column separator to use. Default: ,`);
        writeLine();

        writeLine(`Relative paths will be mapped to the current working directory.`);
        writeLine();

        writeLine(`Examples:  ego csv-split my-file.csv`);
        writeLine(`           ego csv-split my-file-1.csv my-file-2.csv --lines=5979`);
    }

    private async splitCSVFile(ctx: CommandExecuteContext, file: string, onProgess: progressStream.ProgressListener) {
        if (!path.isAbsolute(file)) {
            file = path.join(
                ctx.cwd, file
            );
        }
        file = path.resolve(file);

        const STATS = await fs.stat(file);

        // -o / --out
        let outDir = toStringSafe(ctx.args['o']);
        if ('' === outDir.trim()) {
            outDir = toStringSafe(ctx.args['out']);
        }
        if ('' === outDir.trim()) {
            outDir = ctx.cwd;
        }
        if (!path.isAbsolute(outDir)) {
            outDir = path.join(
                ctx.cwd, outDir
            );
        }
        outDir = path.resolve(outDir);

        // -l / --lines
        let maxLinesPerFile = parseInt(
            toStringSafe(ctx.args['l'])
                .trim()
        );
        if (isNaN(maxLinesPerFile)) {
            maxLinesPerFile = parseInt(
                toStringSafe(ctx.args['lines'])
                    .trim()
            );
        }
        if (isNaN(maxLinesPerFile)) {
            maxLinesPerFile = 10000;
        }

        // -s / --separator
        let separator = toStringSafe(ctx.args['s']);
        if ('' === separator.trim()) {
            separator = toStringSafe(ctx.args['separator']);
        }
        if ('' === separator.trim()) {
            separator = ',';  // default
        }

        // -q / --quote
        let quote: string;
        if (_.isNil(ctx.args['q']) && _.isNil(ctx.args['quote'])) {
            quote = '"';
        } else {
            if (!_.isNil(ctx.args['q'])) {
                quote = toStringSafe(ctx.args['q']);
            } else if (!_.isNil(ctx.args['quote'])) {
                quote = toStringSafe(ctx.args['quote']);
            }
        }

        // -e / --escape
        let escape: string;
        if (_.isNil(ctx.args['e']) && _.isNil(ctx.args['escape'])) {
            escape = quote;
        } else {
            if (!_.isNil(ctx.args['e'])) {
                escape = toStringSafe(ctx.args['e']);
            } else if (!_.isNil(ctx.args['escape'])) {
                escape = toStringSafe(ctx.args['escape']);
            }
        }

        // -enc / --encoding
        let encoding = toStringSafe(ctx.args['enc'])
            .toLowerCase()
            .trim();
        if ('' === encoding) {
            encoding = toStringSafe(ctx.args['encoding'])
                .toLowerCase()
                .trim();
        }
        if ('' === encoding) {
            encoding = 'utf8';  // default
        }

        const NEW_LINE = ctx.args['lf'] || ctx.args['line-feed']
            ? "\n" : "\r\n";

        let chunks = -1;
        let currentFileName: string;
        let lines = -1;
        await (() => {
            return new Promise(async (resolve, reject) => {
                try {
                    fs.createReadStream(file)
                        .pipe(progressStream({
                            length: STATS.size,
                        }))
                        .on('progress', onProgess)
                        .pipe(csvParser({
                            escape: escape,
                            newline: NEW_LINE,
                            quote: quote,
                            separator: separator,
                        }))
                        .once('error', (err) => {
                            reject(err);
                        })
                        .once('end', () => {
                            resolve(undefined);
                        })
                        .on('data', (data) => {
                            ++lines;

                            if (0 === lines % maxLinesPerFile) {  // new file?
                                ++chunks;

                                const EXT = path.extname(file);
                                const BASE_FILENAME = path.basename(file, EXT);

                                // find unique name
                                let fileName = BASE_FILENAME + '-' + chunks;
                                let index = -1;
                                do {
                                    const FULL_PATH = path.join(
                                        outDir, fileName + EXT
                                    );

                                    if (!fs.existsSync(FULL_PATH)) {
                                        currentFileName = FULL_PATH;
                                        break;
                                    }

                                    // try next ...
                                    ++index;
                                    fileName = BASE_FILENAME + '-' + chunks + '-' + index;
                                } while (true);

                                // header
                                fs.appendFileSync(
                                    currentFileName,
                                    Object.keys(data)
                                        .join(separator),
                                    encoding,
                                );
                            }

                            // data row
                            fs.appendFileSync(
                                currentFileName,
                                Object.values(data)
                                    .join(separator),
                                encoding,
                            );
                        });
                } catch (e) {
                    reject(e);
                }
            });
        })();
    }

    /** @inheritdoc */
    public readonly syntax = '[FILES+] [OPTIONS*]';
}


function trimFilenameIfNeeded(fileName: string, maxSize = 20): string {
    const EXT = path.extname(fileName);

    let baseName = path.basename(fileName, EXT)
        .trim();
    if (baseName.length > maxSize) {
        baseName = baseName.substr(0, maxSize) + '\u2026';
    }

    return baseName + EXT;
}
