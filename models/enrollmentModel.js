// models/enrollmentModel.js
const mongoose = require("mongoose");

const accessOverrideSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ["ADMIN_GRANT", "AUTO_GRANT", "MANUAL_OVERRIDE", "FINANCE_GRANT"], // Expanded for future types
    required: true,
  },
  startDate: {
    type: Date,
    required: true,
  },
  endDate: {
    type: Date,
    required: true,
  },
  grantedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
}, { _id: false });


const enrollmentSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    program: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Program",
      required: true,
    },

    batch: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Batch",
    },

    status: {
      type: String,
      enum: [
        "pending",
        "active",
        "completed",
        "suspended",
        "cancelled",
        "blocked",
      ],
      default: "active",
    },
    invoice: { type: mongoose.Schema.Types.ObjectId, ref: "Invoice" },
    // 🔐 ACCESS SYSTEM (NEW)
    accessStatus: {
      type: String,
      enum: ["ACTIVE", "GRACE", "EXTENDED", "RESTRICTED", "BLOCKED"],
      default: "ACTIVE",
    },

    // accessOverride: {
    //   type: {
    //     type: String, // ADMIN_GRANT
    //     startDate: Date,
    //     endDate: Date,
    //     grantedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    //   },
    //   default: null,
    // },
    // accessOverride: {
    //   type: {
    //     type: String,
    //     enum: ["ADMIN_GRANT", "AUTO_GRANT", "MANUAL_OVERRIDE"],
    //   },
    //   startDate: Date,
    //   endDate: Date,
    //   grantedBy: {
    //     type: mongoose.Schema.Types.ObjectId,
    //     ref: "User",
    //   },
    //   default: undefined,
    // },
    accessOverride: {
      type: accessOverrideSchema,
    },

    financeExtension: {
      durationDays: Number,
      reason: String,
      approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      newDueDate: Date,
    },

    financeGraceDaysUsed: {
      type: Number,
      default: 0,
    },

    // Extension history (har grant ka record)
    accessOverrideHistory: [
      {
        type: {
          type: String,
          enum: ["ADMIN_GRANT", "FINANCE_GRANT"],
        },
        durationDays: Number,
        reason: String,
        startDate: Date,
        endDate: Date,
        grantedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        createdAt: { type: Date, default: Date.now },
      }
    ],

    // ── Lead snapshot — pura lead data yahan store hoga ──────────
    // Jab advance pay hone pe lead delete hoti hai toh
    // yeh saara data enrollment ke saath mahfooz rehta hai
    leadSnapshot: {
      // Payment plan
      paymentPlan: {
        totalAmount: Number,
        advanceAmount: Number,
        advanceDueDate: Date,
        installments: [
          {
            label: String,
            amount: Number,
            dueDate: Date,
            status: { type: String, enum: ["pending", "paid"], default: "pending" },
          }
        ],
        notes: String,
        createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        createdAt: Date,
      },

      // Contract details
      contractDetails: {
        fullName: String,
        email: String,
        phone: String,
        programName: String,
        fatherHusbandName: String,
        cnic: String,
        bankAccountNumber: String,
        currentAddress: String,
        emergencyContactName: String,
        emergencyContactPhone: String,
        occupation: String,
        participationAgreement: Boolean,
        photoVideoRelease: Boolean,
        signatureType: String,
        signatureData: String,
        status: String,
        signedAt: Date,
        submittedAt: Date,
      },

      // Lead meta
      source: String,
      quality: String,
      opportunity_value: Number,
      lost_reason: String,
      notes: String,

      // UTM tracking
      utm_source: String,
      utm_medium: String,
      utm_campaign: String,
      lead_score: Number,

      // Activities log
      activities: [
        {
          activity_type: String,
          title: String,
          description: String,
          call_duration_minutes: Number,
          call_outcome: String,
          email_subject: String,
          meeting_link: String,
          meeting_datetime: Date,
          meeting_location: String,
          created_by: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
          createdAt: Date,
        }
      ],

      // Assigned sales rep
      assigned_to: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      created_by: { type: mongoose.Schema.Types.ObjectId, ref: "User" },

      // Original lead id (reference rakho delete hone ke baad bhi)
      lead_id: { type: mongoose.Schema.Types.ObjectId },
    },

    progress: {
      type: Number,
      default: 0,
    },

    enrolledAt: {
      type: Date,
      default: Date.now,
    },

    completedAt: Date,

    isGraduated: {
      type: Boolean,
      default: false,
    },
    
    assigned_to: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  { timestamps: true }
);

// 🔥 prevent duplicate enrollment
enrollmentSchema.index({ user: 1, program: 1 }, { unique: true });

module.exports = mongoose.model("Enrollment", enrollmentSchema);