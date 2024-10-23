const mongoose = require('mongoose');

const storeRateSchema = new mongoose.Schema(
	{
		userId: {
			type: mongoose.Schema.Types.ObjectId,
			required: true,
			ref: 'User',
		},
		storeId: {
			type: mongoose.Schema.Types.ObjectId,
			required: true,
			ref: 'User',
		},
		rate: {
			type: Number,
			default: 0,
		},
	},
	{ toJSON: { virtuals: true } }
);

module.exports = mongoose.model('StoreRate', storeRateSchema);
