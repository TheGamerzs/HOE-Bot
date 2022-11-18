"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.interaction = exports.options = exports.description = exports.name = void 0;
const embeds_1 = require("../util/embeds");
const sql_1 = require("../util/sql");
const string_1 = require("../util/string");
exports.name = "current";
exports.description = "View your current grinding orders";
exports.options = [];
const interaction = async (interaction, bot, DB) => {
    const Query = await (0, sql_1.dbQuery)(DB, "SELECT * FROM `order` WHERE `status` = ? AND `grinder` = ?", ["in progress", interaction.user.id]);
    if (!Query[0])
        return interaction.reply("You have not claimed any orders");
    const embed = (0, embeds_1.createEmbed)(null, null, 0x00ff00, {
        name: "Current Grinding Orders",
        iconURL: interaction.user.displayAvatarURL()
    });
    for (const order of Query) {
        const orderData = order;
        embed.addFields({
            name: `Order ID: ${orderData.orderId}`,
            value: `Customer: <@${orderData.customer}>\nProduct: ${(0, string_1.titleCase)(orderData.product)}\nAmount: ${orderData.amount}\nCost: $${orderData.cost}`,
            inline: true
        });
    }
    interaction.reply({ embeds: [embed] });
};
exports.interaction = interaction;
