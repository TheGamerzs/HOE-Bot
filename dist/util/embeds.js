"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createEmbed = void 0;
const builders_1 = require("@discordjs/builders");
const createEmbed = (title, description, color, author = null) => {
    const embed = new builders_1.EmbedBuilder()
        .setTitle(title)
        .setDescription(description)
        .setColor(color)
        .setAuthor(author);
    return embed;
};
exports.createEmbed = createEmbed;
