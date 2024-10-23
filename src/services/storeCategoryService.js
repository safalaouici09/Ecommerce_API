const StoreCategory = require('../models/StoreCategory');

//get All StoreCategories
exports.getAllStoreCategories = async (req) => {
	try {
		console.log('getAllStoreCategories');
		const StoreCategories = await StoreCategory.find({confirmed : true }).select('-__v');
		//delete all the productIds from the response
		return StoreCategories;
	} catch (err) {
		throw err;
	}
};

//get StoreCategories by id populating products
exports.getStoreCategoryById = async (req) => {
	try {
		const StoreCategory = await StoreCategory.findById(req.params.id);
		return StoreCategory;
	} catch (err) {
		throw err;
	}
};
//Creat StoreCategory
exports.createStoreCategory = async (req) => {
	try {
		//check if image exists
		if (!req.body.name || req.body.name == "") return console.log('You must enter the name of the category.');
		else {
			const newStoreCategory = new StoreCategory({
				name: req.body.name
			});
			await newStoreCategory.save();
			return newStoreCategory;
		}
	} catch (err) {
		throw err;
	}
};

//delete StoreCategory
exports.deleteStoreCategory = async (req) => {
	try {
		verifyAdmin(req);
		const StoreCategoryTest = await StoreCategory.findById(req.params.id);
		if (!StoreCategoryTest) throw Error('The StoreCategory with the given ID was not found.');
		const StoreCategory = await StoreCategory.findByIdAndDelete(req.params.id);
		return StoreCategory;
	} catch (err) {
		throw err;
	}
};

//update StoreCategory
exports.updateStoreCategory = async (req) => {
	try {
		
		const StoreCategoryTest = await StoreCategory.findById(req.params.id);
		if (!StoreCategoryTest) throw Error('The StoreCategory with the given ID was not found.');
		const StoreCategory = await StoreCategory.findByIdAndUpdate(req.params.id, req.body, {
			new: true,
		});
		return StoreCategory;
	} catch (err) {
		throw err;
	}
};
