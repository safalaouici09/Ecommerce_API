const {ONE_SIGNAL_CONFIG} = require("../config/app.config") ;
const Notification = require('../models/Notification');
const OneSignal = require('@onesignal/node-onesignal');

const https = require("https") ; 
const User = require("../models/User");

const app_key_provider = {
    getToken() {
        return ONE_SIGNAL_CONFIG.API_KEY;
    }
};

//create notification
exports.createNotification = async (req) => {
	try {
		
	} catch (error) {
		throw Error(error);
	}
};

//send notification
exports.sendNotification = async (req) => {
	try {
		console.log(req.body) ;
		const user_key_provider = {
			getToken() {
				return ONE_SIGNAL_CONFIG.USER_AUTH;
			}
		};
		const app_key_provider = {
			getToken() {
				return ONE_SIGNAL_CONFIG.API_KEY;
			}
		};
		const configuration = OneSignal.createConfiguration({
			authMethods: {
				user_key: {
					tokenProvider: user_key_provider
				},
				app_key: {
					tokenProvider: app_key_provider
				}
			}
		});
		const client = new OneSignal.DefaultApi(configuration);

		const notification = new OneSignal.Notification();
		notification.app_id = ONE_SIGNAL_CONFIG.APP_ID;
		notification.included_segments = ['Subscribed Users'];
		notification.data = {
				owner_id : [
					"6430802a2e63b8a9ea099b7a"
				] , 
				type : "order" , // order or offer
				sub_type : "Return" , // for the icon
				id : "6430877d2e63b8a9ea099ef6" // get order or offer and go to the page 
			};
		notification.contents = {
			en: "Abdennour has requested a return" ,
			fr: "Abdennour has requested a return"
		};
		notification.headings = {
		  en: "Return Request" ,
		  fr: "Return Request"
		}
		await client.createNotification(notification).then(res => {
			console.log("success") ; 
			console.log(res) ;
		}).catch(err => {
			console.log("error") ; 
			console.log(err) ;
		});
		
	} catch (error) {
		throw Error(error);
	}
};

exports.localSendNotification = async ( title , content , data , ) => {
	try {
		const user_key_provider = {
			getToken() {
				return ONE_SIGNAL_CONFIG.USER_AUTH;
			}
		};
		const app_key_provider = {
			getToken() {
				return ONE_SIGNAL_CONFIG.API_KEY;
			}
		};
		const configuration = OneSignal.createConfiguration({
			authMethods: {
				user_key: {
					tokenProvider: user_key_provider
				},
				app_key: {
					tokenProvider: app_key_provider
				}
			}
		});
		const client = new OneSignal.DefaultApi(configuration);

		const notification = new OneSignal.Notification();
		notification.app_id = ONE_SIGNAL_CONFIG.APP_ID;
		notification.included_segments = ['Subscribed Users'];
		if (data != null) {
			console.log("data.owner_id") ;
			console.log(data.owner_id) ;
			console.log(data.owner_id.length) ;
			for (let index = 0; index < data.owner_id.length; index++) {
				const element = data.owner_id[index].toString();
				console.log(element) ; 
				let savedNotification = new Notification({
					owner_id : element ,
					title : title , 
					content : content , 
					id : data.id , 
					type : data.type , 
					sub_type : data.sub_type , 
					seend : false  , 
					seendInList : false ,
				}) ;

				savedNotification = await savedNotification.save() ; 
				console.log(notification) ; 
				
				notification.data = {...data , notification_id : savedNotification._id} ;
				
			}
		}


		// notification.data = {
		// 		owner_id : [
		// 			"6430802a2e63b8a9ea099b7a"
		// 		] , 
		// 		type : "order" , // order or offer
		// 		sub_type : "Return" , // for the icon
		// 		id : "6430877d2e63b8a9ea099ef6" // get order or offer and go to the page 
		// 	};
		notification.contents = {
			en: content ,
			fr: content
		};
		notification.headings = {
		  en: title ,
		  fr: title
		}
		await client.createNotification(notification).then(res => {
			console.log("success") ; 
			console.log(res) ;
		}).catch(err => {
			console.log("error") ; 
			console.log(err) ;
		});
		
	} catch (error) {
		throw Error(error);
	}
};

exports.updateNotificationsUser = async (req) => {
	try {
		console.log(req.body);
		const user = await User.findById(req.params.id);
		if (!user) {
			throw new Error({ message: 'User not found' });
		} else {
			const updatedNotifications = await Notification.updateMany(
				{owner_id : user._id},
				{
					$set: req.body,
				},
				{ new: true }
			);
			return updatedNotifications;
		}
	} catch (err) {
		throw err;
	}
};

exports.updateNotification = async (req) => {
	try {
		console.log(req.body);
		if (!req.params.id) {
			throw new Error({ message: 'notification not found' });
		} else {
			const updatedNotifications = await Notification.findByIdAndUpdate(
				req.params.id,
				{
					$set: req.body,
				},
				{ new: true }
			);
			return updatedNotifications;
		}
	} catch (err) {
		throw err;
	}
};

exports.getUserNotifications = async (req) => {
	try {
		const user = await User.findById(req.params.id);
		if (!user) {
			throw new Error({ message: 'User not found' });
		} else {
			const notifications = await Notification.find(
				{owner_id : user._id}
			).sort({createdAt : -1});
			return notifications;
		}
	} catch (err) {
		throw err;
	}
};
