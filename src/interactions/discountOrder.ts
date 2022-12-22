import {
	ApplicationCommandOption,
	ApplicationCommandOptionType,
	ChatInputCommandInteraction,
	Client,
	GuildMemberRoleManager,
} from 'discord.js';
import { Connection } from 'mysql';
import { dbQuery } from '../util/sql';

export const name = 'discountorder';
export const description = 'Discount an order';
export const options: ApplicationCommandOption[] = [
	{
		name: 'order',
		description: 'The ID of the order',
		type: ApplicationCommandOptionType.Integer,
		required: true,
	},
	{
		name: 'discount',
		description: 'The discount to apply',
		type: ApplicationCommandOptionType.Integer,
		required: true,
	},
];

export const interaction = async (interaction: ChatInputCommandInteraction, bot: Client, DB: Connection) => {
	const roles = ((interaction.member?.roles ?? []) as GuildMemberRoleManager)?.cache;
	const staffRoles = ['Managers'];

	const orderID = interaction.options.getInteger('order', false);
	const discount = interaction.options.getInteger('discount', false);

	if (!roles.some((role) => staffRoles.includes(role.name))) {
		await interaction.reply({
			content: 'You do not have permission to use this command.',
			ephemeral: true,
		});
		return;
	}

	if (orderID === null || discount === null) {
		await interaction.reply({
			content: 'Invalid arguments.',
			ephemeral: true,
		});
		return;
	}

	const order = await dbQuery(DB, 'SELECT * FROM `order` WHERE `order_id` = ?', [orderID]);

	if (order.length === 0) {
		await interaction.reply({
			content: 'Invalid order ID.',
			ephemeral: true,
		});
		return;
	}

	const compensation = await dbQuery(DB, 'SELECT * FROM `compensation` WHERE `order_id` = ?', [orderID]);

	if (compensation.length > 0) {
		await interaction.reply({
			content: 'This order has already been discounted.',
			ephemeral: true,
		});
		return;
	}

	const Order = order[0] as Order;

	const newTotal = Number(Order.cost) * (1 - discount / 100);

	await dbQuery(DB, 'UPDATE `order` SET `cost` = ? WHERE `order_id` = ?', [newTotal, orderID]);

	await dbQuery(
		DB,
		'INSERT INTO `compensation` (`order_id`, `grinder`, `discount_id`, `amount`) VALUES (?, ?, ?, ?)',
		[orderID, order[0].grinder || null, '-1', Number(Order.cost) - newTotal]
	);

	await interaction.reply({
		content: `Order ${orderID} has been discounted by ${discount}%`,
	});
};
