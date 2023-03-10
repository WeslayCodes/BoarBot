import dotenv from 'dotenv';
import fs from 'fs';
import {ActivityType, Client, GatewayIntentBits, Partials, TextChannel} from 'discord.js';
import {Bot} from '../api/bot/Bot';
import {FormatStrings} from '../util/discord/FormatStrings';
import {ConfigHandler} from './handlers/ConfigHandler';
import {CommandHandler} from './handlers/CommandHandler';
import {EventHandler} from './handlers/EventHandler';
import {BotConfig} from './config/BotConfig';
import {Command} from '../api/commands/Command';
import {Subcommand} from '../api/commands/Subcommand';
import {LogDebug} from '../util/logging/LogDebug';

dotenv.config();

/**
 * {@link BoarBot BoarBot.ts}
 *
 * Creates a {@link Bot bot}, logs it in, then finds where
 * all event and command handlers are. Loads
 * other configurations as well.
 *
 * @license {@link http://www.apache.org/licenses/ Apache-2.0}
 * @copyright WeslayCodes 2023
 */
export class BoarBot implements Bot {
	private client: Client = new Client({ intents:[] });
	private configHandler: ConfigHandler = new ConfigHandler;
	private commandHandler: CommandHandler = new CommandHandler();
	private eventHandler: EventHandler = new EventHandler();

	/**
	 * Creates the bot by loading and registering global information
	 */
	public async create(): Promise<void> {
		this.buildClient();

		await this.loadConfig();
		this.registerCommands();
		this.registerListeners();
		this.fixGuildData();

		await this.login();
		await this.onStart();
	}

	/**
	 * Builds the {@link Client} object with chosen options
	 */
	public buildClient(): void {
		this.client = new Client({
			partials: [
				Partials.Channel // For DM Reporting
			],
			intents: [
				GatewayIntentBits.Guilds,
				GatewayIntentBits.GuildMessages,
				GatewayIntentBits.GuildMessageReactions,
				GatewayIntentBits.GuildEmojisAndStickers,
				GatewayIntentBits.GuildMembers,
				GatewayIntentBits.MessageContent,
				GatewayIntentBits.DirectMessages
			]
		});
	}

	/**
	 * Returns the client object associated with the bot
	 */
	public getClient(): Client { return this.client; }

	/**
	 * Finds config file and pulls it into the code
	 */
	public async loadConfig(): Promise<void> { await this.configHandler.loadConfig(); }

	/**
	 * Returns config information that was gathered from config file
	 */
	public getConfig(): BotConfig { return this.configHandler.getConfig(); }

	/**
	 * Registers command and subcommand information from files
	 */
	public registerCommands(): void { this.commandHandler.registerCommands(); }

	/**
	 * Deploys both application and guild commands
	 */
	public async deployCommands(): Promise<void> { await this.commandHandler.deployCommands(); }

	/**
	 * Returns command information like name, execute function, and more
	 */
	public getCommands(): Map<string, Command> { return this.commandHandler.getCommands(); }

	/**
	 * Returns subcommand information like name and execute function
	 */
	public getSubcommands(): Map<string, Subcommand> { return this.commandHandler.getSubcommands(); }

	/**
	 * Registers event listeners from files
	 */
	public registerListeners() { this.eventHandler.registerListeners(); }

	/**
	 * Logs the bot in using token
	 */
	public async login(): Promise<void> {
		try {
			LogDebug.sendDebug('Logging in...', this.getConfig());
			await this.client.login(process.env.TOKEN);
		} catch {
			LogDebug.handleError('Client wasn\'t initialized or you used an invalid token!');
			process.exit(-1);
		}
	}

	/**
	 * Sends a status message on start
	 */
	public async onStart(): Promise<void> {
		LogDebug.sendDebug('Successfully logged in! Bot online!', this.getConfig());

		const botStatusChannel = await this.getStatusChannel();

		if (!botStatusChannel) return;

		try {
			await botStatusChannel.send(
				this.getConfig().stringConfig.botStatus +
				FormatStrings.toRelTime(Math.round(Date.now() / 1000))
			);
		} catch (err: unknown) {
			LogDebug.handleError(err);
		}

		LogDebug.sendDebug('Successfully sent status message!', this.getConfig());
	}

	/**
	 * Deletes empty guild files (Guild was in the process of setting bot up)
	 *
	 * @private
	 */
	private fixGuildData(): void {
		let guildDataFolder: string;
		let guildDataFiles: string[];

		try {
			guildDataFolder = this.getConfig().pathConfig.guildDataFolder;
			guildDataFiles = fs.readdirSync(guildDataFolder);
		} catch {
			LogDebug.handleError('Unable to find guild data directory provided in \'config.json\'!');
			process.exit(-1);
		}

		for (const guildData of guildDataFiles) {
			const data = JSON.parse(fs.readFileSync(guildDataFolder + guildData, 'utf-8'));

			if (Object.keys(data).length !== 0) continue;

			fs.rmSync(guildDataFolder + guildData);

			LogDebug.sendDebug('Deleted empty guild file: ' + guildData, this.getConfig());
		}

		LogDebug.sendDebug('Guild data fixed!', this.getConfig())
	}

	/**
	 * Finds the {@link TextChannel} to send status messages to
	 *
	 * @private
	 */
	private async getStatusChannel(): Promise<TextChannel | undefined> {
		const botStatusChannelID: string = this.getConfig().botStatusChannel;
		let botStatusChannel: TextChannel;

		try {
			botStatusChannel = await this.client.channels.fetch(botStatusChannelID) as TextChannel;
		} catch {
			LogDebug.handleError(
				'Bot cannot find status channel. Status message not sent.\nIs the channel ID \'' +
				botStatusChannelID + '\' correct? Does the bot have view channel permissions?'
			);
			return undefined;
		}

		const memberMe = botStatusChannel.guild.members.me;
		if (!memberMe) {
			LogDebug.handleError('Bot doesn\'t exist in testing server. Status message not sent.');
			return undefined;
		}

		const memberMePerms = memberMe.permissions.toArray();
		if (!memberMePerms.includes('SendMessages')) {
			LogDebug.handleError('Bot doesn\'t have permission to send status message. Status message not sent.');
			return undefined;
		}

		return botStatusChannel;
	}

}