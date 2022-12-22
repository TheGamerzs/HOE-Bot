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

	const orderData = await dbQuery(DB, 'SELECT * FROM `order` WHERE `order_id` = ?', [order]);

	if (orderData[0].status !== 'in progress') return interaction.reply('This order is not in progress');

	if (orderData[0].grinder !== interaction.user.id) return interaction.reply('You are not the grinder of this order');

	if (progress > orderData[0].amount) return interaction.reply("The progress can't be higher than the amount");

	if (progress < 0) return interaction.reply("The progress can't be lower than 0");

	await dbQuery(DB, 'UPDATE `order` SET `progress` = ? WHERE `order_id` = ?', [progress, order]);

	interaction.reply('Updated the progress of the order');

	const logChannel = bot.channels?.cache.get(process.env.LOG_CHANNEL as string) as TextChannel;

	if (logChannel)
		logChannel.send(`**${interaction.user.tag}** updated the progress of order **#${order}** to **${progress}**`);

	if (progress === orderData[0].amount) {
		await dbQuery(DB, "UPDATE `order` SET `status` = 'completed' WHERE `order_id` = ?", [order]);

		logChannel.send(`**${interaction.user.tag}** completed order **#${order}**`);

		const completedChannel = bot.channels?.cache.get(process.env.COMPLETED_CHANNEL as string) as TextChannel;

		const embed = createEmbed(`Order #${order} completed`, null, 0x00ff00);

		embed.addFields(
			{
				name: 'Order',
				value: `#${orderData[0].id}`,
				inline: true,
			},
			{
				name: 'Product',
				value: orderData[0].product,
				inline: true,
			},
			{
				name: 'Amount',
				value: orderData[0].amount,
				inline: true,
			},
			{
				name: 'Cost',
				value: `$${orderData[0].cost}`,
				inline: true,
			},
			{
				name: 'Grinder',
				value: `<@${orderData[0].grinder}> (${orderData[0].grinder})`,
			}
		);

		if (!completedChannel)
			return interaction.reply({
				content: `The order has been completed but the completed channel is wrong. Please contact <@1003786033546133566>`,
				ephemeral: true,
			});

		completedChannel.send({ embeds: [embed] });
	}
};

export const autocomplete = async (interaction: AutocompleteInteraction, bot: Client, DB: Connection) => {
	const option = interaction.options.getFocused(true);
	let choices: ApplicationCommandOptionChoiceData[] = [];

	if (option.name === 'order') {
		const orders = await dbQuery(
			DB,
			"SELECT * FROM `order` WHERE `status` = 'in progress' AND `grinder` = ? ORDER BY `order_id` DESC",
			[interaction.user.id]
		);

		for (const order of orders) {
			choices.push({
				name: `#${order.id} - ${order.product} - ${order.amount} - ${order.priority ? 'Priority' : 'Normal'}`,
				value: order.id,
			});
		}

		return interaction.respond(
			choices.filter((choice) =>
				choice.value.toString().startsWith(interaction.options.getString('order', false) as string)
			)
		);
	}

	if (option.name === 'progress') {
		const order = interaction.options.getInteger('order', false);

		if (!order)
			return interaction.respond([
				{
					name: 'Please select a bonus first',
					value: -1,
				},
			]);

		const orderData = await dbQuery(DB, 'SELECT * FROM `order` WHERE `order_id` = ?', [order]);

		const amount = orderData[0].amount;
		const progress = orderData[0].progress;

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
