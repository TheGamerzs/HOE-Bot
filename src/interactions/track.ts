// Description: Track an order using the order ID

import {
	ApplicationCommandOptionType,
	ChatInputCommandInteraction,
	Client
} from "discord.js";

import { Connection } from "mysql";
import { createEmbed } from "../util/embeds";
import { dbQuery } from "../util/sql";
import { titleCase } from "../util/string";

export const name = "track";
export const description = "Track an order";
export const options = [
	{
		name: "order",
		description: "The order to track",
		type: ApplicationCommandOptionType.String,
		required: true
	}
];

export const interaction = async (
	interaction: ChatInputCommandInteraction,
	bot: Client,
	DB: Connection
) => {
	const orderId = interaction.options.getString("order", true);

	let Query = await dbQuery(DB, "SELECT * FROM `order` WHERE `orderId` = ?", [
		orderId
	]);

	if (!Query[0]) return interaction.reply("Order not found");

	const order = Query[0] as Order;

	if (!order) return interaction.reply("Order not found");

	const embed = createEmbed(null, null, 0x00ff00, {
		name: "Order Information",
		iconURL: bot.user?.displayAvatarURL()
	});

	embed.addFields(
		{
			name: "Order ID",
			value: order.order_id.toString()
		},
		{
			name: "Customer",
			value: `<@${order.customer}>`
		},
		{
			name: "Product",
			value: titleCase(order.product)
		},
		{
			name: "Amount",
			value: order.amount.toString()
		},
		{
			name: "Cost",
			value: `$${order.cost || "N/A"}`
		},
		{
			name: "Status",
			value: order.status || "N/A"
		},
		{
			name: "Progress",
			value: order.progress.toString() || "N/A"
		},
		{
			name: "Grinder",
			value: order.grinder ? `<@${order.grinder}>` : "N/A"
		},
		{
			name: "Storage",
			value: titleCase(order.storage || "None")
		}
	);

	interaction.reply({ embeds: [embed] });
};
