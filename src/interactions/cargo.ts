// Description: Create a Cargo Order

import {
	ApplicationCommandOptionChoiceData,
	ApplicationCommandOptionType,
	AutocompleteInteraction,
	ButtonBuilder,
	ButtonInteraction,
	ButtonStyle,
	ChatInputCommandInteraction,
	Client,
	ComponentType,
	EmbedBuilder,
	GuildMemberRoleManager,
	TextChannel
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
	const roles = (interaction.member?.roles as GuildMemberRoleManager).cache;

	const product = interaction.options.getString("product", true);
	const amount = interaction.options.getInteger("amount", true);
	const storage = interaction.options.getString("storage", true);
	const priority = interaction.options.getBoolean("priority", false);

	let products = cache.get("products"),
		storages = cache.get("storages");

	if (products.timestamp + 3600000 < Date.now()) {
		console.log("Updating products cache");
		cache.updateProducts(DB);
		products = cache.get("products");
	}

	if (storages.timestamp + 3600000 < Date.now()) {
		console.log("Updating storages cache");
		cache.updateStorages(DB);
		storages = cache.get("storages");
	}

	if (
		!storages.data.filter(
			(storageData: any) => storageData.name === storage
		)?.[0]
	) {
		return interaction.reply({
			content: "The storage you selected does not exist",
			ephemeral: true
		});
	}

	const productData = products.data.filter(
		(productData: any) => productData.name === product
	)?.[0];

	if (!productData) {
		return interaction.reply({
			content: "The product you selected does not exist",
			ephemeral: true
		});
	}

	const VIPRole = interaction.guild?.roles.cache.find(
			role => role.name === "VIP Customer"
		),
		CustomerRole = interaction.guild?.roles.cache.find(
			role => role.name === "Customer"
		),
		UnlimtedRole = interaction.guild?.roles.cache.find(
			role => role.name === "Unlimited"
		);

	if (!roles.has(CustomerRole?.id!)) {
		return interaction.reply({
			content: "You need to be a customer to order cargo",
			ephemeral: true
		});
	}

	//Check if the  amount is valid
	if (amount < 1) {
		return interaction.reply({
			content: "The amount needs to be at least 1",
			ephemeral: true
		});
	}

	if (amount > productData.maximum) {
		return interaction.reply({
			content: `The maximum amount of this product is ${productData.maximum}`,
			ephemeral: true
		});
	}

	// Check if the user has pending or in progress orders
	const pendingOrders = await dbQuery(
		DB,
		"SELECT count(8) FROM `order` WHERE customer LIKE ? AND status IN ('pending', 'in progress')",
		[userId]
	);
	const pendingOrdersCount = pendingOrders[0]["count(8)"] ?? 0;

	// Allow VIPs to have 5 orders and normal customers 3
	if (roles.has(UnlimtedRole?.id!)) {
		//Ignore Check
	} else if (!roles.has(VIPRole?.id!) && pendingOrdersCount >= 3) {
		return interaction.reply({
			content: "You can only have 3 active orders at once",
			ephemeral: true
		});
	} else if (roles.has(VIPRole?.id!) && pendingOrdersCount >= 5) {
		return interaction.reply({
			content: "You can only have 5 active orders at once",
			ephemeral: true
		});
	}

	let finalPrice = productData.value * amount;

	if (priority) finalPrice = Math.round(finalPrice * 1.15);

	//TODO: Get Discounts

	// Create the order
	const order = await dbQuery(
		DB,
		"INSERT INTO `order` (customer, product, amount, priority, cost, storage) VALUES (?, ?, ?, ?, ?, ?)",
		[userId, product, amount, priority, finalPrice, storage]
	);

	const embed = createEmbed(null, null, 0x00ff00, {
		name: "Order Information",
		iconURL: bot.user?.displayAvatarURL()
	});

	embed.addFields(
		{
			name: "Order ID",
			value: order.insertId.toString()
		},
		{
			name: "Product",
			value: titleCase(product)
		},
		{ name: "Amount", value: amount.toString() },
		{ name: "Storage", value: titleCase(storage) },
		{ name: "Price", value: `$${finalPrice.toString()}` },
		{ name: "Priority", value: priority ? "Yes" : "No" }
	);

	const orderChannel = interaction.guild?.channels.cache.find(
			channel => channel.id === process.env.CARGO_ORDERS_CHANNEL
		) as TextChannel,
		ordersChannel = interaction.guild?.channels.cache.find(
			channel => channel.id === process.env.ORDERS_CHANNEL
		) as TextChannel;

	const orderEmbed = new EmbedBuilder(embed.data).setAuthor({
		name: `${interaction.user.username}#${interaction.user.discriminator}`,
		iconURL: interaction.user.displayAvatarURL()
	});

	// Claim the order button
	const claimBtn = new ButtonBuilder()
		.setLabel("Claim")
		.setStyle(ButtonStyle.Primary)
		.setCustomId(`bxp`);

	const orderMsg = await orderChannel.send({
		embeds: [orderEmbed],
		components: [
			{
				type: ComponentType.ActionRow,
				components: [claimBtn]
			}
		]
	});
	ordersChannel.send({
		embeds: [orderEmbed]
	});

	await dbQuery(DB, "UPDATE `order` SET messageid = ? WHERE order_id = ?", [
		orderMsg.id,
		order.insertId
	]);

	interaction.reply({ embeds: [embed] });
};

export const autocomplete = async (
	interaction: AutocompleteInteraction,
	bot: Client,
	DB: Connection
) => {
	const option = interaction.options.getFocused(true);
	let choices: ApplicationCommandOptionChoiceData[] = [];

	if (option.name === "product") {
		let products = cache.get("products");

		if (products.timestamp + 3600000 < Date.now()) {
			console.log("Updating products cache");
			cache.updateProducts(DB);
			products = cache.get("products");
		}

		const cargoProducts = products.data.filter(
			(product: any) => product.type === "Cargo"
		);

		choices = cargoProducts.map((product: any) => {
			return {
				name: product.name,
				value: product.name
			};
		});

		choices = choices.filter((choice: any) => {
			return choice.name.toLowerCase().includes(option.value.toLowerCase());
		});
	} else if (option.name === "amount") {
		const currentValue = interaction.options.getString("product", false) ?? "";
		if (!currentValue)
			return interaction.respond([
				{ name: "Please select a product first", value: -1 }
			]);
		let productData = cache.get("products");

		if (productData.timestamp + 3600000 < Date.now()) {
			await cache.updateProducts(DB);
			productData = cache.get("products");
		}

		const productInfo = productData.data.find(
			product => product.name === currentValue
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

		choices = storages.data.map(storage => {
			return {
				name: storage.name,
				value: storage.name
			};
		});

		choices = choices.filter(choice => {
			return choice.name.toLowerCase().includes(currentValue.toLowerCase());
		});
	}

	await interaction.respond(
		choices.map(choice => ({ name: choice.name, value: choice.value }))
	);
};

export const button = async (
	interaction: ButtonInteraction,
	bot: Client,
	DB: Connection
) => {
	const Query = await dbQuery(DB, "SELECT * FROM `order` WHERE messageid = ?", [
		interaction.message.id
	]);

	if (!Query[0])
		return interaction.reply({ content: "Order not found", ephemeral: true });

	const order = Query[0] as Order;

	if (order.status !== "pending")
		return interaction.reply({
			content: "Order is already claimed",
			ephemeral: true
		});
	if (order.grinder)
		return interaction.reply({
			content: "Order is already claimed",
			ephemeral: true
		});

	await dbQuery(
		DB,
		"UPDATE `order` SET `grinder` = ?, `status` = 'in progress' WHERE `order_id` = ?",
		[interaction.user.id, order.order_id]
	);

	// Delete order message
	await interaction.message.delete();

	await interaction.reply({
		content: "Order claimed",
		ephemeral: true
	});
};
