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

import got from 'got';
import { CommandBase, CommandExecuteContext } from '../../contracts';
import { eGO, spawn, toStringSafe, withSpinnerAsync, writeLine } from '../../util';


/**
 * Create command
 */
export class EgoCommand extends CommandBase {
    /** @inheritdoc */
    public readonly description = `Runs an ${eGO('e.GO')} creator module on npm`;

    /** @inheritdoc */
    public async execute(ctx: CommandExecuteContext): Promise<void> {
        const MODULE_NAME = toStringSafe(ctx.args['_'][0])
            .toLowerCase()
            .trim();
        if ('' === MODULE_NAME) {
            console.warn('Please define the module name, you would like to execute!');

            ctx.exit(1);
        }

        const EGO_MODULE_NAME = `@egodigital/create-${MODULE_NAME}`;
        const ALTERNATIVE_NAME = `create-${MODULE_NAME}`;

        let moduleToExecute = EGO_MODULE_NAME;

        await withSpinnerAsync(`Checking for module '${EGO_MODULE_NAME}' ...`, async (spinner) => {
            const RESPONSE = await got.get(`https://registry.npmjs.org/${EGO_MODULE_NAME}`, {
                throwHttpErrors: false
            });

            switch (RESPONSE.statusCode) {
                case 200:
                    spinner.succeed(`Found module '${EGO_MODULE_NAME}'.`)
                    break;

                case 404:
                    moduleToExecute = ALTERNATIVE_NAME;
                    spinner.warn(`Did not find module '${EGO_MODULE_NAME}', try ${ALTERNATIVE_NAME}...`);
                    break;

                default:
                    spinner.fail(`Unexpected response '${RESPONSE.statusCode}': ${RESPONSE.body}`);
                    ctx.exit(2);
                    break;
            }
        });

        const MODULE_ARGS = [
            moduleToExecute
        ].concat(ctx.rawArgs.slice(1));

        spawn('npx', MODULE_ARGS, {
            stdio: 'inherit'
        });
    }

    /** @inheritdoc */
    public async showHelp(): Promise<void> {
        writeLine(`Examples:  ego create react-app my-web-app`);
        writeLine(`           ego create react-app-native my-mobile-app --template typescript`);
    }

    /** @inheritdoc */
    public readonly syntax = 'MODULE_NAME [ARGS*]';
}
