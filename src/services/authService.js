const CryptoJS = require('crypto-js');
const jwt = require('jsonwebtoken');
var User = require('../models/User');
const { sendMail } = require('../middleware/email');

var axios = require('axios');
const Product = require('../models/Product');
const Cart = require('../models/Cart');
const Offer = require('../models/Offer');


exports.register = async (userInfo) => {
	try {
		const random = Math.floor(Math.random() * (9999 - 1000 + 1)) + 1000;
		if(userInfo.email && userInfo.email != "" ) {
			const userEmail = await User.findOne({ email: userInfo.email });
			if (userEmail) {
				throw new Error('Email already exists !');
			}
			
		}else if(userInfo.phone && userInfo.phone != "") {
			const userphone = await User.findOne({ phone: userInfo.phone });
			if (userphone) {
				throw new Error('Phone number already exists !');
			}
		}else {
			throw new Error('You must enter an email or a phone number !');
		}

		const username = await User.findOne({ username: userInfo.username });
		if (username) {
			throw new Error('Username already exists !');
		}

		if(!(userInfo.password && userInfo.password_confirmation && userInfo.password == userInfo.password_confirmation)) {
			throw new Error('The password and its confirmation are not the same');
		}

		const newUser = new User({
			email: userInfo.email,
			phone: userInfo.phone ,
			username : userInfo.username , 
			password: userInfo.password,
			role: userInfo.role,
			verificationCode: random,
		});
		newUser.password = CryptoJS.AES.encrypt(newUser.password, process.env.ACCESS_TOKEN_SECRET).toString();

		

		try {
			if(newUser.email) {
				sendMail(
					newUser.email,
					'Welcome to SmartCity',
					'Welcome ' +
						newUser.email.split('@')[0] +
						' You have successfully registered to the app your account is now active you can login to the app ' +
						'' +
						' your verification code is ' +
						random +
						' ' +
						' your email is ' +
						userInfo.email 
				);
			}else if (newUser.phone) {
				var phone_to = newUser.phone.substring(1) ;
				var data = JSON.stringify({
					"message": ' your verification code is ' +random,
					"to": phone_to ,
					"sender_id": "Proximity"
				  });
				  
				  var config = {
					method: 'post',
					url: 'https://api.sms.to/sms/estimate',
					headers: { 
					  'Authorization': 'Bearer '+process.env.SMSTO_API_KEY, 
					  'Content-Type': 'application/json'
					},
					data : data
				  };
				  
				  axios(config)
				  .then(function (response) {
					console.log(JSON.stringify(response.data));
				  })
				  .catch(function (error) {
					console.log(error);
				  });
				  
			}
			
		} catch (err) {
			throw err;
		}
		const savedUser = await newUser.save();
		
		let cartItems = [] ; 

		if(userInfo.role == "user" &&  typeof userInfo.cart === "string" && userInfo.cart != "" )  {
			cartItems = JSON.parse(userInfo.cart) ; 
		}

		cartItems = cartItems.map((el) => {return {...el , userId : savedUser._id  }}) ;

		
		console.log('cart Items', cartItems);
		cartItems =  await asyncMapAddToCart(cartItems, myAsyncFuncAddToCart);
		

		return savedUser;
	} catch (err) {
		throw err;
	}
};

//LOGIN
exports.login = async (userInfo) => {
	try {
		let user = await User.findOne({ email: userInfo.email });
		if(!user) {
			user = await User.findOne({ phone: userInfo.email });
		}
		if(!user) {
			user = await User.findOne({ username: userInfo.email });
		}

		if (user) {
			const hashedPassword = CryptoJS.AES.decrypt(user.password, process.env.ACCESS_TOKEN_SECRET).toString(CryptoJS.enc.Utf8);
				const inputPassword = userInfo.password;
				if (hashedPassword === inputPassword) {
					const token = jwt.sign({ id: user._id, role: user.role }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '7d' });
					if(user.role != userInfo.role) {
						return {
							success : false , 
							message : "Permission denied" , 
							data : 3
						};
					}
					if (!user.isVerified) {
						return {
							success : false , 
							message : "Account not verified" , 
							data : 4
						};
					}
					return {
						success : true , 
						message : "" , 
						data : {
							token,
							user: {
								id: user._id,
								email: user.email,
								role: user.role,
								username: user.username,
								welcome : user.welcome ? user.welcome : false 
							}
						}
					};
				} else {
					return {
						success : false , 
						message : "password is incorrect" , 
						data : 2
					};
				}
		} else {
			return {
				success : false , 
				message : "user is not registered" , 
				data : 1
			};
		}
	} catch (err) {
		throw err;
	}
};

//VERIFY
exports.verify = async (req) => {
	try {
		console.log(req);
		const user = await User.findOne({ email: req.email });
		console.log(user) ;
		if (!user) throw new Error('Wrong User Name');
		if (user.verificationCode === req.verificationCode) {
			user.isVerified = true;
			user.save();
			const token = jwt.sign({ id: user._id, role: user.role }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '7d' });
			try {
				sendMail(user.email, 'Registration Completed', 'Your email is Now Verified');
			} catch (err) {
				console.log(err);
			}
			return {
				success : true , 
				message : 'hello ' + user.email + ' your email is now verified' , 
				data : {
					token,
					user: {
						id: user._id,
						email: user.email,
						role: user.role,
						username: user.username,
					}
				}
			};
		} else {
			throw Error('User code incorrect');
		}
	} catch (err) {
		console.log(err);
		throw err;
	}
};


//VERIFY
exports.resend_verification_code = async (userInfo) => {
	try {
		var user = await User.findOne({ email: userInfo.email });
		if (!user) {
			user =  await User.findOne({ phone: userInfo.email }) ;
		}
		if (!user) {
			user =  await User.findOne({ username: userInfo.email }) ;
		}
		if(!user) {
			throw new Error('user is not registered');
		}
		if (user.isVerified) {
			throw new Error('Account already verified');
		} else {
			try {
				
				const random = Math.floor(Math.random() * (9999 - 1000 + 1)) + 1000;
				user.verificationCode = random ;
				const savedUser = await user.save();
				if(user.email) {
					sendMail(
						user.email,
						'Welcome to SmartCity',
						'Welcome ' +
						user.email.split('@')[0] +
							' You have successfully registered to the app your account is now active you can login to the app ' +
							'' +
							' your verification code is ' +
							random 
					);
				}else if (user.phone) {
					var phone_to = user.phone.substring(1) ;
					var data = JSON.stringify({
						"message": ' your verification code is ' +random,
						"to": phone_to ,
						"sender_id": "Proximity"
					  });
					  
					  var config = {
						method: 'post',
						url: 'https://api.sms.to/sms/estimate',
						headers: { 
						  'Authorization': 'Bearer '+process.env.SMSTO_API_KEY, 
						  'Content-Type': 'application/json'
						},
						data : data
					  };
					  
					  axios(config)
					  .then(function (response) {
						console.log(JSON.stringify(response.data));
					  })
					  .catch(function (error) {
						console.log(error);
					  });
					  
				}
				
				return true ;
				
			} catch (err) {
				throw err;
			}
		}
	} catch (err) {
		console.log(err);
		throw err;
	}
};


async function asyncMapAddToCart(array, asyncFunc) {
	const promises = array.map(asyncFunc);
	return Promise.all(promises);
  }
  
// Example usage
async function myAsyncFuncAddToCart(element) {
	try {
		console.log('req.body', element.productId);
		const product = await Product.findOne({ _id: element.productId }).populate('storeId');
		if (!product || product.deleted) throw new Error('Product does not exist 1');
		//check if the varient exist
		const variant = product.variants.find((variant) => variant.id === element.variantId);
		if (!variant || !variant.available || !variant.quantity) throw new Error('variant is not available any more ');

		//check the quantity of the variant
		if (variant.quantity <= element.quantity) {
			element.quantity = variant.quantity;
		}

		//update the variant price
		//get the price of varient
		let priceVariant = 0.0;
		priceVariant = variant.price;
		let discountvar = 0;
		let discountQuantity = 0;
		let offerExist = false;

		//update the price of varient

		//check if the product is an offer

		if (product.offer) {
			console.log('fih offer');
			const offer = await Offer.findOne({ _id: product.offer });
			if (offer) {
				offerContent = offer.toObject();
			}
			//check if offer still active
			if (offer && offer.active && offer.offerStock && !offer.offerDeleted) {
				//check the discount type of offer
				offerExist = true;
				if (offer.offerStock <= element.quantity) {
					discountQuantity = offer.offerStock;
				} else {
					discountQuantity = element.quantity;
				}
				//update discount

				//calculate the product number of offer
				if (offer.discountType == 'percentage') {
					console.log('percentage');
					discountvar = (offer.offerDiscount / 100) * variant.price;
					//update price variant
				} else {
					discountvar = offer.offerDiscount;
				}
			} else {
				discountvar = 0;
				priceVariant = variant.price;
				discountQuantity = 0;
			}
		} else {
			discountvar = 0;
			priceVariant = variant.price;
			discountQuantity = 0;
		}
		const cart = await Cart.findOne({ userId: element.userId });
		console.log('cart', cart);
		if (!cart) {
			const newCart = new Cart({
				userId: element.userId,
				items: [
					{
						productId: element.productId,
						variantId: element.variantId,
						quantity: element.quantity,
						discount: discountvar,
						discountQuantity: discountQuantity,
						price: priceVariant,
						totalPrice: priceVariant * element.quantity - discountQuantity * discountvar,
					},
				],
			});

			await newCart.save();
			console.log('new cart', newCart);
			return newCart;
		} else {
			console.log('cart exist');
			console.log(discountvar);
			console.log(priceVariant);
			console.log(discountQuantity);
			console.log('fffffffffffffffffffff');
			//check if the product variant is already in the cart
			const isProductInCart = cart.items.find((item) => item.variantId == element.variantId);
			if (isProductInCart) {
				const index = cart.items.findIndex((item) => item.variantId == element.variantId);
				cart.items[index].quantity = element.quantity;
				//update discountQuantity
				cart.items[index].discountQuantity = discountQuantity;
				cart.items[index].discount = discountvar;

				cart.items[index].totalPrice = variant.price * cart.items[index].quantity - cart.items[index].discountQuantity * cart.items[index].discount;

				//cart.items[index].totalDiscount = cart.items[index].totalDiscount + cart.items[index].discount * cart.items[index].quantity;
				//cart.items[index].totalPayable = cart.items[index].totalPriceAllProducts - cart.items[index].totalDiscount;
			} else {
				cart.items.push({
					productId: element.productId,
					quantity: element.quantity,
					discount: discountvar,
					variantId: element.variantId,
					discountQuantity: discountQuantity,
					price: priceVariant,
					totalPrice: priceVariant * element.quantity - discountQuantity * discountvar,
				});
			}
			await cart.save();
			return cart;
		}
	} catch (err) {
	}
	return null ;
	
}

