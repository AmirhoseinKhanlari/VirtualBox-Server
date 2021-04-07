const jwt = require('jsonwebtoken');
const AppError = require('../utils/appError');
const catchAsync = require('./../utils/catchAsync');

const signToken = id => {
    return jwt.sign({id},process.env.JWT_SECRET,{
        expiresIn:process.env.JWT_EXPIRES_IN
    })

}

exports.login = catchAsync( async (req,res,next) => {
const {username,password} = req.body;
if(!username || !password) {
    return next(new AppError("Please provide username and password!",400))
}
if((username === 'admin' && password === 'admin') || username === 'user1' && password === 'password') {
    let token = '';
    token = signToken(username);
res.status(200).json({
    status:'success',
    token
})

}
 
})