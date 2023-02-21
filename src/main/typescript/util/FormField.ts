/***********************************************
 * FormField.ts
 * Handles each field of a linear form.
 *
 * Copyright 2023 WeslayCodes
 * License Info: http://www.apache.org/licenses/
 ***********************************************/

import {
    ActionRowBuilder, ButtonBuilder, ChatInputCommandInteraction,
    ModalSubmitInteraction, SelectMenuBuilder, SelectMenuInteraction
} from 'discord.js';

//***************************************

export class FormField {
    private readonly defaultContent: string;

    public content: string;
    public components: ActionRowBuilder<ButtonBuilder | SelectMenuBuilder>[];

    //***************************************

    /**
     * Create a field in a form
     * @param content - Message content in the form
     * @param components - Components (Buttons, Select Menus) in the form
     */
    constructor(content: string, components: ActionRowBuilder<ButtonBuilder | SelectMenuBuilder>[]) {
        this.defaultContent = content;

        this.content = content;
        this.components = components ? components : [];
    }

    //***************************************

    /**
     * Edits the reply to be this field
     * @param interaction - Interaction to be edited
     */
    public async editReply(interaction: ChatInputCommandInteraction | SelectMenuInteraction | ModalSubmitInteraction) {
        await interaction.editReply({
            content: this.content,
            components: [...this.components]
        });
    }

    //***************************************

    /**
     * Resets the field back to its original contents
     */
    public reset() {
        this.content = this.defaultContent;
    }
}