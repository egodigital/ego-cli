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
import * as cliHighlight from 'cli-highlight';
import * as express from 'express';
import * as fs from 'fs-extra';
import * as os from 'os';
import * as path from 'path';
import * as sanitizeFilename from 'sanitize-filename';
import { CommandBase, CommandExecuteContext } from '../../contracts';
import { createHttpServer } from '../../http';
import { compareValuesBy, exists, toStringSafe, waitForEnter, withSpinnerAsync, writeErrLine, writeLine } from '../../util';


type ApiEndpoint = express.RequestHandler;

interface ApiModule {
}

interface ApiRequest extends express.Request {
}


const API_MODULE_PROPERTY = Symbol('API_MODULE_PROPERTY');


/**
 * Api command.
 */
export class EgoCommand extends CommandBase {
    /** @inheritdoc */
    public readonly description = "Runs an Express.js based REST API from current directory.";

    /** @inheritdoc */
    public async execute(ctx: CommandExecuteContext): Promise<void> {
        const { app, https, server } = createHttpServer({
            forceHttp: ctx.args['h'] || ctx.args['http'],
        });

        app.use(async (req, res, next) => {
            res.header('X-Powered-By', 'e.GO CLI');
            res.header('X-Tm-Mk', '1979-09-05 23:09');

            res.header('Last-Modified', (new Date()).toUTCString());

            return next();
        });

        const API_ROUTE = express.Router();
        this.setupAPIRoute(ctx, API_ROUTE);

        app.use('/api', API_ROUTE);

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
            port = 8080;  // default
        }

        // try start host ...
        await withSpinnerAsync(`Starting API host on port ${port} ...`, (spinner) => {
            return new Promise<void>((resolve, reject) => {
                try {
                    server.once('error', (err) => {
                        reject(err);
                    });

                    server.listen(port, () => {
                        spinner.text = `API host now running on port ${port}`;

                        resolve();
                    });
                } catch (e) {
                    reject(e);
                }
            });
        });

        // output all base URLs
        writeLine();
        writeLine(`You can now access the API from the following base URLs:`);
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
            writeLine(`    ${SCHEME}://localhost:${port}/api/`);
            writeLine(`    ${SCHEME}://127.0.0.1:${port}/api/`);
        }

        // wait for ENTER
        writeLine();
        writeLine();
        await waitForEnter('Press <ENTER> to stop ...');

        server.close((err) => {
            if (err) {
                writeErrLine(err);

                ctx.exit(1);
            } else {
                ctx.exit();
            }
        });
    }

    /** @inheritdoc */
    public async showHelp(): Promise<void> {
        writeLine(`Options:`);
        writeLine(` -b, --bearer      # Defines an optional 'Bearer' token for 'Authorization' request header.`);
        writeLine(` -h, --http        # Force in-secure HTTP or not.`);
        writeLine(` -p, --port        # The custom TCP port. Default: 8080`);
        writeLine(` -pwd, --password  # The password for basic authorization.`);
        writeLine(` -r, --root        # Custom root directory. Default: current working directory`);
        writeLine(` -u, --user        # The user name for basic authorization.`);
        writeLine(` -v, --verbose     # Verbose output.`);
        writeLine();

        writeLine(`Examples:    ego api`);
        writeLine(`             ego api --port=23979`);
        writeLine(`             ego api --bearer=footoken`);
        writeLine(`             ego api --user=tanja --password=19790905`);
        writeLine();
        writeLine();

        writeLine(`Example endpoint:`);
        writeLine();
        writeLine(`Create an 'index.js' file and use the following skeleton:`);
        writeLine(
            cliHighlight.highlight(
                `
    // for other methods like 'post' or 'delete'
    // simply implement them by their names in upper case
    // characters ('POST' and/or 'DELETE', e.g.)
    exports.GET = async (req, res) => {
        // for 'req' and 'res' => https://expressjs.com/

        // s. https://egodigital.github.io/ego-cli/interfaces/_contracts_.commandexecutecontext.html
        const CONTEXT = this;

        return res.status(200)
            .send('Hello, e.GO!');
    };

    // handle any HTTP method
    // and/or use as fallback
    exports.request = async (req, res) => {
        return res.status(501)
            .send();
    };
`,
                {
                    language: 'javascript',
                }
            )
        );

        writeLine(`To create another endpoint, like '/foo/bar', use one of the following file paths:`);
        writeLine(`  * /foo/bar.js`);
        writeLine(`  * /foo/bar/index.js`);

        writeLine();
        writeLine(`Files with leading _ will be ignored.`);
    }

    private setupAPIRoute(ctx: CommandExecuteContext, route: express.Router) {
        const VERBOSE = ctx.args['v'] || ctx.args['verbose'];

        // -r or --root
        let rootDir = toStringSafe(
            ctx.args['r']
        );
        if ('' === rootDir.trim()) {
            rootDir = toStringSafe(
                ctx.args['root']
            );
        }
        if ('' === rootDir.trim()) {
            rootDir = ctx.cwd;
        }
        if (!path.isAbsolute(rootDir)) {
            rootDir = path.join(
                ctx.cwd, rootDir
            );
        }
        rootDir = path.resolve(rootDir);

        const FIND_SCRIPT_FILE = async (req: express.Request): Promise<false | string> => {
            let normalizedPath = req.path
                .split(path.sep).join('/')
                .split('/')
                .map(x => x.trim())
                .filter(x => '' !== x)
                .map(x => sanitizeFilename(x))
                .join('/');

            if (!normalizedPath.startsWith('/')) {
                normalizedPath = '/' + normalizedPath;
            }

            const POSSIBLE_FILES = [
                path.join(
                    normalizedPath, 'index.js',
                )
            ];
            if ('' !== path.basename(normalizedPath).trim()) {
                POSSIBLE_FILES.unshift(
                    path.join(
                        path.dirname(normalizedPath), path.basename(normalizedPath) + '.js',
                    )
                );
            }

            for (const PF of POSSIBLE_FILES) {
                const FULL_PATH = path.resolve(
                    path.join(
                        rootDir, PF
                    )
                );

                if (
                    (rootDir !== FULL_PATH) &&
                    (!FULL_PATH.startsWith(rootDir + path.sep))
                ) {
                    // invalid path
                    continue;
                }

                if (!(await exists(FULL_PATH))) {
                    continue;
                }

                const STATS = await fs.stat(FULL_PATH);
                if (STATS.isFile()) {
                    return require.resolve(
                        FULL_PATH
                    );
                }
            }

            return false;
        };

        const PRINT_REQUEST_ERROR = (err: any, req: express.Request) => {
            if (VERBOSE) {
                writeErrLine();
                writeErrLine(`API REQUEST ERROR [${req.method} :: ${req.path}] => ${toStringSafe(err)}`);
            }
        };

        if (VERBOSE) {
            route.use(async (req, res, next) => {
                writeLine();
                writeLine(`API REQUEST [${req.method} :: ${req.path}] => ` + JSON.stringify({
                    headers: req.headers,
                    query: req.query,
                }, null, 2));

                return next();
            });
        }

        let bearerToken = toStringSafe(ctx.args['b'])
            .trim();
        if ('' === bearerToken) {
            bearerToken = toStringSafe(ctx.args['bearer'])
                .trim();
        }
        if ('' !== bearerToken) {
            // check for bearer token

            route.use(async (req, res, next) => {
                const AUTHORIZATION = toStringSafe(req.headers['authorization'])
                    .trim();
                if (AUTHORIZATION.toLowerCase().startsWith('bearer')) {
                    const TOKEN = AUTHORIZATION.substr(6)
                        .trim();

                    if (TOKEN === bearerToken) {
                        return next();  // matches
                    }
                }

                return res.status(401)
                    .send();
            });
        }

        let username = toStringSafe(ctx.args['u']);
        if ('' === username.trim()) {
            username = toStringSafe(ctx.args['user']);
        }

        let password = toStringSafe(ctx.args['pwd']);
        if ('' === password.trim()) {
            password = toStringSafe(ctx.args['password']);
        }

        username = toStringSafe(username)
            .toLowerCase()
            .trim();
        password = toStringSafe(password);
        if ('' !== username || '' !== password.trim()) {
            // check for user and password

            route.use(async (req, res, next) => {
                try {
                    const AUTHORIZATION = toStringSafe(req.headers['authorization'])
                        .trim();
                    if (AUTHORIZATION.toLowerCase().startsWith('basic')) {
                        const BASE64_USERNAME_AND_PASSWORD = AUTHORIZATION.substr(5)
                            .trim();

                        if ('' !== BASE64_USERNAME_AND_PASSWORD) {
                            const USERNAME_AND_PASSWORD = Buffer.from(
                                BASE64_USERNAME_AND_PASSWORD, 'base64'
                            ).toString('utf8');

                            let u: string;
                            let p: string;

                            const SEP = USERNAME_AND_PASSWORD.indexOf(':');
                            if (SEP > -1) {
                                u = USERNAME_AND_PASSWORD.substr(0, SEP);
                                p = USERNAME_AND_PASSWORD.substr(SEP + 1);
                            } else {
                                u = USERNAME_AND_PASSWORD;
                            }

                            u = toStringSafe(u)
                                .toLowerCase()
                                .trim();
                            p = toStringSafe(p);
                            if (u === username && p === password) {
                                return next();  // user & password match
                            }
                        }
                    }
                } catch (e) {
                    PRINT_REQUEST_ERROR(e, req);
                }

                return res.status(401)
                    .header('WWW-Authenticate', 'API by e.GO CLI')
                    .send();
            });
        }

        // check if script (module) exists
        route.use(async (req, res, next) => {
            const SCRIPT_FILE = await FIND_SCRIPT_FILE(req);
            if (false === SCRIPT_FILE) {
                return res.status(404)
                    .send();
            }

            await ctx.queue.add(async () => {
                delete require.cache[SCRIPT_FILE];
                req[API_MODULE_PROPERTY] = require(SCRIPT_FILE);
            });

            return next();
        });

        // handle request
        route.all('/*', async function (req: ApiRequest, res: express.Response) {
            try {
                const API_MODULE: ApiModule = req[API_MODULE_PROPERTY];

                const POSSIBLE_METHODS = [
                    toStringSafe(req.method)
                        .toUpperCase()
                        .trim(),
                    'request',
                ];

                let endpoint: ApiEndpoint | false = false;
                for (const PM of POSSIBLE_METHODS) {
                    const VALUE = API_MODULE[PM];
                    if ('function' === typeof VALUE) {
                        endpoint = VALUE;
                        break;
                    }
                }

                if (false === endpoint) {
                    // not implemented

                    return res.status(405)
                        .send();
                }

                return Promise.resolve(
                    endpoint.apply(ctx, arguments)
                );
            } catch (e) {
                PRINT_REQUEST_ERROR(e, req);

                return res.status(500)
                    .header('Content-type', 'text/plain; charset=utf-8')
                    .send(Buffer.from(
                        toStringSafe(e), 'utf8'
                    ));
            }
        });
    }
}
