const router = require('express').Router();
var StoreController = require('../controllers/storeController');
const { verifyToken, verifySeller, verifyTokenAndAutherization } = require('../middleware/verifyToken');

const { schemaStoreValidation, schemaUpdateStoreValidation , schemaUpdateStoreRatingValidation } = require('../middleware/dataValidation');
//////

router.post('/createStore', verifyToken, schemaStoreValidation ,  StoreController.createStore);

router.put('/:id', verifySeller, schemaUpdateStoreValidation, StoreController.updateStore);
router.get('/seller/:id', verifyToken, StoreController.getSellerStores);
router.get('/:id', StoreController.getStore);
router.get('/findStore/:city', verifyToken, StoreController.getStoresByCity);
router.get('/findStore/:latitude/:longitude/:maxDistance', verifyToken, StoreController.getStoresByLocation);
//router.get('find/', verifyToken, StoreController.getStoresByName);


router.post('/update_rating/:id', verifyToken , schemaUpdateStoreRatingValidation, StoreController.updateStoreRating);

router.delete('/:storeId', verifyToken ,  StoreController.deleteStore);

module.exports = router;
