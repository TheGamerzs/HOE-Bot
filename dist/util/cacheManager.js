"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const sql_1 = require("./sql");
class CacheManager {
    cache;
    constructor() {
        this.cache = {};
    }
    async setup(DB) {
        const products = await (0, sql_1.dbQuery)(DB, "SELECT * FROM `product`", []);
        const storages = await (0, sql_1.dbQuery)(DB, "SELECT * FROM `storage`", []);
        this.set("products", products);
        this.set("storages", storages);
    }
    get(key) {
        return this.cache[key];
    }
    set(key, value) {
        this.cache[key] = { data: value, timestamp: Date.now() };
    }
    delete(key) {
        delete this.cache[key];
    }
    clear() {
        this.cache = {};
    }
    async updateProducts(DB) {
        const products = await (0, sql_1.dbQuery)(DB, "SELECT * FROM `product`", []);
        this.set("products", products);
    }
    async updateStorages(DB) {
        const storages = await (0, sql_1.dbQuery)(DB, "SELECT * FROM `storage`", []);
        this.set("storages", storages);
    }
}
const cache = new CacheManager();
exports.default = cache;
