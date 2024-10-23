const Product = require('../models/Product');
const Store = require('../models/Store');
const User = require('../models/User');
//search the nearest stores
exports.searchStore = async (req) => {
    try {
        const stores = await Store.aggregate([
            {
                $geoNear: {
                    near: {
                        type: 'Point',
                        coordinates: [parseFloat(req.query.langitude), parseFloat(req.query.latitude)],
                    },
                    key: 'location',
                    distanceField: 'dist.calculated',
    				maxDistance: 200000,
                    spherical: true,
                    includeLocs: 'dist.location',
                },
            },{
                $match: {
                  isActive: true,
                 name: { $regex: req.query.name, $options: 'i' }, 
         
                   
                }
              }
        ]);

        return stores;
    } catch (err) {
        throw err;
    }
};

async function asyncMap(array, asyncFunc) {
	const promises = array.map(asyncFunc);
	return Promise.all(promises);
  }
  
// Example usage
async function myAsyncFunc(element) {
// do some asynchronous operation with item
	if(!element.policy) {
		element.policy = null ;
		let store = await Store.findById(element.storeId) ;
		if(!(store && store.policy)) {
				let seller = await User.findById(element.sellerId) ;
				console.log(seller._id);
				if(seller && seller.policy) {
					element.policy = seller.policy ;
				}else {
					element.policy = null
				}
		}else {
			element.policy = store.policy  ;
		}
	}
	return element ; 
}

  

// search product by nearest store
exports.searchProduct = async (req) => {
	try {
		if (!req.query.page) {
			req.query.page = 1;
		}
		if (!req.query.limit) {
			req.query.limit = 10;
		}

		console.log([parseFloat(req.query.langitude), parseFloat(req.query.latitude) , parseFloat(req.query.radius) ]);
		//get the nearest stores
		const stores = await Store.aggregate([
			{
				$geoNear: {
					near: {
						type: 'Point',
						coordinates: [parseFloat(req.query.langitude), parseFloat(req.query.latitude)],
					},
					key: 'location',
					distanceField: 'dist.calculated',
					maxDistance: 200000,
					spherical: true,
				}
			},
			{
				$match: {
				  isActive: true
				}
			  }
		]);
				
		//get the products by nearest stores
		//search for the products in those stores
		const products = await Product.find({
			storeId: {
				$in: stores.map((store) => store._id)
			} , 
			name: {
				$regex: req.query.name ? req.query.name  : "",
				$options: 'i',
			},
		})
			.skip((req.query.page - 1) * req.query.limit)
			.limit(parseInt(req.query.limit))
			.sort({ createdAt: -1 });

			

			
			let new_products = [...products] ; 
			
			
			new_products  = await asyncMap(new_products, myAsyncFunc);
			console.log("new_products");
			console.log(new_products);
		return new_products;
	} catch (err) {
		throw err;
	}
};
