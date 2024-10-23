const router = require('express').Router();
var StoreCategoryController = require('../controllers/storeCategoryController');
const { createStoreCategorySchemaValidation } = require('../middleware/dataValidation');
const { verifyToken, verifyAdmin, verifyTokenAndAutherization, verifySeller } = require('../middleware/verifyToken');

//get All StoreCategories
router.get('/', verifyToken, StoreCategoryController.getStoreCategories);

//get StoreCategory by id with all products
router.get('/:id', verifyToken, StoreCategoryController.getStoreCategoryById);

router.post('/', verifySeller,  StoreCategoryController.createStoreCategory);

//delete StoreCategory
router.delete('/:id', verifyAdmin, StoreCategoryController.deleteStoreCategory);
//update StoreCategory
router.put('/:id', verifyAdmin, StoreCategoryController.updateStoreCategory);


module.exports = router;
