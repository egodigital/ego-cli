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

import { CommandBase } from '../../contracts';


/**
 * New command.
 */
export class Command extends CommandBase {
    /** @inheritdoc */
    public async execute(): Promise<void> {
        console.log('Hello, new!');
    }
}
