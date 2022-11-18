import {
	ApplicationCommandOptionType,
	AutocompleteInteraction,
	ChatInputCommandInteraction,
	Client
} from "discord.js";

import { Connection } from "mysql";
import { createEmbed } from "../util/embeds";
import { dbQuery } from "../util/sql";
import { titleCase } from "../util/string";

export const name = "bxp";
export const description = "Order BXP";
export const options = [
	{
		name: "bonus",
		description: "The BXP you want to order",
		type: ApplicationCommandOptionType.String,
		required: true,
		autocomplete: true
	},
	{
		name: "amount",
		description: "The amount of the BXP you want to order",
		type: ApplicationCommandOptionType.Integer,
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

	const product = interaction.options.getString("bonus", true);
	const amount = interaction.options.getInteger("amount", true);
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
	let choices: any[] = [];

	if (option.name === "bonus") {
		const products = await dbQuery(
			DB,
			"SELECT * FROM `product` WHERE `type` = 'BXP'",
			[]
		);

		choices = products.map((product: { name: any }) => {
			return {
				name: product.name,
				value: product.name
			};
		});

		choices = choices.filter(choice =>
			choice.name.toLowerCase().startsWith(option.value.toLowerCase())
		);
	} else if (option.name === "amount") {
		const bonus = interaction.options.getString("bonus", true);

		const productData = await dbQuery(
			DB,
			"SELECT * FROM `product` WHERE `name` = ?",
			[bonus]
		);

		const product = productData[0];

		choices = [
			{
				name: `Limit: ${product.maximum}`,
				value: product.maximum
			}
		];
	}

	await interaction.respond(
		choices.map(choice => {
			return {
				name: choice.name,
				value: choice.value
			};
		})
	);
};
