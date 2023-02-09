/************************************************
 * ConfigFunctions.ts
 * Functions and enums for the /boar config
 * command.
 *
 * Copyright 2023 WeslayCodes
 * License Info: http://www.apache.org/licenses/
 ***********************************************/

//***************************************

import {
    ActionRowBuilder,
    APISelectMenuOption,
    AttachmentBuilder, ButtonBuilder,
    ButtonInteraction,
    ButtonStyle,
    ChannelType,
    ChatInputCommandInteraction, SelectMenuBuilder,
    TextInputStyle
} from "discord.js";
import {drawImageCompact, drawLine} from '../CanvasFunctions';
import Canvas from 'canvas';


//***************************************

async function finishImage(
    config: any,
    interaction: ChatInputCommandInteraction | ButtonInteraction,
    canvasBase: Canvas.Canvas,
    currentBoarArray: any[],
    components: ActionRowBuilder<ButtonBuilder | SelectMenuBuilder>[]
) {
    const origin = config.numbers.general.originPos;
    const nums = config.numbers.collection;
    const imageSize = nums.imageSize;
    const boarsFolder = config.paths.assets.boars;
    const collectionAssets = config.paths.assets.collection;
    const collectionOverlay = collectionAssets.basePath + collectionAssets.overlay;
    const hexColors = config.hexColors;

    let attachment: AttachmentBuilder;

    const canvas = Canvas.createCanvas(imageSize[0], imageSize[1]);
    const ctx = canvas.getContext('2d');

    drawImageCompact(ctx, canvasBase, origin, imageSize);

    // Draws boars and rarities
    for (let i=0; i<currentBoarArray.length; i++) {
        const boarImagePos = [
            nums.boarStartX + (i % nums.boarCols) * nums.boarSpacingX,
            nums.boarStartY + Math.floor(i / nums.boarRows) * nums.boarSpacingY
        ];

        const lineStartPos = [
            nums.rarityStartX + (i % nums.boarCols) * nums.boarSpacingX,
            nums.rarityStartY + Math.floor(i / nums.boarRows) * nums.boarSpacingY
        ];

        const lineEndPost = [
            nums.rarityStartX + nums.rarityEndDiff + (i % nums.boarCols) * nums.boarSpacingX,
            nums.rarityStartY - nums.rarityEndDiff + Math.floor(i / nums.boarRows) * nums.boarSpacingY
        ];

        const boarFile = boarsFolder + currentBoarArray[i].file;

        drawImageCompact(ctx, await Canvas.loadImage(boarFile), boarImagePos, nums.boarSize);
        drawLine(ctx, lineStartPos, lineEndPost, nums.rarityWidth, hexColors[currentBoarArray[i].rarity]);
    }

    // Draws overlay
    drawImageCompact(ctx, await Canvas.loadImage(collectionOverlay), origin, imageSize);

    attachment = new AttachmentBuilder(canvas.toBuffer())

    await interaction.editReply({ files: [attachment], components: components });
}

//***************************************

export {
    finishImage
}