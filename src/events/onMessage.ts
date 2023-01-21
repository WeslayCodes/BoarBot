/***********************************************
* onMessage.ts
* Weslay
*
* An event that runs when someone sends a
* message.
***********************************************/

import { Message } from "discord.js";

module.exports = {
	name: 'messageCreate',
	async execute(message: Message) {}
};