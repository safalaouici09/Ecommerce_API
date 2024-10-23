const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const User = require('../models/User');
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const Offer = require('../models/Offer');
const Store = require('../models/Store');
const Payment = require('../models/Payment');
const Bill = require('../models/Bill');
const Order = require('../models/Order');
const { check } = require('prettier');
const { default: mongoose } = require('mongoose');
const { localSendNotification } = require('./notificationsService');

//create order
exports.createOrder = async (req) => {
	try {
		let order = req.body ; 
		// check store 
		const store = await Store.findById(order.storeId) ; 
		if(!store) {
			throw new Error('Store not found');
		}
		
		const seller = await User.findById(store.sellerId) ; 
		if(!seller) {
			throw new Error('Seller not found');
		}
		let auto_validation = false ; 
		//check items (variant) [discount , price , policy{ reservation , pickUp , delivery , validation }]
		// and calculate totals 
		let products_ids = order.items.map(el => el.productId) ;
		if(!products_ids && products_ids.length == 0) {
			throw new Error("Missed Order Items");
		}
		products_ids = [...new Set(products_ids)] ;
		let products = await Store.find({_id :  { $in: products_ids }}) ; 
		if(!products || products.length == 0 ){
			throw new Error("Products not found");
		}
		products = products.map(el => el._doc) ;

		order.items.forEach((item , index) => {
			//check item if exist in products 
			if(products.filter(el => el._id == item.productId).length == 0 ) {
				throw("Product not found") ;
			}
			let item_product = products.filter(el => el._id == item.productId)[0] ;
			//check variant 
			if(item_product.variants.filter(el => el._id == item.variantId).length == 0 ) {
				throw("["+item_product.name+" ] : variant not found") ;
			}

			let variant_product = item_product.variants.filter(el => el._id == item.variantId)[0] ; 


			// product policy
			if(!item_product.policy) {
				if(!store.policy) {item_product.policy = seller.policy ;} else {item_product.policy = store.policy ;}  
			}
			if(!item_product.policy) {throw("["+item_product.name+" ] : Policy not found") ;}

			// auto validation checks

			if( item_product.policy.order.validation.auto ) {
				// check price
				if(variant_product.price != item.price) { throw("Price Variant Error") ;}
				
				// check quantity
				if(variant_product.quantity < item.quantity){ throw("["+item_product.name+" ] : insufficient stock") ;}
			
			} 

			//init amount 
			order.items[index].amount = 0 ;
			order.items[index].total = variant_product.price*item.quantity ;


			//check order policy
			//check reservation
			if(order.reservation ) {
				if(!item_product.policy.reservation) throw("["+item_product.name+" ] : Reservation is not allowed") ;
				if(item_product.policy.reservation.total) {
					order.items[index].amount = variant_product.price*item.quantity ;
				}else if(item_product.policy.reservation.partial.fixe) {
					order.items[index].amount = item_product.policy.reservation.partial.fixe*item.quantity ; 
				}else if(item_product.policy.reservation.partial.percentage) {
					order.items[index].amount = (variant_product.price*item_product.policy.reservation.partial.percentage)*item.quantity ; 
				}
			} 
			//check pickup
			if(order.pickup ) {
				if(!item_product.policy.pickup) throw("["+item_product.name+" ] : Pickup is not allowed") ;
				order.items[index].amount = variant_product.price*item.quantity ;
			} 
			//check devlivery
			if(order.delivery ) {
				if(!item_product.policy.delivery) throw("["+item_product.name+" ] : Delivery is not allowed") ;
				let delivery_amount = item_product.policy.delivery.pricing.fixe ? item_product.policy.delivery.pricing.fixe
										: item_product.policy.delivery.pricing.km ? item_product.policy.delivery.pricing.km*order.delivery.nbrKm
										: 0
				order.items[index].amount = variant_product.price*item.quantity + delivery_amount ;
			} 
			



		});
		//check total 
		let total_amount = order.items.reduce(function (total, currentValue) {
			return total + currentValue.amount;
		}, 0) ; 

		let order_total_amount = order.paymentInfos.paymentAmount + (order.delivery ? order.delivery.shippingAmount : 0) ; 

		if(total_amount != order_total_amount ) throw("Payment Amount Error") ;
		if(order.items[0].total != order.paymentInfos.totalAmount ) throw("Total amount Error") ;

		// verification payment 
	
		//create order 

		const new_order = new Order({
			clientId : order.clientId ,
			storeId : order.storeId , 
			items : order.items.map(el => { const {total , amount , ...others} = el ;  return others }) , 
			paymentInfos : order.paymentInfos , 
			reservation : order.reservation , 
			pickup : order.pickup , 
			delivery : order.delivery , 
			canceled : null ,
		}) ; 

		await new_order.save() ;
		
	} catch (error) {
		
	}
};


//create order
exports.createOrderDirectly = async (req) => {
	try {
		let orders = req.body.orders ; 
		if(typeof orders === "string") {
			orders = JSON.parse(orders) ; 
		}else {
			orders = [] ; 
		}

		
		orders  = await asyncMapCreateOrder(orders, myAsyncFuncCreateOrder);
		

		if(req.body.orderId) {
			await Order.findByIdAndDelete(req.body.orderId) ;
		}
		
	} catch (error) {
		console.log(error) ;
		
	}
};


async function asyncMapCreateOrder(array, asyncFunc) {
	const promises = array.map(asyncFunc);
	return Promise.all(promises);
  }
  
// Example usage
async function myAsyncFuncCreateOrder(element) {
	try {

		element.items.forEach(el => {
			if(typeof el.policy === 'string' && el.policy != "" ) {
				el.policy = JSON.parse(el.policy) ; 
			}
			console.log(el.policy) ; 
			
		});
		
		const new_order = new Order({...element}) ; 
		const order = await new_order.save() ;

		// send notifications 

		// get seller id 
		const store = await Store.findById(element.storeId)

		let data = {
			owner_id : [
				// order.clientId ,
				store.sellerId
			] , 
			type : "order" , // order or offer
			sub_type : order.pickUp ? "Pickup" : order.delivery ? "Delivery" : "Reservation" , // for the icon
			id : order._id // get order or offer and go to the page 
		};

		let title = "New Order" ; 
		let content = "You have recived a new order [ "+order._id+" ]" ;

		await localSendNotification(title , content , data) ;
		return new_order ; 
		
	} catch (error) {
		console.log(error);
		return null
	}
	
}

  

//get the order by id
exports.getOrder = async (req) => {
	try {
		const order = await Order.findById(req.params.id);
		if (!order) {
			throw new Error('order not found');
		}
		
		return myAsyncFuncOrder(order);
	} catch (err) {
		throw err;
	}
};

//get order by user id
exports.getOrders = async (req) => {
	try {
		const order = await Order.find({ userId: req.params.id });
		if (!order) {
			throw new Error('order not found');
		}
		return order;
	} catch (err) {
		throw err;
	}
};
//get order by store id
exports.getOrdersByStore = async (req) => {
	try {
		const order = await Order.find({ storeId: req.params.id });
		if (!order) {
			throw new Error('order not found');
		}
		return order;
	} catch (err) {
		throw err;
	}
};

//update item policy for testing 

exports.UpdatePolicy = async () => {
	let order = await Order.findByIdAndUpdate(
		"6430877d2e63b8a9ea099ef6" , 
		{
			items : [
				{
					productId : "643083232e63b8a9ea099bc3" ,
					variantId : "643083232e63b8a9ea099bc4" ,
					name : "Iphone 13 Pro Max ( Gold , 128 GB )" ,
					image : "images/variantes/6e9ed41e-f333-4766-9aae-787c064e59961000003476.jpg" ,
					price : 1500 ,
					discount : 0 ,
					quantity : 1 ,
					policy : {
					"workingTime": {
					  "openTime": "09:00",
					  "closeTime": "18:00"
					},
					"pickup": {
					  "timeLimit": 10
					},
					"delivery": {
					  "zone": {
						"centerPoint": {
						  "latitude": 48.86626614116967,
						  "longitude": 2.3502199351787567
						},
						"radius": 10
					  },
					  "pricing": {
						"fixe": null,
						"km": 2
					  },
					},
					"reservation": {
					  "duration": 10,
					  "payment": {
						"free": false,
						"partial": {
						  "fixe": null,
						  "percentage": 20
						},
						"total": null
					  },
					  "cancelation": {
						"restrictions": {
						  "fixe": null,
						  "percentage": null
						}
					  },
					},
					"return": {
					  "duration": 29,
					  "productStatus": "un petit text pour décrire le status du retour",
					  "returnMethod": "un petit text pour décrire la methode du retour",
					  "refund": {
						"order": {
						  "fixe": null,
						  "percentage": null
						},
						"shipping": {
						  "fixe": null,
						  "percentage": null
						}
					  }
					  
					},
					"order": {
					  "validation": {
						"auto": false,
						"manual": true
					  },
					  "notification": {
						"realtime": true,
						"time": null,
						"perOrdersNbr": null,
						"sendMode": {
						  "mail": true,
						  "sms": true,
						  "popup": true,
						  "vibration": true,
						  "ringing": null
						}
					  }
					}
				  }
				}
			]
		}
	) ; 
	return order  ; 
}

//update order status
exports.UpdateOrdersStatus = async (req) => {
	try {
		if(req.params.id) {
			let user = await User.findById(req.params.id) ; 
			if(user && user.role == "seller") {
				let orderStatus = [
					'Pending', 
					'InPreparation',  
					'LoadingDelivery', 
					'OnTheWay', 
					'Delivered', 
					'AwaitingRecovery', 
					'Recovered', 
					'Reserved', 
					'WaitingForReturn', 
					'Returned', 	
					'UnderRefund' ,
					'Refunded', 
					'succeeded'
				] ;

				// get stores ids 
				// To DO

				//return orders 
				let order = null ;

				switch (req.body.status) {
					case "WaitingForReturn":
						order = await Order.findByIdAndUpdate(
							req.body.orderId , 
							{waitingforReturn : true}
							);				
						break;
					case "Returned":
						// add products quantities and refund methode 

						order = await Order.findByIdAndUpdate(
							req.body.orderId , 
							{returned : true}
							);
						break;
				
					default:
						if(req.body.status && orderStatus.includes(req.body.status)) {
							order = await Order.findByIdAndUpdate(
								req.body.orderId , 
								{status : req.body.status}
								);
						}else {
							throw new Error('Status Error');
						}
						break;
				}

				

				
				if (!order) {
					throw new Error('Order not found');
				}else {
					let data = {
						owner_id : [
							order.clientId 
						] , 
						type : "order" , // order or offer
						sub_type : order.refund ? "Refund" : order.return ? "Return" : order.reservation ? "Reservation" : order.delivery ? "Delivery" :  "Pickup" , // for the icon
						id : order._id // get order or offer and go to the page 
					};
	
					let title = "Order Updated" ; 
					let content = "Your order has been updated [ "+order._id+" ]" ;
	
					await localSendNotification(title , content , data) ;
					

				}
				
			}else{
				throw new Error('Permission denied');
			}
		}

		return true;
	} catch (err) {
		throw err;
	}
};


exports.ReturnOrders = async (req) => {
	try {
		if(req.body.userId) {
			let user = await User.findById( mongoose.Types.ObjectId(req.body.userId)) ; 
			let order = await Order.findById( mongoose.Types.ObjectId(req.body.orderId) ) ; 
			if (!order) {
				throw new Error('Order not found');
			}

			let returnItems = req.body.returnItems ; 
			if(typeof returnItems === "string") {
				returnItems = JSON.parse(returnItems) ; 
			}else {
				returnItems = [] ; 
			}

			if(returnItems.length == 0 ) {
				throw new Error('you must select the products concerned');
			}


			let store = null ; 
			if(order) {
				store = await Store.findById(order.storeId) ; 
			}
			if(user && order && store && (user._id.equals(order.clientId) || user._id.equals(store.sellerId) ) ) {
				// get stores ids 
					let orderItems = [...order.items] ; 
					// let orderNewItems = [] ;
					
					order.items.forEach(item => {
						console.log(item) ;
						console.log(item._doc.variantId) ;
						let index = returnItems.findIndex(el => el.variantId ==  item._doc.variantId ) ;
						if(index !== -1) {
							let return_item = returnItems[returnItems.findIndex(el => el.variantId ==  item._doc.variantId )] ;
							console.log(return_item.quantity > item.quantity) ;
							if(return_item.quantity > item._doc.quantity) {
								throw new Error('The quantity of the returned produt must be less than the quantity in the order');
							}
							// if(return_item.quantity !== item._doc.quantity) {
							// 	let new_item = {...item._doc , quantity : item._doc.quantity - return_item.quantity }
							// 	orderNewItems.push(new_item) ; 
							// }
						}else {
							// orderNewItems.push(item._doc) ;
						}
					}) ;

					// console.log(orderNewItems) ; 
					console.log(returnItems) ;

					await Order.findByIdAndUpdate(
						mongoose.Types.ObjectId(req.body.orderId) , 
						{
							// items : orderNewItems , 
							returnItems : returnItems , 
							returnMotif :  req.body.motif , 
							return : true , 
							// status : "Pending" 
						}
						);

				// get seller id 
				let data = {
					owner_id : [
						// order.clientId ,
						store.sellerId
					] , 
					type : "order" , // order or offer
					sub_type : "Return" , // for the icon
					id : order._id // get order or offer and go to the page 
				};

				let title = "Return Request" ; 
				let content = "You have recived a new return request [ "+order._id+" ]" ;

				await localSendNotification(title , content , data) ;
					
			}else{
				throw new Error('Permission denied');
			}
		}

		

		return true;
	} catch (err) {
		throw err;
	}
};


exports.RefundOrders = async (req) => {
	try {
		if(req.body.userId) {
			let user = await User.findById( mongoose.Types.ObjectId(req.body.userId)) ; 
			let order = await Order.findById( mongoose.Types.ObjectId(req.body.orderId) ) ; 
			if (!order) {
				throw new Error('Order not found');
			}

			let returnItems = req.body.returnItems ; 
			if(typeof returnItems === "string") {
				returnItems = JSON.parse(returnItems) ; 
			}else {
				returnItems = [] ; 
			}

			if(returnItems.items.length == 0 ) {
				throw new Error('you must select the products concerned');
			}

			returnItems.items.forEach(element => {
				element.policy = JSON.parse(element.policy) ; 
			});

			console.log(returnItems) ;

			let store = null ; 
			if(order) {
				store = await Store.findById(order.storeId) ; 
			}
			if(user && order && store && (user._id.equals(order.clientId) || user._id.equals(store.sellerId) ) ) {
				// get stores ids 
					let orderItems = [...order.items] ; 
					// let orderNewItems = [] ;
					
					order.items.forEach(item => {
						console.log(item) ;
						console.log(item._doc.variantId) ;
						let index = returnItems.items.findIndex(el => el.variantId ==  item._doc.variantId ) ;
						if(index !== -1) {
							let return_item = returnItems.items[returnItems.items.findIndex(el => el.variantId ==  item._doc.variantId )] ;
							console.log(return_item.quantity > item.quantity) ;
							if(return_item.quantity > item._doc.quantity) {
								throw new Error('The quantity of the returned produt must be less than the quantity in the order');
							}
							// if(return_item.quantity !== item._doc.quantity) {
							// 	let new_item = {...item._doc , quantity : item._doc.quantity - return_item.quantity }
							// 	orderNewItems.push(new_item) ; 
							// }
						}else {
							// orderNewItems.push(item._doc) ;
						}
					}) ;

					console.log("orderNewItems") ; 
					console.log(returnItems.items) ;
					let updatedOrder = null ; 
					console.log(returnItems.total) ;
					if(parseFloat(returnItems.total) > 0.0) {
						updatedOrder = await Order.findByIdAndUpdate(
							mongoose.Types.ObjectId(req.body.orderId) , 
							{
								returnedItems : returnItems.items , 
								refundPaymentInfos : {
									totalAmount: returnItems.total ,
								} ,
								returned : true , 
								refund : true 
							}
							);
					}else {
						updatedOrder = await Order.findByIdAndUpdate(
							mongoose.Types.ObjectId(req.body.orderId) , 
							{
								returnedItems : returnItems.items , 
								returned : true , 
							}
							);

					}

					console.log(updatedOrder) ; 

				let data = {
					owner_id : [
						order.clientId 
					] , 
					type : "order" , // order or offer
					sub_type : "Refund" , // for the icon
					id : order._id // get order or offer and go to the page 
				};

				let title = "Refund" ; 
				let content = "Your return request has been processed [ "+order._id+" ]" ;

				await localSendNotification(title , content , data) ;
					
			}else{
				throw new Error('Permission denied');
			}
		}

		return true;
	} catch (err) {
		throw err;
	}
};


exports.CancelOrders = async (req) => {
	try {
		if(req.body.userId) {
			let user = await User.findById( mongoose.Types.ObjectId(req.body.userId)) ; 
			let order = await Order.findById( mongoose.Types.ObjectId(req.body.orderId) ) ; 
			if (!order) {
				throw new Error('Order not found');
			}
			let store = null ; 
			if(order) {
				store = await Store.findById(order.storeId) ; 
			} 
			if(user && order && store && (user._id.equals(order.clientId) || user._id.equals(store.sellerId) ) ) {
				// get stores ids 
					let order = await Order.findByIdAndUpdate(
						req.body.orderId , 
						{canceled : true , canceledBy : {userId : user._id , motif : req.body.motif }}
						);
					if(order) {
						let data = {
							owner_id : [
								user._id.equals(order.clientId) ? order.clientId : store.sellerId
							] , 
							type : "order" , // order or offer
							sub_type : "Cancel" , // for the icon
							id : order._id // get order or offer and go to the page 
						};
		
						let title = "Order Canceled" ; 
						let content = "Your order has been canceled [ "+order._id+" ]" ;
		
						await localSendNotification(title , content , data) ;
						
					}
					
			}else{
				throw new Error('Permission denied');
			}
		}

		return true;
	} catch (err) {
		throw err;
	}
};

//get order by status
exports.getOrdersByStatus = async (req) => {
	try {
		let order = [] ; 
		if(req.params.id) {
			let user = await User.findById(req.params.id) ; 
			if(user && user.role == "user") {
				order = await Order.find({ clientId : req.params.id ,   status: req.params.status });
			}else if(user && user.role == "seller") {
				// get stores ids 
				let stores = await Store.find({sellerId : req.params.id}) ; 
				if (stores && stores.length ) {
					stores = stores.map(el => el._doc._id) ;
				}else {
					stores = [] ; 
				}
		
				order = await Order.find({ storeId : {$in : stores } ,  status: req.params.status });

			}
			if (!order) {
				throw new Error('order not found');
			}
	
			order  = await asyncMapOrder(order, myAsyncFuncOrder);

		}

		return order;
	} catch (err) {
		throw err;
	}
};
exports.getOrdersPickUpByStatus = async (req) => {
	try {
		let order = [] ; 
		if(req.params.id) {
			let user = await User.findById(req.params.id) ; 
			if(user && user.role == "user") {
				 if(req.params.status == "Canceled") {
					order = await Order.find({ 
						clientId : req.params.id , 
						canceled : true  , 
						return : req.params.type != "all" ? (req.params.type && req.params.type == "return")  : { $exists: true }  ,  
						pickUp : req.params.type != "all" ? (req.params.type && req.params.type == "pickup")  : { $exists: true } ,  
						delivery : req.params.type != "all" ? (req.params.type && req.params.type == "delivery")  : { $exists: true } ,  
						reservation : req.params.type != "all" ? (req.params.type && req.params.type == "reservation")  : { $exists: true }  ,  
						
						refund : {$ne : true}  
					}).sort({createdAt : -1});

				}else if(req.params.type == "refund") {
						order = await Order.find({ 
							clientId : req.params.id , 
							refund : true  , 
							canceled : {$ne : true}  , 
						}).sort({createdAt : -1});
				}else if(req.params.type == "return") {
					if(req.params.status == "all") {
						order = await Order.find({ 
							clientId : req.params.id , 
							return : true  , 
							canceled : {$ne : true}  , 
						}).sort({createdAt : -1});

					}else {
						order = await Order.find({ 
							clientId : req.params.id , 
							return : true  , 
							waitingforReturn :req.params.status == "pending" ? {$ne : true } : true , 
							returned :   req.params.status == "returned" ? true  : {$ne : true } , 
							canceled : {$ne : true}  , 
						}).sort({createdAt : -1});

					}

				}else {
					order = await Order.find({ 
						clientId : req.params.id ,  
						pickUp : req.params.type != "all" ? (req.params.type && req.params.type == "pickup")  : { $exists: true } ,  
						delivery : req.params.type != "all" ? (req.params.type && req.params.type == "delivery")  : { $exists: true } ,  
						reservation : req.params.type != "all" ? (req.params.type && req.params.type == "reservation")  : { $exists: true }  ,  
						status: req.params.status != "all" ? req.params.status : { $exists: true } , 
						canceled : {$ne : true}  , 
						items: { $ne: [] } ,
						// return : {$ne : true}  , 
						refund : {$ne : true}  
					}).sort({createdAt : -1});

				}
			}else if(user && user.role == "seller") {
				// get stores ids 
				let stores = await Store.find({sellerId : req.params.id}) ; 
				if (stores && stores.length ) {
					stores = stores.map(el => el._doc._id) ;
				}else {
					stores = [] ; 
				}
				
				if(req.params.status == "Canceled") {
					order = await Order.find({ 
						storeId : {$in : stores } , 
						canceled : true  , 
						return : req.params.type != "all" ? (req.params.type && req.params.type == "return")  : { $exists: true }  ,  
						pickUp : req.params.type != "all" ? (req.params.type && req.params.type == "pickup")  : { $exists: true } ,  
						delivery : req.params.type != "all" ? (req.params.type && req.params.type == "delivery")  : { $exists: true } ,  
						reservation : req.params.type != "all" ? (req.params.type && req.params.type == "reservation")  : { $exists: true }  ,  
						
						refund : {$ne : true}  
					}).sort({createdAt : -1});

				}else if(req.params.type == "refund") {
					order = await Order.find({ 
						storeId : {$in : stores } , 
						refund : true  , 
						canceled : {$ne : true}  , 
					}).sort({createdAt : -1});
				}else if(req.params.type == "return") {
					console.log("i'm here") ;
					if(req.params.status == "all") {
						order = await Order.find({ 
							storeId : {$in : stores } , 
							return : true  , 
							canceled : {$ne : true}  , 
						}).sort({createdAt : -1});

					}else {
						order = await Order.find({ 
							storeId : {$in : stores } , 
							return : true  , 
							waitingforReturn :req.params.status == "pending" ? {$ne : true } : true , 
							returned :   req.params.status == "returned" ? true  : {$ne : true } , 
							canceled : {$ne : true}  , 
						}).sort({createdAt : -1});

					}

				}else {
					order = await Order.find({ 
						storeId : {$in : stores } , 
						pickUp : req.params.type != "all" ? (req.params.type && req.params.type == "pickup")  : { $exists: true } ,  
						delivery : req.params.type != "all" ? (req.params.type && req.params.type == "delivery")  : { $exists: true } ,  
						reservation : req.params.type != "all" ? (req.params.type && req.params.type == "reservation")  : { $exists: true }  ,  
						status: req.params.status != "all" ? req.params.status : { $exists: true }, 
						canceled : {$ne : true}  , 
						// return : {$ne : true}  , 
						refund : {$ne : true}  
					}).sort({createdAt : -1});
				}
		

			}
			if (!order) {
				throw new Error('order not found');
			}
	
			order  = await asyncMapOrder(order, myAsyncFuncOrder);
			console.log(order) ;
		}

		return order;
	} catch (err) {
		console.log(err) ;
		throw err;
	}
};


exports.getOrdersDeliveryByStatus = async (req) => {
	try {
		let order = [] ; 
		if(req.params.id) {
			let user = await User.findById(req.params.id) ; 
			if(user && user.role == "user") {
				order = await Order.find({ clientId : req.params.id ,  delivery : true ,  status: req.params.status });
			}else if(user && user.role == "seller") {
				// get stores ids 
				let stores = await Store.find({sellerId : req.params.id}) ; 
				if (stores && stores.length ) {
					stores = stores.map(el => el._doc._id) ;
				}else {
					stores = [] ; 
				}
		
				order = await Order.find({ storeId : {$in : stores } , delivery : true ,  status: req.params.status });

			}
			if (!order) {
				throw new Error('order not found');
			}
	
			order  = await asyncMapOrder(order, myAsyncFuncOrder);

		}
		return order;
	} catch (err) {
		throw err;
	}
};
exports.getOrdersReservationByStatus = async (req) => {
	try {
		let order = [] ; 
		if(req.params.id) {
			let user = await User.findById(req.params.id) ; 
			if(user && user.role == "user") {
				order = await Order.find({ clientId : req.params.id ,  reservation : true ,  status: req.params.status });
			}else if(user && user.role == "seller") {
				// get stores ids 
				let stores = await Store.find({sellerId : req.params.id}) ; 
				if (stores && stores.length ) {
					stores = stores.map(el => el._doc._id) ;
				}else {
					stores = [] ; 
				}
		
				order = await Order.find({ storeId : {$in : stores } , reservation : true ,  status: req.params.status });

			}
			if (!order) {
				throw new Error('order not found');
			}
	
			order  = await asyncMapOrder(order, myAsyncFuncOrder);

		}
		return order;
	} catch (err) {
		throw err;
	}
};


async function asyncMapOrder(array, asyncFunc) {
	const promises = array.map(asyncFunc);
	return Promise.all(promises);
  }
  
// Example usage
async function myAsyncFuncOrder(element) {
	var returnedItem = {...element._doc , store : null , seller : null , client : null } ;
	try {
		
		// get stores (name, addresse )
		var seller = null ; 
		var store = await Store.findById(returnedItem.storeId);
		if (store) {
			let {name , address , location , image , ...others} = store ; 
			returnedItem.store = {name , address , location , image} ;
			// get sellers (phone)
			seller = await User.findById(store.sellerId);
			if (seller) {
				let {phone , email  , ...others} = seller ; 
				returnedItem.seller = {phone , email } ;
			}
		}
		
		var user = await User.findById(element.clientId);
		returnedItem.user = user ; 

		if(returnedItem.canceled == true && returnedItem.canceledBy != null && returnedItem.canceledBy.userId != null ) {
			var canceledByItem = {...returnedItem.canceledBy , image : "" , name : ""} ;
			if(canceledByItem.userId.equals(seller._id) ) {
				canceledByItem = {...canceledByItem , image : store.image , name : store.name} ;
			}else {
				canceledByItem = {...canceledByItem , image : user.profileImage , name : user.username} ;
			}
			returnedItem.canceledBy = canceledByItem ;
		}
		return returnedItem ; 
		
	} catch (error) {
		console.log(error);
		return {...element._doc , store : null , seller : null , client : null}
	}
	
}

  
//get order by shipping status
exports.getOrdersByShippingStatus = async (req) => {
	try {
		const order = await Order.find({ shippingStatus: req.params.shippingStatus });
		if (!order) {
			throw new Error('order not found');
		}
		return order;
	} catch (err) {
		throw err;
	}
};
//get order by payment status
exports.getOrdersByPaymentStatus = async (req) => {
	try {
		const order = await Order.find({ paymentStatus: req.params.paymentStatus });
		if (!order) {
			throw new Error('order not found');
		}
		return order;
	} catch (err) {
		throw err;
	}
};
//get order by payment id
exports.getOrdersByPaymentId = async (req) => {
	try {
		const order = await Order.find({ paymentId: req.params.paymentId });
		if (!order) {
			throw new Error('order not found');
		}
		return order;
	} catch (err) {
		throw err;
	}
};



//get pre Order items
exports.getPreOrderItems = async (req) => {
	try {
		var PreOrder = {
			storeId : null , 
			cartId : null , 
			storeName : "" ,
			maxDeliveryFixe : 0.0 ,
			maxDeliveryKm : 0.0 , 
			storeAdresse : [] , // location
			items : [] , // array of preOrderItem
		}

		var preOrderItem =  {
			productId : null  ,
			variantId : null , 
			name : "" , 
			characterstics : [] ,
			discount : 0.0 , 
			image : "" , 
			price : 0.0 , 
			quantity : 0 ,
			policy : null 
			// policies
			// reservationPolicy : false ,  
			// deliveryPolicy : false ,  
			// pickupPolicy : false ,  
			// // percentage
			// reservationP : 0.0 ,   
		}

		// check cart !!
		var cart = await Cart.findById(req.body.cartId);
		if (!cart) {
			 cart = await Cart.findOne({userId : mongoose.Types.ObjectId(req.body.clientId) , });
			if (!cart) {
				throw new Error('cart not found');
			}
		}

		PreOrder.cartId = req.body.cartId ; 

		// check store 
		// pas du store au niveau du backend 

		// check items and get current values 
		var items = [] ; 
		if(typeof req.body.items === "string" && req.body.items != "" ) {
			items = JSON.parse(req.body.items);
		} ;
		if(items.length) {

			// check if all items in cart 
			var itemIds = items.map(el => el.variantId) ;

			var filterItems = cart.items.filter(el => itemIds.includes(el.variantId)  ) ;

			if(filterItems.length !== items.length) {
				throw new Error('Order without same items of the cart');
			}

			// get first variant and store 
			var firstProduct = await Product.findOne({ 'variants._id': items[0].variantId }) ; 
			if(!firstProduct) {
				throw new Error('Store not found');
			}
			var store = await Store.findById(firstProduct.storeId) ; 
			if(!store) {
				throw new Error('Store not found');
			}
			PreOrder.storeId = store._id.toString() ; 
			PreOrder.storeName = store.name ; 
			PreOrder.storeAdresse = store.location ; 
		}else {
			throw new Error('items not found');
		}

		items  = await asyncMapPreOrderItems(items, myAsyncFuncPreOrderItems);

		//get max delivery pricing 

		var maxDeliveryKm = items.reduce((max, item) => {
			return item.deliveryP > max ? item.deliveryP : max;
		  }, 0.0);
		PreOrder.maxDeliveryKm = maxDeliveryKm ; 

		var maxDeliveryFixe = items.reduce((max, item) => {
			return item.deliveryFixe > max ? item.deliveryFixe : max;
		  }, 0.0);
		PreOrder.maxDeliveryFixe = maxDeliveryFixe ; 
		  
		PreOrder.items = JSON.stringify(items) ;

		return PreOrder;
	} catch (err) {
		console.log(err);
		throw err;
	}
};


async function asyncMapPreOrderItems(array, asyncFunc) {
	const promises = array.map(asyncFunc);
	return Promise.all(promises);
  }
  
// Example usage
async function myAsyncFuncPreOrderItems(element) {
	var returnedItem = {
		error : "Product not found"
	} ;
	try {
		// get the item 
	
		var product = await Product.findOne({ "variants._id": mongoose.Types.ObjectId(element.variantId) }) ; 
		if(product) {
			var productVariant = product.variants.find((item) => item._id.toString() ===  element.variantId ) ;
			if(productVariant) {
				// check disponibilité 	
				if(productVariant.quantity != parseInt(element.orderQuantity)) {
					returnedItem = {
						error : "Product not disponible"
					}
				}
				// get item policy
				if(!product.policy) {
					product.policy = null ;
					let store = await Store.findById(product.storeId) ;
					if(!(store && store.policy)) {
							let seller = await User.findById(product.sellerId) ;
							if(seller && seller.policy) {
								product.policy = seller.policy ;
							}else {
								product.policy = null
							}
					}else {
						product.policy = store.policy  ;
					}
				}
				returnedItem = {
					id : productVariant._id ,
					productId : product._id , 
					variantId : productVariant._id , 
					name : product.name ,
					characterstics : productVariant.characterstics ,
					image : productVariant.img , 
					price : productVariant.price , 
					quantity : parseInt(element.orderQuantity) , 
					discount : product.discount , 
					reservationPolicy: false ,
					deliveryPolicy:  product.policy && product.policy.delivery && product.policy.delivery.delivery ,
					pickupPolicy:  product.policy && product.policy.pickup && product.policy.pickup.timeLimit ,
					reservation: false,
					delivery: !(product.policy && product.policy.pickup && product.policy.pickup.timeLimit != null) ,
					pickup: product.policy && product.policy.pickup && product.policy.pickup.timeLimit != null ,
					reservationP:  0.0 ,
					deliveryP:  0.0 ,
					deliveryFixe:  0.0 ,
					policy : product.policy
				}

			}

		}
		return returnedItem ; 
		
	} catch (error) {
		console.log(error);
		return {
			error : "Product Not found"
		}
	}
	
}

  //get pre Order items
exports.getPreReservationItems = async (req) => {
	try {
		var PreOrder = {
			storeId : null , 
			cartId : null , 
			storeName : "" ,
			maxDeliveryFixe : 0.0 ,
			maxDeliveryKm : 0.0 , 
			storeAdresse : [] , // location
			items : [] , // array of preOrderItem
		}

		var preOrderItem =  {
			productId : null  ,
			variantId : null , 
			name : "" , 
			characterstics : [] ,
			discount : 0.0 , 
			image : "" , 
			price : 0.0 , 
			quantity : 0 ,
			policy : null 
			// policies
			// reservationPolicy : false ,  
			// deliveryPolicy : false ,  
			// pickupPolicy : false ,  
			// // percentage
			// reservationP : 0.0 ,   
		}

		// check cart !!
		var order = await Order.findById(req.body.orderId);
		if (!order) {
			throw new Error('order not found');
		}

		// check store 
		// pas du store au niveau du backend 

		// check items and get current values 
		var items = order.items.map((el) => {return {...el._doc , orderQuantity : el._doc.quantity} ;}) ;
		if(items.length) {
			// get first variant and store 
			var firstProduct = await Product.findOne({ 'variants._id': items[0].variantId }) ; 
			if(!firstProduct) {
				throw new Error('Store not found');
			}
			var store = await Store.findById(firstProduct.storeId) ; 
			if(!store) {
				throw new Error('Store not found');
			}
			PreOrder.storeId = store._id.toString() ; 
			PreOrder.storeName = store.name ; 
			PreOrder.storeAdresse = store.location ; 
		}else {
			throw new Error('items not found');
		}

		items  = await asyncMapPreOrderItems(items, myAsyncFuncPreOrderItems);

		//get max delivery pricing 

		var maxDeliveryKm = items.reduce((max, item) => {
			return item.deliveryP > max ? item.deliveryP : max;
		  }, 0.0);
		PreOrder.maxDeliveryKm = maxDeliveryKm ; 

		var maxDeliveryFixe = items.reduce((max, item) => {
			return item.deliveryFixe > max ? item.deliveryFixe : max;
		  }, 0.0);
		PreOrder.maxDeliveryFixe = maxDeliveryFixe ; 
		  
		PreOrder.items = JSON.stringify(items) ;

		return PreOrder;
	} catch (err) {
		console.log(err);
		throw err;
	}
};
