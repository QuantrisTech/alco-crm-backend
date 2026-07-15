const Visitor = require("../models/visitorModel");

// POST /api/v1/visitors
// Creates a new visitor record, or updates an existing one if visitor_id already exists.
async function upsertVisitor(req, res) {
  try {
    const {
  visitor_id,
  first_name,
  last_name,
  phone,
  email,
  program_interest,
  conversation_summary,
  source,
  is_existing_student,
  existing_source,
} = req.body;

    if (!visitor_id) {
      return res.status(400).json({ error: "visitor_id is required" });
    }

    
    const updateFields = {};
    if (is_existing_student !== undefined) updateFields.is_existing_student = is_existing_student;
    if (existing_source !== undefined) updateFields.existing_source = existing_source;
    if (first_name !== undefined) updateFields.first_name = first_name;
    if (last_name !== undefined) updateFields.last_name = last_name;
    if (phone !== undefined) updateFields.phone = phone;
    if (email !== undefined) updateFields.email = email;
    if (program_interest !== undefined) updateFields.program_interest = program_interest;
    if (conversation_summary !== undefined) updateFields.conversation_summary = conversation_summary;
    if (source !== undefined) updateFields.source = source;

    const visitor = await Visitor.findOneAndUpdate(
      { visitor_id },
      { $set: updateFields },
      { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true }
    );

    return res.status(200).json({ success: true, visitor });
  } catch (err) {
    console.error("upsertVisitor error:", err);
    return res.status(500).json({ error: "Failed to save visitor" });
  }
}



const Lead = require("../models/leadModel");

// POST /api/v1/visitors/:id/promote
async function promoteVisitor(req, res) {
  try {
    const { id } = req.params;
    const {
      promoted_by,
      promotion_reason,
      email,
      first_name,
      last_name,
      phone,
      program_interest,
    } = req.body;

    const visitor = await Visitor.findOne({ visitor_id: id });

    if (!visitor) {
      return res.status(404).json({ error: "Visitor not found" });
    }

    if (visitor.status === "promoted") {
      return res.status(200).json({
        success: true,
        message: "Visitor already promoted",
        lead_id: visitor.promoted_lead_id,
      });
    }

    // If the admin provided any missing info at the moment of conversion,
    // fill it in on the visitor record now, so nothing typed gets lost.
    if (email) visitor.email = email;
    if (first_name) visitor.first_name = first_name;
    if (last_name) visitor.last_name = last_name;
    if (phone) visitor.phone = phone;
    if (program_interest) visitor.program_interest = program_interest;
    
    const lead = await Lead.create({
      first_name: visitor.first_name || "Unknown",
      last_name: visitor.last_name || "",
      email: visitor.email || undefined,
      phone: visitor.phone || null,
      program_name: visitor.program_interest || "",
      message: visitor.conversation_summary || "",
      source: "chatbot",
      status: "new",
      quality: "warm",
      notes: `Auto-promoted from chatbot. Reason: ${promotion_reason || "n/a"}. Promoted by: ${promoted_by || "auto"}`,
    });

    visitor.status = "promoted";
    visitor.promoted_lead_id = lead._id;
    await visitor.save();

    return res.status(200).json({ success: true, lead_id: lead._id });
  } catch (err) {
    if (err.name === "ValidationError") {
      return res.status(400).json({
        error: "Could not create lead — missing required field",
        details: err.message,
      });
    }
    console.error("promoteVisitor error:", err);
    return res.status(500).json({ error: "Failed to promote visitor" });
  }
}


async function updateVisitor(req, res) {
  try {
    const { id } = req.params;
    const { first_name, last_name, email, phone, program_interest } = req.body;

    const updateFields = {};
    if (first_name !== undefined) updateFields.first_name = first_name;
    if (last_name !== undefined) updateFields.last_name = last_name;
    if (email !== undefined) updateFields.email = email;
    if (phone !== undefined) updateFields.phone = phone;
    if (program_interest !== undefined) updateFields.program_interest = program_interest;

    const visitor = await Visitor.findOneAndUpdate(
      { visitor_id: id },
      { $set: updateFields },
      { new: true, runValidators: true }
    );

    if (!visitor) {
      return res.status(404).json({ error: "Visitor not found" });
    }

    return res.status(200).json({ success: true, data: visitor });
  } catch (err) {
    console.error("updateVisitor error:", err);
    return res.status(500).json({ error: "Failed to update visitor" });
  }
}

// GET /api/v1/visitors
async function getAllVisitors(req, res) {
  try {
    const { filter } = req.query; // "mine" | "unassigned" | "all" (or no param at all)

    const query = {};

    if (filter === "mine") {
      query.assigned_to = req.user._id;
    } else if (filter === "unassigned") {
      query.assigned_to = null;
    }
    // if filter is "all" or missing, query stays {} — returns everyone

    const visitors = await Visitor.find(query)
      .sort({ createdAt: -1 })
      .populate("assigned_to", "name email");

    return res.status(200).json({ success: true, data: visitors });
  } catch (err) {
    console.error("getAllVisitors error:", err);
    return res.status(500).json({ error: "Failed to fetch visitors" });
  }
}

// visitorController.js

const User = require("../models/userModel");


async function checkExistingStudent(req, res) {
  try {
    const { email, phone } = req.query;
    if (!email && !phone) return res.status(400).json({ error: "email or phone required" });

    const query = [];
    if (email) query.push({ email });
    if (phone) query.push({ phone });

    const [crmUser, lead] = await Promise.all([
      User.findOne({ $or: query }),
      Lead.findOne({ $or: query }),
    ]);

    if (crmUser) {
      return res.status(200).json({ exists: true, source: "crm_user", user_id: crmUser._id, role: crmUser.role || null });
    }
    if (lead) {
      return res.status(200).json({ exists: true, source: "lead", lead_id: lead._id, status: lead.status || null });
    }
    return res.status(200).json({ exists: false });
  } catch (err) {
    return res.status(500).json({ error: "Lookup failed" });
  }
}

// PATCH /api/v1/visitors/:id/assign
async function assignVisitor(req, res) {
  try {
    const { id } = req.params;
    const adminId = req.user._id;
    const adminName = req.user.name || req.user.email;

    const visitor = await Visitor.findOne({ visitor_id: id });
    if (!visitor) {
      return res.status(404).json({ error: "Visitor not found" });
    }

    if (visitor.assigned_to && visitor.assigned_to.toString() !== adminId.toString()) {
      return res.status(409).json({
        error: "Visitor already assigned",
        assigned_to: visitor.assigned_to,
      });
    }

    visitor.assigned_to = adminId;
    visitor.assigned_at = new Date();
    await visitor.save();

    return res.status(200).json({ success: true, data: visitor });
  } catch (err) {
    console.error("assignVisitor error:", err);
    return res.status(500).json({ error: "Failed to assign visitor" });
  }
}

// PATCH /api/v1/visitors/:id/unassign
async function unassignVisitor(req, res) {
  try {
    const { id } = req.params;

    const visitor = await Visitor.findOne({ visitor_id: id });
    if (!visitor) {
      return res.status(404).json({ error: "Visitor not found" });
    }

    visitor.assigned_to = null;
    visitor.assigned_at = null;
    await visitor.save();

    return res.status(200).json({ success: true, data: visitor });
  } catch (err) {
    console.error("unassignVisitor error:", err);
    return res.status(500).json({ error: "Failed to unassign visitor" });
  }
}

// PATCH /api/v1/visitors/:id/reassign
async function reassignVisitor(req, res) {
  try {
    const { id } = req.params;
    const { new_admin_id } = req.body;

    if (!new_admin_id) {
      return res.status(400).json({ error: "new_admin_id is required" });
    }

    const visitor = await Visitor.findOne({ visitor_id: id });
    if (!visitor) {
      return res.status(404).json({ error: "Visitor not found" });
    }

    visitor.assigned_to = new_admin_id;
    visitor.assigned_at = new Date();
    await visitor.save();

    return res.status(200).json({ success: true, data: visitor });
  } catch (err) {
    console.error("reassignVisitor error:", err);
    return res.status(500).json({ error: "Failed to reassign visitor" });
  }
}

module.exports = { upsertVisitor, promoteVisitor, getAllVisitors, updateVisitor, checkExistingStudent, assignVisitor, unassignVisitor, reassignVisitor };