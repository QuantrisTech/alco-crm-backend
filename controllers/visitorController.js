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
    } = req.body;

    if (!visitor_id) {
      return res.status(400).json({ error: "visitor_id is required" });
    }

    const updateFields = {};
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
    const { promoted_by, promotion_reason } = req.body;

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

module.exports = { upsertVisitor, promoteVisitor };