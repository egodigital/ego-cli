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
import * as express from 'express';
import * as fileSize from 'filesize';
import * as fs from 'fs-extra';
import * as htmlEntities from 'html-entities';
import * as os from 'os';
import * as path from 'path';
import * as readline from 'readline';
import { CommandBase, CommandExecuteContext } from '../../contracts';
import { createHttpServer } from '../../http';
import { compareValuesBy, exists, getMimeType, getResourcePath, loadEJSAsync, withSpinnerAsync, writeLine, toStringSafe } from '../../util';


interface DirectoryEntry {
    name: string;
    path: string;
    stat: fs.Stats;
}


/**
 * Serve command.
 */
export class EgoCommand extends CommandBase {
    /** @inheritdoc */
    public readonly description = "Starts a HTTP server that shares files via a web interface.";

    /** @inheritdoc */
    public async execute(ctx: CommandExecuteContext): Promise<void> {
        const { app, https, server } = createHttpServer({
            forceHttp: ctx.args['h'] || ctx.args['http'],
        });

        app.disable('etag');

        app.use(async (req, res, next) => {
            res.header('X-Powered-By', 'e.GO CLI');
            res.header('X-Tm-Mk', '1979-09-05 23:09');

            res.header('Last-Modified', (new Date()).toUTCString());

            return next();
        });

        // static resources
        app.use('/css', express.static(getResourcePath('css')));
        app.use('/font', express.static(getResourcePath('font')));
        app.use('/fonts', express.static(getResourcePath('fonts')));
        app.use('/img', express.static(getResourcePath('img')));
        app.use('/js', express.static(getResourcePath('js')));

        // header and footer
        const HEADER = await loadEJSAsync('header');
        const FOOTER = await loadEJSAsync('footer');

        app.get('/', async (req, res) => {
            try {
                const ROOT_DIR = path.resolve(
                    ctx.cwd
                );

                let currentDir = toStringSafe(req.query['p'])
                    .trim()
                    .split(path.sep).join('/');
                if (currentDir.startsWith('/')) {
                    currentDir = currentDir.substr(1)
                        .trim();
                }

                const FILE_OR_FOLDER_PATH = path.resolve(
                    path.join(
                        ctx.cwd, currentDir
                    )
                );

                if (
                    FILE_OR_FOLDER_PATH === ROOT_DIR ||
                    FILE_OR_FOLDER_PATH.startsWith(ROOT_DIR + path.sep)
                ) {
                    try {
                        if (
                            await exists(FILE_OR_FOLDER_PATH) &&
                            !FILE_OR_FOLDER_PATH.split(path.sep)
                                .some(x => x.trim().startsWith('.'))  // any part must not start with '.'
                        ) {
                            const STAT = await fs.stat(FILE_OR_FOLDER_PATH);
                            if (STAT.isDirectory()) {
                                const HTML_ENC = new htmlEntities.AllHtmlEntities();

                                let content = `<link href="/css/commands/serve.css" rel="stylesheet">`;

                                content += `<div class="container">`;

                                // Breadcrumb
                                content += `<nav aria-label="breadcrumb">`;
                                content += `<ol class="breadcrumb">`;
                                {
                                    const PARTS = currentDir.split('/')
                                        .filter(x => '' !== x.trim());

                                    if (PARTS.length) {
                                        content += `<li class="breadcrumb-item">
<a href="/">
    <i class="fa fa-home"></i>
</a>`;

                                        for (let i = 0; i < PARTS.length; i++) {
                                            const P = PARTS[i];
                                            const IS_ACTIVE = i === (PARTS.length - 1);

                                            content += `<li class="breadcrumb-item${IS_ACTIVE ? ' active' : ''}">${
                                                IS_ACTIVE ? '' : `<a href="/?p=${
                                                    encodeURIComponent(
                                                        PARTS.slice(0, i + 1)
                                                            .join('/')
                                                    )
                                                    }">`
                                                }${
                                                HTML_ENC.encode(P.trim())
                                                }${
                                                IS_ACTIVE ? '' : `</a>`
                                                }</li>`;
                                        }
                                    } else {
                                        content += `<li class="breadcrumb-item active">
    <i class="fa fa-home"></i>
</li>`;
                                    }
                                }
                                content += `</ol>`;
                                content += `</nav>`;

                                // collect files and folders
                                const FILES: DirectoryEntry[] = [];
                                const FOLDERS: DirectoryEntry[] = [];
                                for (const ITEM of await fs.readdir(FILE_OR_FOLDER_PATH)) {
                                    if (ITEM.trim().startsWith('.')) {
                                        continue;  // must not start with '.'
                                    }

                                    const FULL_PATH = path.resolve(
                                        path.join(
                                            FILE_OR_FOLDER_PATH, ITEM
                                        )
                                    );

                                    const ITEM_STAT = await fs.stat(FULL_PATH);

                                    const TARGET_LIST = ITEM_STAT.isDirectory() ?
                                        FOLDERS : FILES;

                                    TARGET_LIST.push({
                                        name: path.basename(FULL_PATH),
                                        path: FULL_PATH,
                                        stat: ITEM_STAT
                                    });
                                }

                                if (FOLDERS.length || FILES.length) {
                                    content += `<table class="table table-striped table-hover ego-dir-list">`;

                                    content += `<thead>
    <tr>
        <th scope="col" class="ego-icon">&nbsp;</th>
        <th scope="col" class="ego-name">Name</th>
        <th scope="col" class="ego-type">Type</th>
        <th scope="col" class="ego-size">Size</th>
    </tr>
</thead>`;

                                    content += `<tbody>`;

                                    // folders
                                    for (const F of FOLDERS.sort((x, y) => {
                                        return compareValuesBy(x, y, i => {
                                            return toStringSafe(i.name)
                                                .toLowerCase()
                                                .trim();
                                        });
                                    })) {
                                        content += `    <tr>
    <td class="ego-icon"><a href="/?p=${
                                            encodeURIComponent(
                                                currentDir + '/' + F.name
                                            )
                                            }"><i class="fa fa-folder mr-4 pr-3"></i></a>
    </td>
    <td class="ego-name"><a href="/?p=${
                                            encodeURIComponent(
                                                currentDir + '/' + F.name
                                            )
                                            }">${
                                            HTML_ENC.encode(F.name)
                                            }</a></td>
    <td class="ego-type ego-dir">${
                                            HTML_ENC.encode(
                                                '<DIR>'
                                            )
                                            }</td>
    <td class="ego-size ego-dir">&nbsp;</td>
</tr>`;
                                    }

                                    // files
                                    for (const F of FILES.sort((x, y) => {
                                        return compareValuesBy(x, y, i => {
                                            return toStringSafe(i.name)
                                                .toLowerCase()
                                                .trim();
                                        });
                                    })) {
                                        content += `    <tr>
    <td class="ego-icon"><a href="/?p=${
                                            encodeURIComponent(
                                                currentDir + '/' + F.name
                                            )
                                            }" target="_blank"><i class="fa fa-arrow-circle-o-down mr-4 pr-3"></i></a>
    </td>
    <td class="ego-name"><a href="/?p=${
                                            encodeURIComponent(
                                                currentDir + '/' + F.name
                                            )
                                            }" target="_blank">${
                                            HTML_ENC.encode(F.name)
                                            }</a></td>
    <td class="ego-type">${
                                            HTML_ENC.encode(
                                                getMimeType(F.name)
                                            )
                                            }</td>
    <td class="ego-size ego-file" title="${
                                            HTML_ENC.encode(
                                                toStringSafe(
                                                    F.stat.size
                                                )
                                            )
                                            }">${
                                            fileSize(F.stat.size)
                                            }</td>
</tr>`;
                                    }

                                    content += `</tbody>`;

                                    content += `</table>`;
                                } else {
                                    content += `<div class="alert alert-info" role="alert">
    The directory is empty.
</div>`;
                                }

                                content += `</div>`;

                                const HTML = `${HEADER}${content}${FOOTER}`;

                                return res.status(200)
                                    .header('Content-type', 'text/html; charset=utf-8')
                                    .send(Buffer.from(HTML, 'utf8'));
                            }

                            res.status(200)
                                .header('Content-type', getMimeType(FILE_OR_FOLDER_PATH))
                                .header('Content-disposition', `attachment; filename="${path.basename(FILE_OR_FOLDER_PATH)}"`);

                            fs.createReadStream(FILE_OR_FOLDER_PATH)
                                .pipe(res);

                            return;
                        }
                    } catch (e) {
                        return res.status(500)
                            .header('Content-type', 'text/plain; charset=utf-8')
                            .send();
                    }
                }
            } catch { }

            return res.status(404)
                .send();
        });

        // TCP port
        let port = parseInt(
            toStringSafe(ctx.args['p'])
                .trim()
        );
        if (isNaN(port)) {
            port = parseInt(
                toStringSafe(ctx.args['port'])
                    .trim()
            );
        }
        if (isNaN(port)) {
            port = 5979;  // default
        }

        // try start host ...
        await withSpinnerAsync(`Starting host on port ${port} ...`, (spinner) => {
            return new Promise<void>((resolve, reject) => {
                try {
                    server.once('error', (err) => {
                        reject(err);
                    });

                    server.listen(port, () => {
                        spinner.text = `Host now running on port ${port}`;

                        resolve();
                    });
                } catch (e) {
                    reject(e);
                }
            });
        });

        // output all URLs
        writeLine();
        writeLine(`You can now access the web interface from a browser via:`);
        writeLine();
        {
            const SCHEME = https ?
                'https' : 'http';

            const NETWORK_INTERFACES = os.networkInterfaces();

            const LIST_OF_IFNAMES = Object.keys(NETWORK_INTERFACES).sort((x, y) => {
                return compareValuesBy(x, y, n => {
                    return toStringSafe(n)
                        .toLowerCase()
                        .trim();
                });
            });

            for (const IFNAME of LIST_OF_IFNAMES) {
                const IFACES = NETWORK_INTERFACES[IFNAME].filter(x => {
                    return !x.internal;
                }).filter(x => {
                    const ADDR = toStringSafe(x.address)
                        .toLowerCase()
                        .trim();

                    if ('IPv4' === x.family) {
                        return !/^(127\.[\d.]+|[0:]+1|localhost)$/.test(ADDR);
                    }

                    if ('IPv6' === x.family) {
                        return '::1' !== ADDR;
                    }

                    return true;
                }).sort((x, y) => {
                    return compareValuesBy(x, y, (i) => {
                        return 'IPv4' === i.family ? 0 : 1;
                    });
                });

                IFACES.forEach(x => {
                    writeLine(`    ${SCHEME}://${
                        'IPv6' === x.family ? '[' : ''
                        }${x.address}${
                        'IPv6' === x.family ? ']' : ''
                        }:${port}/`);
                });
            }

            writeLine();
            writeLine(`    ${SCHEME}://localhost:${port}/`);
            writeLine(`    ${SCHEME}://127.0.0.1:${port}/`);
        }

        // wait for ENTER
        writeLine();
        writeLine();
        await (() => {
            return new Promise<void>((resolve, reject) => {
                try {
                    const INPUT = readline.createInterface({
                        input: process.stdin,
                        output: process.stdout,
                    });

                    INPUT.question(`Press ENTER to stop ... `, () => {
                        INPUT.close();

                        resolve();
                    });
                } catch (e) {
                    reject(e);
                }
            });
        })();
    }

    /** @inheritdoc */
    public async showHelp(): Promise<void> {
        writeLine(`Options:`);
        writeLine(` -h, --http     # Force in-secure HTTP or not.`);
        writeLine(` -p, --port     # The custom TCP port. Default: 5979`);
        writeLine(` -v, --verbose  # Verbose output.`);
        writeLine();

        writeLine(`Examples:    ego serve`);
        writeLine(`             ego serve --port=23979`);
    }
}
