/***********************************************
* help.ts
* Weslay
*
* Used to see information about the bot.
***********************************************/

import { ChatInputCommandInteraction } from "discord.js";
import fs from "fs";

module.exports = {
    data: { name: "help" },
    async execute(interaction: ChatInputCommandInteraction) {
        await interaction.deferReply({ ephemeral: true });

        const boarConfig = JSON.parse(fs.readFileSync("BoarBotConfig.json", "utf-8"));

        let guildData: any; 

        try {
            guildData = JSON.parse(fs.readFileSync(boarConfig.guildDataFolder + interaction.guild?.id + ".json", "utf-8"));
        } catch {
            await interaction.editReply(boarConfig.needToConfigure);
            return;
        }

        if (guildData.channels.includes(interaction.channel?.id) || guildData.tradeChannel === interaction.channel?.id) {
            let helpStr = "";

            for (const command of Object.keys(boarConfig.commandDescriptions)) {
                helpStr += "> **/" + command + "**: *" + boarConfig.commandDescriptions[command] + "*\n";
            }

            await interaction.editReply({
                files: [fs.readFileSync(boarConfig.helpImages.background)]
            });
        } else {
            let strChannels = "";

            for (const ch of guildData.channels) {
                strChannels += "> <#" + ch + ">\n";
            }
            strChannels += "> <#" + guildData.tradeChannel + ">";

            await interaction.editReply(boarConfig.wrongChannel + "\n" + strChannels);
        }
    }
};