// Description: Giveaway command

import {
	ApplicationCommandOptionType,
	ButtonBuilder,
	ButtonInteraction,
	ButtonStyle,
	ChannelType,
	ChatInputCommandInteraction,
	Client,
	GuildMemberRoleManager,
	Role,
	TextChannel
} from "discord.js";

import { Connection } from "mysql";
import { createEmbed } from "../util/embeds";
import { dbQuery } from "../util/sql";
import { endGiveaway } from "../util/giveaway";

export const name = "giveaway";
export const description = "Create a giveaway";
export const options = [
	{
		name: "duration",
		description: "The duration of the giveaway",
		type: ApplicationCommandOptionType.Integer,
		required: true
	},
	{
		name: "prize",
		description: "The prize of the giveaway",
		type: ApplicationCommandOptionType.String,
		required: true
	},
	{
		name: "channel",
		description: "The channel to send the giveaway in",
		type: ApplicationCommandOptionType.Channel,
		required: true
	},
	{
		name: "message",
		description: "The message to send to the giveaway",
		type: ApplicationCommandOptionType.String,
		required: false
	},
	{
		name: "winners",
		description: "The amount of winners",
		type: ApplicationCommandOptionType.Integer,
		required: false
	},
	{
		name: "image",
		description: "The image of the giveaway",
		type: ApplicationCommandOptionType.String,
		required: false
	}
];

export const interaction = async (
	interaction: ChatInputCommandInteraction,
	bot: Client,
	DB: Connection
) => {
	const roles = (interaction.member?.roles as GuildMemberRoleManager).cache;
	const staffRoles = ["Managers"];

	const prize = interaction.options.getString("prize", false) || "";
	const duration = interaction.options.getInteger("duration", false) || 0;
	const channel = interaction.options.getChannel("channel", false);
	const message = interaction.options.getString("message", false) || "";
	const winners = interaction.options.getInteger("winners", false) || 1;
	const image = interaction.options.getString("image", false) || null;

	if (channel?.type !== ChannelType.GuildText) {
		return interaction.reply({
			content: "The channel must be a text channel.",
			ephemeral: true
		});
	}

	if (!prize) {
		return interaction.reply({
			content: "You need to specify a prize.",
			ephemeral: true
		});
	}

	if (!channel) {
		return interaction.reply({
			content: "You need to specify a channel.",
			ephemeral: true
		});
	}

	if (!duration) {
		return interaction.reply({
			content: "You need to specify a duration.",
			ephemeral: true
		});
	}

	const day = 86400;

	const durationEpoch = ~~(Date.now() / 1000) + duration * day;

	// Get the role ids from the server
	const staffRolesIds = staffRoles.map(role => {
		const roleObj = interaction.guild?.roles.cache.find((roleObj: Role) => {
			return roleObj.name === role;
		}) as Role;

		return roleObj.id;
	});

	// Check if the user has a staff role
	const hasStaffRole = staffRolesIds.some(roleId => {
		return roles.has(roleId);
	});

	// If the user doesn't have a staff role, return
	if (!hasStaffRole) {
		return interaction.reply({
			content: "You don't have permission to use this command.",
			ephemeral: true
		});
	}

	const giveaways = await dbQuery(
		DB,
		"SELECT * FROM `giveaway` WHERE `ended` = 0",
		[]
	);

	if (giveaways.length > 1) {
		return interaction.reply({
			content: "There are two giveaways active.",
			ephemeral: true
		});
	}

	const msgEmbed = createEmbed(null, null, 0x00ff00, {
		name: "Giveaway",
		iconURL: interaction.user.displayAvatarURL()
	});

	msgEmbed.addFields(
		{
			name: "Hosted By:",
			value: `<@${interaction.user.id}>`
		},
		{
			name: "Prize",
			value: prize
		},
		{
			name: "Duration",
			value: `Ends in: <t:${durationEpoch}:R>`
		},
		{
			name: "Winners",
			value: winners.toString()
		}
	);

	const joinBtn = new ButtonBuilder()
		.setLabel("Join")
		.setStyle(ButtonStyle.Success)
		.setCustomId("giveaway");

	const entriesBtn = new ButtonBuilder()
		.setLabel("Entries: 0")
		.setStyle(ButtonStyle.Primary)
		.setCustomId("giveaway-entries")
		.setDisabled(true);

	const msg = await (channel as TextChannel).send({
		content: message,
		embeds: [msgEmbed.setImage(image)],
		components: [
			{
				type: 1,
				components: [joinBtn, entriesBtn]
			}
		]
	});

	const giveaway = await dbQuery(
		DB,
		"INSERT INTO `giveaway` (`channelId`, `messageId`, `endTimestamp`, `winnerCount`, `prize`, `hostId`) VALUES (?, ?, ?, ?, ?, ?)",
		[channel.id, msg.id, durationEpoch, winners, prize, interaction.user.id]
	);

	interaction.reply({
		content: `Giveaway started in ${channel}.`
	});

	// Set a timeout to end the giveaway
	setTimeout(() => {
		endGiveaway(bot, giveaway.insertId, DB);
	}, duration * 1000 * day);
};

export const button = async (
	interaction: ButtonInteraction,
	bot: Client,
	DB: Connection
) => {
	const giveaway = await dbQuery(
		DB,
		"SELECT * FROM `giveaway` WHERE `messageId` = ? AND `ended` = 0",
		[interaction.message.id]
	);

	if (giveaway.length === 0) {
		return interaction.reply({
			content: "This giveaway has already ended.",
			ephemeral: true
		});
	}

	if (interaction.customId !== "giveaway") return;

	const userEntries = await dbQuery(
			DB,
			"SELECT * FROM `giveaway_entries` WHERE `giveaway` = ? AND `user` = ?",
			[giveaway[0].id, interaction.user.id]
		),
		entries = await dbQuery(
			DB,
			"SELECT count(id) FROM `giveaway_entries` WHERE `giveaway` = ?",
			[giveaway[0].id]
		);

	if (userEntries.length > 0) {
		return interaction.reply({
			content: "You have already entered this giveaway.",
			ephemeral: true
		});
	}

	await dbQuery(
		DB,
		"INSERT INTO `giveaway_entries` (`giveaway`, `user`) VALUES (?, ?)",
		[giveaway[0].id, interaction.user.id]
	);

	const joinBtn = new ButtonBuilder(
		interaction.message.components[0].components[0].data
	);

	const entriesBtn = new ButtonBuilder(
		interaction.message.components[0]?.components[1]?.data ?? {}
	).setLabel(`Entries: ${entries[0]["count(id)"] + 1}`);

	const channel = (await bot.channels.cache.get(
		giveaway[0].channelId
	)) as TextChannel;

	const message = await channel.messages.fetch(giveaway[0].messageId);

	await message.edit({
		components: [
			{
				type: 1,
				components: [joinBtn, entriesBtn]
			}
		]
	});

	await interaction.reply({
		content: "You have entered the giveaway.",
		ephemeral: true
	});
};
