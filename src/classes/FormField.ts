import { ActionRowBuilder, ButtonBuilder, ChatInputCommandInteraction, ModalSubmitInteraction, SelectMenuBuilder, SelectMenuInteraction } from "discord.js";

export class FormField {
    private readonly defaultContent: string;
    public content: string;
    public components: ActionRowBuilder<ButtonBuilder | SelectMenuBuilder>[];

    constructor(content: string, components: ActionRowBuilder<ButtonBuilder | SelectMenuBuilder>[]) {
        this.defaultContent = content;

        this.content = content;
        this.components = components ? components : [];
    }

    // Edits the reply to be this field
    public async editReply(interaction: ChatInputCommandInteraction | SelectMenuInteraction | ModalSubmitInteraction) {
        await interaction.editReply({
            content: this.content,
            components: [...this.components]
        });
    }

    public reset() {
        this.content = this.defaultContent;
    }
}