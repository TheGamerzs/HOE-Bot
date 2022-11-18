// MYSQL Server

import * as mysql from "mysql";

import { config } from "dotenv";

config({
	path: ".env"
});

export const connection = mysql.createConnection({
	host: process.env.DB_HOST,
	user: process.env.DB_USER,
	password: process.env.DB_PASS,
	database: process.env.DB_NAME
});
