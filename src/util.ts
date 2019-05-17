/**
 * This file is part of the ego-cli distribution (https://github.com/egodigital/ego-cli).
 * Copyright (c) e.GO Digital GmbH, Aachen, Germany
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, version 3.
 *
 * This program is distributed in the hope that it will be useful, but
 * WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU
 * General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program. If not, see <http://www.gnu.org/licenses/>.
 */

import * as _ from 'lodash';
import * as child_process from 'child_process';
import * as deepMerge from 'deepmerge';
import * as fs from 'fs-extra';
import * as globalDirs from 'global-dirs';
import * as path from 'path';
import * as util from 'util';


/**
 * Possible values for options of 'spawn()' function.
 */
export type SpawnOptions = child_process.SpawnOptions | child_process.SpawnSyncOptionsWithBufferEncoding;


/**
 * Keeps sure a value is an array.
 *
 * @param {T|T[]} val The input value.
 * @param {boolean} [noEmpty] Remove values with are (null) or (undefined).
 *
 * @return {T[]} The output value.
 */
export function asArray<T = any>(val: T | T[], noEmpty = true): T[] {
    if (!Array.isArray(val)) {
        val = [val];
    }

    return val.filter(x => {
        if (noEmpty) {
            return !_.isNil(x);
        }

        return true;
    });
}

/**
 * Checks if a global module exists.
 *
 * @param {string} moduleId The ID of the module.
 *
 * @return {boolean} Module exists or not.
 */
export function globalModuleExists(moduleId: string): boolean {
    moduleId = toStringSafe(moduleId)
        .trim();

    try {
        const MODULE_DIR = path.resolve(
            path.join(
                globalDirs.npm.packages, moduleId,
            )
        );

        if (!(fs.existsSync(MODULE_DIR))) {
            return false;  // module directory not found
        }

        if (!fs.statSync(MODULE_DIR).isDirectory()) {
            return false;  // module path is no directory
        }

        const PACKAGE_JSON = path.resolve(
            path.join(
                MODULE_DIR, 'package.json',
            )
        );

        if (!(fs.existsSync(PACKAGE_JSON))) {
            return false;  // package.json not found
        }

        return fs.statSync(PACKAGE_JSON)
            .isFile();  // is package.json path a directory?
    } catch {
        return false;
    }
}

/**
 * Spawns a new process.
 *
 * @param {any} command The command.
 * @param {any[]} [args] The (optional) arguments for the execution.
 * @param {SpawnOptions} [opts] Custom options.
 *
 * @return {child_process.SpawnSyncReturns<Buffer>} The result of an execution.
 */
export function spawn(
    command: any, args?: any[],
    opts?: SpawnOptions,
): child_process.SpawnSyncReturns<Buffer> {
    if (_.isNil(args)) {
        args = [];
    }

    opts = deepMerge(<SpawnOptions>{
        cwd: process.cwd(),
        stdio: 'inherit',
        env: process.env,
        encoding: 'utf8',
    }, opts || {} as any);

    const RESULT = child_process.spawnSync(
        toStringSafe(command),
        asArray(args, false).map(a => toStringSafe(a)),
        opts,
    );

    if (!_.isNil(RESULT.error)) {
        throw RESULT.error;
    }

    if (0 !== RESULT.status) {
        process.exit(RESULT.status);
    }

    return RESULT;
}

/**
 * Converts a value to a string (if needed).
 *
 * @param {any} val The input value.
 *
 * @return {string} The output value.
 */
export function toStringSafe(val: any): string {
    if (_.isString(val)) {
        return val;
    }

    if (_.isNil(val)) {
        return '';
    }

    if (_.isFunction(val['toString'])) {
        return String(
            val.toString()
        );
    }

    return util.inspect(val);
}
