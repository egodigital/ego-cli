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
import * as fs from 'fs-extra';
import * as path from 'path';
import { Storage, STORAGE_FILE } from './contracts';
import { getEGOFolder, sortObjectByKeys } from './util';


/**
 * Returns the current content of the storage.
 *
 * @return {Storage} The storage.
 */
export function getStorage(): Storage {
    return sortObjectByKeys(
        JSON.parse(
            fs.readFileSync(
                getStorageFile(), 'utf8'
            )
        )
    );
}

/**
 * Returns the possible storage file path inside the '.ego' folder, inside the user's home directory.
 *
 * @param {boolean} [create] Create file, if it does not exist.
 *
 * @return {string} The full path of the storage file.
 */
export function getStorageFile(create = true): string {
    const STORAGE_FILE_PATH = path.resolve(
        path.join(
            getEGOFolder(), STORAGE_FILE
        )
    );

    if (create) {
        let storageContent: any = false;

        if (fs.existsSync(STORAGE_FILE_PATH)) {
            const CURRENT_CONTENT = JSON.parse(
                fs.readFileSync(
                    STORAGE_FILE_PATH,
                    'utf8',
                )
            );

            if (!_.isObjectLike(CURRENT_CONTENT)) {
                storageContent = {};
            }
        } else {
            storageContent = {};
        }

        if (false !== storageContent) {
            fs.writeFileSync(
                STORAGE_FILE_PATH,
                JSON.stringify(storageContent),
                'utf8',
            );
        }
    }

    return STORAGE_FILE_PATH;
}
