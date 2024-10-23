const { Timestamp } = require('mongodb');
const mongoose = require('mongoose');
const User = require('./User');

const OfferSchema = new mongoose.Schema(
	{
		sellerId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'User',
			required: true,
		},
		storeId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'Store',
			required: true,
		},
		productId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'Product',
			required: true,
		},
		offerDiscount: {
			type: Number,
			required: true,
			default: 0,
		},
		offerStock: {
			type: Number,
			required: true,
			default: 0,
		},
		offerExpiration: {
			type: Date,
			
			default: Date.now() + 86400000,
		},
		offerStatus: {
			type: String,
			default:'active',

			enum: ['pending', 'active', 'rejected', 'expired'],
		},
		offerDeleted: {
			type: Boolean,
			required: true,
			default: false,
		},
		offerName: {
			type: String,
			
		},
		offerImage: {
			type: String,

		},
		offerDescription: {
			type: String,
		
		},
		discountType: {
			type: String,
			required: true,
			enum: ['percentage', 'amount'],
		},
	},
	{
		timestamps: true,
		toJSON: { virtuals: true },
	}
);

OfferSchema.virtual('active').get(function () {
	return this.offerExpiration > Date.now();
});

module.exports = mongoose.model('Offer', OfferSchema);
