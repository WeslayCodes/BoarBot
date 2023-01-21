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
    data: { name: "daily" },
    async execute(interaction: ChatInputCommandInteraction) {
        const startInter = Date.now();
        console.log(interaction.user.username + " used /boar daily!");
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
        if (guildData.channels && guildData.channels.includes(interaction.channel?.id)) {
            console.log("Time to get to defer: " + (Date.now() - startInter));
            await interaction.deferReply();
            console.log("Time to get to AFTER defer: " + (Date.now() - startInter));

            await addQueue(async function() {
                try {
                    if (!interaction.guild) {
                        await interaction.editReply(boarConfig.noGuild);
                        return;
                    }

                    // New boar user object used for easier manipulation of data
                    const boarUser = new BoarUser(interaction.user, interaction.guild);

                    // Midnight of next day
                    const nextBoarTime = Math.floor(
                        new Date().setUTCHours(24,0,0,0) / 1000
                    );

                    // Returns if user has already used their daily boar
                    if (boarUser.lastDaily >= nextBoarTime - 86400 && !boarConfig.unlimitedBoars) {
                        await interaction.editReply(boarConfig["daily-give"].usedDaily + "<t:" + nextBoarTime + ":R>");
                        return;
                    }

                    // Array of probabilities for each rarity
                    const probabilities: number[] = [];
                    // Used to prevent total probability from going over 100%
                    let probabilityTotal: number = 0;
                    // Stores which rarity should be chosen
                    const randomRarity: number = Math.random();
                    // Stores the index of the chosen boar
                    let randomBoar: number = Math.random();
                    // Stores which rarity is being checked after RNG is rolled,
                    // eventually settling on the correct rarity
                    let rarityChecking: number;
                    // Stores all rarities
                    const boarRarities: string[] = Object.keys(boarConfig.boarIDs);
                    // Stores user's multiplier before using daily boar
                    const userMultiplier: number = boarUser.powerups.multiplier;
                    // Stores object that stores boar IDs
                    const boarIDs: any = boarConfig.boarIDs;

                    // Gets rarities from config file and stores them in an array
                    for (const rarity of boarRarities) {
                        const rarityProbability: number = boarIDs[rarity].PROBABILITY;
                        if (rarityProbability !== -1)
                            probabilities.push(rarityProbability)
                    }

                    boarUser.lastDaily = Math.round(Date.now() / 1000);

                    // Increases rates of all boars based on user's multiplier
                    if (userMultiplier > 1.0) {
                        // Loops through every rarity value (Divine -> Uncommon)
                        for (let i=probabilities.length-1; i>=0; i--) {
                            // Tries to multiply current rarity by user's multiplier
                            // If resulting value is too high, decrease the amount multiplied until it can fit
                            // If none found, chance of getting the boar class relating to rarity value is 0%
                            for (let j=userMultiplier > 1000 ? 1000 : userMultiplier; j>=0; j--) {
                                if (probabilityTotal + j * probabilities[i] <= 1.0) {
                                    probabilities[i] = j * probabilities[i];
                                    probabilityTotal += probabilities[i];

                                    break;
                                }
                            }
                        }

                        // If multiplier is over 10x, common boars won't be obtainable
                        for (let i=0; i<probabilities.length-1 && userMultiplier > 10.0; i++) {
                            if (probabilities[i] !== 0) {
                                probabilities[i] += 1 - probabilityTotal;
                                break;
                            }
                        }

                        boarUser.powerups.multiplier = 1.0;
                    }

                    // Gets the probability value of a common
                    rarityChecking = 1 - probabilities.reduce((a, b) => { return a + b });
                    for (const rarity of boarRarities) {
                        // If the value gotten is lower than the rarity being checked,
                        // go to next highest rarity
                        if (randomRarity >= rarityChecking) {
                            rarityChecking += probabilities[boarRarities.indexOf(rarity)];
                            continue;
                        }

                        // Stores the IDs of the current rarity being checked
                        const rarityIDs: string[] = Object.keys(boarIDs[rarity])

                        // Stores the ID that was chosen
                        let boarID = rarityIDs[Math.floor(randomBoar * rarityIDs.indexOf("SCORE_VALUE"))];
                        let isBlacklisted = boarIDs[rarity][boarID].blacklisted;
                        let isSB = boarIDs[rarity][boarID].isSB;

                        // Retries getting ID if blacklisted or SB boar in non-SB server
                        while (isBlacklisted || !guildData.isSBServer && isSB) {
                            randomBoar = Math.random();

                            boarID = rarityIDs[Math.floor(randomBoar * rarityIDs.indexOf("SCORE_VALUE"))];

                            isBlacklisted = boarIDs[rarity][boarID].blacklisted;
                            isSB = boarIDs[rarity][boarID].isSB;

                        }

                        console.log(interaction.user.username + " got: " + boarID);
                        await boarUser.addBoar(boarID, rarity, "daily", interaction);

                        break;
                    }

                    boarUser.numDailies++;
                    await boarUser.orderBoars(interaction);
                } catch (err: unknown) {
                    await handleError(err, interaction);
                }
            }, interaction.id + interaction.user.id);
            console.log(interaction.user.username + " end of /boar daily!");
        } else if (!guildData.channels) {
            console.log(interaction.user.username + " used /boar daily during configuration!");

            await interaction.reply({
                content: boarConfig.currentlyConfiguring,
                ephemeral: true
            });
        } else {
            console.log(interaction.user.username + " used /boar daily in the wrong channel!");

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