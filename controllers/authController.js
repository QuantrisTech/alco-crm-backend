// controllers/authController.js — UPDATED
const User = require("../models/userModel.js");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { generateToken, generateRefreshToken } = require("../utils/generateToken.js");
const sendEmail = require("../utils/sendEmail.js");
const generateColor = require("../utils/generateColor.js");

// ─── REGISTER ────────────────────────────────────────────────
// exports.register = async (req, res) => {
//   try {
//     const { name, email, password, role } = req.body;

//     const existingUser = await User.findOne({ email });
//     if (existingUser)
//       return res.status(400).json({ message: "User already exists" });

//     const hashedPassword = await bcrypt.hash(password, 10);
//     const verificationToken = crypto.randomBytes(32).toString("hex");
//     const avatarColor = generateColor(email);

//     const user = await User.create({
//       name,
//       email,
//       password: hashedPassword,
//       role,
//       verificationToken,
//       isVerified: false,
//       isActive: false,
//       avatarColor,
//     });

//     // ✅ Email fail ho toh bhi registration complete ho
//     try {
//       const verificationUrl = `${process.env.BACKEND_BASE_URL}/api/auth/verify-email/${verificationToken}`;
//       await sendEmail({
//         to: user.email,
//         subject: "Verify your email ✅",
//         templateName: "verify",
//         replacements: {
//           UserName: user.name,
//           VerifyLink: verificationUrl,
//           YourCompanyName: "Al-and-co",
//         },
//       });
//     } catch (emailError) {
//       console.error("Verification email send nahi hua:", emailError.message);
//       // Silent fail — user ban gaya, email baad mein resend kar sakte ho
//     }

//     res.status(201).json({ success: true, message: "Registration successful. Verification email bhej di gayi hai (agar available ho)." });
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };
exports.register = async (req, res) => {
  try {
    const isHuman = await verifyTurnstile(req.body.turnstileToken);
    if (!isHuman) {
      return res.status(400).json({ message: "Security check failed. Please try again." });
    }

    const { name, email, phone, role } = req.body;
    const normalizedEmail = email?.toLowerCase().trim();

    if (!normalizedEmail || !name) {
      return res.status(400).json({ message: "Name and email are required" });
    }

    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(200).json({
        success: true,
        duplicate: true,
        message: "You're already registered. Check your email for login details. 😊",
      });
    }

    const plainPassword = Math.random().toString(36).slice(-8);
    const hashedPassword = await bcrypt.hash(plainPassword, 10);

    const newUser = await User.create({
      name,
      email: normalizedEmail,
      phone: phone || null,
      password: hashedPassword,
      role: role || "user",
      isVerified: true,
      isActive: true,
      avatarColor: generateColor(normalizedEmail),
      isTemporaryPassword: true,
    });

    await sendEmailDynamic({
      to: normalizedEmail,
      subject: "Your Account Credentials 🔑",
      templateName: "send-user-credentials",
      replacements: {
        UserName: name,
        UserEmail: normalizedEmail,
        UserPassword: plainPassword,
        SupportEmail: "alco@support.com",
        YourCompanyName: "Al-and-co",
        LoginLink: `https://app.arslanlarik.com/auth?email=${normalizedEmail}&password=${plainPassword}`,
      },
    });

    return res.status(201).json({
      success: true,
      duplicate: false,
      message: "Registration successful. Check your email for login details. 😊",
      data: { id: newUser._id, name: newUser.name, email: newUser.email },
    });

  } catch (error) {
    if (error.code === 11000) {
      return res.status(200).json({
        success: true,
        duplicate: true,
        message: "You're already registered. Check your email for login details. 😊",
      });
    }
    res.status(500).json({ message: error.message });
  }
};
// ─── LOGIN (UPDATED — old_user support) ──────────────────────
exports.login = async (req, res) => {
  try {
    const { identifier, password } = req.body;
    // identifier = email | phone | username

    if (!identifier) {
      return res.status(400).json({ message: "Email, phone, or username is required" });
    }

    // ✅ Tino se dhundho
    const user = await User.findOne({
      $or: [
        { email: identifier.toLowerCase() },
        { phone: identifier },
        { username: identifier.toLowerCase() },
      ],
    }).select("+password");

    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // ✅ OLD USER — password skip, seedha login
    if (user.is_old_user) {
      await User.findByIdAndUpdate(user._id, { lastLogin: new Date() });

      const access_token = generateToken(user);
      const refresh_token = generateRefreshToken(user);
      user.refreshToken = refresh_token;
      await user.save();

      return res.status(200).json({
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
            phone: user.phone,
            role: user.role,
            is_old_user: user.is_old_user,
            needsAccountSetup: user.needsAccountSetup,
            isTemporaryPassword: user.isTemporaryPassword,
          },
        },
      });
    }

    // ✅ NORMAL USER — email verify + password check
    if (!user.is_old_user && !user.isVerified) {
      return res.status(401).json({
        message: "Please verify your email first",
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    await User.findByIdAndUpdate(user._id, { lastLogin: new Date() });

    const access_token = generateToken(user);
    const refresh_token = generateRefreshToken(user);
    user.refreshToken = refresh_token;
    await user.save();

    // Login alert email (sirf jo email wale hain)
    if (user.email) {
      // ✅ Email fail ho toh login block na ho
      try {
        await sendEmail({
          to: user.email,
          subject: "New Login Alert 🔐",
          templateName: "login",
          replacements: {
            UserName: user.name,
            SecurityLink: "https://app.arslanlarik.com/auth",
            YourCompanyName: "Al-and-co",
          },
        });
      } catch (emailError) {
        console.error("Login alert email send nahi hua:", emailError.message);
        // Silent fail — login phir bhi successful rahega
      }
    }

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
          is_old_user: user.is_old_user,
          needsAccountSetup: user.needsAccountSetup,
          isTemporaryPassword: user.isTemporaryPassword,
        },
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─── COMPLETE ACCOUNT SETUP (old user → email + password set) ─
exports.completeAccountSetup = async (req, res) => {
  try {
    const { email, password } = req.body;
    const userId = req.user.id;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    // Email already kisi aur ka toh nahi?
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing && existing._id.toString() !== userId) {
      return res.status(409).json({ message: "Email already in use" });
    }

    const verificationToken = crypto.randomBytes(32).toString("hex");
    const hashedPassword = await bcrypt.hash(password, 10);
    const avatarColor = generateColor(email);

    await User.findByIdAndUpdate(userId, {
      email: email.toLowerCase(),
      password: hashedPassword,
      verificationToken,
      isVerified: false,        // email verify karwao
      is_old_user: false,       // ab normal user ban gaya
      needsAccountSetup: false,
      isTemporaryPassword: false,
      avatarColor,
    });

    const verificationUrl = `${process.env.BACKEND_BASE_URL}/api/auth/verify-email/${verificationToken}`;

    await sendEmail({
      to: email,
      subject: "Verify your email ✅",
      templateName: "verify",
      replacements: {
        UserName: req.user.name,
        VerifyLink: verificationUrl,
        YourCompanyName: "Al-and-co",
      },
    });

    res.json({
      success: true,
      message: "Account setup done! Please verify your email.",
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─── GET ME ──────────────────────────────────────────────────
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─── FORGOT PASSWORD ─────────────────────────────────────────
exports.forgotPassword = async (req, res) => {
  const user = await User.findOne({ email: req.body.email });
  if (!user) return res.status(404).json({ message: "User not found" });

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  user.resetPasswordToken = otp;
  user.resetPasswordExpire = Date.now() + 10 * 60 * 1000;
  user.resetPasswordAttempts = 0;
  await user.save();

  await sendEmail({
    to: user.email,
    subject: "Reset Password OTP 🔑",
    templateName: "forgot-password",
    replacements: { UserName: user.name, OTP: otp, YourCompanyName: "Al-and-co" },
  });

  res.json({ success: true, message: "OTP sent to your email. It expires in 10 minutes." });
};

// ─── RESET PASSWORD ──────────────────────────────────────────
exports.resetPassword = async (req, res) => {
  const { email, otp, newPassword } = req.body;

  const user = await User.findOne({ email, resetPasswordExpire: { $gt: Date.now() } });
  if (!user) return res.status(400).json({ message: "Invalid or expired OTP" });

  if (user.resetPasswordAttempts >= 5)
    return res.status(429).json({ message: "Too many wrong attempts. Request a new OTP." });

  if (user.resetPasswordToken !== otp) {
    user.resetPasswordAttempts += 1;
    await user.save();
    return res.status(400).json({ message: "Incorrect OTP" });
  }

  user.password = await bcrypt.hash(newPassword, 10);
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;
  user.resetPasswordAttempts = 0;
  user.isTemporaryPassword = false;   
  user.needsAccountSetup = false; 
  await user.save();

  res.json({ success: true, message: "Password reset successfully" });
};

// ─── VERIFY EMAIL ────────────────────────────────────────────
exports.verifyEmail = async (req, res) => {
  const user = await User.findOne({ verificationToken: req.params.token });

  if (!user) {
    return res.status(400).json({ message: "This verification link has already been used or is invalid." });
  }

  user.isVerified = true;
  user.verificationToken = undefined;
  await user.save();

  const token = generateToken(user);

  if (user.email) {
    await sendEmail({
      to: user.email,
      subject: "Welcome 🎉",
      templateName: "registration",
      replacements: { UserName: user.name, LoginLink: process.env.CRM_FRONTEND_URL + "/auth", YourCompanyName: "Al-and-co" },
    });
  }

  res.json({ success: true, message: "Email verified successfully", token });
};

// ─── LOGOUT ──────────────────────────────────────────────────
exports.logout = async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.user.id, { refreshToken: null });
    res.status(200).json({ success: true, message: "Logged out successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─── REFRESH TOKEN ───────────────────────────────────────────
exports.refreshToken = async (req, res) => {
  const { refresh_token } = req.body;
  if (!refresh_token) return res.status(400).json({ success: false, error: { code: "VALIDATION_ERROR", message: "Refresh token required" } });

  try {
    const decoded = jwt.verify(refresh_token, process.env.JWT_REFRESH_SECRET);
    const user = await User.findById(decoded.id);

    if (!user) return res.status(401).json({ success: false, error: { code: "UNAUTHORIZED", message: "User not found" } });
    if (user.refreshToken !== refresh_token) return res.status(401).json({ success: false, error: { code: "UNAUTHORIZED", message: "Invalid refresh token" } });

    const newAccessToken = generateToken(user);
    const newRefreshToken = generateRefreshToken(user);
    user.refreshToken = newRefreshToken;
    user.isTemporaryPassword = false;
    user.needsAccountSetup = false;
    await user.save();

    return res.status(200).json({ success: true, data: { access_token: newAccessToken, refresh_token: newRefreshToken, token_type: "Bearer", expires_in: 3600 } });
  } catch (error) {
    return res.status(401).json({ success: false, error: { code: "UNAUTHORIZED", message: "Refresh token expired or invalid. Please login again." } });
  }
};

// ─── RESEND VERIFICATION ─────────────────────────────────────
exports.resendVerification = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });
    if (user.isVerified) return res.status(400).json({ message: "Email already verified" });

    const verificationToken = crypto.randomBytes(32).toString("hex");
    user.verificationToken = verificationToken;
    await user.save();

    const verificationUrl = `${process.env.BACKEND_BASE_URL}/api/auth/verify-email/${verificationToken}`;
    await sendEmail({ to: user.email, subject: "Verify your email ✅", templateName: "verify", replacements: { UserName: user.name, VerifyLink: verificationUrl, YourCompanyName: "Al-and-co" } });

    res.status(200).json({ success: true, message: "Verification email sent again" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
// const User = require("../models/userModel.js");
// const bcrypt = require("bcryptjs");
// const jwt = require("jsonwebtoken");
// const crypto = require("crypto");
// const { generateToken, generateRefreshToken } = require("../utils/generateToken.js");
// const sendEmail = require("../utils/sendEmail.js");
// const generateColor = require("../utils/generateColor.js");

// // REGISTER
// exports.register = async (req, res) => {
//   try {
//     const { name, email, password, role } = req.body;

//     const existingUser = await User.findOne({ email });
//     if (existingUser)
//       return res.status(400).json({ message: "User already exists" });

//     const hashedPassword = await bcrypt.hash(password, 10);

//     const verificationToken = crypto.randomBytes(32).toString("hex");

//     const avatarColor = generateColor(email);

//     const user = await User.create({
//       name,
//       email,
//       password: hashedPassword,
//       role,
//       verificationToken,
//       isVerified: false,
//       isActive: false,
//       avatarColor
//     });

//     // const verificationUrl = `http://localhost:5000/api/auth/verify-email/${verificationToken}`;
//     const verificationUrl = `${process.env.BACKEND_BASE_URL}/api/auth/verify-email/${verificationToken}`

//     // ✅ VERIFY EMAIL TEMPLATE use karo (registration nahi)
//     await sendEmail({
//       to: user.email,
//       subject: "Verify your email ✅",
//       templateName: "verify", // 👈 naya template banana hoga
//       replacements: {
//         UserName: user.name,
//         VerifyLink: verificationUrl,
//         YourCompanyName: "Al-and-co"
//       }
//     });

//     res.status(201).json({
//       success: true,
//       message: "Please verify your email first",
//     });

//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };

// // LOGIN
// exports.login = async (req, res) => {
//   try {

//     const { email, password } = req.body;

//     const user = await User.findOne({ email }).select("+password");
//     if (!user) {
//       return res.status(400).json({ message: "Invalid credentials" });
//     }

//     if (!user.isVerified) {
//       return res.status(401).json({ message: "Please verify your email first" });
//     }

//     const isMatch = await bcrypt.compare(password, user.password);
//     if (!isMatch) {
//       return res.status(400).json({ message: "Invalid credentials" });
//     }

//     await User.findByIdAndUpdate(user._id, { lastLogin: new Date() });

//     // ✅ YAHAN SE NEW CODE START HOTA HAI
//     const access_token = generateToken(user);
//     const refresh_token = generateRefreshToken(user);

//     user.refreshToken = refresh_token;
//     await user.save();
//     // ✅ YAHAN TAK NEW CODE HAI

//     await sendEmail({
//       to: user.email,
//       subject: "New Login Alert 🔐",
//       templateName: "login",
//       replacements: {
//         UserName: user.name,
//         SecurityLink: "https://alco-crm-frontend.vercel.app/auth",
//         YourCompanyName: "Al-and-co"
//       }
//     });

//     // ✅ RESPONSE BHI REPLACE KARO
//     res.status(200).json({
//       success: true,
//       message: "Login successful",
//       data: {
//         access_token,
//         refresh_token,
//         token_type: "Bearer",
//         expires_in: 3600,
//         user: {
//           id: user._id,
//           name: user.name,
//           email: user.email,
//           role: user.role,
//           isTemporaryPassword: user.isTemporaryPassword,
//         }
//       }
//     });

//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };

// // GET ME
// exports.getMe = async (req, res) => {
//   try {
//     const user = await User.findById(req.user.id).select("-password"); // password hide
//     if (!user) {
//       return res.status(404).json({ message: "User not found" });
//     }
//     res.json({
//       success: true,
//       user,
//     });
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };

// // FORGOT PASSWORD
// exports.forgotPassword = async (req, res) => {
//   const user = await User.findOne({ email: req.body.email });
//   if (!user) return res.status(404).json({ message: "User not found" });

//   // Generate 6-digit OTP
//   const otp = Math.floor(100000 + Math.random() * 900000).toString();

//   // Save OTP, expiry and reset attempts
//   user.resetPasswordToken = otp;
//   user.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 minutes
//   user.resetPasswordAttempts = 0; // reset attempts on new OTP
//   await user.save();

//   // Send OTP email
//   await sendEmail({
//     to: user.email,
//     subject: "Reset Password OTP 🔑",
//     templateName: "forgot-password", // your forgotpassword.html template
//     replacements: {
//       UserName: user.name,
//       OTP: otp,
//       YourCompanyName: "Al-and-co"
//     }
//   });

//   res.json({
//     success: true,
//     message: "OTP sent to your email. It expires in 10 minutes."
//   });
// };

// // RESET PASSWORD
// exports.resetPassword = async (req, res) => {
//   const { email, otp, newPassword } = req.body;

//   const user = await User.findOne({
//     email,
//     resetPasswordExpire: { $gt: Date.now() } // OTP not expired
//   });

//   if (!user) {
//     return res.status(400).json({ message: "Invalid or expired OTP" });
//   }

//   // Check OTP attempts
//   if (user.resetPasswordAttempts >= 5) {
//     return res.status(429).json({ message: "Too many wrong attempts. Request a new OTP." });
//   }

//   // Check OTP
//   if (user.resetPasswordToken !== otp) {
//     user.resetPasswordAttempts += 1;
//     await user.save();
//     return res.status(400).json({ message: "Incorrect OTP" });
//   }

//   // ✅ OTP correct → update password
//   user.password = await bcrypt.hash(newPassword, 10);
//   user.resetPasswordToken = undefined;
//   user.resetPasswordExpire = undefined;
//   user.resetPasswordAttempts = 0; // reset counter
//   await user.save();

//   res.json({
//     success: true,
//     message: "Password reset successfully"
//   });
// };

// // VERIFY EMAIL
// exports.verifyEmail = async (req, res) => {
//   const user = await User.findOne({ verificationToken: req.params.token });

//   // if (!user) {
//   //   return res.status(400).json({ message: "Invalid token" });
//   // }

//   // ✅ Token invalid ya already used check
//   if (!user) {
//     return res.status(400).json({
//       message: "This verification link has already been used or is invalid."
//     });
//   }

//   user.isVerified = true;
//   user.verificationToken = undefined;

//   await user.save();

//   // ✅ Ab JWT do
//   const token = generateToken(user);

//   // ✅ Welcome email yahan bhejo (ab user verified hai)
//   await sendEmail({
//     to: user.email,
//     subject: "Welcome 🎉",
//     templateName: "registration",
//     replacements: {
//       UserName: user.name,
//       LoginLink: "http://localhost:3000/auth",
//       YourCompanyName: "Al-and-co"
//     }
//   });

//   res.json({
//     success: true,
//     message: "Email verified successfully",
//     token
//   });
// };

// // LOGOUT
// exports.logout = async (req, res) => {
//   try {
//     // refreshToken DB se hata do
//     await User.findByIdAndUpdate(req.user.id, { refreshToken: null });

//     res.status(200).json({
//       success: true,
//       message: "Logged out successfully"
//     });
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };

// // REFRESH TOKEN
// exports.refreshToken = async (req, res) => {
//   const { refresh_token } = req.body;

//   if (!refresh_token) {
//     return res.status(400).json({
//       success: false,
//       error: {
//         code: "VALIDATION_ERROR",
//         message: "Refresh token required",
//       },
//     });
//   }

//   try {
//     // Token verify karo
//     const decoded = jwt.verify(refresh_token, process.env.JWT_REFRESH_SECRET);

//     // User DB mein check karo
//     const user = await User.findById(decoded.id);

//     if (!user) {
//       return res.status(401).json({
//         success: false,
//         error: {
//           code: "UNAUTHORIZED",
//           message: "User not found",
//         },
//       });
//     }

//     // Check karo token DB mein stored hai ya nahi (optional but recommended)
//     if (user.refreshToken !== refresh_token) {
//       return res.status(401).json({
//         success: false,
//         error: {
//           code: "UNAUTHORIZED",
//           message: "Invalid refresh token",
//         },
//       });
//     }

//     // Naye tokens banao
//     const newAccessToken = generateToken(user);
//     const newRefreshToken = generateRefreshToken(user);

//     // Naya refresh token DB mein save karo
//     user.refreshToken = newRefreshToken;
//     await user.save();

//     return res.status(200).json({
//       success: true,
//       data: {
//         access_token: newAccessToken,
//         refresh_token: newRefreshToken,
//         token_type: "Bearer",
//         expires_in: 3600,
//       },
//     });

//   } catch (error) {
//     // Token expired ya invalid
//     return res.status(401).json({
//       success: false,
//       error: {
//         code: "UNAUTHORIZED",
//         message: "Refresh token expired or invalid. Please login again.",
//       },
//     });
//   }
// };

// // ✅ RESEND VERIFICATION EMAIL
// exports.resendVerification = async (req, res) => {
//   try {
//     const { email } = req.body;

//     const user = await User.findOne({ email });

//     if (!user) {
//       return res.status(404).json({ message: "User not found" });
//     }

//     if (user.isVerified) {
//       return res.status(400).json({ message: "Email already verified" });
//     }

//     // Naya token banao
//     const verificationToken = crypto.randomBytes(32).toString("hex");
//     user.verificationToken = verificationToken;
//     await user.save();

//     const verificationUrl = `${process.env.BACKEND_BASE_URL}/api/auth/verify-email/${verificationToken}`;

//     await sendEmail({
//       to: user.email,
//       subject: "Verify your email ✅",
//       templateName: "verify",
//       replacements: {
//         UserName: user.name,
//         VerifyLink: verificationUrl,
//         YourCompanyName: "Al-and-co",
//       },
//     });

//     res.status(200).json({
//       success: true,
//       message: "Verification email sent again",
//     });
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };
