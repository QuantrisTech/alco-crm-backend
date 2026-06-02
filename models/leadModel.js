const mongoose = require("mongoose");

const leadSchema = new mongoose.Schema(
  {
    first_name: {
      type: String,
      required: true,
    },
    last_name: String,

    email: {
      type: String,
      required: true,
      lowercase: true,
    },

    // phone: String,

    // phone: {
    //   type: String,
    //   unique: true,
    //   sparse: true,  
    //   default: null,
    // },

    phone: {
      type: String,
      default: null,
    },

    // ✅ NEW FIELDS
    nationality: {
      type: String,
    },

    profession: {
      type: String,
    },

    program_name: {
      type: String,
    },

    program_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Program",
      default: null,
    },

    batch_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Batch",
      default: null,
    },

    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    goals: [String],
    message: String,
    query: String,

    opportunity_value: {
      type: Number,
      default: 0,
    },

    status: {
      type: String,
      enum: ["new", "contacted", "qualified", "interested", "converted", "lost"],
      default: "new",
    },

    quality: {
      type: String,
      enum: ["hot", "warm", "cold"],
      default: "cold",
    },

    source: {
      type: String,
      enum: ["utm", "referral", "social", "facebook", "instagram", "google", "organic", "enroll", "contact", "webinar", "frontforce", "lms", "crm", "resource", "other"],
      default: "enroll"
    },

    assigned_to: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    // ✅ Sahi — activities array ke andar hona chahiye
    activities: [
      {
        activity_type: {
          type: String,
          enum: ["call", "email", "meeting", "note"],
        },
        title: String,
        description: String,
        call_duration_minutes: Number,
        call_outcome: String,
        // ✅ New fields
        email_subject: String,
        meeting_link: String,
        meeting_datetime: Date,
        meeting_location: String,
        created_by: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    paymentPlan: {
      totalAmount: Number,
      advanceAmount: Number,
      advanceDueDate: Date,
      installments: [
        {
          label: String,
          amount: Number,
          dueDate: Date,
          status: {
            type: String,
            enum: ["pending", "paid"],
            default: "pending"
          }
        }
      ],
      notes: String,
      createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
      },
      createdAt: { type: Date, default: Date.now }
    },

    contractDetails: {
      // Auto-fill fields (lead se)
      fullName: String,
      email: String,
      phone: String,
      programName: String,

      // User khud bharega
      fatherHusbandName: String,
      cnic: String,
      bankAccountNumber: String,
      currentAddress: String,
      emergencyContactName: String,
      occupation: String,

      // Agreements (checkboxes)
      participationAgreement: { type: Boolean, default: false },
      photoVideoRelease: { type: Boolean, default: false },

      // Signature
      signatureType: { type: String, enum: ["draw", "type"], default: "draw" },
      signatureData: String, // base64 (draw) ya text (type)

      // Status
      status: {
        type: String,
        enum: ["pending", "filled", "signed"],
        default: "pending"
      },
      signedAt: Date,
      submittedAt: Date,
    },

    created_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    advance_paid: {
      type: Boolean,
      default: false,
    },

    lost_reason: String,
    lost_notes: String,
    notes: String,

    // 🔥 Marketing tracking
    utm_source: String,
    utm_medium: String,
    utm_campaign: String,

    lead_score: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Lead", leadSchema);