const AppError=require("../utils/AppError")
const validator=require("validator")//external library for robust production ready email validation better than regular expression
const validateAuth=(req,res,next)=>{
    const {email,password}=req.body
    if (!email||email.trim()==="") {
    return next(new AppError(" Email is required for logging in", 400));
  }
  if (!password||password.trim()==="") {
    return next(new AppError("Password is required for logging in", 400));
  }
  if (!validator.isEmail(email)) {
    return next(new AppError("Please enter a valid email id ", 400));
}
next();
}
module.exports=validateAuth