"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.autocomplete = exports.interaction = exports.options = exports.description = exports.name = void 0;
const discord_js_1 = require("discord.js");
const embeds_1 = require("../util/embeds");
const sql_1 = require("../util/sql");
const string_1 = require("../util/string");
exports.name = "bxp";
exports.description = "Order BXP";
exports.options = [
    {
        name: "bonus",
        description: "The BXP you want to order",
        type: discord_js_1.ApplicationCommandOptionType.String,
        required: true,
        autocomplete: true
    },
    {
        name: "amount",
        description: "The amount of the BXP you want to order",
        type: discord_js_1.ApplicationCommandOptionType.Integer,
        required: true,
        autocomplete: true
    },
    {
        name: "priority",
        description: "Choose if you want to order the product with priority",
        type: discord_js_1.ApplicationCommandOptionType.Boolean,
        required: false
    }
];
const interaction = async (interaction, bot, DB) => {
    const userId = interaction.user.id;
    const product = interaction.options.getString("bonus", true);
    const amount = interaction.options.getInteger("amount", true);
    const priority = interaction.options.getBoolean("priority", false);
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
    });
    interaction.reply({ embeds: [embed] });
};
exports.interaction = interaction;
const autocomplete = async (interaction, bot, DB) => {
    const option = interaction.options.getFocused(true);
    let choices = [];
    if (option.name === "bonus") {
        const products = await (0, sql_1.dbQuery)(DB, "SELECT * FROM `product` WHERE `type` = 'BXP'", []);
        choices = products.map((product) => {
            return {
                name: product.name,
                value: product.name
            };
        });
        choices = choices.filter(choice => choice.name.toLowerCase().startsWith(option.value.toLowerCase()));
    }
    else if (option.name === "amount") {
        const bonus = interaction.options.getString("bonus", true);
        const productData = await (0, sql_1.dbQuery)(DB, "SELECT * FROM `product` WHERE `name` = ?", [bonus]);
        const product = productData[0];
        choices = [
            {
                name: `Limit: ${product.maximum}`,
                value: product.maximum
            }
        ];
    }
    await interaction.respond(choices.map(choice => {
        return {
            name: choice.name,
            value: choice.value
        };
    }));
};
exports.autocomplete = autocomplete;
