/***********************************************
* onGuildAdd.ts
* Weslay
*
* An event that runs once the bot is added to
* a server.
***********************************************/

import { AttachmentBuilder, AuditLogEvent, Guild } from "discord.js";
import fs from "fs";

module.exports = {
	name: 'guildCreate',
	async execute(guild: Guild) {
        if (!guild.members.me?.permissions.has("ViewAuditLog"))
            return;

        guild.fetchAuditLogs({ type: AuditLogEvent.BotAdd, limit: 1 }).then(log => {
            const firstEntry = log.entries.first();

            if (!(firstEntry && firstEntry.executor))
                return;

            firstEntry.executor.send({
                content:
                    "Hey, " + firstEntry.executor.username + "! Thanks for adding me to your server **" + guild.name +
                    "**!\n> To get started, run the command `/boar setup` in your server!",
                files: [new AttachmentBuilder(fs.readFileSync("assets/BoarBotThanks.png"))]
            });
        });
    }
};