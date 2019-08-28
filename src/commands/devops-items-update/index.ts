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
import * as got from 'got';
import { CommandBase, CommandExecuteContext } from '../../contracts';
import { asArray, colorize, toStringSafe, withSpinnerAsync, writeLine } from '../../util';

interface ListWorkItemsResult {
    "count": number;
    "value": [
        {
            "commentVersionRef": {
                "commentId": number;
                "url": string;
                "version": number;
            };
            "fields": {
                "Microsoft.VSTS.Common.StateChangeDate": string;
                "System.AreaPath": string;
                "System.AssignedTo": {
                    "_links": {
                        "avatar": {
                            "href": string;
                        };
                    };
                    "descriptor": string;
                    "displayName": string;
                    "id": string;
                    "imageUrl": string;
                    "uniqueName": string;
                    "url": string;
                };
                "System.BoardColumn": string;
                "System.BoardColumnDone": boolean;
                "System.ChangedBy": {
                    "_links": {
                        "avatar": {
                            "href": string;
                        };
                    };
                    "descriptor": string;
                    "displayName": string;
                    "id": string;
                    "imageUrl": string;
                    "uniqueName": string;
                    "url": string;
                };
                "System.ChangedDate": string;
                "System.CommentCount": number;
                "System.CreatedBy": {
                    "_links": {
                        "avatar": {
                            "href": string;
                        };
                    };
                    "descriptor": string;
                    "displayName": string;
                    "id": string;
                    "imageUrl": string;
                    "uniqueName": string;
                    "url": string;
                };
                "System.CreatedDate": string;
                "System.Description": string;
                "System.History": string;
                "System.IterationPath": string;
                "System.Reason": string;
                "System.State": string;
                "System.TeamProject": string;
                "System.Title": string;
                "System.WorkItemType": string;
            };
            "id": number;
            "rev": number;
            "url": string;
        }
    ];
}

/**
 * Devops-Items-Update command.
 */
export class EgoCommand extends CommandBase {
    /** @inheritdoc */
    public readonly description = "Updates one or more Azure DevOps work items.";

    /** @inheritdoc */
    public async execute(ctx: CommandExecuteContext): Promise<void> {
        // DevOps user
        const USER = toStringSafe(ctx.get('devops_user'))
            .toLowerCase()
            .trim();
        if ('' === USER) {
            console.warn(`Please setup ${colorize('devops_user')} config value, by executing ${colorize('ego set devops_user "tanja.m"')}`);

            ctx.exit(1);
        }

        // Personal Access Token
        const PAT = toStringSafe(ctx.get('devops_pat'))
            .trim();
        if ('' === PAT) {
            console.warn(`Please setup ${colorize('devops_pat')} config value, by executing ${colorize('ego set devops_pat "xyz"')}`);

            ctx.exit(2);
        }

        // organization
        const ORG = toStringSafe(ctx.get('devops_org'))
            .trim();
        if ('' === ORG) {
            console.warn(`Please setup ${colorize('devops_org')} config value, by executing ${colorize('ego set devops_org "microsoft"')}`);

            ctx.exit(3);
        }

        // new state
        let state = toStringSafe(
            ctx.args['s']
        ).trim();
        if ('' === state) {
            state = toStringSafe(
                ctx.args['state']
            ).trim();
        }

        // new user, the item should be assigned to
        let assignedTo = toStringSafe(
            ctx.args['a']
        ).trim();
        if ('' === assignedTo) {
            assignedTo = toStringSafe(
                ctx.args['assign-to']
            ).trim();
        }

        // work item IDs
        const ID_LIST = asArray(ctx.args['_'])
            .map(x => parseInt(toStringSafe(x).trim()))
            .filter(x => !isNaN(x) && x);

        if (!ID_LIST.length) {
            console.warn(`Please define at least one ID of a work item!`);

            ctx.exit(4);
        }

        for (const ID of ID_LIST) {
            await withSpinnerAsync(`Updating work item ${ID} ...`, async (spinner) => {
                try {
                    const RESPONSE = await got.get(`https://dev.azure.com/${
                        encodeURIComponent(ORG)
                        }/_apis/wit/workitems?ids=${
                        encodeURIComponent(ID.toString())
                        }&api-version=5.1`, {
                            headers: {
                                'Authorization': `Basic ${Buffer.from(`${USER}:${PAT}`, 'utf8').toString('base64')}`,
                            },
                        });

                    if (200 === RESPONSE.statusCode) {
                        const WORK_ITEMS: ListWorkItemsResult = JSON.parse(
                            RESPONSE.body
                        );

                        if (WORK_ITEMS.count) {
                            for (const V of WORK_ITEMS.value) {
                                const OPERATIONS: any[] = [];

                                if ('' !== state) {
                                    OPERATIONS.push({
                                        "op": "replace",
                                        "path": "/fields/System.State",
                                        "value": state,
                                    });
                                }

                                if ('' !== assignedTo) {
                                    OPERATIONS.push({
                                        "op": "replace",
                                        "path": "/fields/System.AssignedTo",
                                        "value": assignedTo,
                                    });
                                }

                                if (OPERATIONS.length) {
                                    const UPDATE_RESPONSE = await got.patch(
                                        `https://dev.azure.com/${
                                        encodeURIComponent(ORG)
                                        }/_apis/wit/workitems/${
                                        encodeURIComponent(V.id.toString())
                                        }?api-version=5.1`,
                                        {
                                            headers: {
                                                'Authorization': `Basic ${Buffer.from(`${USER}:${PAT}`, 'utf8').toString('base64')}`,
                                                'Content-type': 'application/json-patch+json',
                                            },
                                            body: JSON.stringify(OPERATIONS),
                                            throwHttpErrors: false,
                                        }
                                    );

                                    if (200 === UPDATE_RESPONSE.statusCode) {
                                        spinner.text = `Work item ${ID} updated`;
                                    } else {
                                        // failed

                                        spinner.fail(`Unexpected response for work item ${ID}: [${UPDATE_RESPONSE.statusCode}] '${UPDATE_RESPONSE.statusMessage}'

${
                                            cliHighlight.highlight(
                                                JSON.stringify(
                                                    JSON.parse(UPDATE_RESPONSE.body), null, 2
                                                ),
                                                {
                                                    "language": "javascript"
                                                }
                                            )
                                            }`);
                                    }
                                } else {
                                    spinner.text = `Work item ${ID} updated`;
                                }
                            }
                        } else {
                            spinner.warn(`Empty result for work item ${ID}!`);
                        }
                    } else {
                        spinner.fail(`Unexpected response for work item ${ID}: [${RESPONSE.statusCode}] '${RESPONSE.statusMessage}'`);
                    }
                } catch (e) {
                    spinner.fail(`Could not update work item ${ID}: '${toStringSafe(e)}'`);
                }
            });
        }
    }

    /** @inheritdoc */
    public async showHelp(): Promise<void> {
        writeLine(`Options:`);
        writeLine(` -a, --assign-to  # Sets the new user, the item should be assigned to.`);
        writeLine(` -s, --state      # The name of the new state, like 'Active'.`);
        writeLine();

        writeLine(`Config:`);
        writeLine(` devops_org   # The name of the organization,`);
        writeLine(` devops_pat   # The Personal Access Token for accessing the API.`);
        writeLine(` devops_user  # The Azure DevOps user name.`);
        writeLine();

        writeLine(`Examples:    ego devops-items-update 23979 --state=Active`);
        writeLine(`             ego devops-items-update 5979 --assigned-to="Marcel Kloubert" --state=Active`);
    }

    /** @inheritdoc */
    public readonly syntax = '[WORK_ITEM_ID]+ [options]';
}
