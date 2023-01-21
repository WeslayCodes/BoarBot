/***********************************************
 * collection.ts
 * Weslay
 *
 * Used to see a collection of boars, powerups,
 * and other information pertaining to a user
 ***********************************************/

import {AttachmentBuilder, ChatInputCommandInteraction, User} from "discord.js";
import fs from "fs";
import {addQueue, findRarity, handleError} from "../classes/GeneralFunctions";
import {BoarUser} from "../classes/BoarUser";
import Canvas from "canvas";

module.exports = {
    data: { name: "collection" },
    async execute(interaction: ChatInputCommandInteraction) {
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
            await interaction.deferReply();

            // Gets user to interact with
            const userInput = (interaction.options.getUser("user")
                ? interaction.options.getUser("user")
                : interaction.user) as User;

            await addQueue(async () => {
                try {
                    if (!interaction.guild) {
                        await interaction.editReply(boarConfig.noGuild);
                        return;
                    }

                    const MAX_BOAR_SCORE = 999999999999999;
                    const MAX_TOTAL_BOARS = 9999999999;
                    const MAX_UNIQUES = 9999999;
                    const MAX_MULTIPLIER = 999;
                    const MAX_GIFTS = 999999999;

                    const boarUser = new BoarUser(userInput, interaction.guild);

                    const userScore = boarUser.boarScore;
                    const userTotal = boarUser.totalBoars;
                    const userUniques = Object.keys(boarUser.boarCollection).length;
                    const userMultiplier = boarUser.powerups.multiplier;
                    const userGifts = boarUser.powerups.gifts;

                    const lastBoarRarity = findRarity(boarUser.lastBoar);
                    const favoriteBoarRarity = findRarity(boarUser.favoriteBoar);

                    // Stores information about all boars the user has
                    const boarArray: any[] = [];
                    // Stores a slice of the boar array that's being shown
                    let currentBoarArray: any[];

                    for (const boarID of Object.keys(boarUser.boarCollection)) {
                        // Stores information about the boar in user's collection
                        const boarInfo = boarUser.boarCollection[boarID];
                        const boarRarity: string = findRarity(boarID);

                        // Stores information about a boar's global details
                        const boarDetails = boarConfig.boarIDs[boarRarity][boarID];

                        boarArray.push({
                            id: boarID,
                            name: boarDetails.name,
                            file: boarDetails.file.endsWith("gif")
                                ? boarDetails.file.split(".")[0] + "STATIC.png"
                                : boarDetails.file,
                            num: boarInfo.num,
                            editions: boarInfo.editions,
                            firstObtained: boarInfo.firstObtained,
                            lastObtained: boarInfo.lastObtained,
                            rarity: boarRarity,
                            color: boarConfig.boarIDs[boarRarity].COLOR
                        })
                    }

                    currentBoarArray = boarArray.slice(0, 16);

                    const boarCanvas = Canvas.createCanvas(1920, 1388);
                    const boarCtx = boarCanvas.getContext("2d");

                    boarCtx.font = '45px "Minecraft"';
                    boarCtx.textAlign = "left";
                    boarCtx.fillStyle = "#dedede";

                    // Background of attachment
                    boarCtx.drawImage(await Canvas.loadImage("assets/BoarInventoryUnderlay.png"), 0, 0, boarCanvas.width, boarCanvas.height);

                    // Username and avatar
                    boarCtx.drawImage(await Canvas.loadImage(userInput.displayAvatarURL({extension: "png"})), 24, 24, 156, 156);
                    boarCtx.fillText(userInput.username.substring(0, 16) + "#" + userInput.discriminator, 225, 80);

                    // Stats of user
                    boarCtx.textAlign = "center";
                    boarCtx.font = '40px "Minecraft"';
                    boarCtx.fillText(userScore <= MAX_BOAR_SCORE
                        ? userScore.toLocaleString()
                        : MAX_BOAR_SCORE.toLocaleString() + "+", 365, 365);
                    boarCtx.fillText(userTotal <= MAX_TOTAL_BOARS
                        ? userTotal.toLocaleString()
                        : MAX_TOTAL_BOARS.toLocaleString() + "+", 227, 562);
                    boarCtx.fillText(userUniques <= MAX_UNIQUES
                        ? userUniques.toLocaleString()
                        : MAX_UNIQUES.toLocaleString() + "+", 568, 562);
                    boarCtx.fillText(userMultiplier <= MAX_MULTIPLIER
                        ? userMultiplier.toFixed(2) + "x"
                        : MAX_MULTIPLIER + "x (MAX)", 185, 736);
                    boarCtx.fillText(userGifts <= MAX_GIFTS
                        ? userGifts.toLocaleString()
                        : MAX_GIFTS.toLocaleString() + "+", 533, 736);

                    // Date of first daily boar ever
                    boarCtx.textAlign = "left";
                    boarCtx.font = '45px "Minecraft"';
                    boarCtx.fillText(boarUser.firstDaily > 0
                        ? new Date(boarUser.firstDaily * 1000).toLocaleString("default", {
                            month: "long",
                            day: "2-digit",
                            year: "numeric"
                        })
                        : "N/A", 991, 150);

                    if (boarUser.badges.length === 0) {
                        boarCtx.fillText("No Badges!", 240, 150,
                        );
                    }

                    for (let i = 0; i < boarUser.badges.length; i++) {
                        const imagePath = "assets/badges/" + boarConfig.badgeIDs[boarUser.badges[i]].file;

                        boarCtx.drawImage(
                            await Canvas.loadImage(imagePath),
                            240 + i % 8 * 70,
                            105,
                            55, 55
                        );
                    }

                    // Draws all boars onto the inventory attachment
                    for (let i = 0; i < currentBoarArray.length; i++) {
                        boarCtx.drawImage(
                            await Canvas.loadImage("assets/boars/" + currentBoarArray[i].file),
                            740 + (i % 4) * 296,
                            210 + Math.floor(i / 4) * 295,
                            268, 268
                        );

                        boarCtx.lineWidth = 20;

                        boarCtx.beginPath();
                        boarCtx.strokeStyle = boarConfig.imageColors.foregroundGray;

                        boarCtx.moveTo(730 + (i % 4) * 296,
                            260 + Math.floor(i / 4) * 295
                        );

                        boarCtx.lineTo(790 + (i % 4) * 296,
                            200 + Math.floor(i / 4) * 295
                        );

                        boarCtx.stroke();
                        boarCtx.beginPath();
                        boarCtx.strokeStyle = currentBoarArray[i].color;

                        boarCtx.moveTo(730 + (i % 4) * 296,
                            253 + Math.floor(i / 4) * 295
                        );

                        boarCtx.lineTo(783 + (i % 4) * 296,
                            200 + Math.floor(i / 4) * 295
                        );

                        boarCtx.stroke();
                    }

                    if (boarUser.lastBoar !== "") {
                        const lastBoarDetails = boarConfig.boarIDs[lastBoarRarity][boarUser.lastBoar];
                        const fileName = lastBoarDetails.file.endsWith("gif")
                            ? lastBoarDetails.file.split(".")[0] + "STATIC.png"
                            : lastBoarDetails.file;
                        boarCtx.drawImage(await Canvas.loadImage("assets/boars/" + fileName), 382, 1037, 329, 329);

                        boarCtx.fillStyle = boarConfig.boarIDs[lastBoarRarity].COLOR;
                        boarCtx.fillRect(382, 1037, 200, 40);
                    }

                    if (boarUser.favoriteBoar !== "") {
                        const favoriteBoarDetails = boarConfig.boarIDs[favoriteBoarRarity][boarUser.favoriteBoar];
                        const fileName = favoriteBoarDetails.file.endsWith("gif")
                            ? favoriteBoarDetails.file.split(".")[0] + "STATIC.png"
                            : favoriteBoarDetails.file;
                        boarCtx.drawImage(await Canvas.loadImage("assets/boars/" + fileName), 26, 1037, 329, 329);

                        boarCtx.fillStyle = boarConfig.boarIDs[favoriteBoarRarity].COLOR;
                        boarCtx.fillRect(26, 1037, 200, 40);
                    }

                    for (let i = 0; i < 8; i++) {
                        let imagePath = "assets/EnhancerInactive.png";

                        if (i < boarUser.powerups.enhancers)
                            imagePath = "assets/EnhancerActive.png";

                        boarCtx.drawImage(
                            await Canvas.loadImage(imagePath),
                            83 + i % 8 * 71,
                            885,
                            70, 70
                        );
                    }

                    boarCtx.drawImage(await Canvas.loadImage("assets/BoarInventoryOverlay.png"), 0, 0, boarCanvas.width, boarCanvas.height);

                    await interaction.editReply({files: [await new AttachmentBuilder(boarCanvas.toBuffer(), {name: "unknown" + ".png"})]});
                } catch (err: unknown) {
                    await handleError(err, interaction);
                }
            }, interaction.id + userInput.id)

            console.log(interaction.user.username + " end of /boar collection!");
        } else if (!guildData.channels) {
            console.log(interaction.user.username + " used /boar collection during configuration!");

            await interaction.reply({
                content: boarConfig.currentlyConfiguring,
                ephemeral: true
            });
        } else {
            console.log(interaction.user.username + " used /boar collection in the wrong channel!");

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