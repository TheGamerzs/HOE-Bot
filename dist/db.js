"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.connection = void 0;
const tslib_1 = require("tslib");
const mysql = tslib_1.__importStar(require("mysql"));
const dotenv_1 = require("dotenv");
(0, dotenv_1.config)({
    path: ".env"
});
exports.connection = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME
});
