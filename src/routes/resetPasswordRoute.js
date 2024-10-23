const router = require('express').Router();
var ResetPasswordController = require('../controllers/resetPasswordController');
const { resetPasswordRequestSchemaValidation , resetPasswordSchemaValidation } = require('../middleware/dataValidation');

//////

//create new request for reset password
router.post('/', resetPasswordRequestSchemaValidation , ResetPasswordController.requestResetPassword);

//reset password
router.post('/:email/:token', resetPasswordSchemaValidation, ResetPasswordController.resetPassword);

//check
router.get('/:email/:token', ResetPasswordController.checkToken);

module.exports = router;
