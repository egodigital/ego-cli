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
import * as path from 'path';
import { CommandBase, CommandExecuteContext, CommandScriptModule, } from '../../contracts';
import { asArray, exists, getEGOFolder, toStringSafe, writeLine } from '../../util';


/**
 * Run command.
 */
export class EgoCommand extends CommandBase {
    /** @inheritdoc */
    public readonly description = "Runs one or more Node.js based script file(s).";

    /** @inheritdoc */
    public async execute(ctx: CommandExecuteContext): Promise<void> {
        const SCRIPT_FILES = asArray(ctx.args['_'])
            .map(x => toStringSafe(x))
            .filter(x => '' !== x.trim());

        if (!SCRIPT_FILES.length) {
            console.warn('Define at least one script file, which should be executed!');

            ctx.exit(1);
        }

        for (const SF of SCRIPT_FILES) {
            let scriptPath = SF;
            if (!path.isAbsolute(scriptPath)) {
                let newScriptPath = path.join(
                    ctx.cwd, scriptPath
                );
                if (!newScriptPath.endsWith('.js')) {
                    newScriptPath += '.js';
                }

                if (!(await exists(newScriptPath))) {
                    // try from '.ego' folder

                    newScriptPath = path.join(
                        getEGOFolder(), scriptPath
                    );
                }

                scriptPath = newScriptPath;
            }
            scriptPath = require.resolve(scriptPath);

            if (!scriptPath.endsWith('.js')) {
                scriptPath += '.js';
            }

            delete require.cache[scriptPath];

            const SCRIPT_MODULE: CommandScriptModule = require(scriptPath);
            if (SCRIPT_MODULE) {
                const EXECUTE = SCRIPT_MODULE.execute;
                if (EXECUTE) {
                    const EXIT_CODE = parseInt(
                        toStringSafe(
                            await Promise.resolve(
                                EXECUTE.apply(SCRIPT_MODULE, [ctx])
                            )
                        ).trim()
                    );

                    if (!isNaN(EXIT_CODE)) {
                        ctx.exit(EXIT_CODE);
                    }
                }
            }
        }
    }

    /** @inheritdoc */
    public async showHelp(): Promise<void> {
        writeLine(`Examples:    ego run my-script.js`);
        writeLine(`             ego run my-script`);
        writeLine();
        writeLine(`Relative paths will be mapped to the current working directory or the '.ego' subfolder inside the user's home directory.`);
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
    public readonly syntax = 'SCRIPT_FILE+';
}
