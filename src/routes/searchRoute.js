const router = require('express').Router();
var SearchController = require('../controllers/searchController');
const { schemaSearchStoreValidation, schemaSearchProductValidation } = require('../middleware/dataValidation');
const { verifyToken } = require('../middleware/verifyToken');

//search the nearest stores
router.get('/',   SearchController.searchStore);
//search product by nearest store
router.get('/product' , SearchController.searchProduct);

module.exports = router;
