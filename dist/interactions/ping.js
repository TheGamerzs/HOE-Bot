"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.interaction = exports.options = exports.description = exports.name = void 0;
exports.name = "ping";
exports.description = "Pong!";
exports.options = [];
const interaction = async (interaction, bot, DB) => {
    interaction.reply(`Pong! ${bot.ws.ping}ms`);
};
exports.interaction = interaction;
