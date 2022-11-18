import {
	ApplicationCommandOptionType,
	ChatInputCommandInteraction,
	Client
} from "discord.js";

import { Connection } from "mysql";
import { createEmbed } from "../util/embeds";
import { dbQuery } from "../util/sql";

export const name = "claim";
export const description = "Claim an order";
export const options = [
	{
		name: "order",
		description: "The order to claim",
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

	const Query = await dbQuery(DB, "SELECT * FROM `order` WHERE `orderId` = ?", [
		orderId
	]);

	if (!Query[0]) return interaction.reply("Order not found");

	const order = Query[0] as Order;

	if (order.status !== "pending")
		return interaction.reply("Order is already claimed");
	if (order.grinder) return interaction.reply("Order is already claimed");

	await dbQuery(
		DB,
		"UPDATE `order` SET `grinder` = ?, `status` = 'in progress' WHERE `orderId` = ?",
		[interaction.user.id, orderId]
	);

	const embed = createEmbed(null, "Order claimed", 0x00ff00, {
		name: "Order Information",
		iconURL: bot.user?.displayAvatarURL()
	});

	interaction.reply({ embeds: [embed] });
};
