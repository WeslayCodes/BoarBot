import Canvas, { registerFont } from "canvas";
import { AttachmentBuilder, ChatInputCommandInteraction, Guild, GuildMember, User } from "discord.js";
import {addQueue, getGlobalData} from "./GeneralFunctions";
import { PythonShell } from "python-shell";
import fs from "fs";

const pyshell = new PythonShell("scripts/getDynamicImage.py");
pyshell.setMaxListeners(100);

export class BoarUser {
    public readonly user: User;
    private readonly guild: Guild;
    private readonly member: GuildMember | null;

    public lastDaily: number;
    public numDailies: number;
    public totalBoars: number;
    public boarScore: number;
    public favoriteBoar: string;
    public lastBoar: string;
    public firstDaily: number;
    public powerupsWon: number;
    public boarStreak: number;
    public boarCollection: any;
    public powerups: any;
    public theme: string;
    public themes: string[];
    public badges: string[];

    constructor(user: User, guild: Guild) {
        this.user = user;
        this.guild = guild;
        this.member = this.guild.members.cache.get(this.user.id) as GuildMember | null;

        const userData = this.getUserData();

        this.lastDaily = userData.lastDaily;
        this.numDailies = userData.numDailies;
        this.totalBoars = userData.totalBoars;
        this.boarScore = userData.boarScore;
        this.favoriteBoar = userData.favoriteBoar;
        this.lastBoar = userData.lastBoar;
        this.firstDaily = userData.firstDaily;
        this.powerupsWon = userData.powerupsWon;
        this.boarStreak = userData.boarStreak;
        this.boarCollection = userData.boarCollection;
        this.powerups = userData.powerups;
        this.theme = userData.theme;
        this.themes = userData.themes;
        this.badges = userData.badges;
    }

    private getUserData() {
        const boarConfig = JSON.parse(fs.readFileSync("BoarBotConfig.json", "utf-8"));

        let userDataJSON: string;

        try {
            userDataJSON = fs.readFileSync(boarConfig.userDataFolder + this.user.id + ".json", "utf-8");
        } catch {
            fs.writeFileSync(boarConfig.userDataFolder + this.user.id + ".json", JSON.stringify(boarConfig.emptyUser));
            userDataJSON = fs.readFileSync(boarConfig.userDataFolder + this.user.id + ".json", "utf-8");
        }

        return JSON.parse(userDataJSON);
    }

    public updateUserData() {
        const boarConfig = JSON.parse(fs.readFileSync("BoarBotConfig.json", "utf-8"));

        const userData = this.getUserData();

        userData.lastDaily = this.lastDaily;
        userData.numDailies = this.numDailies;
        userData.totalBoars = this.totalBoars;
        userData.boarScore = this.boarScore;
        userData.favoriteBoar = this.favoriteBoar;
        userData.lastBoar = this.lastBoar;
        userData.firstDaily = this.firstDaily;
        userData.powerupsWon = this.powerupsWon;
        userData.boarStreak = this.boarStreak;
        userData.boarCollection = this.boarCollection;
        userData.powerups = this.powerups;
        userData.theme = this.theme;
        userData.themes = this.themes;
        userData.badges = this.badges;

        fs.writeFileSync(boarConfig.userDataFolder + this.user.id + ".json", JSON.stringify(userData));
    }

    public async addBoar(boarID: string, rarity: string, interactionType: string, inter: ChatInputCommandInteraction) {
        const boarConfig = JSON.parse(fs.readFileSync("BoarBotConfig.json", "utf-8"));

        const boarInfo = boarConfig.boarIDs[rarity][boarID];

        let boarEdition: number = 0;                 // Stores edition number of boar (only applies to specials/very specials)
        let attachmentTitle = boarConfig["daily-give"].dailyTitle; // Stores what the title of the embed should be
        // Stores image name of boar gotten by removing spaces in name
        const imagePath = boarInfo.file;
        // Stores if image is animated
        const isAnimated = boarInfo.file.endsWith(".gif");
        // Stores what image color should be behind the attachment based on rarity
        const imageColor = "DailyBackground" + rarity[0].toUpperCase() + rarity.substring(1);
        // Stores the buffer used for the attachment (is an array so its value can be manipulated in promises and listeners)
        const buffer: Buffer[] = [Buffer.from([0x00])];

        await addQueue(() => {
            const globalData = getGlobalData();

            // Sets edition number
            if (!globalData.editions[boarID])
                globalData.editions[boarID] = 0;
            boarEdition = ++globalData.editions[boarID];

            fs.writeFileSync(boarConfig.dataFolder + "GlobalData.json", JSON.stringify(globalData));
        }, inter.id + "global");

        // If the boar being added is a special boar, changes the title to reflect it
        if (rarity === "special") {
            attachmentTitle = boarConfig["daily-give"].specialGivenTitle;
        } else if (interactionType === "give") {
            attachmentTitle = boarConfig["daily-give"].givenTitle;
        }

        if (interactionType === "daily" && this.firstDaily === 0)
            this.firstDaily = Math.round(Date.now() / 1000);

        // Updates boar information
        if (!this.boarCollection[boarID]) {
            this.boarCollection[boarID] = {
                num: 0,
                editions: [],
                editionDates: [],
                firstObtained: Math.round(Date.now() / 1000),
                lastObtained: 0
            };
        }
        this.boarCollection[boarID].num++;
        this.boarCollection[boarID].lastObtained = Math.round(Date.now() / 1000);
        if (boarEdition <= 10 || rarity === "special") {
            this.boarCollection[boarID].editions.push(boarEdition);
            this.boarCollection[boarID].editionDates.push(Math.round(Date.now() / 1000));
        }
        this.lastBoar = boarID;

        // Updates score and total information
        this.boarScore += boarConfig.boarIDs[rarity].SCORE_VALUE;
        this.totalBoars++;

        this.updateUserData();

        // Creates a dynamic response attachment depending on the boar's image type
        if (isAnimated) {
            // Waits for python code to execute before continuing
            await new Promise((resolve, reject) => {
                // Sends python all dynamic image data
                pyshell.send("assets/" + imageColor + ".png," +
                    "assets/boars/" + imagePath + "," +
                    this.user.displayAvatarURL({ extension: "png" }) + "," +
                    boarInfo.name + "|" +
                    this.user.tag + "|" +
                    this.user.id + "|" +
                    attachmentTitle
                );

                const msgFunction = (data: string) => {
                    if (data.startsWith(this.user.id)) {
                        buffer[0] = Buffer.from(data.substring(data.indexOf(":") + 1), "base64");
                        pyshell.removeListener("message", msgFunction);
                        pyshell.removeListener("pythonError", errFunction);
                        resolve("Successful!");
                    }
                };

                const errFunction = (err: Error) => {
                    console.log("[\x1b[32mSAFE\x1b[0m] " + err.stack);
                    pyshell.removeListener("message", msgFunction);
                    pyshell.removeListener("pythonError", errFunction);
                    reject("Error!");
                };

                // Creates buffer from response
                pyshell.on("message", msgFunction);

                // Rejects if error thrown from python
                pyshell.on("pythonError", errFunction);
            });
        } else {
            const boarCanvas = Canvas.createCanvas(930,1080);
            const boarCtx = boarCanvas.getContext("2d");

            // Creating base attachment
            boarCtx.drawImage(await Canvas.loadImage("assets/" + imageColor + ".png"), 0, 0, boarCanvas.width, boarCanvas.height);
            boarCtx.drawImage(await Canvas.loadImage("assets/boars/" + imagePath), 27, 169, 885, 885);
            boarCtx.drawImage(await Canvas.loadImage("assets/DailyBackgroundBase.png"), 0, 0, boarCanvas.width, boarCanvas.height);

            boarCtx.font = '60px "Minecraft"';
            boarCtx.textAlign = "center";

            // Adding text to top of attachment
            boarCtx.fillStyle = "#dedede";
            boarCtx.fillText(attachmentTitle, 464, 82);
            boarCtx.font = '40px "Minecraft"';
            boarCtx.fillText(boarInfo.name, 464, 135);

            // Adding nameplate along with user's tag
            boarCtx.textAlign = "left";
            let userTag: string;
            if((userTag = this.user.tag).length > 23)
                userTag = userTag.substring(0, 17) + userTag.substring(userTag.indexOf("#"), userTag.length);
            boarCtx.drawImage(await Canvas.loadImage("assets/DailyBackgroundNameplate.png"), 102, 964, boarCtx.measureText(userTag).width + 120, 80);
            boarCtx.fillText(userTag, 200, 1020);

            // Adds user's avatar in a circle crop
            boarCtx.beginPath();
            boarCtx.arc(111, 969, 75, 0, Math.PI * 2, true);
            boarCtx.closePath();
            boarCtx.clip();
            boarCtx.drawImage(await Canvas.loadImage(this.user.displayAvatarURL({ extension: "png" })), 36, 894, 150, 150);

            buffer[0] = boarCanvas.toBuffer();
        }

        const attachment = await new AttachmentBuilder(buffer[0], { name: "unknown" + imagePath.substring(imagePath.indexOf(".")) });


        // If regular boar on "/boar daily", reply to interaction with attachment
        if (!inter.ephemeral) {
            await inter.editReply({ files: [attachment] });
            // "/boar give" used, so reply with success then send attachment separately
        } else {
            await inter.editReply(boarConfig["daily-give"].gaveBoar);
            await inter.channel?.send({ files: [attachment] });
        }
    }

    public async orderBoars(inter: ChatInputCommandInteraction) {
        const boarConfig = JSON.parse(fs.readFileSync("BoarBotConfig.json", "utf-8"));

        const boarRarities = Object.keys(boarConfig.boarIDs);
        const obtainedBoars = Object.keys(this.boarCollection);

        let numAllBoars: number = 0;

        for (const rarity of boarRarities)
            numAllBoars += Object.keys(boarConfig.boarIDs[rarity]).indexOf("SCORE_VALUE");

        // Looping through all boar classes (Common -> Very Special)
        for (const rarity of boarRarities.reverse()) {
            const orderedBoars: string[] = [];
            const boarsOfRarity = Object.keys(boarConfig.boarIDs[rarity]);

            // Looping through user's boar collection
            for (let j=0; j<obtainedBoars.length; j++) {
                const curBoarID = obtainedBoars[j]; // ID of current boar
                const curBoarData = this.boarCollection[curBoarID];    // Data of current boar

                // Removes boar from front and add it to the back of the list to refresh the order
                if (boarsOfRarity.includes(curBoarID) && !orderedBoars.includes(curBoarID)) {
                    delete this.boarCollection[curBoarID];
                    this.boarCollection[curBoarID] = curBoarData;

                    orderedBoars.push(curBoarID);
                    j--;
                }
            }
        }

        if (obtainedBoars.length >= numAllBoars)
            await this.addBadge("hunter", "obtained", inter);

        this.updateUserData();
    }

    public async addBadge(badgeID: string, interactionType: string, inter: ChatInputCommandInteraction) {
        const boarConfig = JSON.parse(fs.readFileSync("BoarBotConfig.json", "utf-8"));

        const badgeInfo = boarConfig.badgeIDs[badgeID];

        if (this.badges.includes(badgeID) && interactionType === "give") {
            await inter.editReply("This user already has this badge!");
            return;
        }

        if (this.badges.includes(badgeID) && interactionType !== "give")
            return;

        this.badges.push(badgeID);

        this.updateUserData();

        const badgeFile = badgeInfo.file;
        const attachmentTitle = interactionType === "give" ? boarConfig["daily-give"].badgeTitleGiven : boarConfig["daily-give"].badgeTitleObtained;
        // Stores the buffer used for the attachment (is an array so its value can be manipulated in promises and listeners)
        const buffer: Buffer[] = [Buffer.from([0x00])];

        const badgeCanvas = Canvas.createCanvas(930,1080);
        const badgeCtx = badgeCanvas.getContext("2d");

        // Creating base attachment
        badgeCtx.drawImage(await Canvas.loadImage("assets/DailyBackgroundSpecial.png"), 0, 0, badgeCanvas.width, badgeCanvas.height);
        badgeCtx.drawImage(await Canvas.loadImage("assets/BadgeBackground.png"), 0, 0, badgeCanvas.width, badgeCanvas.height);
        badgeCtx.drawImage(await Canvas.loadImage("assets/badges/" + badgeFile), 120, 250, 700, 700);
        badgeCtx.drawImage(await Canvas.loadImage("assets/DailyBackgroundBase.png"), 0, 0, badgeCanvas.width, badgeCanvas.height);

        badgeCtx.font = '60px "Minecraft"';
        badgeCtx.textAlign = "center";

        // Adding text to top of attachment
        badgeCtx.fillStyle = "#dedede";
        badgeCtx.fillText(attachmentTitle, 464, 82);
        badgeCtx.font = '40px "Minecraft"';
        badgeCtx.fillText(badgeInfo.name, 464, 135);

        // Adding nameplate along with user's tag
        badgeCtx.textAlign = "left";
        let userTag: string;
        if((userTag = this.user.tag).length > 23)
            userTag = userTag.substring(0, 17) + userTag.substring(userTag.indexOf("#"), userTag.length);
        badgeCtx.drawImage(await Canvas.loadImage("assets/DailyBackgroundNameplate.png"), 102, 964, badgeCtx.measureText(userTag).width + 120, 80);
        badgeCtx.fillText(userTag, 200, 1020);

        // Adds user's avatar in a circle crop
        badgeCtx.beginPath();
        badgeCtx.arc(111, 969, 75, 0, Math.PI * 2, true);
        badgeCtx.closePath();
        badgeCtx.clip();
        badgeCtx.drawImage(await Canvas.loadImage(this.user.displayAvatarURL({ extension: "png" })), 36, 894, 150, 150);

        buffer[0] = badgeCanvas.toBuffer();

        const attachment = await new AttachmentBuilder(buffer[0], { name: "unknown.png" });

        if (interactionType === "give") {
            await inter.editReply(boarConfig["daily-give"].gaveBadge);
            await inter.channel?.send({ files: [attachment] });
        } else {
            await inter.followUp({ files: [attachment] });
        }
    }
}