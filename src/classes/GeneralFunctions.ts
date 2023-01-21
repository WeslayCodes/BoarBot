import {
    ButtonInteraction,
    ChatInputCommandInteraction, Client, EmbedBuilder, Interaction,
    ModalSubmitInteraction,
    SelectMenuInteraction
} from "discord.js";
import fs from "fs";

const queue: Record<string, () => void>[] = [{}, {}, {}, {}, {}, {}, {}, {}, {}, {}, {}];
let queueRunning = [false, false, false, false, false, false, false, false, false, false];

const errorEmbed = new EmbedBuilder()
    .setColor(0xFF0000);

function hasAttachmentPerms(interaction: ChatInputCommandInteraction | ButtonInteraction | SelectMenuInteraction | ModalSubmitInteraction) {
    return interaction.guild?.members.me?.permissions.has("AttachFiles") as boolean;
}

// Adds a function to a queue based on its ID number
async function addQueue(func: () => void, id: string) {
    const queueIndex = id.endsWith("global") ? 0 : parseInt(id[id.length-1]) + 1;
    queue[queueIndex][id] = func;

    if (!queueRunning[queueIndex]) {
        queueRunning[queueIndex] = true;
        runQueue(queueIndex);
    }

    return new Promise((resolve, reject) => {
        setTimeout(() => {
            reject("Took too long! Abort!");
        }, 30000);

        setInterval(() => {
            if (!queue[queueIndex][id])
                resolve("Processed");
        }, 100);
    })
}

async function runQueue(queueIndex: number) {
    if (Object.keys(queue[queueIndex]).length === 0) {
        queueRunning[queueIndex] = false
    }
    if (Object.keys(queue[queueIndex]).length > 0) {
        queueRunning[queueIndex] = true;

        try {
            await queue[queueIndex][Object.keys(queue[queueIndex])[0]]();
        } catch (err: unknown) {
            console.log("[\x1b[32mSAFE\x1b[0m] " + (err as Error).stack);
        }

        delete queue[queueIndex][Object.keys(queue[queueIndex])[0]];

        runQueue(queueIndex);
    }
}

function getGlobalData() {
    const boarConfig = JSON.parse(fs.readFileSync("BoarBotConfig.json", "utf-8"));

    return JSON.parse(fs.readFileSync(boarConfig.dataFolder + "GlobalData.json", "utf-8"));
}

function sleep(time: number) {
    return new Promise(r => setTimeout(r, time));
}

async function handleError(err: unknown, interaction: ChatInputCommandInteraction | ModalSubmitInteraction | undefined) {
    console.log("[\x1b[32mSAFE\x1b[0m] " + (err as Error).stack);

    if (!interaction) return;

    const boarConfig = JSON.parse(fs.readFileSync("BoarBotConfig.json", "utf-8"));

    if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({
            embeds: [errorEmbed.setTitle(boarConfig.errorOccurred)],
            ephemeral: true
        }).catch((err: unknown) => {
            console.log("[\x1b[32mSAFE\x1b[0m] " + (err as Error).stack);
            return;
        });
    } else if (!interaction.replied && interaction.deferred) {
        await interaction.editReply({
            embeds: [errorEmbed.setTitle(boarConfig.errorOccurred)]
        }).catch((err: unknown) => {
            console.log("[\x1b[32mSAFE\x1b[0m] " + (err as Error).stack);
            return;
        });
    }
}

function findRarity(boarID: string) {
    const boarConfig = JSON.parse(fs.readFileSync("BoarBotConfig.json", "utf-8"));
    let finalRarity: string = "";

    for (const rarity of Object.keys(boarConfig.boarIDs)) {
        if (boarConfig.boarIDs[rarity][boarID]) {
            finalRarity = rarity;
            break;
        }
    }

    return finalRarity;
}

function sendDebug(debugStr: string) {
    console.log("[\x1b[33mDEBUG\x1b[0m] [\x1b[90m" + new Date().toLocaleString() + "\x1b[0m]\n" + debugStr);
}

export {
    addQueue,
    hasAttachmentPerms,
    getGlobalData,
    sleep,
    handleError,
    findRarity,
    sendDebug
}