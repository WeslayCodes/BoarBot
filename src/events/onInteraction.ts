/***********************************************
* onInteractions.ts
* Weslay
*
* An event that runs once the bot detects an
* interaction.
***********************************************/
import {Interaction} from "discord.js";
import {BetterClient} from "../classes/BetterClient";
import {handleError} from "../classes/GeneralFunctions";

module.exports = {
	name: 'interactionCreate',
	async execute(interaction: Interaction) {
        if (!interaction.isChatInputCommand() && !interaction.isModalSubmit()) return;

        let command;
        let modal;

        if (interaction.isChatInputCommand())
            command = (interaction.client as BetterClient).commandList.get(interaction.commandName);
        else if (interaction.isModalSubmit())
            modal = (interaction.client as BetterClient).modals.get(interaction.customId);

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