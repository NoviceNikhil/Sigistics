const nodemailer = require("nodemailer");

const sendOtpEmail = async (email, otp) => {
  try {
    const transporter = nodemailer.createTransport({
      // For cloud: use port 587 with STARTTLS (some hosts block port 465)
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: `"Sigistics" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Sigistics Verification OTP",
      html: `
  <div style="font-family: Arial, sans-serif; background-color: #f4f6f8; padding: 20px;">
    
    <div style="max-width: 500px; margin: auto; background: #ffffff; border-radius: 10px; padding: 30px; text-align: center; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">

      <h2 style="color: #2c3e50; margin-bottom: 10px;">Sigistics</h2>
      <p style="color: #7f8c8d; font-size: 14px;">Secure Access</p>
      <hr style="margin: 20px 0; border: none; border-top: 1px solid #eee;" />
      <h3 style="color: #333;">OTP Verification</h3>
      <p style="color: #555; font-size: 14px;">
        Hello,<br/>
        Use the OTP below to complete your login.
      </p>
      <div style="margin: 25px 0;">
        <span style="
          display: inline-block;
          font-size: 28px;
          letter-spacing: 8px;
          font-weight: bold;
          color: #ffffff;
          background: linear-gradient(135deg, #072fe2ff, #072fe2ff);
          padding: 8px 12px;
          border-radius: 10px;
          box-shadow: 0 4px 10px rgba(0,0,0,0.15);
        ">
          ${otp}
        </span>
      </div>

      <p style="color: #e74c3c; font-size: 13px; margin-top: 10px;">
        ⏳ This OTP will expire in 5 minutes
      </p>

      <p style="color: #777; font-size: 12px; margin-top: 20px;">
        If you did not request this, please ignore this email.
      </p>

      <hr style="margin: 25px 0; border: none; border-top: 1px solid #eee;" />

      <p style="font-size: 12px; color: #aaa;">
        © ${new Date().getFullYear()} Sigistics. All rights reserved.
      </p>

    </div>
  </div>
  `,
    };
    // send mail
    await transporter.sendMail(mailOptions);

    // console.log(" OTP email sent successfully. OTP was:", otp);
  } catch (error) {
    console.log("❌ Error sending email:", error.message);
    throw new Error("Failed to send OTP email");
  }
};

module.exports = sendOtpEmail;