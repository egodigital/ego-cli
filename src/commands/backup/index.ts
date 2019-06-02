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
import * as path from 'path';
import { CommandBase, CommandExecuteContext } from '../../contracts';
import { colorize, exists, getEGOFolder, toStringSafe, withSpinnerAsync, writeLine } from '../../util';


interface DirectoryEntry {
    name: string;
    path: string;
    stat: fs.Stats;
}


/**
 * Backup command.
 */
export class EgoCommand extends CommandBase {
    /** @inheritdoc */
    public readonly description = 'Backups the current directory.';

    /** @inheritdoc */
    public async execute(ctx: CommandExecuteContext): Promise<void> {
        let backupDir = toStringSafe(ctx.get('backup_dir'))
            .trim();
        if ('' === backupDir) {
            console.warn(`Please setup ${colorize('backup_dir')} config value, by executing ${colorize('ego set backup_dir "/target/path/for/backuped/files"')}`);

            ctx.exit(1);
        }

        const BACKUP_SUBFOLDER_NAME = path.basename(
            ctx.cwd
        ).trim();
        if ('' === BACKUP_SUBFOLDER_NAME) {
            console.warn('Cannot backup root folder!');

            ctx.exit(2);
        }

        if (!path.isAbsolute(backupDir)) {
            backupDir = path.join(
                getEGOFolder(), '.backups'
            );
        }

        backupDir = path.join(
            backupDir, BACKUP_SUBFOLDER_NAME
        );

        backupDir = path.resolve(backupDir);

        if (!(await exists(backupDir))) {
            await withSpinnerAsync(`📁 Creating backup folder ${colorize(backupDir)} ...`, async (spinner) => {
                await fs.mkdirs(backupDir);

                spinner.text = `📁 Backup folder ${colorize(backupDir)} created`;
            });
        }

        const STAT = await fs.stat(backupDir);
        if (!STAT.isDirectory()) {
            console.warn('Target is no directory!');

            ctx.exit(3);
        }

        await this._backupFolder(
            ctx,
            ctx.cwd, backupDir
        );

        await withSpinnerAsync(`💯 Finishing ...`, async (spinner) => {
            spinner.text = `💯 All files have been copied to ${colorize(backupDir)}`;
        });
    }

    /** @inheritdoc */
    public async showHelp(): Promise<void> {
        writeLine(`Options:`);
        writeLine(` -d, --dot      # Also backup files and folders with leading dots.`);
        writeLine(` -v, --verbose  # Verbose output.`);
        writeLine();

        writeLine(`Config:`);
        writeLine(` backup_dir   # The path to the target directory.`);
        writeLine(`              # Relative paths will be mapped to the '.ego/.backups' subfolder`);
        writeLine(`              # inside the user's home directory.`);
        writeLine(` backup_dots  # Indicates if also files / files with leading dots`);
        writeLine(`              ä should be handled (true) or not (false).`);
        writeLine();

        writeLine(`Example:    ego backup`);
    }


    private async _backupFolder(
        ctx: CommandExecuteContext,
        src: string, dest: string,
    ) {
        let rootDir = ctx.cwd;

        src = path.resolve(src);
        dest = path.resolve(dest);

        const BACKUP_DOTS = ctx.args['d'] ||
            ctx.args['dot'] ||
            ctx.get('backup_dots');

        // entering directory
        if (ctx.verbose) {
            const REL_SRC_PATH = path.relative(rootDir, src);

            if ('' !== REL_SRC_PATH.trim()) {
                await withSpinnerAsync(`🚪 Entering ${colorize(REL_SRC_PATH)} ...`, async (spinner) => {
                    spinner.text = `🚪 ${colorize(REL_SRC_PATH)} entered`;
                });
            }
        }

        if (!(await exists(dest))) {
            if (ctx.verbose) {
                await withSpinnerAsync(`📁 Creating target directory ...`, async (spinner) => {
                    await fs.mkdirs(dest);

                    spinner.text = `📁 Target directory created`;
                });
            } else {
                await fs.mkdirs(dest);
            }
        }

        const SRC_ENTRIES = await this._scanDir(src, BACKUP_DOTS);
        const DEST_ENTRIES = await this._scanDir(dest, BACKUP_DOTS);

        // extra files and dirs
        {
            for (const DE of DEST_ENTRIES) {
                const SRC_ENTRIES_EXIST = SRC_ENTRIES.map(x => {
                    return this._normalizeFSName(x.name);
                }).indexOf(
                    this._normalizeFSName(DE.name)
                ) > -1;

                if (SRC_ENTRIES_EXIST) {
                    continue;
                }

                const REL_DEST_PATH = path.relative(
                    dest, DE.path
                );

                await withSpinnerAsync(`🧹 Removing extra ${colorize(REL_DEST_PATH)} ...`, async (spinner) => {
                    if (DE.stat.isDirectory()) {
                        await fs.remove(DE.path);
                    } else {
                        await fs.unlink(DE.path);
                    }

                    spinner.text = `🧹 Extra ${colorize(REL_DEST_PATH)} removed`;
                });
            }
        }

        // copy files
        {
            const FILES = SRC_ENTRIES.filter(e => e.stat.isFile());

            for (const F of FILES) {
                let copyFile = true;
                let operationStart = 'Copy';
                let operationFinished = 'copied';

                const DEST_PATH = path.resolve(
                    path.join(dest, F.name)
                );
                if (await exists(DEST_PATH)) {
                    const DEST_STAT = await fs.stat(DEST_PATH);
                    if (DEST_STAT.isFile()) {
                        copyFile = !this._areFilesEqual(F.stat, DEST_STAT);

                        operationStart = 'Update';
                        operationFinished = 'updated';
                    }
                }

                if (copyFile) {
                    const REL_SRC_PATH = path.relative(rootDir, F.path);

                    await withSpinnerAsync(`🚛 ${operationStart} ${colorize(REL_SRC_PATH)} ...`, async (spinner) => {
                        await fs.copy(
                            F.path, DEST_PATH,
                            {
                                overwrite: true,
                            }
                        );

                        await this._applyFileTimes(F.stat, DEST_PATH);

                        spinner.text = `🚛 ${colorize(REL_SRC_PATH)} ${operationFinished}`;
                    });
                }
            }
        }

        // sub directories
        {
            const DIRS = SRC_ENTRIES.filter(e => e.stat.isDirectory());

            for (const D of DIRS) {
                await this._backupFolder(
                    ctx,
                    path.join(src, D.name),
                    path.join(dest, D.name),
                );
            }
        }

        await this._applyFileTimes(
            await fs.stat(src),
            dest
        );
    }

    private async _applyFileTimes(src: fs.Stats, dest: string) {
        try {
            await fs.utimes(
                dest,
                src.atime, src.mtime
            );
        } catch {
            return false;
        }

        return true;
    }

    private _areFilesEqual(src: fs.Stats, dest: fs.Stats) {
        try {
            return src.size === dest.size &&
                src.mtime.getUTCDate() === dest.mtime.getUTCDate();
        } catch {
            return false;
        }
    }

    private _normalizeFSName(name: string) {
        if ('win32' === process.platform) {
            name = name.toLowerCase();
        }

        return name;
    }

    private async _scanDir(dir: string, withDot: boolean): Promise<DirectoryEntry[]> {
        const ENTRIES: DirectoryEntry[] = [];

        for (const ITEM of await fs.readdir(dir)) {
            if (ITEM.trim().startsWith('.')) {
                if (!withDot) {
                    continue;
                }
            }

            const FULL_PATH = path.resolve(
                path.join(dir, ITEM)
            );

            ENTRIES.push({
                name: path.basename(FULL_PATH),
                path: FULL_PATH,
                stat: await fs.stat(FULL_PATH),
            });
        }

        return ENTRIES;
    }
}
