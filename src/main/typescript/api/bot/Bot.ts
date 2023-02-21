/***********************************************
 * Bot.ts
 * An interface used to handle a new bot.
 *
 * Copyright 2023 WeslayCodes
 * License Info: http://www.apache.org/licenses/
 ***********************************************/

import {BotConfig} from '../../bot/config/BotConfig';
import {Command} from '../commands/Command';

//***************************************

export interface Bot {
    buildClient(): void;
    loadConfig(): void;
    getConfig(): BotConfig;
    setCommands(): void;
    getCommands(): Map<string, Command>;
    deployCommands(): void;
    registerListeners(): void;
    onStart(): void;
    login(): void;
}