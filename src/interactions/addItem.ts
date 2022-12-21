import {
	ApplicationCommandOption,
	ApplicationCommandOptionType,
	ChatInputCommandInteraction,
	Client,
	GuildMemberRoleManager,
} from 'discord.js';
import { Connection } from 'mysql';
import { dbQuery } from '../util/sql';

export const name = 'additem';
export const description = 'Add a new item to the database';
export const options: ApplicationCommandOption[] = [
	{
		name: 'type',
		description: 'The type of item',
		type: ApplicationCommandOptionType.String,
		required: true,
		choices: [
			{
				name: 'Cargo',
				value: 'Cargo',
			},
			{
				name: 'BXP',
				value: 'BXP',
			},
		],
	},
	{
		name: 'name',
		description: 'The name of the item',
		type: ApplicationCommandOptionType.String,
		required: true,
	},
	{
		name: 'limit',
		description: 'The limit of the item',
		type: ApplicationCommandOptionType.Integer,
		required: true,
	},
	{
		name: 'cost',
		description: 'The cost of the item',
		type: ApplicationCommandOptionType.Integer,
		required: true,
	},
];

export const interaction = async (interaction: ChatInputCommandInteraction, bot: Client, DB: Connection) => {
	const roles = (interaction.member?.roles as GuildMemberRoleManager).cache;
	const staffRoles = ['Managers'];

	const type = interaction.options.getString('type', false);
	const name = interaction.options.getString('name', false);
	const limit = interaction.options.getInteger('limit', false);
	const cost = interaction.options.getInteger('cost', false);

	if (!roles.some((role) => staffRoles.includes(role.name))) {
		await interaction.reply({
			content: 'You do not have permission to use this command.',
			ephemeral: true,
		});
		return;
	}

	const result = await dbQuery(DB, 'INSERT INTO `product` (`type`, `name`, `maximum`, `value`) VALUES (?, ?, ?, ?)', [
		type,
		name,
		limit,
		cost,
	]);

	await interaction.reply({
		content: `Added item \`${name}\` to the database. ID: ${result.insertId}`,
	});
};
