const mongoose = require('mongoose');

const storeCategorySchema = new mongoose.Schema(
	{
		name: {
			type: String,
			required: true,
		} , 
		
		confirmed : { type : Boolean ,  default : false } , 
	},
	{ timestamps: true, toJSON: { virtuals: true } }
);

module.exports = mongoose.model('StoreCategory', storeCategorySchema);
