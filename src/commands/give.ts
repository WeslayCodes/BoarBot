/***********************************************
 * give.ts
 * Weslay
 *
 * Used to give a user a specific boar
 ***********************************************/

import {ChatInputCommandInteraction} from "discord.js";
import fs from "fs";
import {addQueue, handleError} from "../classes/GeneralFunctions";
import {BoarUser} from "../classes/BoarUser";

module.exports = {
    data: { name: "give" },
    async execute(interaction: ChatInputCommandInteraction) {
        console.log(interaction.user.username + " used /boar give!");
        const boarConfig = JSON.parse(fs.readFileSync("BoarBotConfig.json", "utf-8"));

        let guildData: any;

        try {
            guildData = JSON.parse(fs.readFileSync(boarConfig.guildDataFolder + interaction.guild?.id + ".json", "utf-8"));
        } catch {
            await interaction.reply({
                content: boarConfig.needToConfigure,
                ephemeral: true
            });

            return;
        }

        // Only runs in boar channels. Boar trading separate
        if (boarConfig.developers.includes(interaction.user.id) && guildData.channels && guildData.channels.includes(interaction.channel?.id)) {
            await interaction.deferReply({ ephemeral: true });

            const userInput = interaction.options.getUser("user");
            const boarInput = interaction.options.getString("id");
            let rarityFound: string = "";

            if (!userInput || !boarInput) {
                await interaction.editReply(boarConfig.nullValues);
                return;
            }

            // Gets the rarity of boar gotten
            for (const rarity of Object.keys(boarConfig.boarIDs)) {
                if (boarConfig.boarIDs[rarity][boarInput]) {
                    rarityFound = rarity;
                    break;
                }
            }

            // Returns if boar ID doesn't exist
            if (rarityFound === "") {
                await interaction.editReply(boarConfig.invalidID);
                return;
            }

            await addQueue(async function() {
                try {
                    if (!interaction.guild) {
                        await interaction.editReply(boarConfig.noGuild);
                        return;
                    }

                    // New boar user object used for easier manipulation of data
                    const boarUser = new BoarUser(userInput, interaction.guild);

                    // Adds boar from boarInput to inputted user's collection
                    await boarUser.addBoar(boarInput, rarityFound, "give", interaction);

                    await boarUser.orderBoars(interaction);
                } catch (err: unknown) {
                    await handleError(err, interaction);
                }
            }, interaction.id + userInput.id);
            console.log(interaction.user.username + " end of /boar give!");
        } else if (!boarConfig.developers.includes(interaction.user.id)) {
            console.log(interaction.user.username + " used /boar give as a non-developer!");

            await interaction.reply({
                content: boarConfig.noPermission,
                ephemeral: true
            });
        } else if (!guildData.channels) {
            console.log(interaction.user.username + " used /boar give during configuration!");

            await interaction.reply({
                content: boarConfig.currentlyConfiguring,
                ephemeral: true
            });
        } else {
            console.log(interaction.user.username + " used /boar give in the wrong channel!");

            let strChannels = "";

            for (const ch of guildData.channels) {
                strChannels += "> <#" + ch + ">\n";
            }

            await interaction.reply({
                content: boarConfig.wrongChannel + "\n" + strChannels,
                ephemeral: true
            });
        }
    }
};