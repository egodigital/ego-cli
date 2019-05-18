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
import { asArray, compareValuesBy, getCWD, spawn, WithCWD } from './util';


/**
 * Options for 'getGitBranches()' function.
 */
export interface GetGitBranchesOptions extends WithCWD {
}

/**
 * Options for 'getGitRemotes()' function.
 */
export interface GetGitRemotesOptions extends WithCWD {
}


/**
 * Lists all branches of a git repository.
 *
 * @param {GetGitBranchesOptions} [opts] Custom options.
 *
 * @return {string[]} The list of branches.
 */
export function getGitBranches(opts?: GetGitBranchesOptions): string[] {
    if (_.isNil(opts)) {
        opts = {} as any;
    }

    return asArray(
        spawn(
            'git', ['branch'],
            {
                cwd: getCWD(opts),
                stdio: null,
            }
        ).output
    ).map((x) => {
        return x.split('\n');
    }).reduce((x, y) => {
        return x.concat(y);
    }).sort((x, y) => {
        return compareValuesBy(x, y, (i) => {
            return i.trim()
                .startsWith('* ') ? 0 : 1;
        });
    }).map(b => {
        b = b.trim();
        if (b.startsWith('*')) {
            b = b.substr(1)
                .trim();
        }

        return b;
    }).filter(b => '' !== b);
}

/**
 * Lists all remotes of a git repository.
 *
 * @param {GetGitRemotesOptions} [opts] Custom options.
 *
 * @return {string[]} The list of remotes.
 */
export function getGitRemotes(opts?: GetGitRemotesOptions): string[] {
    if (_.isNil(opts)) {
        opts = {} as any;
    }

    return asArray(
        spawn(
            'git', ['remote'],
            {
                cwd: getCWD(opts),
                stdio: null,
            }
        ).output
    ).map((x) => {
        return x.split('\n');
    }).reduce((x, y) => {
        return x.concat(y);
    }).sort((x, y) => {
        return compareValuesBy(x, y, (i) => {
            return 'origin' === i.trim()
                ? 0 : 1;
        });
    }).map(r => {
        return r.trim();
    }).filter(r => '' !== r);
}
