const { Timestamp } = require('mongodb');
const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema(
	{
		owner_id: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'User',
			required: true,
		},
		title: {type: String, required: true },
		content: {type: String, required: true },
		id: {type: String, required: true },
		type: { type: String, required: true, enum: [
														'order', 
														'offer', 
													], default: '' }, 
		sub_type: { type: String, required: true, enum: [
														'Delivery', 
														'Pickup',  
														'Reservation', 
														'Return', 
														'Refund', 
														'Cancel' 
													], default: 'Cancel' }, 
		seend : { type : Boolean ,  default : false }  ,
		seendInList : { type : Boolean ,  default : false }
	},

	{ timestamps: true }
);

module.exports = mongoose.model('Notification', NotificationSchema);
