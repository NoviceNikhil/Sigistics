const authServisesOTP = require("../services/authServices.verifyOTP");
const { successResponse, errorResponse } = require("../utils/apiResponse");

//   USER OTP (login/signup/forgot)

exports.verifyUserOTP = async (req, res) => {
  try {
    let { email, otp, type } = req.body;

    if (!email || !otp || !type) {
      return errorResponse(res, "email, otp and type required", null, 400);
    }

    email = email.trim().toLowerCase();
    otp = otp.trim();

    //   pass type here
    const data = await authServisesOTP.verifyUserOTP(email, otp, type);

    //   only for signup (login token)
    if (data.token) {
      res.cookie("token", data.token, {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
      });
    }

    return successResponse(res, "User OTP verified", data);
  } catch (err) {
    return errorResponse(res, err.message, null, err.statusCode || 500);
  }
};
exports.verifyAdminLoginOTP = async (req, res) => {
  try {
    let { email, otp } = req.body;

    if (!email || !otp) {
      return errorResponse(res, "email and otp required", null, 400);
    }

    email = email.trim().toLowerCase();
    otp = otp.trim();

    const data = await authServisesOTP.verifyAdminOTP(email, otp);

    //   LOGIN → set cookie
    res.cookie("token", data.token, {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      path: "/",
    });

    return successResponse(res, "Admin login OTP verified", data);
  } catch (err) {
    return errorResponse(
      res,
      err.message || "Admin OTP verification failed",
      null,
      err.statusCode || 500,
    );
  }
};

exports.verifyDeliveryOTP = async (req, res) => {
  try {
    let { email, otp, type } = req.body;

    if (!email || !otp || !type) {
      return errorResponse(res, "email, otp and type required", null, 400);
    }

    email = email.trim().toLowerCase();
    otp = otp.trim();

    const data = await authServisesOTP.verifyDeliveryOTP(email, otp, type);

    return successResponse(res, "Delivery OTP verified", data);
  } catch (err) {
    return errorResponse(
      res,
      err.message || "Delivery OTP verification failed",
      null,
      err.statusCode || 500,
    );
  }
};
