"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.autocomplete = exports.interaction = exports.options = exports.description = exports.name = void 0;
const tslib_1 = require("tslib");
const discord_js_1 = require("discord.js");
const cacheManager_1 = tslib_1.__importDefault(require("../util/cacheManager"));
const embeds_1 = require("../util/embeds");
const string_1 = require("../util/string");
exports.name = "cargo";
exports.description = "Order cargo products";
exports.options = [
    {
        name: "product",
        description: "The product you want to order",
        type: discord_js_1.ApplicationCommandOptionType.String,
        required: true,
        autocomplete: true
    },
    {
        name: "amount",
        description: "The amount of the product you want to order",
        type: discord_js_1.ApplicationCommandOptionType.Integer,
        required: true,
        autocomplete: true
    },
    {
        name: "storage",
        description: "The storage you want to order the product to",
        type: discord_js_1.ApplicationCommandOptionType.String,
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
    const product = interaction.options.getString("product", true);
    const amount = interaction.options.getInteger("amount", true);
    const storage = interaction.options.getString("storage", true);
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
        name: "Storage",
        value: (0, string_1.titleCase)(storage)
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
    if (option.name === "product") {
        let products = cacheManager_1.default.get("products");
        if (products.timestamp + 3600000 < Date.now()) {
            console.log("Updating products cache");
            cacheManager_1.default.updateProducts(DB);
            products = cacheManager_1.default.get("products");
        }
        products = products.data.filter((product) => product.type === "Cargo");
        choices = products.map((product) => {
            return {
                name: product.name,
                value: product.name
            };
        });
        choices = choices.filter((choice) => {
            return choice.name.toLowerCase().includes(option.value.toLowerCase());
        });
    }
    else if (option.name === "amount") {
        const currentValue = interaction.options.getString("product", true);
        let productData = cacheManager_1.default.get("products");
        if (productData.timestamp + 3600000 < Date.now()) {
            await cacheManager_1.default.updateProducts(DB);
            productData = cacheManager_1.default.get("products");
        }
        const productInfo = productData.data.find((product) => product.name === currentValue);
        if (!productInfo)
            return interaction.respond([]);
        choices = [
            {
                name: `Limit: ${productInfo.maximum}`,
                value: productInfo.maximum
            }
        ];
    }
    else if (option.name === "storage") {
        const currentValue = interaction.options.getString("storage", true);
        let storages = cacheManager_1.default.get("storages");
        if (storages.timestamp + 3600000 < Date.now()) {
            await cacheManager_1.default.updateStorages(DB);
            storages = cacheManager_1.default.get("storages");
        }
        choices = storages.data.map((storage) => {
            return {
                name: storage.name,
                value: storage.name
            };
        });
        choices = choices.filter((choice) => {
            return choice.name.toLowerCase().includes(currentValue.toLowerCase());
        });
    }
    await interaction.respond(choices.map(choice => ({ name: choice.name, value: choice.value })));
};
exports.autocomplete = autocomplete;
