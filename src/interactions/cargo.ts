import {
	ApplicationCommandOptionType,
	ApplicationCommandOptionWithChoicesAndAutocompleteMixin,
	AutocompleteInteraction,
	ChatInputCommandInteraction,
	Client
} from "discord.js";

import { Connection } from "mysql";
import cache from "../util/cacheManager";
import { createEmbed } from "../util/embeds";
import { dbQuery } from "../util/sql";
import { titleCase } from "../util/string";

export const name = "cargo";
export const description = "Order cargo products";
export const options = [
	{
		name: "product",
		description: "The product you want to order",
		type: ApplicationCommandOptionType.String,
		required: true,
		autocomplete: true
	},
	{
		name: "amount",
		description: "The amount of the product you want to order",
		type: ApplicationCommandOptionType.Integer,
		required: true,
		autocomplete: true
	},
	{
		name: "storage",
		description: "The storage you want to order the product to",
		type: ApplicationCommandOptionType.String,
		required: true,
		autocomplete: true
	},
	{
		name: "priority",
		description: "Choose if you want to order the product with priority",
		type: ApplicationCommandOptionType.Boolean,
		required: false
	}
];

export const interaction = async (
	interaction: ChatInputCommandInteraction,
	bot: Client,
	DB: Connection
) => {
	const userId = interaction.user.id;

	const product = interaction.options.getString("product", true);
	const amount = interaction.options.getInteger("amount", true);
	const storage = interaction.options.getString("storage", true);
	const priority = interaction.options.getBoolean("priority", false);

	const embed = createEmbed(null, null, 0x00ff00, {
		name: "Order Information",
		iconURL: bot.user?.displayAvatarURL()
	});

	embed.addFields(
		{
			name: "Customer",
			value: `<@${userId}>`
		},
		{
			name: "Product",
			value: titleCase(product)
		},
		{
			name: "Amount",
			value: amount.toString()
		},
		{
			name: "Storage",
			value: titleCase(storage)
		},
		{
			name: "Priority",
			value: priority ? "Yes" : "No"
		}
	);

	interaction.reply({ embeds: [embed] });
};

export const autocomplete = async (
	interaction: AutocompleteInteraction,
	bot: Client,
	DB: Connection
) => {
	const option = interaction.options.getFocused(true);
	let choices = [];

	if (option.name === "product") {
		let products = cache.get("products");

		if (products.timestamp + 3600000 < Date.now()) {
			console.log("Updating products cache");
			cache.updateProducts(DB);
			products = cache.get("products");
		}

		products = products.data.filter((product: any) => product.type === "Cargo");

		choices = products.map((product: any) => {
			return {
				name: product.name,
				value: product.name
			};
		});

		choices = choices.filter((choice: any) => {
			return choice.name.toLowerCase().includes(option.value.toLowerCase());
		});
	} else if (option.name === "amount") {
		const currentValue = interaction.options.getString("product", true);
		let productData = cache.get("products");

		if (productData.timestamp + 3600000 < Date.now()) {
			await cache.updateProducts(DB);
			productData = cache.get("products");
		}

		const productInfo = productData.data.find(
			(product: { name: any }) => product.name === currentValue
		);

		if (!productInfo) return interaction.respond([]);

		choices = [
			{
				name: `Limit: ${productInfo.maximum}`,
				value: productInfo.maximum
			}
		];
	} else if (option.name === "storage") {
		const currentValue = interaction.options.getString("storage", true);
		let storages = cache.get("storages");

		if (storages.timestamp + 3600000 < Date.now()) {
			await cache.updateStorages(DB);
			storages = cache.get("storages");
		}

		choices = storages.data.map((storage: any) => {
			return {
				name: storage.name,
				value: storage.name
			};
		});

		choices = choices.filter((choice: any) => {
			return choice.name.toLowerCase().includes(currentValue.toLowerCase());
		});
	}

	await interaction.respond(
		choices.map(choice => ({ name: choice.name, value: choice.value }))
	);
};
