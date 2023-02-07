/***********************************************
* onInteractions.ts
* Weslay
*
* An event that runs once the bot detects an
* interaction.
***********************************************/

import {EmbedBuilder, Events, Interaction} from 'discord.js';
import {CustomClient} from '../supporting_files/CustomClient';
import {handleError} from '../supporting_files/LogDebug';
import {getConfigFile} from '../supporting_files/DataHandlers';

//***************************************

const maintenanceEmbed = new EmbedBuilder()
    .setColor(0xFFFF00);

//***************************************

module.exports = {
	name: Events.InteractionCreate,
	async execute(interaction: Interaction) {
        if (!interaction.isChatInputCommand() && !interaction.isModalSubmit()) return;

        const config = getConfigFile();

        const generalStrings = config.strings.general;

        try {
            if (interaction.channel && interaction.channel.isDMBased()) {
                await interaction.reply(generalStrings.noGuild);
                return;
            }

            if (config.maintenanceMode && interaction.isChatInputCommand() &&
                !config.developers.includes(interaction.user.id)
            ) {
                await interaction.reply({
                    embeds: [maintenanceEmbed.setTitle(generalStrings.maintenance)],
                    ephemeral: true
                });
                return;
            }
        } catch (err: unknown) {
            await handleError(err, interaction);
            return;
        }

        let command;
        let modal;

        if (interaction.isChatInputCommand())
            command = (interaction.client as CustomClient).commandList.get(interaction.commandName);
        else if (interaction.isModalSubmit())
            modal = (interaction.client as CustomClient).modals.get(interaction.customId);

        if (command) {
            try {
                await command.execute(interaction);
            } catch (err: unknown) {
                await handleError(err, interaction);
                return;
            }
        }

        if (modal) {
            try {
                await modal.execute(interaction);
            } catch (err: unknown) {
                await handleError(err, interaction);
                return;
            }
        }
    }
};