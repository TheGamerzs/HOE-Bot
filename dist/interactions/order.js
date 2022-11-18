"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.interaction = exports.options = exports.description = exports.name = void 0;
const discord_js_1 = require("discord.js");
const embeds_1 = require("../util/embeds");
const string_1 = require("../util/string");
exports.name = "order";
exports.description = "Order a product";
exports.options = [
    {
        name: "product",
        description: "The product you want to order",
        type: discord_js_1.ApplicationCommandOptionType.String,
        required: true
    },
    {
        name: "amount",
        description: "The amount of the product you want to order",
        type: discord_js_1.ApplicationCommandOptionType.Integer,
        required: true
    },
    {
        name: "priority",
        description: "Choose if you want to order the product with priority",
        type: discord_js_1.ApplicationCommandOptionType.Boolean,
        required: false
    },
    {
        name: "storage",
        description: "The storage you want to order the product to",
        type: discord_js_1.ApplicationCommandOptionType.String,
        required: false
    }
];
const interaction = async (interaction, bot, DB) => {
    const userId = interaction.user.id;
    const product = interaction.options.getString("product", true);
    const amount = interaction.options.getInteger("amount", true);
    const priority = interaction.options.getBoolean("priority", false);
    const storage = interaction.options.getString("storage", false);
    const embed = (0, embeds_1.createEmbed)(null, null, 0x00ff00, {
        name: "Order Information",
        iconURL: bot.user?.displayAvatarURL()
    });
    embed.addFields({
        name: "Customer",
        value: `<@${userId}>`
    }, {
        name: "Product",
        value: (0, string_1.titleCase)(product)
    }, {
        name: "Amount",
        value: amount.toString()
    }, {
        name: "Priority",
        value: priority ? "Yes" : "No"
    }, {
        name: "Storage",
        value: storage ? (0, string_1.titleCase)(storage) : "None"
    });
    interaction.reply({ embeds: [embed] });
};
exports.interaction = interaction;
