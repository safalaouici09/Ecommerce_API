const User = require('../models/User');
const fs = require('fs');

const CryptoJS = require('crypto-js');
const uuid = require('uuid');
const path = require('path');

//Update User

exports.updateUser = async (req) => {
	try {
		if (req.body.password) {
			req.body.password = CryptoJS.AES.encrypt(req.body.password, process.env.ACCESS_TOKEN_SECRET).toString();
		}
		const updatedUser = await User.findByIdAndUpdate(
			req.params.id,
			{
				$set: req.body,
			},
			{ new: true }
		).select('-password');
		console.log(updatedUser);
		if (updatedUser) {
		}
		return updatedUser;
	} catch (err) {
		throw err;
	}
};

exports.updateUserImage = async(req) => {
	
	try {
		const user = await User.findById(req.params.id) ; 

		try {
			if(user && user.profileImage) {
				fs.unlinkSync(path.resolve(__dirname, '..', '..', 'public')+"/"+user.profileImage);
			  
				console.log("Delete File successfully.");
			}
		  } catch (error) {
			console.log(error);
		  }
		
		
		const image = req.files.image;
		//remove spaces from name
		image.name = image.name.replace(/\s/g, '');
		const fileName = `${uuid.v4()}${image.name}`;
		const uploadPath = path.resolve(__dirname, '..', '..', 'public', 'images', 'users', fileName);
		const storagePath = `images/users/${fileName}`;
		image.mv(uploadPath, function (err) {
			if (err) return console.log(err);
		});
		
		const updatedUser = await User.findByIdAndUpdate(
			req.params.id,
			{
				profileImage : storagePath,
			},
			{ new: true }
		).select('-password');
		
		return updatedUser;
	} catch (err) {
		throw err;
	}
	
}

//delete user
exports.deleteUser = async (req) => {
	try {
		const deletedUser = await User.findByIdAndDelete(req.params.id);
		const { password, ...others } = deletedUser._doc;
		return others;
	} catch (err) {
		throw err;
	}
};
//get user by his id
exports.getUser = async (req) => {
	try {
		console.log('req.params.id', req.params.id);
		console.log('start');
		const user = await User.findById(req.params.id);
		const { password, ...others } = user._doc;
		console.log(others);
		return others;
	} catch (err) {
		throw err;
	}
};


//get user by his id
exports.welcome = async (req) => {
	try {	
		const updatedUser = await User.findByIdAndUpdate(
			req.params.id,
			{
				welcome: true ,
			},
			{ new: true }
		);		

		
		const user = await User.findById(req.params.id);
		const { password, ...others } = user._doc;

		return others;
		
		
	} catch (err) {
		throw err;
	}
};
//get all users
exports.getUsers = async (req) => {
	try {
		const users = await User.find();
		return users;
	} catch (err) {
		throw err;
	}
};
