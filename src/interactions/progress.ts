// Description: Update a orders progress

import {
	ApplicationCommandOption,
	ApplicationCommandOptionChoiceData,
	ApplicationCommandOptionType,
	AutocompleteInteraction,
	ChatInputCommandInteraction,
	Client,
	TextChannel,
} from 'discord.js';

import { Connection } from 'mysql';
import { createEmbed } from '../util/embeds';
import { dbQuery } from '../util/sql';

export const name = 'progress';
export const description = 'Update the progress of an order';
export const options: ApplicationCommandOption[] = [
	{
		name: 'order',
		description: 'The order id',
		type: ApplicationCommandOptionType.Integer,

		required: true,
		autocomplete: true,
	},

	{
		name: 'progress',
		description: 'The progress of the order',
		type: ApplicationCommandOptionType.Integer,
		required: true,
		autocomplete: true,
	},
];

export const interaction = async (interaction: ChatInputCommandInteraction, bot: Client, DB: Connection) => {
	const order = interaction.options.getInteger('order', false);
	const progress = interaction.options.getInteger('progress', false);

	if (!order || !progress) return interaction.reply('Please select an order and progress first');

	const queryOrder = await dbQuery(DB, 'SELECT * FROM `order` WHERE `order_id` = ?', [order]);

	if (!queryOrder[0]) return interaction.reply('Order not found');

	const orderData = queryOrder[0] as Order;

	if (orderData.status !== 'in progress') return interaction.reply('This order is not in progress');

	if (orderData.grinder !== interaction.user.id) return interaction.reply('You are not the grinder of this order');

	if (progress > orderData.amount) return interaction.reply("The progress can't be higher than the amount");

	if (progress < 0) return interaction.reply("The progress can't be lower than 0");

	await dbQuery(DB, 'UPDATE `order` SET `progress` = ? WHERE `order_id` = ?', [progress, order]);

	interaction.reply(`Updated the progress of order #${order} to ${progress}`);

	const logChannel = bot.channels?.cache.get(process.env.LOG_CHANNEL as string) as TextChannel;

	if (logChannel)
		logChannel.send(`**${interaction.user.tag}** updated the progress of order **#${order}** to **${progress}**`);

	if (progress === orderData.amount) {
		await dbQuery(DB, "UPDATE `order` SET `status` = 'completed' WHERE `order_id` = ?", [order]);

		logChannel.send(`**${interaction.user.tag}** completed order **#${order}**`);

		let completedChannel = bot.channels?.cache.get(process.env.COMPLETED_CHANNEL as string) as TextChannel;

		const embed = createEmbed(`Order #${order} completed`, null, 0x00ff00);

		embed.addFields(
			{
				name: 'Order',
				value: `#${orderData.order_id}`,
				inline: true,
			},
			{
				name: 'Product',
				value: orderData.product,
				inline: true,
			},
			{
				name: 'Amount',
				value: orderData.amount.toString(),
				inline: true,
			},
			{
				name: 'Cost',
				value: `$${orderData.cost}`,
				inline: true,
			},
			{
				name: 'Grinder',
				value: `<@${orderData.grinder}> (${orderData.grinder})`,
			}
		);

		if (!completedChannel) {
			completedChannel = (await bot.channels.fetch(process.env.COMPLETED_CHANNEL as string)) as TextChannel;

			if (!completedChannel)
				return interaction.reply({
					content: `The order has been completed but the completed channel is wrong. Please contact <@1003786033546133566>`,
					ephemeral: true,
				});
		}

		completedChannel.send({ content: `<@${orderData.customer}>`, embeds: [embed] });
	}
};

export const autocomplete = async (interaction: AutocompleteInteraction, bot: Client, DB: Connection) => {
	const option = interaction.options.getFocused(true);
	let choices: ApplicationCommandOptionChoiceData[] = [];

	if (option.name === 'order') {
		const orders = (await dbQuery(
			DB,
			"SELECT * FROM `order` WHERE `status` = 'in progress' AND `grinder` = ? ORDER BY `order_id` DESC",
			[interaction.user.id]
		)) as Order[];

		for (const order of orders) {
			choices.push({
				name: `#${order.order_id} - ${order.product} - ${order.amount} - ${
					order.priority ? 'Priority' : 'Normal'
				}`,
				value: Number(order.order_id),
			});
		}

		return interaction.respond(choices);
	}

	if (option.name === 'progress') {
		const orderId = interaction.options.getInteger('order', false);

		if (!orderId)
			return interaction.respond([
				{
					name: 'Please select an order first',
					value: -1,
				},
			]);

		const orderData = await dbQuery(DB, 'SELECT * FROM `order` WHERE `order_id` = ?', [orderId]);

		const order = orderData[0] as Order;

		const amount = order.amount;
		const progress = order.progress;

		choices = [
			{
				name: `Current: ${progress}`,
				value: progress,
			},
			{
				name: `Amount: ${amount}`,
				value: amount,
			},
		];

		choices.map((choice) => {
			return {
				name: choice.name,
				value: choice.value,
			};
		});

		return interaction.respond(choices);
	}

	await interaction.respond(choices);
};
