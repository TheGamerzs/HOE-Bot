// Custom cache

import { Connection } from "mysql";
import { dbQuery } from "./sql";

class CacheManager {
	private cache: CacheManagerType;

	constructor() {
		this.cache = {};
	}

	async setup(DB: Connection) {
		const products = await dbQuery(DB, "SELECT * FROM `product`", []);
		const storages = await dbQuery(DB, "SELECT * FROM `storage`", []);

		this.set("products", products);
		this.set("storages", storages);
	}

	public get(key: string | number) {
		return this.cache[key];
	}

	public set(key: string | number, value: any) {
		this.cache[key] = { data: value, timestamp: Date.now() };
	}

	public delete(key: string | number) {
		delete this.cache[key];
	}

	public clear() {
		this.cache = {};
	}

	public async updateProducts(DB: Connection) {
		const products = await dbQuery(DB, "SELECT * FROM `product`", []);
		this.set("products", products);
	}

	public async updateStorages(DB: Connection) {
		const storages = await dbQuery(DB, "SELECT * FROM `storage`", []);
		this.set("storages", storages);
	}
}

const cache = new CacheManager();

export default cache;
