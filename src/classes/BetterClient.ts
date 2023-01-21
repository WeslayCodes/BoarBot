import {Client, ClientOptions, Collection} from "discord.js";

export class BetterClient extends Client {
    public commandList: Collection<string, any>;
    public subcommands: Collection<string, any>;
    public modals: Collection<string, any>;

    constructor(options: ClientOptions) {
        super(options);
        this.commandList = new Collection<string, any>();
        this.subcommands = new Collection<string, any>();
        this.modals = new Collection<string, any>();
    }
}