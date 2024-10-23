const mongoose = require('mongoose');
const Product = require('./Product');

const categorySchema = new mongoose.Schema(
	{
		storeCategoryId : {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'StoreCategory',
		} , 
		name: {
			type: String,
			required: true,
		},
		
		confirmed : { type : Boolean ,  default : false } , 
		
		subCategories: [
			{
				name: {
					type: String,
					required: true,
				},
				confirmed : { type : Boolean ,  default : false } , 
			},
			{
				timestamps: true,
			},
		],
	},
	{ timestamps: true, toJSON: { virtuals: true } }
);

module.exports = mongoose.model('Category', categorySchema);
