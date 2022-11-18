"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.interaction = exports.options = exports.description = exports.name = void 0;
const embeds_1 = require("../util/embeds");
const sql_1 = require("../util/sql");
const string_1 = require("../util/string");
exports.name = "orders";
exports.description = "View your current orders";
exports.options = [];
const interaction = async (interaction, bot, DB) => {
    const userId = interaction.user.id;
    let Query = await (0, sql_1.dbQuery)(DB, "SELECT * FROM `order` WHERE `customer` = ? AND `status` IN ('pending', 'in progress')", [userId]);
    if (!Query[0])
        return interaction.reply("You have no orders");
    const orders = Query;
    const embed = (0, embeds_1.createEmbed)(null, null, 0x00ff00, {
        name: interaction.user.username,
        iconURL: interaction.user.displayAvatarURL()
    });
    for (const order of orders) {
        const grinder = order.grinder ? `<@${order.grinder}>` : "Not Claimed";
        const storage = order.storage ?? "Not Given";
        const orderDescription = `**Product:** ${(0, string_1.titleCase)(order.product)}` +
            `\n**Amount:** ${order.amount}` +
            `\n**Status:** ${order.status}` +
            `\n**Cost:** $${order.cost}` +
            `\n**Storage:** ${storage}` +
            `\n**Priority**: ${order.priority ? "High" : "Normal"}` +
            `\n**Grinder:** ${grinder}`;
        embed.addFields({
            name: `Order ID: ${order.orderId}`,
            value: orderDescription,
            inline: true
        });
    }
    interaction.reply({ embeds: [embed] });
};
exports.interaction = interaction;
