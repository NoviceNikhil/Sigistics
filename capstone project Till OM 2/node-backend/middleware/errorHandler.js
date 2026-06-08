//const {errorResponse}=require("../utils/apiResponse")
const AppError=require("../utils/AppError")
const errorHandler=(err,req,res,next)=>{
    // console.error(err.stack)
    // const statusCode=err.statusCode || 500

    console.error("ERROR:", {
        message: err?.message,
        statusCode: err?.statusCode,
        stack: err?.stack

    })
    // let statusCode=500;
    // let message="Internal Server Error"
    // if(err && typeof err==="object"){
    //     if(typeof err.statusCode==="number") statusCode=err.statusCode
    //     if(typeof err.message==="string") message=err.message
    //     return errorResponse(res, message, statusCode)
    // }
    if (err instanceof AppError) {
        return res.status(err.statusCode).json(err.toJSON());
    }
    // res.status(statusCode).json({
    //     success:false,
    //     message:err.messsage || "Internal Server Error"
    // })
    if (err && typeof err === "object") {
        const statusCode = typeof err.statusCode === "number" ? err.statusCode : 500;
        const message = typeof err.message === "string" ? err.message : "Internal Server Error";
        const appError = new AppError(message, statusCode);
        return res.status(appError.statusCode).json(appError.toJSON());
    }

    const appError = new AppError("Internal Server Error", 500);
    return res.status(appError.statusCode).json(appError.toJSON());
}
module.exports=errorHandler;