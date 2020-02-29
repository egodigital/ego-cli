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
import * as open from 'open';
import { CommandBase, CommandExecuteContext } from '../../contracts';
import { getCurrentGitBranch, getGitRemotes, getGitRemoteUrl, hasGitChanges } from '../../git';
import { getSTDIO, spawnAsync, withSpinnerAsync, writeLine, toStringSafe } from '../../util';

interface RemoteInfo {
    name: string;
    repository: false | RepositoryDetails;
    url: string;
}

interface RepositoryDetails {
    name: string;
    organization: string;
    project: string;
}

const REGEX_HTTP_URL = /(https\:\/\/)([^\.]+)(\.)(visualstudio\.com)(\/)([^\/]+)(\/)(_git)(\/)([\S]+)/i;
const REGEX_SSH_URL = /([^@]+)(@)([^\:]+)(\:)([^\/]+)(\/)([^\/]+)(\/)([^\/]+)(\/)([\S]+)/i;

/**
 * Pull-Request command.
 */
export class EgoCommand extends CommandBase {
    /** @inheritdoc */
    public readonly description = "Starts a pull request (Azure DevOps) for the branch of the current git repository.";

    /** @inheritdoc */
    public async execute(ctx: CommandExecuteContext): Promise<void> {
        const IGNORE_CHANGES = ctx.args['i'] ||
            ctx.args['ignore-changes'];

        if (!IGNORE_CHANGES) {
            if (hasGitChanges(ctx)) {
                console.warn(`Repository has uncommited changes!`);

                ctx.exit(1);
            }
        }

        // target branch
        let targetBranch = toStringSafe(ctx.args['t'])
            .trim();
        if ('' === targetBranch) {
            targetBranch = toStringSafe(ctx.args['target'])
                .trim();
        }
        if ('' === targetBranch) {
            // try get default from config
            targetBranch = toStringSafe(ctx.get('default_target_branch'))
                .trim();
        }
        if ('' === targetBranch) {
            // default
            targetBranch = 'master';
        }

        const NO_PUSH = ctx.args['np'] ||
            ctx.args['no-push'];

        // current / source branch
        let srcBranch: string;
        await withSpinnerAsync('Detecting current branch ...', async (spinner) => {
            srcBranch = getCurrentGitBranch({
                cwd: ctx.cwd,
                verbose: ctx.verbose,
            });

            if (srcBranch === targetBranch) {
                spinner.warn('Same branch!');

                ctx.exit(2);
            }

            spinner.text = `Branch: '${srcBranch}'`;
        });

        // loading remotes
        let remotes: string[];
        await withSpinnerAsync('Loading remotes ...', async (spinner) => {
            remotes = getGitRemotes({
                cwd: ctx.cwd,
                verbose: ctx.verbose,
            });

            spinner.text = remotes.length + ' remote(s) found';
        });

        // get repository details
        const REMOTES_WITH_URLS: RemoteInfo[] = [];
        for (let i = 0; i < remotes.length; i++) {
            const R = remotes[i];

            await withSpinnerAsync(`Getting remote URL of '${R}' (${i + 1} / ${remotes.length}) ...`, async (spinner) => {
                const REMOTE_URL = getGitRemoteUrl(R, {
                    cwd: ctx.cwd,
                    verbose: ctx.verbose,
                });

                if (false === REMOTE_URL) {
                    spinner.warn(`Could not get remote URL of '${R}' (${i + 1} / ${remotes.length})!`);
                } else {
                    const NEW_ENTRY: RemoteInfo = {
                        name: R,
                        repository: false,
                        url: REMOTE_URL,
                    };

                    const SSH = REGEX_SSH_URL.exec(NEW_ENTRY.url);
                    if (null === SSH) {
                        const HTTP = REGEX_HTTP_URL.exec(NEW_ENTRY.url);
                        if (null !== HTTP) {
                            // HTTP URL

                            NEW_ENTRY.repository = {
                                name: decodeURIComponent(HTTP[10]).trim(),
                                organization: decodeURIComponent(HTTP[2]),
                                project: decodeURIComponent(HTTP[6]),
                            };
                        }
                    } else {
                        // SSH URL

                        NEW_ENTRY.repository = {
                            name: decodeURIComponent(SSH[11]),
                            organization: decodeURIComponent(SSH[7]),
                            project: decodeURIComponent(SSH[9]),
                        };
                    }

                    if (false !== NEW_ENTRY.repository) {
                        // has enough information
                        REMOTES_WITH_URLS.push(NEW_ENTRY);
                    }

                    spinner.text = `Remote URL of '${R}' got (${i + 1} / ${remotes.length})`;
                }
            });
        }

        // push to remotes?
        if (!NO_PUSH) {
            for (let i = 0; i < REMOTES_WITH_URLS.length; i++) {
                const R = REMOTES_WITH_URLS[i];

                await withSpinnerAsync(`Pushing to '${R.name}' (${i + 1} / ${REMOTES_WITH_URLS.length}) ...`, async (spinner) => {
                    await spawnAsync('git', ['push', R.name, srcBranch], {
                        cwd: ctx.cwd,
                        stdio: getSTDIO(ctx),
                    });

                    spinner.text = `Pushed to '${R.name}' (${i + 1} / ${REMOTES_WITH_URLS.length})`;
                });
            }
        }

        // open in browser
        for (let i = 0; i < REMOTES_WITH_URLS.length; i++) {
            const R = REMOTES_WITH_URLS[i];
            const REPO_DETAILS = R.repository as RepositoryDetails;

            await withSpinnerAsync(`Opening pull request in browser for '${R.name}' (${i + 1} / ${REMOTES_WITH_URLS.length}) ...`, async (spinner) => {
                const WEB_URL = `https://${
                    encodeURIComponent(REPO_DETAILS.organization)
                    }.visualstudio.com/${
                    encodeURIComponent(REPO_DETAILS.project)
                    }/_git/${
                    encodeURIComponent(REPO_DETAILS.name)
                    }/pullrequestcreate?sourceRef=${
                    encodeURIComponent(srcBranch)
                    }&targetRef=${
                    encodeURIComponent(targetBranch)
                    }`;

                await open(WEB_URL, {
                    wait: false,
                });

                spinner.text = `Pull request for '${R.name}' opened (${i + 1} / ${REMOTES_WITH_URLS.length})`;
            });
        }
    }

    /** @inheritdoc */
    public async showHelp(): Promise<void> {
        writeLine(`Options:`);
        writeLine(` -i, --ignore-changes  # Ignore uncommited local changes or not. Default: (false)`);
        writeLine(` -np, --no-push        # Indicates NOT pushing local changes to remote. Default: (false)`);
        writeLine(` -t, --target          # The name of the target branch. Default: master`);
        writeLine(` -v, --verbose         # Verbose output.`);
        writeLine();

        writeLine(`Config:`);
        writeLine(` default_target_branch   # The name of the default target branch.`);
        writeLine();

        writeLine(`Examples:   ego pull-request`);
        writeLine(`            ego pull-request --target=dev`);
        writeLine(`            ego pull-request --no-push --target=stage`);
    }
}
