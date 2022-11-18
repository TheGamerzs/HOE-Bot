// import messageEmbed from discord.js

import {
	EmbedAuthorOptions,
	EmbedBuilder,
	RGBTuple
} from "@discordjs/builders";

export const createEmbed = (
	title: string | null,
	description: string | null,
	color: number,
	author: EmbedAuthorOptions | null = null
) => {
	const embed = new EmbedBuilder()
		.setTitle(title)
		.setDescription(description)
		.setColor(color)
		.setAuthor(author);

	return embed;
};
