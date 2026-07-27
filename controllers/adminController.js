const bcrypt = require("bcryptjs");
const sendEmail = require("../utils/sendEmail.js");
const User = require("../models/userModel.js");
const sendEmailDynamic = require("../utils/sendEmailDynamic.js");
const generateColor = require("../utils/generateColor");

// ✅ GET ALL USERS
// without search, pagination and role
// exports.getAllUsers = async (req, res) => {
//   try {
//     const requesterRole = req.user.role;

//     let query = {};

//     if (requesterRole === "admin") {
//       // ✅ Admin ko sirf non-admin users dikhao
//       query = {
//         role: { $nin: ["super_admin", "admin"] },
//       };
//     }
//     // super_admin ko sab dikhao — query empty rahegi

//     const users = await User.find(query).select("-password");

//     res.status(200).json({
//       success: true,
//       count: users.length,
//       users,
//     });
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };

exports.getAllUsers = async (req, res) => {
  try {
    const requesterRole = req.user.role;

    // query params
    const {
      page = 1,
      limit = 10,
      search = "",
      role,
    } = req.query;

    const skip = (page - 1) * limit;

    let query = {};

    // 🔐 Role-based access control
    if (requesterRole === "admin") {
      query.role = { $nin: ["super_admin", "admin"] };
    }

    // 🔎 Search (name/email)
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    // 🎯 Filter by role (optional)
    if (role) {
      query.role = query.role
        ? { ...query.role, $eq: role }
        : role;
    }

    const users = await User.find(query)
      .select("-password")
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    const total = await User.countDocuments(query);

    res.status(200).json({
      success: true,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / limit),
      count: users.length,
      users,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ✅ GET USER BY ID
exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // ✅ Admin super_admin ya admin ko nahi dekh sakta
    if (
      req.user.role === "admin" &&
      (user.role === "super_admin" || user.role === "admin")
    ) {
      return res.status(403).json({ message: "Not authorized" });
    }

    res.status(200).json({ success: true, user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ✅ UPDATE ANY USER
exports.updateUser = async (req, res) => {
  try {

    // ❌ Password is blocked here — use /change-password route
    const { password, ...updateFields } = req.body;

    if (password) {
      return res.status(400).json({
        success: false,
        message: "Password change not allowed here. Use /change-password route.",
      });
    }

    const existingUser = await User.findById(req.params.id);

    if (!existingUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    console.log("Existing User:", existingUser);
    console.log("Update Fields:", updateFields);

    // ✅ Detect which fields actually changed
    const changedFields = [];
    for (const key of Object.keys(updateFields)) {
      if (String(existingUser[key]) !== String(updateFields[key])) {
        changedFields.push({
          field: key,
          oldValue: existingUser[key] ?? "N/A",
          newValue: updateFields[key],
        });
      }
    }

    // ✅ Save updated user
    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      updateFields,
      { new: true }
    ).select("-password");

    // ✅ Send email only if something actually changed
    if (changedFields.length > 0) {
      const changedRows = changedFields
        .map(
          (c) => `
          <tr>
            <td style="padding:9px 12px; border-bottom:1px solid #e2e8f0;
              border-right:1px solid #e2e8f0; font-weight:600; color:#1a202c;
              text-transform:capitalize;">${c.field}</td>
            <td style="padding:9px 12px; border-bottom:1px solid #e2e8f0;
              border-right:1px solid #e2e8f0; color:#A32D2D;
              text-decoration:line-through;">${c.oldValue}</td>
            <td style="padding:9px 12px; border-bottom:1px solid #e2e8f0;
              color:#0F6E56; font-weight:600;">${c.newValue}</td>
          </tr>
        `
        )
        .join("");

      await sendEmailDynamic({
        to: existingUser.email,
        subject: "Account Details Updated ✏️",
        templateName: "user-update-admin",
        replacements: {
          UserName: existingUser.name,
          ChangedRows: changedRows,
          SupportEmail: "connect@arslanlarik.com",
          YourCompanyName: "Al-and-co",
        },
      });
    }

    res.status(200).json({
      success: true,
      user: updatedUser,
      notified: changedFields.length > 0,
      changedFields: changedFields.map((c) => c.field),
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ✅ DELETE USER BY ID
exports.deleteUserById = async (req, res) => {
  try {
    const userToDelete = await User.findById(req.params.id);

    if (!userToDelete) {
      return res.status(404).json({ message: "User not found" });
    }

    const requesterRole = req.user.role;

    // ✅ Admin, super_admin ya kisi bhi admin ko delete nahi kar sakta
    if (requesterRole === "admin") {
      if (
        userToDelete.role === "super_admin" ||
        userToDelete.role === "admin"
      ) {
        return res.status(403).json({
          message: "You cannot delete an admin or super admin",
        });
      }
    }

    await User.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ✅ DELETE ALL USERS
exports.deleteAllUsers = async (req, res) => {
  try {
    const requesterRole = req.user.role;

    if (requesterRole === "super_admin") {
      // ✅ Super admin — sab delete kar sakta hai
      await User.deleteMany({});
    } else if (requesterRole === "admin") {
      // ✅ Admin — sirf non-admin users delete kar sakta hai
      await User.deleteMany({
        role: { $nin: ["super_admin", "admin"] },
      });
    } else {
      return res.status(403).json({ message: "Not authorized" });
    }

    res.status(200).json({
      success: true,
      message: "Users deleted successfully",
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ✅ CREATE USER (ADMIN)
// exports.createUser = async (req, res) => {
//   try {
//     const { name, email, password, role } = req.body;

//     // ✅ Duplicate check
//     const existingUser = await User.findOne({ email });
//     if (existingUser) {
//       return res.status(400).json({ message: "User already exists" });
//     }

//     // ✅ Role validation — YAHAN ADD KARO
//     const allowedRoles = ["super_admin", "admin", "sales_manager", "sales_rep", "support", "finance_manager", "user"];
//     if (role && !allowedRoles.includes(role)) {
//       return res.status(400).json({ message: "Invalid role" });
//     }

//     const hashedPassword = await bcrypt.hash(password, 10);
//     const avatarColor = generateColor(email);

//     const user = await User.create({
//       name,
//       email,
//       password: hashedPassword,
//       role: role || "user",
//       isVerified: true,
//       avatarColor,
//       isPlayable: false,
//       isTemporaryPassword: true
//     });

//     res.status(201).json({
//       success: true,
//       message: "User created successfully",
//       user: {
//         id: user._id,
//         name: user.name,
//         email: user.email,
//         role: user.role,
//       },
//     });
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };

exports.createUser = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    // ✅ Duplicate check
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    // ✅ Role validation
    const allowedRoles = ["super_admin", "admin", "sales_manager", "sales_rep", "support", "finance_manager", "user"];
    if (role && !allowedRoles.includes(role)) {
      return res.status(400).json({ message: "Invalid role" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const avatarColor = generateColor(email);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role: role || "user",
      isVerified: true,
      avatarColor,
      isPlayable: false,
      isTemporaryPassword: true
    });

    // Send email with user credentials after creation
    await sendEmailDynamic({
      to: email,
      subject: "Your Account Credentials 🔑",
      templateName: "send-user-credentials",
      replacements: {
        UserName: name,
        UserEmail: email,
        UserPassword: password,  // Use the plain password here
        SupportEmail: "alco@support.com",
        YourCompanyName: "Al-and-co",
        LoginLink: "https://alco-crm-frontend.vercel.app/login?email=" + email + "&password=" + password,
      },
    });

    res.status(201).json({
      success: true,
      message: "User created successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
exports.createUser = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    // ✅ Duplicate check
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    // ✅ Role validation
    const allowedRoles = ["super_admin", "admin", "sales_manager", "sales_rep", "support", "finance_manager", "user"];
    if (role && !allowedRoles.includes(role)) {
      return res.status(400).json({ message: "Invalid role" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const avatarColor = generateColor(email);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role: role || "user",
      isVerified: true,
      avatarColor,
      isPlayable: false,
      isTemporaryPassword: true
    });

    // Send email with user credentials after creation
    await sendEmailDynamic({
      to: email,
      subject: "Your Account Credentials 🔑",
      templateName: "send-user-credentials",
      replacements: {
        UserName: name,
        UserEmail: email,
        UserPassword: password,  // Use the plain password here
        SupportEmail: "alco@support.com",
        YourCompanyName: "Al-and-co",
        LoginLink: "https://alco-crm-frontend.vercel.app/login?email=" + email + "&password=" + password,
      },
    });

    res.status(201).json({
      success: true,
      message: "User created successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// ✅ ASSIGN ROLE
exports.assignRole = async (req, res) => {
  try {
    const { role } = req.body;

    const allowedRoles = [
      "super_admin",
      "admin",
      "sales_manager",
      "sales_rep",
      "support",
      "finance_manager",
      "user"
    ];
    if (!allowedRoles.includes(role)) {
      return res.status(400).json({ message: "Invalid role" });
    }

    // ✅ Pehle existing user fetch karo — oldRole ke liye
    const existingUser = await User.findById(req.params.id);

    if (!existingUser) {
      return res.status(404).json({ message: "User not found" });
    }

    const oldRole = existingUser.role;

    // ✅ Role update karo
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true }
    ).select("-password");
    //  if (!user) {
    //   return res.status(404).json({ message: "User not found" }); }
    // ✅ Email bhejo agar role actually change hua
    if (oldRole !== role) {
      await sendEmailDynamic({
        to: user.email,
        subject: "Your Account Role Has Been Updated 🔑",
        templateName: "user-role-update-admin",
        replacements: {
          UserName: user.name,
          OldRole: oldRole,
          NewRole: role,
          SupportEmail: "alco@support.com",
          YourCompanyName: "Al-and-co",
        },
      });
    }

    res.status(200).json({
      success: true,
      message: `Role updated to ${role}`,
      user,
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ✅ CHANGE USER PASSWORD 
exports.changeUserPassword = async (req, res) => {
  try {
    const { newPassword } = req.body;

    if (!newPassword) {
      return res.status(400).json({
        success: false,
        message: "New password is required",
      });
    }

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();

    await sendEmailDynamic({
      to: user.email,
      subject: "Password Changed 🔐",
      templateName: "user-password-update-admin",
      replacements: {
        UserName: user.name,
        ChangedBy: "Admin",
        DateTime: new Date().toLocaleString(),
        SupportEmail: "connect@arslanlarik.com",
        YourCompanyName: "Al-and-co",
      },
    });

    res.status(200).json({
      success: true,
      message: `Password updated. Notification sent to ${user.email}`,
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};