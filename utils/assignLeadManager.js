const User = require("../models/userModel.js");

const assignLeadManager = async () => {
  // Active + available Sales Managers aur Admins
  const managers = await User.find({
    role: { $in: ["sales_manager", "admin"] },
    isActive: true,
    isAvailableForLead: true,
  }).sort({ lastLeadAssignedAt: 1 });

  if (!managers.length) {
    return null;
  }

  // Round-robin: sabse pehle jis ko sabse pehle lead mili thi
  const manager = managers[0];

  manager.lastLeadAssignedAt = new Date();
  await manager.save();

  return manager._id;
};

module.exports = assignLeadManager;