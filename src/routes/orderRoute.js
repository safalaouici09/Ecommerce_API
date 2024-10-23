const router = require('express').Router();
var OrderController = require('../controllers/orderController');
const { orderSchemaValidation } = require('../middleware/dataValidation');

const { verifyToken } = require('../middleware/verifyToken');


//creat an order for a user
router.post('/', verifyToken , OrderController.createOrder);
//Update an order
router.post('/update/:id', verifyToken , OrderController.UpdateOrdersStatus);
//Cancel an order
router.post('/cancel', verifyToken , OrderController.CancelOrders);
//return an order
router.post('/return', verifyToken , OrderController.ReturnOrders);
router.post('/refund', verifyToken , OrderController.RefundOrders);
// get pre order
router.post('/preOrder', verifyToken,  OrderController.getPreOrderItems);
// get pre Reeservation
router.post('/preReeservation', verifyToken,  OrderController.getPreReservationItems);
//get the order by id
router.get('/:id', verifyToken, OrderController.getOrder);
//get order by user id
router.get('/user/:id', verifyToken, OrderController.getOrders);
//get order by store id
router.get('/store/:id', verifyToken, OrderController.getOrdersByStore);
//get order by status
// router.get('/:id/status/:status', verifyToken, OrderController.getOrdersByStatus);
router.get('/:type/:id/status/:status', OrderController.getOrdersPickUpByStatus);
// router.get('/delivery/:id/status/:status', verifyToken, OrderController.getOrdersDeliveryByStatus);
// router.get('/reservation/:id/status/:status', verifyToken, OrderController.getOrdersReservationByStatus);
//get order by shipping status
router.get('/shippingStatus/:shippingStatus', verifyToken, OrderController.getOrdersByShippingStatus);
//get order by payment status
router.get('/paymentStatus/:paymentStatus', verifyToken, OrderController.getOrdersByPaymentStatus);
//get order by payment id
//router.get('/paymentId/:paymentId', verifyToken, OrderController.getOrderByPaymentId);

module.exports = router;
