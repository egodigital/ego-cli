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
import * as cron from 'cron';
import * as fs from 'fs-extra';
import * as path from 'path';
import { CommandBase, CommandExecuteContext, JobScriptModule } from '../../contracts';
import { EOL } from 'os';
import { getShellScriptExtension } from '../../scripts';
import { asArray, getEGOFolder, toStringSafe, waitForEnter, writeErrLine, writeLine, spawnAsync } from '../../util';


/**
 * Job command.
 */
export class EgoCommand extends CommandBase {
    /** @inheritdoc */
    public readonly description = "Executes one or more scripts periodically.";

    /** @inheritdoc */
    public async execute(ctx: CommandExecuteContext): Promise<void> {
        const ARGS = asArray(ctx.args['_'])
            .map(x => toStringSafe(x))
            .filter(x => '' !== x);

        if (ARGS.length < 1) {
            console.warn('Define at least one script file, which should be executed!');

            ctx.exit(1);
        }

        if (ARGS.length < 2) {
            console.warn('Define the period (cron tab), the script(s) should be executed in!');

            ctx.exit(2);
        }

        let cronTab = toStringSafe(ARGS[ARGS.length - 1])
            .trim();
        if ('' === cronTab) {
            cronTab = '0 * * * * *';
        }

        const SCRIPT_FILES = ARGS.slice(0, ARGS.length - 1);

        const APPEND_SCRIPT_EXTENSION = (filePath: string) => {
            if (!filePath.endsWith(getShellScriptExtension())) {
                if (!filePath.endsWith('.js')) {
                    filePath += '.js';
                }
            }

            return filePath;
        };

        const JOBS: cron.CronJob[] = [];
        SCRIPT_FILES.forEach(sf => {
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

            let jobAction: () => Promise<void>;
            if (scriptFile.endsWith(getShellScriptExtension())) {
                jobAction = async () => {
                    await this._executeShellScript(ctx, scriptFile);
                };
            } else {
                jobAction = async () => {
                    await this._executeScriptFile(ctx, scriptFile);
                };
            }

            let isExecuting = false;
            const NEW_JOB = new cron.CronJob(
                cronTab,
                // onTick
                () => {
                    if (isExecuting) {
                        return;
                    }

                    isExecuting = true;
                    jobAction().catch((err) => {
                        writeErrLine(err);
                    }).finally(() => {
                        isExecuting = false;
                    });
                },
                null,  // onComplete
                true,  // start
                null,  // timeZone
                null,  // context
                false,  // runOnInit
            );

            JOBS.push(NEW_JOB);
        });

        await waitForEnter(`Press <ENTER> to stop ...${EOL}`);

        JOBS.forEach(j => {
            if (j.running) {
                j.stop();
            }
        });

        ctx.exit();
    }

    /** @inheritdoc */
    public async showHelp(): Promise<void> {
        writeLine(`Examples:    ego job my-job.js "0 * * * * *"`);
        writeLine(`             ego job my-job  "* */15 * * * *"`);
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
    exports.execute = async (context) => {
        // context  =>  s. https://egodigital.github.io/ego-cli/interfaces/_contracts_.commandexecutecontext.html

        // context.args            =>  List of command line arguments, s. https://www.npmjs.com/package/minimist
        // context.cwd             =>  The full path of the current working directory
        // context.getFullPath()   =>  Returns the full version of a path, based on the value of 'cwd'
        // context.package         =>  The 'package.json' file of the e.GO CLI
        // context.queue           =>  A queue, that only executes 1 action at the same time, s. https://www.npmjs.com/package/p-queue
        // context.require()       =>  Allows to include a NPM module of the e.GO CLI
        // context.values          =>  A key/value pair storage, that is available while the execution
        // context.verbose         =>  Indicates, if script should output additional information or not

        // docker utils, s. https://egodigital.github.io/ego-cli/modules/_docker_.html
        const docker = context.require('./docker');
        // git utils, s. https://egodigital.github.io/ego-cli/modules/_git_.html
        const git = context.require('./git');
        // common app utils, s. https://egodigital.github.io/ego-cli/modules/_util_.html
        const util = context.require('./util');

        util.writeLine('Hello, from ' + __filename);
    };
`,
                {
                    language: 'javascript',
                }
            )
        );
    }

    /** @inheritdoc */
    public readonly syntax = '[JOB_FILE+] CRON_TAB';


    private async _executeShellScript(
        ctx: CommandExecuteContext, scriptFile: string
    ) {
        await spawnAsync(
            scriptFile,
            [],
            {
                cwd: ctx.cwd,
            }
        );
    }

    private async _executeScriptFile(
        ctx: CommandExecuteContext, scriptFile: string
    ) {
        delete require.cache[scriptFile];

        const SCRIPT_MODULE: JobScriptModule = require(scriptFile);
        if (SCRIPT_MODULE) {
            const EXECUTE = SCRIPT_MODULE.execute;
            if (EXECUTE) {
                await Promise.resolve(
                    EXECUTE.apply(SCRIPT_MODULE, [ctx])
                );
            }
        }
    }
}
