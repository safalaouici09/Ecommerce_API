const Product = require('../models/Product');
const Offer = require('../models/Offer');
const Store = require('../models/Store');
const uuid = require('uuid');
const path = require('path');
const fileUpload = require('express-fileupload');
const Category = require('../models/Category');
const { Cookies } = require('nodemailer/lib/fetch');
const StoreCategory = require('../models/StoreCategory');

//get All Categories
exports.getAllCategories = async (req) => {
	try {
		console.log('getAllCategories');
		const categories = await Category.find().select('-__v');
		//delete all the productIds from the response
		return categories;
	} catch (err) {
		throw err;
	}
};

//get Categories by id populating products
exports.getCategoryById = async (req) => {
	try {
		const category = await Category.findById(req.params.id).where({confirm : true}).get();
		return category;
	} catch (err) {
		throw err;
	}
};


//get Categories by store categorie id
exports.getCategoryByStoreCategoryId = async (req) => {
	try {
		const category = await Category.find({
			storeCategoryId : req.params.id 
		});
		return category;
	} catch (err) {
		throw err;
	}
};



//get Categories by store categorie id
exports.getCategoryByStoreCategoryIds = async (req) => {
	try {
		console.log(req.body.storeCategories) ; 
		var storeCatIds = [] ; 
		if(req.body.storeCategories && typeof req.body.storeCategories === "string" ) {
			storeCatIds = JSON.parse(req.body.storeCategories) ; 
		}
		console.log(storeCatIds) ; 
		const category = await Category.find({
			storeCategoryId : {$in : storeCatIds}, 
			// confirmed : true 
		});
		return category;
	} catch (err) {
		throw err;
	}
};
//Creat Category
exports.createCategory = async (req) => {
	try {
		//check if image exists
		if(typeof req.body.subCategories === "string" && req.body.subCategories != "" ) {
			req.body.subCategories = JSON.parse(req.body.subCategories) ; 
		}else {
			req.body.subCategories = [] ;
		}
		
		const newCategory = new Category({
			name: req.body.name,
			subCategories : req.body.subCategories
		});
		await newCategory.save();
		return newCategory;
		
	} catch (err) {
		throw err;
	}
};


//Creat Category
exports.addSubCategory = async (req) => {
	try {
		//check if image exists
		if(typeof req.body.subCategories === "string" && req.body.subCategories != "" ) {
			req.body.subCategories = JSON.parse(req.body.subCategories) ; 
		}else {
			req.body.subCategories = [] ;
		}
		
		const newCategory = new Category({
			name: req.body.name,
			subCategories : req.body.subCategories
		});
		await newCategory.save();
		return newCategory;
		
	} catch (err) {
		throw err;
	}
};



//delete Category
exports.deleteCategory = async (req) => {
	try {
		verifyAdmin(req);
		const { error } = categorySchema.validate(req.body);
		if (error) throw Error(error.details[0].message);
		const category = await Category.findByIdAndUpdate(req.params.id, req.body, {
			new: true,
		});
		if (!category) throw Error('The category with the given ID was not found.');
		return category;
	} catch (err) {
		throw err;
	}
};

//get the categories for a store
exports.getCategoriesForStore = async (req) => {
	try {
		//check if the store exists
		const store = await Store.findById(req.params.id);
		if (!store) throw Error('The store with the given ID was not found.');

		var storeCategories = [] ;

		if(store.productCategorieIds && store.productCategorieIds.length) {
			storeCategories = store.productCategorieIds.map((cat) => cat.categoryId) ;
		}

		//get the names of the categories of the store
		const categories = await (
			await Category.find({
				_id: {
					$in: storeCategories
				} 
			}) 
		)
			.map((category) => {
				return category.name;
			})
			.sort();
		return categories;
	} catch (err) {
		throw err;
	}
};

//get categories names for a store
exports.getCategoriesNamesForStore = async (req) => {
	try {
		//check if the category exists
		console.log(req.params.category, 'category');
		console.log(req.params.id, 'store id');

		const category = await Category.findOne({ name: req.params.category });
		if (!category) throw Error('The category with the given name was not found.');
		//get the products of the category
		const products = await Product.find().where('categoryId').equals(category._id);
		return products;
	} catch (err) {
		throw err;
	}
};
//update category
exports.updateCategory = async (req) => {
	try {
		const { error } = categorySchema.validate(req.body);
		if (error) throw Error(error.details[0].message);
		
		if(typeof req.body.subCategories === "string" && req.body.subCategories != "" ) {
			req.body.subCategories = JSON.parse(req.body.subCategories) ; 
		}

		const category = await Category.findByIdAndUpdate(req.params.id, req.body, {
			new: true,
		});
		if (!category) throw Error('The category with the given ID was not found.');
		return category;
	} catch (err) {
		throw err;
	}
};
