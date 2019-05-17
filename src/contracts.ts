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

import { ParsedArgs } from 'minimist';


/**
 * A command.
 */
export interface Command {
    /**
     * Executes the command.
     *
     * @param {CommandExecutionContext} context The context.
     *
     * @return {CommandExecuteResult|PromiseLike<CommandExecuteResult>} The result.
     */
    readonly execute: (context: CommandExecutionContext) => CommandExecuteResult | PromiseLike<CommandExecuteResult>;
}

/**
 * The result of an Command.#execute() invocation.
 */
export type CommandExecuteResult = void | null | undefined | number;

/**
 * Execution context of a command.
 */
export interface CommandExecutionContext {
    /**
     * The parsed arguments.
     */
    readonly args: ParsedArgs;
    /**
     * App information.
     */
    readonly package: PackageJSON;
    /**
     * The root directory of the command.
     */
    readonly root: string;
}

/**
 * 'package.json' file.
 */
export interface PackageJSON {
    /**
     * The version.
     */
    version: string;
}


/**
 * The list of supported commands.
 */
export const SUPPORTED_COMMANDS = [
    'new',
];


/**
 * A basic command.
 */
export abstract class CommandBase implements Command {
    /** @inheritdoc */
    public abstract execute(context: CommandExecutionContext): Promise<CommandExecuteResult>;
}
