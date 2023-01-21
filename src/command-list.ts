/***********************************************
* boarCommands.ts
* Weslay
*
* A collection of all /boar commands. Gives a
* user their "daily boar", shows users either
* their or others' inventories.
***********************************************/

import { SlashCommandBuilder } from "discord.js";
import fs from "fs";
import {handleError} from "./classes/GeneralFunctions";

const { ChatInputCommandInteraction } = require("discord.js");

const boarConfig = JSON.parse(fs.readFileSync("BoarBotConfig.json", "utf-8"));

module.exports = {
    data: new SlashCommandBuilder()
        .setName("boar")
        .setDescription("Boar commands.")
        .addSubcommand(option => option.setName("config")
            .setDescription(boarConfig.commandDescriptions.config)
        )
        .addSubcommand(option => option.setName("help")
            .setDescription(boarConfig.commandDescriptions.help)
        )
        .addSubcommand(option => option.setName("daily")
            .setDescription(boarConfig.commandDescriptions.daily)
        )
        .addSubcommand(option => option.setName("give")
            .setDescription(boarConfig.commandDescriptions.give)
            .addUserOption(option => option.setName("user")
                .setDescription(boarConfig.commandDescriptions["give-arg1"])
                .setRequired(true)
            )
            .addStringOption(option => option.setName("id")
                .setDescription(boarConfig.commandDescriptions["give-arg2"])
                .setRequired(true)
            )
        )
        .addSubcommand(option => option.setName("collection")
            .setDescription(boarConfig.commandDescriptions.collection)
            .addUserOption(option => option.setName("user")
                .setDescription(boarConfig.commandDescriptions["collection-arg1"])
                .setRequired(false)
            )
        )
        .addSubcommand(option => option.setName("give-badge")
            .setDescription(boarConfig.commandDescriptions["give-badge"])
            .addUserOption(option => option.setName("user")
                .setDescription(boarConfig.commandDescriptions["give-badge-arg2"])
                .setRequired(true)
            )
            .addStringOption(option => option.setName("id")
                .setDescription(boarConfig.commandDescriptions["give-badge-arg2"])
                .setRequired(true)
            )
        )
        // .addSubcommand(option => option.setName("top")
        //     .setDescription("View the Boar Score Leaderboard.")
        //     .addIntegerOption(option => option.setName("page")
        //         .setDescription("Page number of leaderboard.")
        //         .setRequired(false)
        //     )
        //     .addStringOption(option => option.setName("leaderboard")
        //         .setDescription("Which leaderboard to look at.")
        //         .setRequired(false)
        //         .addChoices(
        //             { name: "Boar Score", value:"Boar Score" },
        //             { name: "Unique Boars", value:"Unique Boars" },
        //             { name: "Total Boars", value:"Total Boars" },
        //             { name: "Score-to-Total Ratio", value:"Score-to-Total Ratio" },
        //             { name: "Extra Boar Total", value:"Extra Boar Total" },
        //             { name: "Base Multiplier", value:"Base Multiplier" }
        //         )
        //     )
        // )
        // .addSubcommand(option => option.setName("powerup")
        //     .setDescription("Spawn a powerup.")
        //     .addIntegerOption(option => option.setName("type")
        //         .setDescription("Type of powerup.")
        //         .setRequired(false)
        //         .addChoices(
        //             { name: "Extra Boars", value:1 },
        //             { name: "4x Multiplier", value:2 },
        //             { name: "10% Score Increase", value:3 },
        //             { name: "Steal Boar", value:4 },
        //             { name: "Powerup Boar", value:5 }
        //         )
        //     )
        // )
        // .addSubcommand(option => option.setName("trade")
        //     .setDescription("Trade boars with someone.")
        //     .addUserOption(option => option.setName("user")
        //         .setDescription("User you'd like to trade with.")
        //         .setRequired(true)
        //     )
        // )
        // .addSubcommand(option => option.setName("tradelist")
        //     .setDescription("Check ingoing and outgoing trades.")
        // )
        ,
    async execute(interaction: typeof ChatInputCommandInteraction) {
        const subcommand = interaction.client.subcommands.get(interaction.options._subcommand);

        if (subcommand) {
            try {
                await subcommand.execute(interaction);
            } catch (err: unknown) {
                await handleError(err, interaction);
                return;
            }
        }
    }
};