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
import { asArray, getCWD, spawn, WithCWD, WithVerbose, getSTDIO, toStringSafe } from './util';


/**
 * Options for 'getRunningDockerContainers()' function.
 */
export interface GetRunningDockerContainers extends WithCWD, WithVerbose {
}


/**
 * Lists the IDs of all running docker containers.
 *
 * @param {GetRunningDockerContainers} [opts] Custom options.
 *
 * @return {string[]} The list of running docker container IDs.
 */
export function getRunningDockerContainers(opts?: GetRunningDockerContainers): string[] {
    if (_.isNil(opts)) {
        opts = {} as any;
    }

    return asArray(
        spawn(
            'docker', ['ps', '--format', '{{.ID}}'],
            {
                cwd: getCWD(opts),
                stdio: getSTDIO(opts),
            }
        ).output
    ).map((x) => {
        return toStringSafe(x)
            .split('\n');
    }).reduce((x, y) => {
        return x.concat(y);
    }, []).map(b => b.trim())
        .filter(b => '' !== b);
}
