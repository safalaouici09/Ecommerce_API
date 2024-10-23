const mongoose = require('mongoose');
const User = require('./User');
const Product = require('./Product');
const { policySchema } = require('./Policy');
var ObjectId = require('mongodb').ObjectID;

const storeSchema = new mongoose.Schema(
	{
		name: {
			type: String,
			required: true,
		},
		sellerId: {
			type: mongoose.Schema.Types.ObjectId,
			required: true,
			ref: 'User',
		},
		address: {
			city: {
				type: String,
				required: true,
			},
			streetName: {
				type: String,
				//required: true,
			},
			postalCode: {
				type: String,
				//required: true,
			},
			country: {
				type: String,
				//required: true,
			},
			fullAdress: {
				type: String,
				//required: true,
			},
			region: {
				type: String,
				//required: true,
			},
			countryCode: {
				type: String,
				//required: true,
			},
			phone: {
				type: String,
				//required: true,
			},
		},
		location: {
			type: {
				type: String,
				enum: ['Point'],
				default: "Point"
			},
			coordinates: [
				{
					type: Number,
					required: true,
				},
				{
					type: Number,
					required: true,
				},
			],
		},

		image: {
			type: String,
			required: true,
		},
		customCategorie: [
			{
				name: {
					type: String,
					required: true,
				},
				productIds: [
					{
						type: mongoose.Schema.Types.ObjectId,
						ref: 'Product',
					},
				],
			},
		],
		categories: [
			{
				name: {
					type: String,
					required: true,
				},
				productIds: [
					{
						type: mongoose.Schema.Types.ObjectId,
						ref: 'Product',
					},
				],
			},
		],
		isActive: {
			type: Boolean,
			default: true,
		},
		policy: policySchema ,
		offers: [
			{
				name: {
					type: String,
					required: true,
				},
				description: {
					type: String,
					required: true,
				},
				image: {
					type: String,
				},
				timestamps: {
					type: Date,
					required: true,
					default: Date.now(),
				},
				discount: {
					type: Number,
					required: true,
					default: 0,
				},
				productId: {
					type: mongoose.Schema.Types.ObjectId,
					ref: 'Product',
				},
			},
		],
		followers: [
			{
				userId: {
					type: mongoose.Schema.Types.ObjectId,
					ref: 'User',
				},
				date: {
					type: Date,
					required: true,
					default: Date.now(),
				},
			},
		],
		description: {
			type: String,
			required: true,
		},
		ratingCount: {
			type: Number,
			default: 0,
		},
		ratingSum: {
			type: Number,
			default: 0,
		},
		workingTime: {

			type : {
				option: {
					type: String,
					default: "",
				},
				fixedHours: [{
					openTime: {
						type: String,
						required: true,
					},
					closeTime: {
						type: String,
						required: true,
					},
				}],
				customizedHours: {
					type: Map,
					of: [{
						openTime: {
							type: String,
							required: true,
						},
						closeTime: {
							type: String,
							required: true,
						},
					}],
				
			},

			} , 
			required: false,
			
		},
		storeCategorieIds: [
			{
				type: mongoose.Schema.Types.ObjectId,
				ref: 'StoreCategory',
			},
		],
		productCategorieIds: [
			{
				categoryId : {
					type: mongoose.Schema.Types.ObjectId,
					ref: 'Category',
				} , 
				subCategories : [
					{
						type: mongoose.Schema.Types.ObjectId,
						ref: 'Category.subCategories',
					}
				]
			},
		],
		storeRayons: [
			{
				name: {
					type: String,
					required: true,
				}
			},
		],
		templateId: {
			type: Number,
			default: 1,
		},
		
		activated : {
			type: Boolean,
			default: false,
		},
		
	},
	{ timestamps: true,},
	//{ timestamps: true, toJSON: { virtuals: true } }
);
//virtual image url
storeSchema.virtual('imageUrl').get(function () {
	if (this.image != null) {
		return `${process.env.APP_URL}/${this.image}`;
	}
	return `${process.env.APP_URL}/images/stores/default.jpg`;
});
//virtual rating
storeSchema.virtual('rating').get(function () {
	if (this.ratingSum != 0 && this.ratingCount != 0) {
		return this.ratingSum / this.ratingCount;
	}
	return 0;
});
//creat index for location
storeSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('Store', storeSchema);