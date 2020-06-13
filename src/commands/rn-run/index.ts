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
import { CommandBase, CommandExecuteContext } from '../../contracts';
import { getSTDIO, spawnAsync, toStringSafe, withSpinnerAsync, writeLine } from '../../util';

/**
 * Rn-Run command.
 */
export class EgoCommand extends CommandBase {
    /** @inheritdoc */
    public readonly description = "Runs the current React Native project.";

    /** @inheritdoc */
    public async execute(ctx: CommandExecuteContext): Promise<void> {
        let android: boolean = false;
        let iOS: boolean = false;

        // first get defaults
        const DEFAULT_TARGETS = toStringSafe(ctx.get('react_native_targets'))
            .split(',')
            .map(x => x.toLowerCase().trim());
        for (const DT of DEFAULT_TARGETS) {
            switch (DT) {
                case 'a':
                case 'android':
                    android = true;
                    break;

                case 'i':
                case 'ios':
                    iOS = true;
                    break;
            }
        }

        if (
            (!_.isNil(ctx.args['a']) || !_.isNil(ctx.args['android'])) &&
            (!_.isNil(ctx.args['i']) || !_.isNil(ctx.args['ios']))
        ) {
            // use CLI arguments

            android = ctx.args['a'] ||
                ctx.args['android'];

            iOS = ctx.args['i'] ||
                ctx.args['ios'];
        }

        if (!android && !iOS) {
            // default by operation system

            switch (process.platform) {
                case 'darwin':
                    iOS = true;
                    break;

                default:
                    android = true;
                    break;
            }
        }

        if (iOS) {
            await withSpinnerAsync(`Opening app on iOS ...`, async (spinner) => {
                try {
                    await spawnAsync('npx', ['react-native', 'run-ios'], {
                        cwd: ctx.cwd,
                        stdio: getSTDIO(ctx),
                    });

                    spinner.text = `App opened on iOS`;
                } catch (error) {
                    spinner.fail(`Could not open app on iOS. (Error: ${error.message}`);
                }
            });
        }

        if (android) {
            await withSpinnerAsync(`Opening app on Android ...`, async (spinner) => {
                try {
                    await spawnAsync('npx', ['react-native', 'run-android'], {
                        cwd: ctx.cwd,
                        stdio: getSTDIO(ctx),
                    });

                    spinner.text = `App opened on Android`;
                } catch (error) {
                    spinner.fail(`Could not open app on Android. (Error: ${error.message}`);
                }
            });
        }
    }

    /** @inheritdoc */
    public async showHelp(): Promise<void> {
        writeLine(`Options:`);
        writeLine(` -a, --android  # Opens app on Android.`);
        writeLine(` -i, --ios      # Opens app on iOS.`);
        writeLine(` -v, --verbose  # Verbose output.`);
        writeLine();

        writeLine(`Config:`);
        writeLine(` react_native_targets   # A comma separated list of default targets.`);
        writeLine(`                        # Example: ios,android`);
        writeLine();

        writeLine(`Examples:  ego rn-run --ios`);
        writeLine(`           ego rn-run -ia`);
    }
}
