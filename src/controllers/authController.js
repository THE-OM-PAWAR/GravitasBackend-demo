const jwt = require('jsonwebtoken');
const User = require('../models/User');
const nodemailer = require('nodemailer');
const dotenv = require("dotenv");
dotenv.config();


const transporter = nodemailer.createTransport({
  host:process.env.SMTP_HOST,
  port:process.env.SMTP_PORT,
  auth: {
    user:process.env.SMTP_USER, // Replace with your API Key
    pass:process.env.SMTP_PASS, // Same as Username
  },
});

const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN
  });
};

const sendOTPEmail = async (email, otp) => {
  console.log(email, "This is email where otp will be send");
  console.log(otp, "This is the otp coming sendOTP Email")

  const mailOptions = {
    from:process.env.EMAIL_FROM, // Must be your verified email
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
  
  await transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error("Error:", error);
    } else {
      console.log("Email sent:", info.response);
    }
  });
};

exports.signup = async (req, res) => {
  try {
    const newUser = await User.create({
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      email: req.body.email,
      password: req.body.password,
      company: req.body.company
    });

    // Generate and send OTP
    const otp = newUser.generateOTP();
    await newUser.save();
    await sendOTPEmail(newUser.email, otp);

    const token = signToken(newUser._id);

    res.status(201).json({
      status: 'success',
      token,
      data: {
        user: {
          id: newUser._id,
          email: newUser.email,
          firstName: newUser.firstName,
          lastName: newUser.lastName,
          company: newUser.company,
          isVerified: newUser.isVerified
        }
      }
    });
  } catch (error) {
    res.status(400).json({
      status: 'fail',
      message: error.message
    });
  }
};

exports.verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        status: 'fail',
        message: 'User not found'
      });
    }

    if (user.isVerified) {
      return res.status(400).json({
        status: 'fail',
        message: 'User is already verified'
      });
    }

    if (!user.verifyOTP(otp)) {
      return res.status(400).json({
        status: 'fail',
        message: 'Invalid or expired OTP'
      });
    }

    user.isVerified = true;
    user.otp = undefined;
    await user.save();

    const token = signToken(user._id);

    res.status(200).json({
      status: 'success',
      token,
      data: {
        user: {
          id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          company: user.company,
          isVerified: user.isVerified
        }
      }
    });
  } catch (error) {
    res.status(400).json({
      status: 'fail',
      message: error.message
    });
  }
};

exports.resendOTP = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        status: 'fail',
        message: 'User not found'
      });
    }

    if (user.isVerified) {
      return res.status(400).json({
        status: 'fail',
        message: 'User is already verified'
      });
    }

    const otp = user.generateOTP();
    await user.save();
    await sendOTPEmail(user.email, otp);

    res.status(200).json({
      status: 'success',
      message: 'OTP sent successfully'
    });
  } catch (error) {
    res.status(400).json({
      status: 'fail',
      message: error.message
    });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if email and password exist
    if (!email || !password) {
      return res.status(400).json({
        status: 'fail',
        message: 'Please provide email and password'
      });
    }

    // Check if user exists && password is correct
    const user = await User.findOne({ email }).select('+password');

    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({
        status: 'fail',
        message: 'Incorrect email or password'
      });
    }

    // If user is not verified, send new OTP
    if (!user.isVerified) {
      const otp = user.generateOTP();
      await user.save();
      await sendOTPEmail(user.email, otp);

      return res.status(200).json({
        status: 'success',
        message: 'Please verify your email',
        requiresVerification: true,
        data: {
          user: {
            id: user._id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            company: user.company,
            isVerified: user.isVerified
          }
        }
      });
    }

    // If everything ok, send token to client
    const token = signToken(user._id);

    res.status(200).json({
      status: 'success',
      token,
      data: {
        user: {
          id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          company: user.company,
          isVerified: user.isVerified
        }
      }
    });
  } catch (error) {
    res.status(400).json({
      status: 'fail',
      message: error.message
    });
  }
};

exports.loginWithOTP = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    console.log(user, "This is user")
    if (!user) {
      return res.status(404).json({
        status: 'fail',
        message: 'User not found'
      });
    }

    const otp = user.generateOTP();
    console.log(otp);
    await user.save();
    await sendOTPEmail(user.email, otp);

    res.status(200).json({
      status: 'success',
      message: 'OTP sent successfully'
    });
  } catch (error) {
    res.status(400).json({
      status: 'fail',
      message: error.message
    });
  }
};

exports.verifyLoginOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        status: 'fail',
        message: 'User not found'
      });
    }

    if (!user.verifyOTP(otp)) {
      return res.status(400).json({
        status: 'fail',
        message: 'Invalid or expired OTP'
      });
    }

    user.otp = undefined;
    if (!user.isVerified) {
      user.isVerified = true;
    }
    await user.save();

    const token = signToken(user._id);

    res.status(200).json({
      status: 'success',
      token,
      data: {
        user: {
          id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          company: user.company,
          isVerified: user.isVerified
        }
      }
    });
  } catch (error) {
    res.status(400).json({
      status: 'fail',
      message: error.message
    });
  }
};