/***********************************************
* ready.ts
* Weslay
*
* An event that runs once the bot is ready and
* online.
***********************************************/

import {Client, TextChannel} from 'discord.js'
import {sendDebug, handleError} from "../classes/GeneralFunctions";

module.exports = {
	name: 'ready',
	once: true,
	async execute (client: Client) {
		sendDebug("Bot ready!");

		try {
			const botStatusChannel = await client.channels.fetch("1042624481044209735") as TextChannel;

			await botStatusChannel.send("> Bot went online <t:" + Math.round(Date.now() / 1000) + ":R>");
		} catch (err: unknown) {
			await handleError(err, undefined);
			return;
		}
  	}
}
