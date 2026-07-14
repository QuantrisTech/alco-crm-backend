const mongoose = require("mongoose");

const visitorSchema = new mongoose.Schema(
  {
    visitor_id: {
      type: String,
      required: true,
      unique: true,
    },
    first_name: String,
    last_name: String,
    phone: {
      type: String,
      default: null,
    },
    email: {
      type: String,
      default: null,
      lowercase: true,
    },
    program_interest: String,
    conversation_summary: String,
    source: {
      type: String,
      default: "chatbot",
    },
    status: {
      type: String,
      enum: ["visitor", "promoted"],
      default: "visitor",
    },
    promoted_lead_id: {
  type: mongoose.Schema.Types.ObjectId,
  ref: "Lead",
  default: null,
},
is_existing_student: {
  type: Boolean,
  default: false,
},
existing_source: {
  type: String,
  default: null,
},
  }, 
  { timestamps: true }
);
  
module.exports = mongoose.model("Visitor", visitorSchema);