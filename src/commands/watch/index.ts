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
import * as cliHighlight from 'cli-highlight';
import * as chokidar from 'chokidar';
import * as fs from 'fs-extra';
import * as path from 'path';
import * as pQueue from 'p-queue';
import { CommandBase, CommandExecuteContext, WatcherScriptModule } from '../../contracts';
import { EOL } from 'os';
import { getShellScriptExtension } from '../../scripts';
import { asArray, getEGOFolder, toStringSafe, waitForEnter, writeErrLine, writeLine, spawnAsync } from '../../util';


/**
 * Watch command.
 */
export class EgoCommand extends CommandBase {
    /** @inheritdoc */
    public readonly description = "Runs one or more scripts for file changes.";

    /** @inheritdoc */
    public async execute(ctx: CommandExecuteContext): Promise<void> {
        const ARGS = asArray(ctx.args['_'])
            .map(x => toStringSafe(x))
            .filter(x => '' !== x);

        if (ARGS.length < 1) {
            console.warn('Define at least one script file, which should be executed!');

            ctx.exit(1);
        }

        const APPEND_SCRIPT_EXTENSION = (filePath: string) => {
            if (!filePath.endsWith(getShellScriptExtension())) {
                if (!filePath.endsWith('.js')) {
                    filePath += '.js';
                }
            }

            return filePath;
        };

        const WATCH_ACTIONS: ((ev: string, p: string) => Promise<void>)[] = [];
        ARGS.forEach(sf => {
            let scriptFile = sf;
            if (!path.isAbsolute(scriptFile)) {
                let newScriptPath = path.join(
                    ctx.cwd, scriptFile
                );

                newScriptPath = APPEND_SCRIPT_EXTENSION(newScriptPath);

                if (!fs.existsSync(newScriptPath)) {
                    // try from '.ego' folder

                    newScriptPath = path.join(
                        getEGOFolder(), scriptFile
                    );
                }

                scriptFile = newScriptPath;
            }
            scriptFile = require.resolve(scriptFile);

            scriptFile = APPEND_SCRIPT_EXTENSION(scriptFile);

            if (scriptFile.endsWith(getShellScriptExtension())) {
                WATCH_ACTIONS.push(
                    async (ev, p) => {
                        await this._executeShellScript(ctx, scriptFile, ev, p);
                    }
                );
            } else {
                WATCH_ACTIONS.push(
                    async (ev, p) => {
                        await this._executeScriptFile(ctx, scriptFile, ev, p);
                    }
                );
            }
        });

        const WATCHER = chokidar.watch(ctx.cwd, {
            cwd: ctx.cwd,
        });

        let isReady = false;
        const QUEUE = new pQueue({
            autoStart: true,
            concurrency: 1,
        });
        const INVOKE_EVENT = (ev: string, p: string) => {
            if (!isReady) {
                return;
            }

            QUEUE.add(async () => {
                for (const WA of WATCH_ACTIONS) {
                    try {
                        await WA(ev, p);
                    } catch (e) {
                        writeErrLine(e);
                    }
                }
            }).catch((err) => {
                writeErrLine(err);
            });
        };

        WATCHER.on('error', err => {
            writeErrLine(err);
        }).on('add', p => {
            INVOKE_EVENT('file:add', p);
        }).on('change', p => {
            INVOKE_EVENT('file:change', p);
        }).on('unlink', p => {
            INVOKE_EVENT('file:unlink', p);
        }).on('addDir', p => {
            INVOKE_EVENT('dir:add', p);
        }).on('unlinkDir', p => {
            INVOKE_EVENT('dir:unlink', p);
        }).on('ready', () => {
            isReady = true;
        });

        await waitForEnter(`Press <ENTER> to stop ...${EOL}`);

        WATCHER.close();

        ctx.exit();
    }

    /** @inheritdoc */
    public async showHelp(): Promise<void> {
        writeLine(`Examples:    ego watch my-watcher.js`);
        writeLine(`             ego watch my-watcher"`);
        writeLine();
        writeLine(`Relative paths will be mapped to the current working directory or the '.ego' subfolder inside the user's home directory.`);
        writeLine();
        writeLine(`It is also possible to run shell scripts (with .sh or .cmd extension).`);
        writeLine();
        writeLine();

        writeLine(`Example script:`);
        writeLine(
            cliHighlight.highlight(
                `
    exports.execute = async (path, event, context) => {
        // context  =>  s. https://egodigital.github.io/ego-cli/interfaces/_contracts_.commandexecutecontext.html

        // context.args            =>  List of command line arguments, s. https://www.npmjs.com/package/minimist
        // context.cwd             =>  The full path of the current working directory
        // context.getFullPath()   =>  Returns the full version of a path, based on the value of 'cwd'
        // context.package         =>  The 'package.json' file of the e.GO CLI
        // context.queue           =>  A queue, that only executes 1 action at the same time, s. https://www.npmjs.com/package/p-queue
        // context.require         =>  Allows to include a NPM module of the e.GO CLI
        // context.values          =>  A key/value pair storage, that is available while the execution
        // context.verbose         =>  Indicates, if script should output additional information or not

        // docker utils, s. https://egodigital.github.io/ego-cli/modules/_docker_.html
        const docker = context.require('./docker');
        // git utils, s. https://egodigital.github.io/ego-cli/modules/_git_.html
        const git = context.require('./git');
        // common app utils, s. https://egodigital.github.io/ego-cli/modules/_util_.html
        const util = context.require('./util');

        util.writeLine(\`'\${path}' raised the '\${event}' event.\`);
    };
`,
                {
                    language: 'javascript',
                }
            )
        );
    }

    /** @inheritdoc */
    public readonly syntax = '[WATCHER_FILE+]';


    private async _executeShellScript(
        ctx: CommandExecuteContext, scriptFile: string,
        ev: string, p: string,
    ) {
        await spawnAsync(
            scriptFile,
            [p, ev],
            {
                cwd: ctx.cwd,
            }
        );
    }

    private async _executeScriptFile(
        ctx: CommandExecuteContext, scriptFile: string,
        ev: string, p: string,
    ) {
        delete require.cache[scriptFile];

        const SCRIPT_MODULE: WatcherScriptModule = require(scriptFile);
        if (SCRIPT_MODULE) {
            const EXECUTE = SCRIPT_MODULE.execute;
            if (EXECUTE) {
                await Promise.resolve(
                    EXECUTE.apply(SCRIPT_MODULE, [p, ev, ctx])
                );
            }
        }
    }
}
