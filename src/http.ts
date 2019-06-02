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


/**
 * Result of 'createHttpServer()' function.
 */
export interface CreateHttpServerResult {
    /**
     * The host instance.
     */
    readonly host: express.Express;
    /**
     * Is HTTPs or not.
     */
    readonly https: boolean;
}


/**
 * Creates a new HTTP server instance.
 *
 * @return {CreateHttpServerResult} The result.
 */
export function createHttpServer(): CreateHttpServerResult {
    let https = false;

    const HOST = express();

    return {
        host: HOST,
        https,
    };
}
