import {
    AutocompleteInteraction,
    ChatInputCommandInteraction,
    EmbedBuilder,
    Events,
    Interaction,
    ModalSubmitInteraction
} from 'discord.js';
import {Listener} from '../api/listeners/Listener';
import {BotConfig} from '../bot/config/BotConfig';
import {BoarBotApp} from '../BoarBotApp';
import {LogDebug} from '../util/logging/LogDebug';

/**
 * {@link GuildAddListener GuildAddListener.ts}
 *
 * An event that runs once the bot detects an
 * interaction.
 *
 * @license {@link http://www.apache.org/licenses/ Apache-2.0}
 * @copyright WeslayCodes 2023
 */
export default class InteractionListener implements Listener {
    public readonly eventName: Events = Events.InteractionCreate;
    private interaction: ChatInputCommandInteraction | ModalSubmitInteraction | AutocompleteInteraction | null = null;
    private config: BotConfig | null = null;
    public static maintenanceEmbed = new EmbedBuilder()
        .setColor(0xFFFF00);

    public async execute(interaction: Interaction) {
        if (!interaction.isChatInputCommand() && !interaction.isAutocomplete()) return;

        this.interaction = interaction;
        this.config = BoarBotApp.getBot().getConfig();

        try {
            if (!await this.handleMaintenance()) return;
        } catch (err: unknown) {
            await LogDebug.handleError(err, interaction);
            return;
        }

        const command = BoarBotApp.getBot().getCommands().get(interaction.commandName);

        if (command) {
            try {
                await command.execute(interaction);
            } catch (err: unknown) {
                await LogDebug.handleError(err, interaction);
                return;
            }
        }
    }

    private async handleMaintenance(): Promise<boolean> {
        if (!this.interaction || !this.config) return false;

        const strConfig = this.config.stringConfig;

        if (this.config.maintenanceMode && this.interaction.isChatInputCommand() &&
            !this.config.devs.includes(this.interaction.user.id)
        ) {
            await this.interaction.reply({
                embeds: [InteractionListener.maintenanceEmbed.setTitle(strConfig.maintenance)],
                ephemeral: true
            });
            return false;
        }

        return true;
    }
}