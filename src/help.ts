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

import { PackageJSON } from './contracts';
import { writeLine } from './util';


/**
 * Shows the common help screen.
 *
 * @param {PackageJSON} The app information.
 */
export function showHelp(app: PackageJSON) {
    writeLine(`Version ${app.version}`);
    writeLine(`Syntax:    ego COMMAND [options]`);
    writeLine();

    writeLine(`General options:`);
    writeLine(` -h, --help     # Prints this info and help screen`);
    writeLine(` -v, --version  # Prints the version of that app`);
    writeLine();

    writeLine(`Examples:    ego new`);
    writeLine(`             ego help new`);
}
