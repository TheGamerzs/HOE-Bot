/* eslint-disable no-unused-vars */
type Order = {
	length: number;

	// Order ID
	order_id: string;

	// Customer ID
	customer: string;

	// Product
	product: string;

	// Amount
	amount: number;

	// Storage
	storage?: string;

	// Cost
	cost: string;

	// Message ID
	messageid: string;

	// Progress
	progress: number;

	// Grinder ID
	grinder: string;

	// Status
	status: string;

	// Priority
	priority?: number;

	// Discount ID
	discount_id?: string;

	// Order Timestamp
	orderTimestamp: number;

	// Claim Timestamp
	claimTimestamp?: number;

	// Completed Timestamp
	completedTimestamp?: number;

	// Delivered Timestamp
	deliveredTimestamp?: number;
};

type Product = {
	// Product ID
	id: number;

	// Product Name
	name: string;

	// Product Maxiumum
	maximum: number;

	// Product Value
	value: number;

	// Product type
	type: string;
};

type Storage = {};

type DBItem = Product | Storage;

type CacheManagerType = {
	// Cache Item
	[key: string]: {
		// Cache Data
		data: Array<DBItem>;

		// Cache Timestamp
		timestamp: number;
	};
};

type Giveaway = {
	// Giveaway ID
	id: number;

	// Giveaway Channel ID
	channelId: string;

	// Giveaway Message ID
	messageId: string;

	// Giveaway End Timestamp
	endTimestamp: number;

	// Giveaway Winner Count
	winnerCount: number;

	// Giveaway Winners
	winners: Array<string>;

	// Giveaway Ended
	ended: boolean;

	// Giveaway Prize
	prize: string;

	// Giveaway Host ID
	hostId: string;

	// Giveaway  Entries
	entries: Array<string>;
};
