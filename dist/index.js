"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const discord_js_1 = require("discord.js");
const db_1 = require("./db");
const cacheManager_1 = tslib_1.__importDefault(require("./util/cacheManager"));
const path_1 = require("path");
const fs_1 = require("fs");
const prefix = process.env.PREFIX || ">";
const bot = new discord_js_1.Client({
    intents: [
        discord_js_1.GatewayIntentBits.DirectMessages,
        discord_js_1.GatewayIntentBits.Guilds,
        discord_js_1.GatewayIntentBits.GuildBans,
        discord_js_1.GatewayIntentBits.GuildMessages,
        discord_js_1.GatewayIntentBits.MessageContent
    ]
});
const events = (0, fs_1.readdirSync)((0, path_1.join)(__dirname, "events")).map(file => {
    return require((0, path_1.join)(__dirname, "events", file));
});
events.forEach(event => {
    bot.on(event.name, event.run.bind(null, bot));
});
const interactions = (0, fs_1.readdirSync)((0, path_1.join)(__dirname, "interactions")).map(file => {
    return require((0, path_1.join)(__dirname, "interactions", file));
});
bot.on("messageCreate", async (message) => {
    if (message.author.bot)
        return;
    if (!message.content.startsWith(prefix))
        return;
    message.reply("This bot now uses slash commands. Please use /help to see a list of commands.");
});
bot.on("interactionCreate", async (interaction) => {
    if (!interaction.isCommand())
        return;
    const commandToRun = interactions.find(cmd => cmd.name === interaction.commandName);
    if (commandToRun) {
        await commandToRun.interaction(interaction, bot, db_1.connection);
    }
});
bot.on("interactionCreate", async (interaction) => {
    if (!interaction.isAutocomplete())
        return;
    const commandToRun = interactions.find(cmd => cmd.name === interaction.commandName);
    if (commandToRun) {
        await commandToRun.autocomplete(interaction, bot, db_1.connection);
    }
});
(async () => {
    await db_1.connection.connect();
    console.log("Connected to database");
    await cacheManager_1.default.setup(db_1.connection);
    console.log("Cached data");
    await bot.login(process.env.DISCORD_TOKEN);
    try {
        await bot.application?.commands.set(interactions.map(interaction => {
            return {
                name: interaction.name,
                description: interaction.description,
                options: interaction.options
            };
        }));
        console.log("Registered interactions");
    }
    catch (error) {
        console.error(error);
    }
})();
