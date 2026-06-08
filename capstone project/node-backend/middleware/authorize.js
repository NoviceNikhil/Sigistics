const AppError = require("../utils/AppError");

const authorize = (...allowedRoles) => {
    return (req,res,next) => {
        //console.log(allowedRoles.includes(req.user.role));
        

        if(!req.user){
            return next(new AppError("Authentication failed",401));
        }

        if(!allowedRoles.includes(req.user.role)){
            return next(new AppError("Forbidden: Insufficient Permissions,Authorization Failiure",403));
        }
        next();
    };
};
module.exports = authorize;