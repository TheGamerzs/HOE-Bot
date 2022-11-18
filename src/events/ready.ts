import { Client } from "discord.js";

export const name = "ready";

export const run = (bot: Client) => {
	console.log(`Logged in as ${bot?.user?.tag}`);
};
