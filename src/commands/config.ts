/***********************************************
* config.ts
* Weslay
*
* Sets up the bot with style and channels.
***********************************************/

import {
    ActionRowBuilder,
    APISelectMenuOption,
    ButtonBuilder,
    ButtonInteraction,
    ButtonStyle,
    ChannelType,
    ChatInputCommandInteraction,
    ComponentType,
    Events,
    InteractionCollector,
    ModalBuilder,
    ModalSubmitInteraction,
    SelectMenuBuilder,
    SelectMenuInteraction,
    TextInputBuilder,
    TextInputStyle,
} from "discord.js";
import fs from "fs";
import { FormField } from "../classes/FormField";
import {hasAttachmentPerms, sendDebug} from "../classes/GeneralFunctions";

module.exports = {
    data: { name: "config" },
    async execute(interaction: ChatInputCommandInteraction) {
        // force ephemeral reply as nobody else needs to see configuration
        await interaction.deferReply({ ephemeral: true });

        // get message response strings and files
        const boarConfig = JSON.parse(
            fs.readFileSync("BoarBotConfig.json", "utf-8")
        );

        // first line of defense if the guild doesn't exist for some reason
        if (!interaction.guild) return;

        const guildID = interaction.guild.id;

        // only admins can run this command
        if (interaction.memberPermissions?.has("Administrator") || true) {
            let guildData: any;

            try {
                guildData = JSON.parse(
                    fs.readFileSync(boarConfig.guildDataFolder + guildID + ".json", "utf-8")
                );
            } catch (err: unknown) {
                if ((err as Error).message.startsWith("ENOENT")) {
                    fs.writeFileSync(boarConfig.guildDataFolder + guildID + ".json", "{}");

                    guildData = JSON.parse(
                        fs.readFileSync(boarConfig.guildDataFolder + guildID + ".json", "utf-8")
                    );
                } else {
                    throw err;
                }
            }

            // Stores response from user
            let isSBServer = false;
            let tradeChannelId: string = "";
            let boarChannels: string[] = ["", "", ""];

            // Field that gets trade channel
            const configFieldOne = new FormField(
                boarConfig.config.fieldOne.content.unfinished,
                [
                    new ActionRowBuilder<ButtonBuilder | SelectMenuBuilder>().setComponents(
                        new SelectMenuBuilder()
                            .setCustomId("config_trade_channel/" + interaction.id)
                            .setPlaceholder("UNSELECTED")
                            .setOptions(...getTextChannels(interaction))
                    ),
                    new ActionRowBuilder<ButtonBuilder | SelectMenuBuilder>().setComponents(
                        new ButtonBuilder()
                            .setCustomId("config_refresh_trade/" + interaction.id)
                            .setLabel("Refresh")
                            .setStyle(ButtonStyle.Primary)
                            .setDisabled(false),
                        new ButtonBuilder()
                            .setCustomId("config_find/" + interaction.id)
                            .setEmoji("📝")
                            .setStyle(ButtonStyle.Secondary)
                            .setDisabled(false),
                        new ButtonBuilder()
                            .setCustomId("config_trade_info/" + interaction.id)
                            .setEmoji("ℹ")
                            .setStyle(ButtonStyle.Primary)
                            .setDisabled(false)
                    ),
                    new ActionRowBuilder<ButtonBuilder | SelectMenuBuilder>().setComponents(
                        new ButtonBuilder()
                            .setCustomId("config_cancel/" + interaction.id)
                            .setLabel("Cancel")
                            .setStyle(ButtonStyle.Danger)
                            .setDisabled(false),
                        new ButtonBuilder()
                            .setCustomId("config_reset/" + interaction.id)
                            .setLabel("Restart")
                            .setStyle(ButtonStyle.Secondary)
                            .setDisabled(false),
                        new ButtonBuilder()
                            .setCustomId("config_next/" + interaction.id)
                            .setLabel("Next")
                            .setStyle(ButtonStyle.Primary)
                            .setDisabled(true)
                    )
                ]
            );

            // Field that gets boar channels
            const configFieldTwo = new FormField(
                boarConfig.config.fieldTwo.content.unfinished,
                [
                    new ActionRowBuilder<ButtonBuilder | SelectMenuBuilder>().setComponents(
                        new SelectMenuBuilder()
                            .setCustomId("config_boar_channel_1/" + interaction.id)
                            .setPlaceholder("UNSELECTED")
                            .setOptions(...getTextChannels(interaction))
                    ),
                    new ActionRowBuilder<ButtonBuilder | SelectMenuBuilder>().setComponents(
                        new SelectMenuBuilder()
                            .setCustomId("config_boar_channel_2/" + interaction.id)
                            .setPlaceholder("UNSELECTED")
                            .setOptions(...getTextChannels(interaction))
                    ),
                    new ActionRowBuilder<ButtonBuilder | SelectMenuBuilder>().setComponents(
                        new SelectMenuBuilder()
                            .setCustomId("config_boar_channel_3/" + interaction.id)
                            .setPlaceholder("UNSELECTED")
                            .setOptions(...getTextChannels(interaction))
                    ),
                    new ActionRowBuilder<ButtonBuilder | SelectMenuBuilder>().setComponents(
                        new ButtonBuilder()
                            .setCustomId("config_refresh_boar/" + interaction.id)
                            .setLabel("Refresh")
                            .setStyle(ButtonStyle.Primary)
                            .setDisabled(false),
                        new ButtonBuilder()
                            .setCustomId("config_find/" + interaction.id)
                            .setEmoji("📝")
                            .setStyle(ButtonStyle.Secondary)
                            .setDisabled(false),
                        new ButtonBuilder()
                            .setCustomId("config_boar_info/" + interaction.id)
                            .setEmoji("ℹ")
                            .setStyle(ButtonStyle.Primary)
                            .setDisabled(false)
                    ),
                    new ActionRowBuilder<ButtonBuilder | SelectMenuBuilder>().setComponents(
                        new ButtonBuilder()
                            .setCustomId("config_cancel/" + interaction.id)
                            .setLabel("Cancel")
                            .setStyle(ButtonStyle.Danger)
                            .setDisabled(false),
                        new ButtonBuilder()
                            .setCustomId("config_reset/" + interaction.id)
                            .setLabel("Restart")
                            .setStyle(ButtonStyle.Secondary)
                            .setDisabled(false),
                        new ButtonBuilder()
                            .setCustomId("config_next/" + interaction.id)
                            .setLabel("Next")
                            .setStyle(ButtonStyle.Primary)
                            .setDisabled(true)
                    )
                ]
            );

            // Field that gets if server is SB server or not
            const configFieldThree = new FormField(
                boarConfig.config.fieldThree.content.unfinished,
                [
                    new ActionRowBuilder<ButtonBuilder | SelectMenuBuilder>().setComponents(
                        new ButtonBuilder()
                            .setCustomId("config_explode_sb/" + interaction.id)
                            .setLabel("Yes")
                            .setStyle(ButtonStyle.Success)
                            .setDisabled(false),
                        new ButtonBuilder()
                            .setCustomId("config_explode_normal/" + interaction.id)
                            .setLabel("No")
                            .setStyle(ButtonStyle.Danger)
                            .setDisabled(false),
                        new ButtonBuilder()
                            .setCustomId("config_sb_info/" + interaction.id)
                            .setEmoji("ℹ")
                            .setStyle(ButtonStyle.Primary)
                            .setDisabled(false)
                    ),
                    new ActionRowBuilder<ButtonBuilder | SelectMenuBuilder>().setComponents(
                        new ButtonBuilder()
                            .setCustomId("config_cancel/" + interaction.id)
                            .setLabel("Cancel")
                            .setStyle(ButtonStyle.Danger)
                            .setDisabled(false),
                        new ButtonBuilder()
                            .setCustomId("config_reset/" + interaction.id)
                            .setLabel("Restart")
                            .setStyle(ButtonStyle.Secondary)
                            .setDisabled(false),
                        new ButtonBuilder()
                            .setCustomId("config_finish/" + interaction.id)
                            .setLabel("Finish")
                            .setStyle(ButtonStyle.Success)
                            .setDisabled(true)
                    )
                ]
            );

            let curField: number = 1;

            // Attempts to send first config message
            await configFieldOne.editReply(interaction)
                .catch((err) => {
                    try {
                        fs.rmSync(boarConfig.guildDataFolder + guildID + ".json");
                    } catch {
                        sendDebug(boarConfig.alreadyDeleted);
                    }
                    throw err;
                });

            // Only allows button presses from current interaction to affect results
            const filter = async (btnInt: ButtonInteraction | SelectMenuInteraction) => {
                return btnInt.customId.substring(btnInt.customId.indexOf("/") + 1) === interaction.id;
            };

            let collector: InteractionCollector<ButtonInteraction | SelectMenuInteraction>;

            // Attempts to create a collector in the current channel
            try {
                collector = interaction.channel?.createMessageComponentCollector({
                    filter,
                    idle: 120000
                }) as InteractionCollector<ButtonInteraction | SelectMenuInteraction>;
            } catch (err: unknown) {
                try {
                    fs.rmSync(boarConfig.guildDataFolder + guildID + ".json");
                } catch {
                    sendDebug(boarConfig.alreadyDeleted);
                }
                throw err;
            }

            // used to prevent collections from being processed too quickly, leading to
            // issues with double processing
            let timeUntilCollect: number = 0;
            // updates timeUntilCollect while a collection is being processed
            let updateTime: NodeJS.Timer;

            collector.on("collect", async (inter: SelectMenuInteraction) => {
                try {
                    // if the collection attempt was too quick, cancel it
                    if (Date.now() < timeUntilCollect) {
                        await inter.deferUpdate();
                        return;
                    }

                    timeUntilCollect = Date.now() + 500;
                    updateTime = setInterval(() => {
                        timeUntilCollect = Date.now() + 500;
                    }, 100);

                    sendDebug(`${interaction.user.tag}: ${inter.customId.split("/")[0]} on Field ${curField}`);

                    if (inter.customId === "config_find/" + interaction.id) {
                        if (curField === 1) {
                            const modal = new ModalBuilder()
                                .setCustomId("trade_config/" + inter.id)
                                .setTitle("Input Channel ID")

                            const channelInput = new TextInputBuilder()
                                .setCustomId("channelInput")
                                .setLabel("ID")
                                .setStyle(TextInputStyle.Short)
                                .setPlaceholder("012345678901234567")

                            const modalRow = new ActionRowBuilder<TextInputBuilder>().addComponents(channelInput);

                            modal.addComponents(modalRow);
                            await inter.showModal(modal);

                            inter.client.once(Events.InteractionCreate, async (i) => {
                                updateTime = setInterval(() => {
                                    timeUntilCollect = Date.now() + 500;
                                }, 100);

                                try {
                                    const submittedModal = i;
                                    if (!submittedModal.isModalSubmit() || submittedModal.customId !== "trade_config/" + inter.id || curField !== 1 || collector.ended) {
                                        clearInterval(updateTime);
                                        return;
                                    }

                                    await submittedModal.deferUpdate();

                                    const submittedChannelID = submittedModal.fields.getTextInputValue("channelInput");

                                    await submittedModal.guild?.channels.fetch();

                                    if (submittedModal.guild?.channels.cache.has(submittedChannelID) && !boarChannels.includes(submittedChannelID) && tradeChannelId !== submittedChannelID) {
                                        tradeChannelId = submittedChannelID;

                                        const submittedChannel = submittedModal.guild.channels.cache.get(submittedChannelID)
                                        const submittedChannelName = submittedChannel?.name;
                                        const submittedChannelParentName = submittedChannel?.parent ? submittedChannel?.parent.name.toUpperCase() : "NO CATEGORY";

                                        (configFieldOne.components[0].components[0] as SelectMenuBuilder)
                                            .setOptions(...getTextChannels(submittedModal, [tradeChannelId]))
                                            .setPlaceholder("#" + submittedChannelName + " [" + submittedChannelParentName + "]")
                                            .setDisabled(getTextChannels(submittedModal, [tradeChannelId])[0].label === "None");
                                        configFieldOne.content = boarConfig.config.fieldOne.content.finished + "<#" + tradeChannelId + ">";
                                        configFieldOne.components[2].components[2].setDisabled(false);
                    
                                        await configFieldOne.editReply(submittedModal);
                    
                                        // Handling updating boar channel select menus
                                        for (const row of (configFieldTwo.components.slice(0,3))) {
                                            (row.components[0] as SelectMenuBuilder)
                                                .setOptions(...getTextChannels(submittedModal, [tradeChannelId]))
                                                .setDisabled(getTextChannels(submittedModal, [tradeChannelId])[0].label === "None");
                                        }
                                    } else {
                                        await submittedModal.followUp({
                                            content: "That channel either doesn't exist or is already used.", 
                                            ephemeral: true
                                        });
                                    }
                                } catch (err: unknown) {
                                    console.log("[\x1b[32mSAFE\x1b[0m] " + (err as Error).stack);
                                    collector.stop("Inter Error");
                                }

                                clearInterval(updateTime);
                            });
                        }
                        if (curField == 2) {
                            const modal = new ModalBuilder()
                                .setCustomId("boar_channel_config/" + inter.id)
                                .setTitle("Input Channel ID")

                            const channelInput = new TextInputBuilder()
                                .setCustomId("channelInput")
                                .setLabel("ID")
                                .setStyle(TextInputStyle.Short)
                                .setPlaceholder("012345678901234567")

                            const modalRow = new ActionRowBuilder<TextInputBuilder>().addComponents(channelInput);

                            modal.addComponents(modalRow);
                            await inter.showModal(modal);

                            inter.client.once(Events.InteractionCreate, async (i) => {
                                updateTime = setInterval(() => {
                                    timeUntilCollect = Date.now() + 500;
                                }, 100);

                                try {
                                    const submittedModal = i;
                                    if (!submittedModal.isModalSubmit() || submittedModal.customId !== "boar_channel_config/" + inter.id || curField !== 2 || collector.ended) {
                                        clearInterval(updateTime);
                                        return;
                                    }

                                    await submittedModal.deferUpdate();

                                    const submittedChannelID = submittedModal.fields.getTextInputValue("channelInput");

                                    await submittedModal.guild?.channels.fetch();

                                    if (submittedModal.guild?.channels.cache.has(submittedChannelID) && !boarChannels.includes(submittedChannelID) && tradeChannelId !== submittedChannelID) {
                                        let selectIndex: number = 2;

                                        for (let i=0; i<2; i++) {
                                            if ((configFieldTwo.components[i].components[0] as SelectMenuBuilder).data.placeholder === "UNSELECTED") {
                                                selectIndex = i;
                                                break;
                                            }
                                        }

                                        boarChannels[selectIndex] = submittedChannelID;

                                        const submittedChannel = submittedModal.guild.channels.cache.get(submittedChannelID)
                                        const submittedChannelName = submittedChannel?.name;
                                        const submittedChannelParentName = submittedChannel?.parent ? submittedChannel?.parent.name.toUpperCase() : "NO CATEGORY";
                    
                                        // Handling updating boar channel info and select menus
                                        (configFieldTwo.components[selectIndex].components[0] as SelectMenuBuilder)
                                            .setPlaceholder("#" + submittedChannelName + " [" + submittedChannelParentName + "]");
                    
                                        for (const row of (configFieldTwo.components.slice(0,3))) {
                                            (row.components[0] as SelectMenuBuilder)
                                                .setOptions(...getTextChannels(submittedModal, boarChannels.concat(tradeChannelId)))
                                                .setDisabled(getTextChannels(submittedModal, boarChannels.concat(tradeChannelId))[0].label === "None");
                                        }

                                        let channelsString = "";

                                        for (const channel of boarChannels) {
                                            if (channel !== "")
                                                channelsString += "<#" + channel + "> ";
                                        }

                                        configFieldTwo.content = boarConfig.config.fieldTwo.content.finished + channelsString;
                                        configFieldTwo.components[4].components[2].setDisabled(false);
                    
                                        await configFieldTwo.editReply(submittedModal);
                                    } else {
                                        await submittedModal.followUp({
                                            content: "That channel either doesn't exist or is already used.", 
                                            ephemeral: true
                                        });
                                    }
                                } catch (err: unknown) {
                                    console.log("[\x1b[32mSAFE\x1b[0m] " + (err as Error).stack);
                                    collector.stop("Inter Error");
                                }

                                clearInterval(updateTime);
                            });
                        }

                        clearInterval(updateTime);
                        return;
                    }

                    await inter.deferUpdate();

                    // Go to the next field (can only go forward)

                    if (inter.customId === "config_next/" + interaction.id) {
                        if (curField === 1) {
                            curField = 2;
                            await configFieldTwo.editReply(inter);
                        }
                        else {
                            curField = 3;
                            await configFieldThree.editReply(inter);
                        }
                    }

                    // Reset progress in config

                    if (inter.customId === "config_reset/" + interaction.id) {
                        curField = 1;

                        isSBServer = false;

                        configFieldThree.reset();
                        configFieldThree.components[1].components[2].setDisabled(true);

                        await configFieldOne.editReply(interaction);
                    }
                    
                    // End collector with reason Cancelled on cancel

                    if (inter.customId === "config_cancel/" + interaction.id) {
                        collector.stop("Cancelled");
                    }

                    // End collector with reason Finished on finish

                    if (inter.customId === "config_finish/" + interaction.id) {
                        collector.stop("Finished");
                    }

                    // Enable the "Next" button when user decides on SkyBlock style

                    if (inter.customId === "config_explode_sb/" + interaction.id || inter.customId === "config_explode_normal/" + interaction.id) {
                        // Handling updating boar style
                        isSBServer = inter.customId.startsWith("config_explode_s");

                        configFieldThree.content = boarConfig.config.fieldThree.content.finished + (isSBServer ? "Yes" : "No");
                        configFieldThree.components[1].components[2].setDisabled(false);

                        await configFieldThree.editReply(inter);
                    }

                    // Refreshes select menu options and set placeholder for trade menu channel

                    if (inter.customId === "config_trade_channel/" + interaction.id) {
                        // Handling updating trade channel info and select menu
                        tradeChannelId = inter.values[0];

                        (configFieldOne.components[0].components[0] as SelectMenuBuilder)
                            .setOptions(...getTextChannels(inter, [tradeChannelId]))
                            .setPlaceholder(inter.component.options.filter(option => option.value === inter.values[0])[0].label)
                            .setDisabled(getTextChannels(inter, [tradeChannelId])[0].label === "None");
                        configFieldOne.content = boarConfig.config.fieldOne.content.finished + "<#" + tradeChannelId + ">";
                        configFieldOne.components[2].components[2].setDisabled(false);

                        await configFieldOne.editReply(inter);

                        // Handling updating boar channel select menus
                        for (const row of (configFieldTwo.components.slice(0,3))) {
                            (row.components[0] as SelectMenuBuilder)
                                .setOptions(...getTextChannels(inter, [tradeChannelId]))
                                .setDisabled(getTextChannels(inter, [tradeChannelId])[0].label === "None");
                        }
                    }

                    // Refreshes select menu options and set placeholder for chosen boar channel

                    if (inter.customId === "config_boar_channel_1/" + interaction.id ||
                        inter.customId === "config_boar_channel_2/" + interaction.id ||
                        inter.customId === "config_boar_channel_3/" + interaction.id
                    ) {
                        const selectIndex: number = parseInt(inter.customId.charAt(inter.customId.indexOf("/") - 1)) - 1;
                        boarChannels[selectIndex] = inter.values[0];

                        // Handling updating boar channel info and select menus
                        (configFieldTwo.components[selectIndex].components[0] as SelectMenuBuilder)
                            .setPlaceholder(inter.component.options.filter(option => option.value === inter.values[0])[0].label);

                        for (const row of (configFieldTwo.components.slice(0,3))) {
                            (row.components[0] as SelectMenuBuilder)
                                .setOptions(...getTextChannels(inter, boarChannels.concat(tradeChannelId)))
                                .setDisabled(getTextChannels(inter, boarChannels.concat(tradeChannelId))[0].label === "None");
                        }

                        let channelsString = "";

                        for (const channel of boarChannels) {
                            if (channel !== "")
                                channelsString += "<#" + channel + "> ";
                        }

                        configFieldTwo.content = boarConfig.config.fieldTwo.content.finished + channelsString;
                        configFieldTwo.components[4].components[2].setDisabled(false);

                        await configFieldTwo.editReply(inter);
                    }

                    // Unselects current trade option and updates all select menus with all channels available

                    if (inter.customId === "config_refresh_trade/" + interaction.id || inter.customId === "config_reset/" + interaction.id) {
                        // Handling updating trade channel info and select menus
                        tradeChannelId = "";
                        (configFieldOne.components[0].components[0] as SelectMenuBuilder)
                            .setOptions(...getTextChannels(inter, [tradeChannelId]))
                            .setPlaceholder("UNSELECTED")
                            .setDisabled(getTextChannels(inter, [tradeChannelId])[0].label === "None");
                        configFieldOne.content = boarConfig.config.fieldOne.content.unfinished;
                        configFieldOne.components[2].components[2].setDisabled(true);

                        if (inter.customId.startsWith("config_ref") || curField === 1)
                            await configFieldOne.editReply(inter);

                        // Handling updating boar channel select menus
                        for (const row of (configFieldTwo.components.slice(0,3))) {
                            (row.components[0] as SelectMenuBuilder)
                                .setOptions(...getTextChannels(inter, [tradeChannelId]))
                                .setDisabled(getTextChannels(inter, [tradeChannelId])[0].label === "None");
                        }
                    }

                    // Unselects all options and updates all select menus with all channels available

                    if (inter.customId === "config_refresh_boar/" + interaction.id || inter.customId === "config_reset/" + interaction.id) {
                        boarChannels = ["", "", ""]

                        // Handling updating boar channel info and select menus
                        for (const row of (configFieldTwo.components.slice(0,3))) {
                            (row.components[0] as SelectMenuBuilder)
                                .setOptions(...getTextChannels(inter, boarChannels.concat(tradeChannelId)))
                                .setPlaceholder("UNSELECTED")
                                .setDisabled(getTextChannels(inter, boarChannels.concat(tradeChannelId))[0].label === "None");
                        }

                        configFieldTwo.content = boarConfig.config.fieldTwo.content.unfinished;
                        configFieldTwo.components[4].components[2].setDisabled(true);

                        if (inter.customId.startsWith("config_ref"))
                            await configFieldTwo.editReply(inter);
                    }


                    // Info for the trade channel section

                    if (inter.customId === "config_trade_info/" + interaction.id) {
                        await inter.followUp({
                            content: boarConfig.config.tradeInfo,
                            ephemeral: true
                        });
                    }

                    // Info for the boar channels section

                    if (inter.customId === "config_boar_info/" + interaction.id) {
                        await inter.followUp({
                            content: boarConfig.config.boarChannelsInfo,
                            ephemeral: true
                        });
                    }

                    // Info for the skyblock section

                    if (inter.customId === "config_sb_info/" + interaction.id) {
                        await inter.followUp({
                            content: boarConfig.config.skyblockInfo,
                            ephemeral: true
                        });
                    }
                } catch (err: unknown) {
                    console.log("[\x1b[32mSAFE\x1b[0m] " + (err as Error).stack);
                    collector.stop("Inter Error");
                }

                clearInterval(updateTime);
            });

            collector.on("end", async (collected, reason) => {
                console.log(interaction.user.tag + " ended collection with reason \'" + reason + "\'.");

                try {
                    if (reason && reason === "Cancelled") {
                        if (Object.keys(guildData).length === 0) {
                            try {
                                fs.rmSync(boarConfig.guildDataFolder + guildID + ".json");
                            } catch {
                                console.log(boarConfig.alreadyDeleted);
                            }
                        }

                        await interaction.editReply({
                            content: boarConfig.config.cancelled,
                            files: [],
                            components: []
                        });
                    } else if (reason && reason === "Inter Error") {
                        if (Object.keys(guildData).length === 0) {
                            try {
                                fs.rmSync(boarConfig.guildDataFolder + guildID + ".json");
                            } catch {
                                console.log(boarConfig.alreadyDeleted);
                            }
                        }

                        await interaction.editReply({
                            content: boarConfig.config.error,
                            files: [],
                            components: []
                        });
                    } else if (reason && reason === "Finished") {
                        guildData = {
                            isSBServer: isSBServer,
                            tradeChannel: tradeChannelId,
                            channels: boarChannels.filter((ch) => ch !== "")
                        };

                        fs.writeFileSync(boarConfig.guildDataFolder + guildID + ".json", JSON.stringify(guildData));

                        await interaction.editReply({
                            content: boarConfig.config.finished + (hasAttachmentPerms(interaction) ? "" : "\n\n" + boarConfig.config.noAttachmentPerms),
                            components: []
                        });
                    } else {
                        if (Object.keys(guildData).length === 0) {
                            try {
                                fs.rmSync(boarConfig.guildDataFolder + guildID + ".json");
                            } catch {
                                console.log(boarConfig.alreadyDeleted);
                            }
                        }

                        await interaction.editReply({
                            content: boarConfig.config.expired,
                            files: [],
                            components: []
                        });
                    }
                } catch (err: unknown) {
                    console.log("[\x1b[32mSAFE\x1b[0m] " + (err as Error).stack);
                }
            });
        } else {
            await interaction.editReply(boarConfig.noPermission);
        }
    }
};

// Gets array of channel names and IDs for when selecting channels the bot
// should work in
function getTextChannels(
    interaction: ChatInputCommandInteraction |
    SelectMenuInteraction |
    ModalSubmitInteraction,
    blackList?: string[]
) {
    const channelOptions: APISelectMenuOption[] = [];

    try {
        const textChannels = interaction.guild?.channels.cache.filter(ch => ch.type === ChannelType.GuildText);
        textChannels?.forEach((txtCh) => {
            if (!blackList || (blackList && !blackList.includes(txtCh.id))) {
                channelOptions.push({
                    label: (
                        "#" + txtCh.name + " [" +
                        (txtCh.parent ? txtCh.parent.name.toUpperCase() : "NO CATEGORY") + "]").substring(0, 100),
                    value: txtCh.id
                })
            }
        });

        return channelOptions.length > 0 ? channelOptions.slice(0, 25) : [{ label: "None", value: "none" }];
    } catch {
        return [{ label: "None", value: "none" }];
    }
}