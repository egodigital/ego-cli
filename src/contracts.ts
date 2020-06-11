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
import PQueue from 'p-queue';


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

    /**
     * Syntax description, which is shown on help screen.
     */
    readonly syntax: string;
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
     * Tries to return a value from the config storage.
     *
     * @param {any} key The key.
     * @param {TDefault} [defaultValue] A custom default value.
     *
     * @return {TResult|TDefault} The value, if found.
     */
    get<TResult = any, TDefault = TResult>(key: any, defaultValue?: TResult): TResult | TDefault;
    /**
     * Returns the full version of a path, based on the value for 'current working directory'.
     *
     * @param {any} p The input value.
     *
     * @return {string} The full path.
     */
    readonly getFullPath: (p: any) => string;
    /**
     * The normalized name.
     */
    readonly name: string;
    /**
     * App information.
     */
    readonly package: PackageJSON;
    /**
     * A queue that allows only one operation at once.
     */
    readonly queue: PQueue;
    /**
     * Raw List of arguments from the command line.
     */
    readonly rawArgs: ReadonlyArray<string>;
    /**
     * Loads a module from (CLI) app context.
     *
     * @param {string} id The ID of the module.
     *
     * @return {TModule} The module.
     */
    require<TModule = any>(id: string): TModule;
    /**
     * The root directory of the command.
     */
    readonly root: string;
    /**
     * A key/value pair storage, that is available while the execution.
     */
    readonly values: any;
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
 * A command script module
 */
export interface CommandScriptModule {
    /**
     * Executes the script.
     *
     * @param {CommandExecuteContext} ctx The execution context.
     */
    execute(ctx: CommandExecuteContext): void | number | PromiseLike<void | number>;
}

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
 * A job script module
 */
export interface JobScriptModule {
    /**
     * Executes the script.
     *
     * @param {CommandExecuteContext} ctx The execution context.
     */
    execute(ctx: CommandExecuteContext): void | PromiseLike<void>;
}

/**
 * A file system watcher script module
 */
export interface WatcherScriptModule {
    /**
     * Executes the script.
     *
     * @param {string} path The path of the underliyng file system item.
     * @param {string} event The name of the event.
     * @param {WatcherExecuteContext} ctx The execution context.
     */
    execute(path: string, event: string, ctx: CommandExecuteContext): void | PromiseLike<void>;
}

/**
 * 'package.json' file.
 */
export interface PackageJSON {
    /**
     * The display name of the app.
     */
    displayName?: string;
    /**
     * The app's name.
     */
    name?: string;
    /**
     * List of scripts.
     */
    scripts?: {
        [name: string]: string
    };
    /**
     * The version.
     */
    version?: string;
}

/**
 * A storage.
 */
export type Storage = { [name: string]: any };


/**
 * The name of an ego (sub)folder.
 */
export const EGO_FOLDER = '.ego';

/**
 * Regular expression for testing for a valid command name.
 */
export const REGEX_COMMAND_NAME = /^([a-z0-9]|\-){1,}$/i;

/**
 * The name of the storage file.
 */
export const STORAGE_FILE = '.storage';


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

    /** @inheritdoc */
    public syntax = '[options]';
}
