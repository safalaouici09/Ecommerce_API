var ResetPasswordService = require('../services/resetPasswordService');
exports.requestResetPassword = async (req, res) => {
	try {
		const response = await ResetPasswordService.requestResetPassword(req.body);
		res.send(response);
	} catch (err) {
		res.status(500).send(err.message);
	}
};

exports.checkToken = async (req, res) => {
	try {
		const response = await ResetPasswordService.checkToken(req);
		res.send(response);
	} catch (err) {
		res.status(500).send(err.message);
	}
};

exports.resetPassword = async (req, res) => {
	try {
		const response = await ResetPasswordService.resetPassword(req);
		res.send(response);
	} catch (err) {
		res.status(500).send(err.message);
	}
};
