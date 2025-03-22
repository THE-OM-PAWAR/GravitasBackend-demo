const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const dotenv = require("dotenv");
const { User } = require('../models/User');
dotenv.config();

const generateAccessAndRefereshTokens = async (userId) => {
  try {
    const user = await User.findById(userId);
    if (!user) throw new Error("User not found");

    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    throw new Error("Something went wrong while generating tokens");
  }
};

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const sendOTPEmail = async (email, otp) => {
  console.log(`Sending OTP to ${email}: ${otp}`);

  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: email,
    subject: "OTP for Verification on Avirrav",
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px;">
        <h2>Email Verification</h2>
        <p>Your OTP for email verification is: <strong>${otp}</strong></p>
        <p>This OTP will expire in 10 minutes.</p>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
};

// ✅ User Signup
exports.signup = async (req, res) => {
  try {
    const newUser = await User.create(req.body);

    // Generate and send OTP
    const otp = newUser.generateOTP();
    await newUser.save();
    await sendOTPEmail(newUser.email, otp);

    const { accessToken, refreshToken } = await generateAccessAndRefereshTokens(newUser._id);

    res.status(201).json({
      status: 'success',
      accessToken,
      refreshToken,
      data: { user: newUser },
    });
  } catch (error) {
    res.status(400).json({ status: 'fail', message: error.message });
  }
};

// ✅ Verify OTP
exports.verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;
    const user = await User.findOne({ email });

    if (!user || !user.verifyOTP(otp)) {
      return res.status(400).json({ status: 'fail', message: 'Invalid or expired OTP' });
    }

    user.isVerified = true;
    user.otp = undefined;
    await user.save();

    const { accessToken, refreshToken } = await generateAccessAndRefereshTokens(user._id);

    res.status(200).json({
      status: 'success',
      accessToken,
      refreshToken,
      data: { user },
    });
  } catch (error) {
    res.status(400).json({ status: 'fail', message: error.message });
  }
};

// ✅ Resend OTP
exports.resendOTP = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) return res.status(404).json({ status: 'fail', message: 'User not found' });

    if (user.isVerified) return res.status(400).json({ status: 'fail', message: 'User is already verified' });

    const otp = user.generateOTP();
    await user.save();
    await sendOTPEmail(user.email, otp);

    res.status(200).json({ status: 'success', message: 'OTP sent successfully' });
  } catch (error) {
    res.status(400).json({ status: 'fail', message: error.message });
  }
};

// ✅ Login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ status: 'fail', message: 'Please provide email and password' });

    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ status: 'fail', message: 'Incorrect email or password' });
    }

    if (!user.isVerified) {
      const otp = user.generateOTP();
      await user.save();
      await sendOTPEmail(user.email, otp);
      return res.status(200).json({ status: 'success', message: 'Please verify your email', requiresVerification: true });
    }

    const { accessToken, refreshToken } = await generateAccessAndRefereshTokens(user._id);

    res.status(200).json({
      status: 'success',
      accessToken,
      refreshToken,
      data: { user },
    });
  } catch (error) {
    res.status(400).json({ status: 'fail', message: error.message });
  }
};

// ✅ Login with OTP
exports.loginWithOTP = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) return res.status(404).json({ status: 'fail', message: 'User not found' });

    const otp = user.generateOTP();
    await user.save();
    await sendOTPEmail(user.email, otp);

    res.status(200).json({ status: 'success', message: 'OTP sent successfully' });
  } catch (error) {
    res.status(400).json({ status: 'fail', message: error.message });
  }
};

// ✅ Verify Login OTP
exports.verifyLoginOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;
    const user = await User.findOne({ email });

    if (!user || !user.verifyOTP(otp)) {
      return res.status(400).json({ status: 'fail', message: 'Invalid or expired OTP' });
    }

    user.otp = undefined;
    if (!user.isVerified) user.isVerified = true;
    await user.save();

    const { accessToken, refreshToken } = await generateAccessAndRefereshTokens(user._id);

    res.status(200).json({
      status: 'success',
      accessToken,
      refreshToken,
      data: { user },
    });
  } catch (error) {
    res.status(400).json({ status: 'fail', message: error.message });
  }
};
