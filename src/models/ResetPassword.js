const mongoose = require('mongoose');

const resetPasswordSchema = new mongoose.Schema(
	{
		userId: {
			type: mongoose.Schema.Types.ObjectId,
			required: true,
			ref: 'User',
		},
		token: {
			type: String,
			required: true,
		},
		createAt: {
			type: Date,
			default: Date.now,
            expires : 3600
		}
	},
	{ toJSON: { virtuals: true } }
);

module.exports = mongoose.model('ResetPassword', resetPasswordSchema);
