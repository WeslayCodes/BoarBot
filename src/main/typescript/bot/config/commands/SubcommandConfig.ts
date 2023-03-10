import {SubcommandArgsConfig} from './SubcommandArgsConfig';
import {ActionRowBuilder, ButtonBuilder, ModalComponentData, SelectMenuBuilder} from 'discord.js';
import {RowConfig} from '../components/RowConfig';
import {ModalConfig} from '../modals/ModalConfig';

/**
 * {@link SubcommandConfig SubcommandConfig.ts}
 *
 * Stores a specific subcommand configuration
 * for a bot instance.
 *
 * @license {@link http://www.apache.org/licenses/ Apache-2.0}
 * @copyright WeslayCodes 2023
 */
export class SubcommandConfig {
    public readonly name: string = '';
    public readonly description: string = '';

    // Arguments the command uses

    public readonly args: SubcommandArgsConfig[] = [];

    // Tags for the command

    public readonly cooldown: boolean = false;

    // Components and modals associated with a command
    // NOTE: Types should expand as more commands with Components and Modals are added

    public readonly componentFields: RowConfig[][] = [];
    public readonly modals: ModalConfig[] = [];

}