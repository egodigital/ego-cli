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

import { CommandBase, CommandExecuteContext } from '../../contracts';
import { writeLine, writeErrLine } from '../../util';
import * as lib from 'http';


/**
 * chuck command
 */
export class EgoCommand extends CommandBase {
    /** @inheritdoc */
    public readonly description = 'Print a random Chuck Norris joke. Jep it is true! Just try it 😎';

    /** @inheritdoc */
    public async execute(context: CommandExecuteContext): Promise<void> {
        let url = "http://api.icndb.com/jokes/";

        if (context.args['i'] || context.args['id']) {
            const id = context.args.i ? context.args.i : context.args.id;
            if (!isNaN(parseFloat(id)) && isFinite(id)) {
                url += "" + id;
            } else {
                writeErrLine("DUDE! You have to input a number like in this example: ego chuck -i 104");

                context.exit(1);
            }
        } else {
            url += "random";
        }

        if (context.args['n'] || context.args['name']) {
            const name: string = (context.args.n ? context.args.n : context.args.name) + "";
            const split = name.split('-');
            if (split.length === 2) {
                url += '?firstName=' + encodeURIComponent(split[0]) + "&lastName=" + encodeURIComponent(split[1]);
                url += "&escape=javascript";
            } else if (split.length === 1 && split[0].length > 1) {
                url += '?firstName=' + encodeURIComponent(split[0]) + "&lastName= ";
                url += "&escape=javascript";
            } else {
                writeErrLine("DUDE! We need a fist AND a last name! Divided by \"-\" i.e. ego chuck -n Ole-Mustermann");

                context.exit(2);
            }
        } else {
            url += "?escape=javascript";
        }

        try {
            let response = JSON.parse(await this.getJoke(url));

            if (response && response.type && response.type === "success") {
                writeLine();
                writeLine("[" + response.value.id + "]");
                writeLine(response.value.joke);
                writeLine();
            } else {
                this.handleError("Invalid Response");
            }
        } catch (error) {
            this.handleError(error);
        }
    }

    /** @inheritdoc */
    public async showHelp(): Promise<void> {
        writeLine(`Options:`);
        writeLine(` -i, --id    # Print a specific joke `);
        writeLine(` -n, --name  # You need a little confidence boost?`);
        writeLine(`               No problem, just write down your name.`);
        writeLine(`               If you provide a first and a last name please divide them by "-".`);
        writeLine();

        writeLine(`Examples:    ego chuck`);
        writeLine(`             ego chuck --name Ole-Mustermann`);
        writeLine(`             ego chuck -n Ole`);
        writeLine(`             ego chuck -i 15`);
        writeLine(`             ego chuck --id 15 -n Ole-Mustermann`);
    }

    /** @inheritdoc */
    public readonly syntax = '[options]';  // Syntax, that is shown in help screen

    private getJoke = function (url: string): Promise<string> {
        // return new pending promise
        return new Promise<string>((resolve, reject) => {
            const request = lib.get(url, (response) => {
                // handle http errors
                if (response.statusCode < 200 || response.statusCode > 299) {
                    reject(new Error('Failed to load page, status code: ' + response.statusCode));
                }
                // temporary data holder
                const body = [];
                // on every content chunk, push it to the data array
                response.on('data', (chunk) => body.push(chunk));
                // we are done, resolve promise with those joined chunks
                response.on('end', () => resolve(body.join('')));
            });
            // handle connection errors of the request
            request.on('error', (err) => reject(err));
        });
    };

    private handleError(error: any) {
        writeErrLine("OH BOY, somthing really bad happend, even Chuck Norris can't do anything about it...");
        writeErrLine("Maybe this can help him:");
        writeErrLine(error);
    }
}