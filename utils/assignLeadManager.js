const User = require("../models/userModel.js");

const assignLeadManager = async () => {
  // Sirf active + available sales managers
  const managers = await User.find({
    role: "sales_manager",
    isActive: true,
    isAvailableForLead: true,
  }).sort({ lastLeadAssignedAt: 1 });

  if (!managers.length) {
    return null;
  }

  // Sabse purana assigned manager
  const manager = managers[0];

  // Update assignment time
  manager.lastLeadAssignedAt = new Date();
  await manager.save();

  return manager._id;
};

module.exports = assignLeadManager;