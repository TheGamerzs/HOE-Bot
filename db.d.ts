type Order = {
	length: number;
	//Order ID
	orderId: string;

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
	messageId: string;

	// Progress
	progress: number;

	// Grinder ID
	grinder: string;

	// Status
	status: string;

	// Priority
	priority?: number;

	// Discount ID
	discountId?: string;

	// Order Timestamp
	orderTimestamp: number;

	// Claim Timestamp
	claimTimestamp?: number;

	// Completed Timestamp
	completedTimestamp?: number;

	// Delivered Timestamp
	deliveredTimestamp?: number;
};
