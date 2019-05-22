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
import * as os from 'os';
import * as path from 'path';
import * as sanitizeFilename from 'sanitize-filename';
import { spawn, toStringSafe } from './util';


/**
 * Tries to executes a command as bash script.
 *
 * @param {any} commandName The name of the command.
 * @param {any[]} args The list of arguments for the script.
 *
 * @return {boolean} A shell script has been executed or not.
 */
export function executeShellScriptCommand(
    commandName: any, args: any[]
): boolean {
    commandName = sanitizeFilename(
        toStringSafe(commandName)
            .trim()
    );

    if ('' !== commandName) {
        let scriptExt = 'sh';
        if ('win32' === process.platform) {
            scriptExt = 'cmd';
        }

        // ${HOME_DIR}/.ego/${commandName}.${scriptExt}
        const SCRIPT_FILE = path.resolve(
            path.join(
                os.homedir(), '.ego', commandName + '.' + scriptExt
            )
        );
        if (fs.existsSync(SCRIPT_FILE)) {
            const STAT = fs.statSync(SCRIPT_FILE);
            if (STAT.isFile()) {
                spawn(SCRIPT_FILE, args, {
                    cwd: process.cwd(),
                    env: process.env,
                });

                return true;
            }
        }
    }

    return false;
}
