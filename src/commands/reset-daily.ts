/***********************************************
 * daily.ts
 * Weslay
 *
 * Used to give users their daily boar
 ***********************************************/

import {ChatInputCommandInteraction} from "discord.js";
import fs from "fs";
import {addQueue, handleError} from "../classes/GeneralFunctions";
import {BoarUser} from "../classes/BoarUser";

module.exports = {
    data: { name: "reset-daily" },
    async execute(interaction: ChatInputCommandInteraction) {
        const boarConfig = JSON.parse(fs.readFileSync("BoarBotConfig.json", "utf-8"));

        await addQueue(async function() {
            try {
                if (!interaction.guild) {
                    await interaction.editReply(boarConfig.noGuild);
                    return;
                }

                await interaction.reply({
                    content: "Your daily boar has been reset!",
                    ephemeral: true
                });

                // New boar user object used for easier manipulation of data
                const boarUser = new BoarUser(interaction.user, interaction.guild);

                boarUser.lastDaily = 0;

                await boarUser.updateUserData();
            } catch (err: unknown) {
                await handleError(err, interaction);
                return;
            }
        }, interaction.id + interaction.user.id);
    }
};