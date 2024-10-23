const { Schema, model } = require('mongoose');

exports.policySchema = new Schema(
	{   
        
        workingTime : {
            type : {
                openTime: { type: String  ,  default : ""},
                closeTime: { type: String ,  default : ""} ,
            } , 
        },
        pickup: { 
            type : {
                timeLimit : { type: Number  ,  default : null} , 
            } , 
        },
        delivery: {
            type : {
                delivery : {
                    
                    type : Boolean,  default : null } , 
                }
        
            } ,
        
        reservation : {
            type : {
                duration : {type : Number ,  default : null} ,
                payment : {
                    free : {type : Boolean ,  default : null} ,
                    partial : { 
                        fixe : {type : Number ,  default : null} ,
                        percentage : {type : Number ,  default : null} ,
                    } ,
                    total : {type : Boolean ,  default : null} ,
                } ,
                cancelation : {
                    restrictions : {
                        fixe : {type : Number ,  default : null} ,
                        percentage : {type : Number ,  default : null} ,
                    }
                } ,
            } , 
        } , 
        return : {
            type : {
                duration : {type : Number ,  default : null} ,
                productStatus : {type : String ,  default : ""} ,
                returnMethod : {type : String ,  default : ""} ,
                refund : {
                    order : {
                        fixe : {type : Number ,  default : null} ,
                        percentage : {type : Number ,  default : null} ,
                    } , 
                    shipping : {
                        fixe : {type : Number ,  default : null} ,
                        percentage : {type : Number ,  default : null} ,
                    },
                } , 
            } , 

        } , 
        order : {
            type : {
            
            notification : {
                realtime :{type : Boolean ,  default : null} , 
                time :{type : Number ,  default : null} , 
                perOrdersNbr :{type : Number ,  default : null} , 
                sendMode : {
                    mail :{type : Boolean ,  default : null} , 
                    sms :{type : Boolean ,  default : null} , 
                    popup :{type : Boolean ,  default : null} , 
                    vibration :{type : Boolean ,  default : null} , 
                    ringing :{type : Boolean ,  default : null} , 
                } ,
            } 

            }
        }
    },
	{
        
	}
);