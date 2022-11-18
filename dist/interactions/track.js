"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.interaction = exports.options = exports.description = exports.name = void 0;
const discord_js_1 = require("discord.js");
const embeds_1 = require("../util/embeds");
const sql_1 = require("../util/sql");
const string_1 = require("../util/string");
exports.name = "track";
exports.description = "Track an order";
exports.options = [
    {
        name: "order",
        description: "The order to track",
        type: discord_js_1.ApplicationCommandOptionType.String,
        required: true
    }
];
const interaction = async (interaction, bot, DB) => {
    const orderId = interaction.options.getString("order", true);
    let Query = await (0, sql_1.dbQuery)(DB, "SELECT * FROM `order` WHERE `orderId` = ?", [
        orderId
    ]);
    if (!Query[0])
        return interaction.reply("Order not found");
    const order = Query[0];
    if (!order)
        return interaction.reply("Order not found");
    const embed = (0, embeds_1.createEmbed)(null, null, 0x00ff00, {
        name: "Order Information",
        iconURL: bot.user?.displayAvatarURL()
    });
    embed.addFields({
        name: "Order ID",
        value: order.orderId.toString()
    }, {
        name: "Customer",
        value: `<@${order.customer}>`
    }, {
        name: "Product",
        value: (0, string_1.titleCase)(order.product)
    }, {
        name: "Amount",
        value: order.amount.toString()
    }, {
        name: "Cost",
        value: `$${order.cost || "N/A"}`
    }, {
        name: "Status",
        value: order.status || "N/A"
    }, {
        name: "Progress",
        value: order.progress.toString() || "N/A"
    }, {
        name: "Grinder",
        value: order.grinder ? `<@${order.grinder}>` : "N/A"
    }, {
        name: "Storage",
        value: (0, string_1.titleCase)(order.storage || "None")
    });
    interaction.reply({ embeds: [embed] });
};
exports.interaction = interaction;
