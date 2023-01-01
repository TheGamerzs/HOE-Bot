import {
	ApplicationCommandOption,
	ApplicationCommandOptionType,
	AutocompleteInteraction,
	ChatInputCommandInteraction,
	Client,
	GuildMemberRoleManager,
} from 'discord.js';
import { Connection } from 'mysql';
import cache from '../util/cacheManager';
import { dbQuery } from '../util/sql';

export const name = 'disableitem';
export const description = 'Disable an item from the database';
export const options: ApplicationCommandOption[] = [
	{
		name: 'item',
		description: 'The item to disable',
		type: ApplicationCommandOptionType.String,
		required: true,
		autocomplete: true,
	},
];

export const interaction = async (interaction: ChatInputCommandInteraction, bot: Client, DB: Connection) => {
	const roles = (interaction.member?.roles as GuildMemberRoleManager).cache;
	const staffRoles = ['Managers'];

	const item = interaction.options.getString('item', false);

	if (!roles.some((role) => staffRoles.includes(role.name))) {
		await interaction.reply({
			content: 'You do not have permission to use this command',
			ephemeral: true,
		});
		return;
	}

	if (!item) {
		await interaction.reply({
			content: 'Please provide an item to disable',
			ephemeral: true,
		});
		return;
	}

	let products = cache.get('products');
	if (products.timestamp + 3600000 < Date.now()) {
		console.log('Updating products cache');
		cache.updateProducts(DB);
		products = cache.get('products');
	}

	const product = products.data.find((product) => product.name === item);
	if (!product) {
		await interaction.reply({
			content: 'That item does not exist',
			ephemeral: true,
		});
		return;
	}

	await dbQuery(DB, 'UPDATE `product` SET `enabled` = 0 WHERE id = ?', [product.id]);

	await interaction.reply({
		content: `Successfully disabled ${item}`,
	});

	cache.updateProducts(DB);
};

export const autocomplete = async (interaction: AutocompleteInteraction, bot: Client, DB: Connection) => {
	let products = cache.get('products');
	if (products.timestamp + 3600000 < Date.now()) {
		console.log('Updating products cache');
		cache.updateProducts(DB);
		products = cache.get('products');
	}

	const item = interaction.options.getString('item', false);

	const enabledProducts = products.data.filter((product) => {
		return product.enabled && product.name.includes(item);
	});

	const choices = enabledProducts.map((product) => {
		return {
			name: product.name,
			value: product.name,
		};
	});

	await interaction.respond(choices);
};
