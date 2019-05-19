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
import * as child_process from 'child_process';
import * as deepMerge from 'deepmerge';
import * as fs from 'fs-extra';
import * as globalDirs from 'global-dirs';
import * as ora from 'ora';
import * as os from 'os';
import * as path from 'path';
import * as util from 'util';
import { default as chalk } from 'chalk';


/**
 * Possible values for options of 'spawnAsync()' function.
 */
export type SpawnAsyncOptions = child_process.SpawnOptions;

/**
 * A result of a 'spawnAsync()' function call.
 */
export interface SpawnAsyncResult {
    /**
     * The exit code.
     */
    status: number;
    /**
     * The data of the standard error stream.
     */
    stderr: Buffer | null;
    /**
     * The data of the standard output stream.
     */
    stdout: Buffer | null;
}

/**
 * Possible values for options of 'spawn()' function.
 */
export type SpawnOptions = child_process.SpawnOptions | child_process.SpawnSyncOptionsWithBufferEncoding;

/**
 * An object with a custom, current working directory.
 */
export interface WithCWD {
    /**
     * The custom, current working directory.
     */
    cwd?: string;
}

/**
 * An object with a custom, verbose flag.
 */
export interface WithVerbose {
    /**
     * Verbose output or not.
     */
    verbose?: boolean;
}


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
 * Runs an action async.
 *
 * @param {Function} action The action to invoke.
 *
 * @return {Promise<TResult>} The promise with the resumt of the action.
 */
export function async<TResult = any>(
    action: (...args: any[]) => TResult,
): Promise<TResult> {
    return new Promise<TResult>((resolve, reject) => {
        try {
            process.nextTick(() => {
                try {
                    resolve(
                        action()
                    );
                } catch (e) {
                    reject(e);
                }
            });
        } catch (e) {
            reject(e);
        }
    });
}

/**
 * Compares two values for sorting, by using a selector.
 *
 * @param {T} x The first value.
 * @param {T} y The second value.
 * @param {Function} selector The function, that selects the value to compare.
 *
 * @return {number} The soirt value.
 */
export function compareValuesBy<T, V>(x: T, y: T, selector: (i: T) => V): number {
    const VAL_X = selector(x);
    const VAL_Y = selector(y);

    if (VAL_X !== VAL_Y) {
        if (VAL_X < VAL_Y) {
            return -1;
        }

        if (VAL_X > VAL_Y) {
            return 1;
        }
    }

    return 0;
}

/**
 * Handles a value as string and adds colors to each 'e.GO' expression inside it for console output.
 *
 * @param {any} [val] The (optional) input value.
 *
 * @return {string} The output value.
 */
export function eGO(val: any = 'e.GO'): string {
    return toStringSafe(val).replace(
        "e.GO",
        `${chalk.reset() + chalk.blueBright('e') + chalk.white('.') + chalk.blueBright('GO') + chalk.reset()}`
    );
}

/**
 * Checks if a path exists.
 *
 * @param {fs.PathLike} p The path to check.
 *
 * @return {Promise<boolean>} The promise, that indicates, if path exists or not.
 */
export function exists(p: fs.PathLike): Promise<boolean> {
    return new Promise<boolean>((resolve, reject) => {
        try {
            fs.exists(p, (doesExist) => {
                resolve(doesExist);
            });
        } catch (e) {
            reject(e);
        }
    });
}

/**
 * Extracts the current working directory from an object.
 *
 * @param {WithCWD} obj The object with the data.
 *
 * @return {string} The extracted data.
 */
export function getCWD(obj: WithCWD): string {
    if (_.isNil(obj)) {
        obj = {} as any;
    }

    let cwd = toStringSafe(obj.cwd);

    if ('' === cwd.trim()) {
        cwd = process.cwd();
    }

    if (!path.isAbsolute(cwd)) {
        cwd = path.join(
            process.cwd(), cwd
        );
    }

    return path.resolve(cwd);
}

/**
 * Returns the value for an spawn.stdio property.
 *
 * @param {WithVerbose} obj The object with a verbose flag.
 *
 * @return {child_process.StdioOptions} The value for the property.
 */
export function getSTDIO(obj: WithVerbose): child_process.StdioOptions {
    if (_.isNil(obj)) {
        obj = {} as any;
    }

    return obj.verbose ?
        'inherit' : null;
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
 * @return {child_process.SpawnSyncReturns<Buffer>} The result of the execution.
 */
export function spawn(
    command: any, args?: any[],
    opts?: SpawnOptions,
): child_process.SpawnSyncReturns<Buffer> {
    command = toStringSafe(command);

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
        command,
        asArray(args, false).map(a => toStringSafe(a)),
        opts,
    );

    if (!_.isNil(RESULT.error)) {
        throw RESULT.error;
    }

    if (0 !== RESULT.status) {
        throw new Error(`'${command}' exited with code '${RESULT.status}'`);
    }

    return RESULT;
}

/**
 * Spawns a new process (async).
 *
 * @param {any} command The command.
 * @param {any[]} [args] The (optional) arguments for the execution.
 * @param {SpawnAsyncOptions} [opts] Custom options.
 *
 * @return {Promise<SpawnAsyncResult>} The promise with the result of the execution.
 */
export function spawnAsync(
    command: any, args?: any[],
    opts?: SpawnAsyncOptions,
): Promise<SpawnAsyncResult> {
    return new Promise<SpawnAsyncResult>((resolve, reject) => {
        try {
            command = toStringSafe(command);

            if (_.isNil(args)) {
                args = [];
            }

            opts = deepMerge(<SpawnAsyncOptions>{
                cwd: process.cwd(),
                env: process.env,
                stdio: 'inherit',
            }, opts || {} as any);

            const PS = child_process.spawn(
                command, args,
                opts,
            );

            PS.once('error', (err) => {
                reject(err);
            });

            let stdout: Buffer;
            if (!_.isNil(PS.stderr)) {
                stdout = Buffer.alloc(0);

                PS.stdout.on('data', (data) => {
                    try {
                        stdout = Buffer.concat([
                            stdout, toBufferSafe(data)
                        ]);
                    } catch (e) {
                        reject(e);
                    }
                });
            }

            let stderr: Buffer = null;
            if (!_.isNil(PS.stderr)) {
                stderr = Buffer.alloc(0);

                PS.stderr.on('data', (data) => {
                    try {
                        stderr = Buffer.concat([
                            stderr, toBufferSafe(data)
                        ]);
                    } catch (e) {
                        reject(e);
                    }
                });
            }

            PS.once('close', (code) => {
                if (0 === code) {
                    resolve({
                        status: code,
                        stderr,
                        stdout,
                    });
                } else {
                    reject(
                        new Error(`'${command}' exited with code '${code}'`)
                    );
                }
            });
        } catch (e) {
            reject(e);
        }
    });
}

/**
 * Converts data to a buffer (if needed).
 *
 * @param {any} data The input data.
 *
 * @return {Buffer} The output data.
 */
export function toBufferSafe(data: any): Buffer {
    if (Buffer.isBuffer(data)) {
        return data;
    }

    if (_.isNil(data)) {
        return Buffer.alloc(0);
    }

    return new Buffer(
        toStringSafe(data), 'utf8'
    );
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

    if (val instanceof Error) {
        return `[${val.name}] '${val.message}'`;
    }

    if (_.isFunction(val['toString'])) {
        return String(
            val.toString()
        );
    }

    return util.inspect(val);
}

/**
 * Executes an action for a spinner.
 *
 * @param {any} text The initial text.
 * @param {Function} [action] The action to invoke.
 *
 * @return {TResult} The result of the action.
 */
export function withSpinner<TResult = any>(
    text: any, action?: (spinner: ora.Ora) => TResult
): TResult {
    text = toStringSafe(text);

    const SPINNER = ora(text);
    SPINNER.start();

    try {
        let result: TResult;
        if (action) {
            result = action(SPINNER);
        }

        SPINNER.succeed();

        return result;
    } catch (e) {
        SPINNER.fail(text + ' => ' + toStringSafe(e));

        throw e;
    }
}

/**
 * Executes an action for a spinner (async).
 *
 * @param {any} text The initial text.
 * @param {Function} [action] The action to invoke.
 *
 * @return {Promise<TResult>} The promise with the result of the action.
 */
export async function withSpinnerAsync<TResult = any>(
    text: any, action?: (spinner: ora.Ora) => PromiseLike<TResult>
): Promise<TResult> {
    text = toStringSafe(text);

    const SPINNER = ora();
    await async(() => SPINNER.start());

    try {
        let result: TResult;
        if (action) {
            result = await action(SPINNER);
        }

        await async(() => SPINNER.succeed());

        return result;
    } catch (e) {
        await async(() => SPINNER.fail(text + ' => ' + toStringSafe(e)));

        throw e;
    }
}

/**
 * Writes an output message.
 *
 * @param {any} msg The message to write.
 */
export function write(msg: any): void {
    process.stdout.write(
        toStringSafe(msg)
    );
}

/**
 * Writes an (optional) output message and adds a new line.
 *
 * @param {any} [msg] The (optional) message to write.
 */
export function writeLine(msg: any = ''): void {
    process.stdout.write(
        toStringSafe(msg) + os.EOL
    );
}
