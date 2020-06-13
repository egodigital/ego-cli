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

import { WebClient } from '@slack/web-api';
import { CommandBase, CommandExecuteContext } from '../../contracts';
import { colorize, toStringSafe, withSpinnerAsync, writeLine } from '../../util';


/**
 * Slack-Post command.
 */
export class EgoCommand extends CommandBase {
    /** @inheritdoc */
    public readonly description = 'Posts a message to one or more Slack channels.';

    /** @inheritdoc */
    public async execute(ctx: CommandExecuteContext): Promise<void> {
        const MESSAGE = toStringSafe(ctx.args['_'][0])
            .trim();
        if ('' === MESSAGE) {
            console.warn(`Please define a message!`);

            ctx.exit(1);
        }

        let slackToken = toStringSafe(ctx.args['t'])
            .trim();
        if ('' === slackToken) {
            slackToken = toStringSafe(ctx.args['token'])
                .trim();
            if ('' === slackToken) {
                slackToken = toStringSafe(ctx.get('slack_token'))
                    .trim();
            }
        }

        if ('' === slackToken) {
            console.warn(`Please setup ${colorize('slack_token')} config value, by executing ${colorize('ego set slack_token "<MY-SLACK-TOKEN>"')}`);

            ctx.exit(2);
        }

        let channelList = toStringSafe(ctx.args['c'])
            .trim();
        if ('' === channelList) {
            channelList = toStringSafe(ctx.args['channels'])
                .trim();
        }

        const CHANNELS: string[] = channelList.split(',').map(c => {
            return c.trim();
        }).filter(c => '' !== c);

        const SLACK_CLIENT = new WebClient(slackToken);

        for (const C of CHANNELS) {
            await withSpinnerAsync(`Posting message to Slack channel '${C}' ...`, async (spinner) => {
                try {
                    await SLACK_CLIENT.chat.postMessage({
                        channel: C,
                        text: MESSAGE,
                    });

                    spinner.text = `Posted message to Slack channel '${C}'`;
                } catch (e) {
                    spinner.fail(`Posting message to Slack '${C}' failed: '${toStringSafe(e)}'`);
                }
            });
        }
    }

    /** @inheritdoc */
    public async showHelp(): Promise<void> {
        writeLine(`Options:`);
        writeLine(` --c, --channels  # One or more channels to post to, separated by commas.`);
        writeLine(` --t, --token     # The custom token of the (bot) user for the Slack Web API.`);
        writeLine();

        writeLine(`Config:`);
        writeLine(` slack_token  # The token of the (bot) user for the Slack Web API.`);
        writeLine();

        writeLine(`Example:  ego slack-post "Hello, e.GO" --channels=ABCDEFGHI,JKLMNOPQR`);
    }

    /** @inheritdoc */
    public readonly syntax = 'MESSAGE [options]';
}
