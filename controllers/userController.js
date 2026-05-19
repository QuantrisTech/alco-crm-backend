const User = require("../models/userModel.js");
const bcrypt = require("bcryptjs");

// ✅ GET ALL USERS 
exports.getAllUsers = async (req, res) => {
  try {
    const requesterRole = req.user.role;

    let query = {};

    if (requesterRole === "admin") {
      // Admin: see all except admins
      query = {
        role: { $nin: ["super_admin", "admin"] },
      };
    }
    else if (requesterRole === "sales_manager") {
      // Sales manager: see only reps + normal users
      query = {
        role: { $in: ["sales_rep", "user"] },
      };
    }
    // super_admin → no query filter (see all)

    const users = await User.find(query).select("-password");

    res.status(200).json({
      success: true,
      count: users.length,
      users,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ✅ GET OWN PROFILE
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");

    res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ✅ UPDATE OWN PROFILE
exports.updateProfile = async (req, res) => {
  try {
    const { name } = req.body;

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { name },
      { new: true }
    ).select("-password");

    res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ✅ CHANGE PASSWORD
exports.changePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;

    const user = await User.findById(req.user.id).select("+password");

    const isMatch = await bcrypt.compare(oldPassword, user.password);

    if (!isMatch) {
      return res.status(400).json({ message: "Old password incorrect" });
    }

    if (user.isTemporaryPassword) {
      user.isTemporaryPassword = false;
      await user.save();
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    res.status(200).json({
      success: true,
      message: "Password updated successfully",
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ✅ CHANGE Document
const uploadUserDocument = async (req, res) => {
  const { type, label, url, fileType } = req.body;

  const user = await User.findByIdAndUpdate(
    req.params.id,
    {
      $push: {
        documents: { type, label, url, fileType },
      },
    },
    { new: true }
  );

  res.json({ success: true, documents: user.documents });
};

// ✅ DELETE Document
const deleteUserDocument = async (req, res) => {
  const user = await User.findByIdAndUpdate(
    req.params.id,
    {
      $pull: {
        documents: { _id: req.params.docId },
      },
    },
    { new: true }
  );

  res.json({ success: true, documents: user.documents });
};

// ✅ DELETE OWN ACCOUNT
exports.deleteMyAccount = async (req, res) => {
  try {
    await User.findByIdAndDelete(req.user.id);

    res.status(200).json({
      success: true,
      message: "Account deleted successfully",
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};