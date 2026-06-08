const successResponse = (res, message, data = null, statusCode = 200) => {
    return res.status(statusCode).json({
        success: true,
        data,
        message,
        error: null,
    });
};

const errorResponse = (res, message, error = null, statusCode = 500) => {
    return res.status(statusCode).json({
        success: false,
        message,
        data: null,
        error,
    });
};

module.exports = {
    successResponse,
    errorResponse,
};

