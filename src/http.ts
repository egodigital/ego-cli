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

import * as express from 'express';
import * as fs from 'fs-extra';
import * as http from 'http';
import * as https from 'https';
import * as path from 'path';
import { getEGOFolder } from './util';


/**
 * Options for 'createHttpServer()' function.
 */
export interface CreateHttpServerOptions {
    /**
     * Force HTTP or not.
     */
    forceHttp?: boolean;
}

/**
 * Result of 'createHttpServer()' function.
 */
export interface CreateHttpServerResult {
    /**
     * The express instance.
     */
    readonly app: express.Express;
    /**
     * Is HTTPs or not.
     */
    readonly https: boolean;
    /**
     * The server instance.
     */
    readonly server: http.Server | https.Server;
}


/**
 * Creates a new HTTP server instance.
 *
 * @param {CreateHttpServerOptions} [opts] Custom options.
 *
 * @return {CreateHttpServerResult} The result.
 */
export function createHttpServer(opts?: CreateHttpServerOptions): CreateHttpServerResult {
    if (!opts) {
        opts = {} as any;
    }

    let isHTTPs: boolean;
    let server: http.Server | https.Server | false = false;

    const app = express();

    if (!opts.forceHttp) {
        const EGO_FOLDER = getEGOFolder();

        const CERT_FILE = path.resolve(
            path.join(EGO_FOLDER, 'server.cert')
        );
        const KEY_FILE = path.resolve(
            path.join(EGO_FOLDER, 'server.key')
        );

        if (fs.existsSync(CERT_FILE) && fs.existsSync(KEY_FILE)) {
            isHTTPs = true;

            server = https.createServer({
                cert: fs.readFileSync(CERT_FILE),
                key: fs.readFileSync(KEY_FILE),
            }, app);
        }
    }

    if (false === server) {
        isHTTPs = false;

        server = http.createServer(app);
    }

    return {
        app,
        https: isHTTPs,
        server,
    };
}
