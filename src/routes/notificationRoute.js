const router = require('express').Router();
var NotificationController = require('../controllers/notificationController');


const { verifyToken, verifySeller } = require('../middleware/verifyToken');

//creat notification
router.post('/send',  NotificationController.sendNotification);

router.get('/:id',  NotificationController.getUserNotifications);
router.post('/update/:id',  NotificationController.updateNotification);
router.post('/update/user/:id',  NotificationController.updateNotificationsUser);

module.exports = router;
