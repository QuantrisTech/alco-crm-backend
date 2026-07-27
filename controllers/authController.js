const User = require("../models/userModel.js");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { generateToken, generateRefreshToken } = require("../utils/generateToken.js");
const sendEmail = require("../utils/sendEmail.js");
const generateColor = require("../utils/generateColor.js");

// REGISTER 
exports.register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser)
      return res.status(400).json({ message: "User already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);

    const verificationToken = crypto.randomBytes(32).toString("hex");

    const avatarColor = generateColor(email);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role,
      verificationToken,
      isVerified: false,
      isActive: false,
      avatarColor
    });

    // const verificationUrl = `http://localhost:5000/api/auth/verify-email/${verificationToken}`;
    const verificationUrl = `${process.env.BACKEND_BASE_URL}/api/auth/verify-email/${verificationToken}`

    // ✅ VERIFY EMAIL TEMPLATE use karo (registration nahi)
    await sendEmail({
      to: user.email,
      subject: "Verify your email ✅",
      templateName: "verify", // 👈 naya template banana hoga
      replacements: {
        UserName: user.name,
        VerifyLink: verificationUrl,
        YourCompanyName: "Al-and-co"
      }
    });

    res.status(201).json({
      success: true,
      message: "Please verify your email first",
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// LOGIN
exports.login = async (req, res) => {
  try {

    const { email, password } = req.body;

    const user = await User.findOne({ email }).select("+password");
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    if (!user.isVerified) {
      return res.status(401).json({ message: "Please verify your email first" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    await User.findByIdAndUpdate(user._id, { lastLogin: new Date() });

    // ✅ YAHAN SE NEW CODE START HOTA HAI
    const access_token = generateToken(user);
    const refresh_token = generateRefreshToken(user);

    user.refreshToken = refresh_token;
    await user.save();
    // ✅ YAHAN TAK NEW CODE HAI

    await sendEmail({
      to: user.email,
      subject: "New Login Alert 🔐",
      templateName: "login",
      replacements: {
        UserName: user.name,
        SecurityLink: "https://alco-crm-frontend.vercel.app/login",
        YourCompanyName: "Al-and-co"
      }
    });

    // ✅ RESPONSE BHI REPLACE KARO
    res.status(200).json({
      success: true,
      message: "Login successful",
      data: {
        access_token,
        refresh_token,
        token_type: "Bearer",
        expires_in: 3600,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          isTemporaryPassword: user.isTemporaryPassword,
        }
      }
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET ME
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password"); // password hide
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json({
      success: true,
      user,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// FORGOT PASSWORD
exports.forgotPassword = async (req, res) => {
  const user = await User.findOne({ email: req.body.email });
  if (!user) return res.status(404).json({ message: "User not found" });

  // Generate 6-digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  // Save OTP, expiry and reset attempts
  user.resetPasswordToken = otp;
  user.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 minutes
  user.resetPasswordAttempts = 0; // reset attempts on new OTP
  await user.save();

  // Send OTP email
  await sendEmail({
    to: user.email,
    subject: "Reset Password OTP 🔑",
    templateName: "forgot-password", // your forgotpassword.html template
    replacements: {
      UserName: user.name,
      OTP: otp,
      YourCompanyName: "Al-and-co"
    }
  });

  res.json({
    success: true,
    message: "OTP sent to your email. It expires in 10 minutes."
  });
};

// RESET PASSWORD
exports.resetPassword = async (req, res) => {
  const { email, otp, newPassword } = req.body;

  const user = await User.findOne({
    email,
    resetPasswordExpire: { $gt: Date.now() } // OTP not expired
  });

  if (!user) {
    return res.status(400).json({ message: "Invalid or expired OTP" });
  }

  // Check OTP attempts
  if (user.resetPasswordAttempts >= 5) {
    return res.status(429).json({ message: "Too many wrong attempts. Request a new OTP." });
  }

  // Check OTP
  if (user.resetPasswordToken !== otp) {
    user.resetPasswordAttempts += 1;
    await user.save();
    return res.status(400).json({ message: "Incorrect OTP" });
  }

  // ✅ OTP correct → update password
  user.password = await bcrypt.hash(newPassword, 10);
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;
  user.resetPasswordAttempts = 0; // reset counter
  await user.save();

  res.json({
    success: true,
    message: "Password reset successfully"
  });
};

// VERIFY EMAIL
exports.verifyEmail = async (req, res) => {
  const user = await User.findOne({ verificationToken: req.params.token });

  // if (!user) {
  //   return res.status(400).json({ message: "Invalid token" });
  // }

  // ✅ Token invalid ya already used check
  if (!user) {
    return res.status(400).json({
      message: "This verification link has already been used or is invalid."
    });
  }

  user.isVerified = true;
  user.verificationToken = undefined;

  await user.save();

  // ✅ Ab JWT do
  const token = generateToken(user);

  // ✅ Welcome email yahan bhejo (ab user verified hai)
  await sendEmail({
    to: user.email,
    subject: "Welcome 🎉",
    templateName: "registration",
    replacements: {
      UserName: user.name,
      LoginLink: "http://localhost:3000/login",
      YourCompanyName: "Al-and-co"
    }
  });

  res.json({
    success: true,
    message: "Email verified successfully",
    token
  });
};

// LOGOUT
exports.logout = async (req, res) => {
  try {
    // refreshToken DB se hata do
    await User.findByIdAndUpdate(req.user.id, { refreshToken: null });

    res.status(200).json({
      success: true,
      message: "Logged out successfully"
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// REFRESH TOKEN
exports.refreshToken = async (req, res) => {
  const { refresh_token } = req.body;

  if (!refresh_token) {
    return res.status(400).json({
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "Refresh token required",
      },
    });
  }

  try {
    // Token verify karo
    const decoded = jwt.verify(refresh_token, process.env.JWT_REFRESH_SECRET);

    // User DB mein check karo
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({
        success: false,
        error: {
          code: "UNAUTHORIZED",
          message: "User not found",
        },
      });
    }

    // Check karo token DB mein stored hai ya nahi (optional but recommended)
    if (user.refreshToken !== refresh_token) {
      return res.status(401).json({
        success: false,
        error: {
          code: "UNAUTHORIZED",
          message: "Invalid refresh token",
        },
      });
    }

    // Naye tokens banao
    const newAccessToken = generateToken(user);
    const newRefreshToken = generateRefreshToken(user);

    // Naya refresh token DB mein save karo
    user.refreshToken = newRefreshToken;
    await user.save();

    return res.status(200).json({
      success: true,
      data: {
        access_token: newAccessToken,
        refresh_token: newRefreshToken,
        token_type: "Bearer",
        expires_in: 3600,
      },
    });

  } catch (error) {
    // Token expired ya invalid
    return res.status(401).json({
      success: false,
      error: {
        code: "UNAUTHORIZED",
        message: "Refresh token expired or invalid. Please login again.",
      },
    });
  }
};

// ✅ RESEND VERIFICATION EMAIL
exports.resendVerification = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.isVerified) {
      return res.status(400).json({ message: "Email already verified" });
    }

    // Naya token banao
    const verificationToken = crypto.randomBytes(32).toString("hex");
    user.verificationToken = verificationToken;
    await user.save();

    const verificationUrl = `${process.env.BACKEND_BASE_URL}/api/auth/verify-email/${verificationToken}`;

    await sendEmail({
      to: user.email,
      subject: "Verify your email ✅",
      templateName: "verify",
      replacements: {
        UserName: user.name,
        VerifyLink: verificationUrl,
        YourCompanyName: "Al-and-co",
      },
    });

    res.status(200).json({
      success: true,
      message: "Verification email sent again",
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
