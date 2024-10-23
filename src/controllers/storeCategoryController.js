var StoreCategoryService = require('../services/storeCategoryService');

exports.getStoreCategories = async (req, res) => {
	try {
		const StoreCategories = await StoreCategoryService.getAllStoreCategories();
		res.send(StoreCategories);
	} catch (err) {
		res.status(500).send(err.message);
	}
};

exports.getStoreCategoryById = async (req, res) => {
	try {
		const StoreCategory = await StoreCategoryService.getStoreCategoryById(req);
		res.send(StoreCategory);
	} catch (err) {
		res.status(500).send(err.message);
	}
};

exports.createStoreCategory = async (req, res) => {
	try {
		const StoreCategory = await StoreCategoryService.createStoreCategory(req);
		res.send(StoreCategory);
	} catch (err) {
		res.status(500).send(err.message);
	}
};

exports.deleteStoreCategory = async (req, res) => {
	try {
		const StoreCategory = await StoreCategoryService.deleteStoreCategory(req);
		res.send(StoreCategory);
	} catch (err) {
		res.status(500).send(err.message);
	}
};

exports.updateStoreCategory = async (req, res) => {
	try {
		const StoreCategory = await StoreCategoryService.updateStoreCategory(req.body);
		res.send(StoreCategory);
	} catch (err) {
		res.status(500).send(err.message);
	}
};
