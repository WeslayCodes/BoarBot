import {
    ButtonInteraction,
    ChatInputCommandInteraction,
    ModalSubmitInteraction, PermissionResolvable,
    SelectMenuInteraction
} from 'discord.js';
import {BoarBotApp} from '../../BoarBotApp';
import {RarityConfig} from '../../bot/config/items/RarityConfig';
import {BotConfig} from '../../bot/config/BotConfig';
import {DataHandlers} from '../data/DataHandlers';
import {Replies} from './Replies';
import {LogDebug} from '../logging/LogDebug';

/**
 * {@link InteractionUtils InteractionUtils.ts}
 *
 * Functions needed by many interactions.
 *
 * @license {@link http://www.apache.org/licenses/ Apache-2.0}
 * @copyright WeslayCodes 2023
 */
export class InteractionUtils {
    /**
     * Handles the beginning of most command interactions to prevent duplicate code
     *
     * @param config - Used to get the string to reply with
     * @param interaction - Interaction to reply to
     * @param includeTrade - Whether to include trade menu when deciding usable channels
     * @return guildData - Guild data parsed from JSON
     */
    public static async handleStart(
        config: BotConfig,
        interaction: ChatInputCommandInteraction,
        includeTrade: boolean = false
    ): Promise<any> {
        if (!interaction.guild || !interaction.channel) return;

        LogDebug.sendDebug('Started interaction', config, interaction);

        const guildData = await DataHandlers.getGuildData(interaction);
        if (!guildData) return;

        if (!guildData.channels) {
            await Replies.currentConfigReply(config, interaction);
            return;
        }

        const acceptableChannels: string[] = [].concat(guildData.channels);

        if (includeTrade) {
            acceptableChannels.push(guildData.tradeChannel);
        }

        if (!acceptableChannels.includes(interaction.channel.id)) {
            await Replies.wrongChannelReply(config, interaction, guildData, includeTrade);
            return;
        }

        return guildData;
    }
}