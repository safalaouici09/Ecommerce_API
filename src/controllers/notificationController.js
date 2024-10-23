var NotificationService = require('../services/notificationsService');

exports.createNotification = async (req, res) => {
	try {
		const notification = await NotificationService.createNotification(req);
		res.send(notification);
	} catch (err) {
		res.status(500).send(err.message);
	}
};
exports.sendNotification = async (req, res) => {
	try {
		const notification = await NotificationService.sendNotification(req);
		res.send(notification);
	} catch (err) {
		res.status(500).send(err.message);
	}
};
exports.updateNotificationsUser = async (req, res) => {
	try {
		const notification = await NotificationService.updateNotificationsUser(req);
		res.send(notification);
	} catch (err) {
		res.status(500).send(err.message);
	}
};
exports.updateNotification = async (req, res) => {
	try {
		const notification = await NotificationService.updateNotification(req);
		res.send(notification);
	} catch (err) {
		res.status(500).send(err.message);
	}
};
exports.getUserNotifications = async (req, res) => {
	try {
		const notification = await NotificationService.getUserNotifications(req);
		res.send(notification);
	} catch (err) {
		res.status(500).send(err.message);
	}
};