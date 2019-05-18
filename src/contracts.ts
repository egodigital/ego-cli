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
     * A description text.
     */
    readonly description: string;

    /**
     * Executes the command.
     *
     * @param {CommandExecuteContext} context The context.
     *
     * @return {CommandExecuteResult|PromiseLike<CommandExecuteResult>} The result.
     */
    readonly execute: (context: CommandExecuteContext) => CommandExecuteResult | PromiseLike<CommandExecuteResult>;

    /**
     * Shows help screen for the command.
     *
     * @param {CommandShowHelpContext} context The context.
     *
     * @return {CommandShowHelpResult|PromiseLike<CommandShowHelpResult>} The result.
     */
    readonly showHelp: (context: CommandShowHelpContext) => CommandShowHelpResult | PromiseLike<CommandShowHelpResult>;
}

/**
 * Context for an Command.#execute() invocation.
 */
export interface CommandExecuteContext {
    /**
     * The parsed arguments.
     */
    readonly args: ParsedArgs;
    /**
     * The working directory.
     */
    readonly cwd: string;
    /**
     * Exists the process.
     *
     * @param {number} code The custom, relative exit code. Default: 0
     */
    readonly exit: (code?: number) => void;
    /**
     * The normalized name.
     */
    readonly name: string;
    /**
     * App information.
     */
    readonly package: PackageJSON;
    /**
     * The root directory of the command.
     */
    readonly root: string;
    /**
     * Indicates if app runs in verbose mode or node.
     */
    readonly verbose: boolean;
}

/**
 * The result of an Command.#execute() invocation.
 */
export type CommandExecuteResult = void | null | undefined | number;

/**
 * Context for an Command.#showHelp() invocation.
 */
export interface CommandShowHelpContext {
    /**
     * App information.
     */
    readonly package: PackageJSON;
}

/**
 * The result of an Command.#showHelp() invocation.
 */
export type CommandShowHelpResult = void | null | undefined | number;

/**
 * 'package.json' file.
 */
export interface PackageJSON {
    /**
     * The display name of the app.
     */
    displayName: string;
    /**
     * The app's name.
     */
    name: string;
    /**
     * The version.
     */
    version: string;
}


/**
 * Regular expression for testing for a valid command name.
 */
export const REGEX_COMMAND_NAME = /^([a-z]|\-){1,}$/i;


/**
 * A basic command.
 */
export abstract class CommandBase implements Command {
    /** @inheritdoc */
    public abstract description: string;

    /** @inheritdoc */
    public abstract execute(context: CommandExecuteContext): Promise<CommandExecuteResult>;

    /** @inheritdoc */
    public abstract showHelp(context: CommandShowHelpContext): Promise<CommandShowHelpResult>;
}
