"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.run = exports.name = void 0;
exports.name = "ready";
const run = (bot) => {
    console.log(`Logged in as ${bot?.user?.tag}`);
};
exports.run = run;
