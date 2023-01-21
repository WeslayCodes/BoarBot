/***********************************************
* index.ts
* Weslay
*
* Creates the bot, logs it in, then finds where
* all event and command handlers are.
***********************************************/

import dotenv from "dotenv";
import fs from "fs";
import path from "path";

import { GatewayIntentBits, Partials } from "discord.js";
import { BetterClient } from "./src/classes/BetterClient";
import {registerFont} from "canvas";
dotenv.config();

const client = new BetterClient({
	partials: [
		Partials.Channel,
	],
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMessageReactions,
        GatewayIntentBits.GuildEmojisAndStickers,
		GatewayIntentBits.GuildMembers,
		GatewayIntentBits.MessageContent,
		GatewayIntentBits.DirectMessages
    ]
});

registerFont("assets/F77MinecraftRegular-0VYv.ttf", { family: "Minecraft" });

const boarConfig = JSON.parse(fs.readFileSync("BoarBotConfig.json", "utf-8"));

// Registers list of subcommands
const commandList = require("./src/command-list.ts");
client.commandList.set(commandList.data.name, commandList);

// Registers subcommand file locations
const subcommandsPath = path.join(__dirname, './src/commands');
const subcommandFiles = fs.readdirSync(subcommandsPath).filter((file: string) => file.endsWith('.ts'));

for (const file of subcommandFiles) {
	const filePath = path.join(subcommandsPath, file);
	const subcommand = require(filePath);
	client.subcommands.set(subcommand.data.name, subcommand);
}

// Registers modal file locations
// const modalsPath = path.join(__dirname, './src/modals');
// const modalFiles = fs.readdirSync(modalsPath).filter((file: string) => file.endsWith('.ts'));
//
// for (const file of modalFiles) {
// 	const filePath = path.join(modalsPath, file);
// 	const modal = require(filePath);
// 	client.modals.set(modal.data.name, modal);
// }

// Registers event handlers
const eventsPath = path.join(__dirname, './src/events');
const eventFiles = fs.readdirSync(eventsPath).filter((file: string) => file.endsWith('.ts'));

for (const file of eventFiles) {
	const filePath = path.join(eventsPath, file);
	const event = require(filePath);
	if (event.once)
		client.once(event.name, (...args: string[]) => event.execute(...args));
	else
		client.on(event.name, (...args: string[]) => event.execute(...args));
}

// Gets rid of empty data files on restart
const guildFolders = fs.readdirSync(boarConfig.guildDataFolder);

for (const guild of guildFolders) {
	const filePath = boarConfig.guildDataFolder + guild;
	const data = JSON.parse(fs.readFileSync(filePath, "utf-8"));

	if (Object.keys(data).length === 0)
		fs.rmSync(boarConfig.guildDataFolder + guild);
}

client.login(process.env.TOKEN);