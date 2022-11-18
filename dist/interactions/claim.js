"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.interaction = exports.options = exports.description = exports.name = void 0;
const discord_js_1 = require("discord.js");
const embeds_1 = require("../util/embeds");
const sql_1 = require("../util/sql");
exports.name = "claim";
exports.description = "Claim an order";
exports.options = [
    {
        name: "order",
        description: "The order to claim",
        type: discord_js_1.ApplicationCommandOptionType.String,
        required: true
    }
];
const interaction = async (interaction, bot, DB) => {
    const orderId = interaction.options.getString("order", true);
    const Query = await (0, sql_1.dbQuery)(DB, "SELECT * FROM `order` WHERE `orderId` = ?", [
        orderId
    ]);
    if (!Query[0])
        return interaction.reply("Order not found");
    const order = Query[0];
    if (order.status !== "pending")
        return interaction.reply("Order is already claimed");
    if (order.grinder)
        return interaction.reply("Order is already claimed");
    await (0, sql_1.dbQuery)(DB, "UPDATE `order` SET `grinder` = ?, `status` = 'in progress' WHERE `orderId` = ?", [interaction.user.id, orderId]);
    const embed = (0, embeds_1.createEmbed)(null, "Order claimed", 0x00ff00, {
        name: "Order Information",
        iconURL: bot.user?.displayAvatarURL()
    });
    interaction.reply({ embeds: [embed] });
};
exports.interaction = interaction;
