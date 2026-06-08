// controllers/lmsAdminController.js
const Assignment = require("../models/assignmentModel");
const Submission = require("../models/submissionModel");
const LiveSession = require("../models/liveSessionModel");
const Resource = require("../models/resourceModel");
const Lead = require("../models/leadModel");
const User = require("../models/userModel");
const BookRequest = require("../models/bookRequestModel.js");
const sendEmail = require("../utils/sendEmailDynamic");
const cloudinary = require("../config/cloudinary");
const streamifier = require("streamifier");
const bcrypt = require("bcryptjs");
const generateColor = require("../utils/generateColor.js");
const { notifyBookRequested } = require("../config/notificationService");

// ── Helper: Cloudinary upload ─────────────────────────────────
const uploadToCloudinary = (buffer, options) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(options, (err, result) => {
      if (err) reject(err);
      else resolve(result);
    });
    streamifier.createReadStream(buffer).pipe(stream);
  });
};

// ═════════════════════════════════════════════════════════════
// ASSIGNMENTS
// ═════════════════════════════════════════════════════════════

exports.adminGetAssignments = async (req, res) => {
  try {
    const { program_id, course_id, status } = req.query;
    const filter = {};
    if (program_id) filter.program_id = program_id;
    if (course_id) filter.course_id = course_id;
    if (status) filter.status = status;

    const assignments = await Assignment.find(filter)
      .populate("program_id", "name")
      .populate("course_id", "title")
      .sort({ createdAt: -1 });

    res.json({ success: true, data: assignments });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.adminCreateAssignment = async (req, res) => {
  try {
    const assignment = await Assignment.create({ ...req.body, created_by: req.user.id });
    res.status(201).json({ success: true, data: assignment });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.adminUpdateAssignment = async (req, res) => {
  try {
    const assignment = await Assignment.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!assignment) return res.status(404).json({ success: false, message: "Not found" });
    res.json({ success: true, data: assignment });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.adminDeleteAssignment = async (req, res) => {
  try {
    await Assignment.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Assignment deleted" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ═════════════════════════════════════════════════════════════
// LIVE SESSIONS
// ═════════════════════════════════════════════════════════════

exports.adminGetLiveSessions = async (req, res) => {
  try {
    const { program_id, status } = req.query;
    const filter = {};
    if (program_id) filter.program_id = program_id;
    if (status) filter.status = status;

    const sessions = await LiveSession.find(filter)
      .populate("program_id", "name")
      .populate("instructor_id", "name email")
      .sort({ scheduled_at: -1 });

    res.json({ success: true, data: sessions });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.adminCreateLiveSession = async (req, res) => {
  try {
    const session = await LiveSession.create(req.body);
    res.status(201).json({ success: true, data: session });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.adminUpdateLiveSession = async (req, res) => {
  try {
    const session = await LiveSession.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!session) return res.status(404).json({ success: false, message: "Not found" });
    res.json({ success: true, data: session });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.adminDeleteLiveSession = async (req, res) => {
  try {
    await LiveSession.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Session deleted" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ═════════════════════════════════════════════════════════════
// RESOURCES — ADMIN CRUD
// ═════════════════════════════════════════════════════════════

exports.adminGetResources = async (req, res) => {
  try {
    const resources = await Resource.find()
      .populate("uploaded_by", "name")
      .sort({ createdAt: -1 });
    res.json({ success: true, data: resources });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.adminGetResourceById = async (req, res) => {
  try {
    const resource = await Resource.findById(req.params.id).populate("uploaded_by", "name");
    if (!resource) return res.status(404).json({ success: false, message: "Not found" });
    res.json({ success: true, data: resource });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// exports.adminCreateResource = async (req, res) => {
//   try {
//     const { title, description } = req.body;
//     if (!title) return res.status(400).json({ success: false, message: "Title required" });
//     if (!req.files?.pdf?.[0]) return res.status(400).json({ success: false, message: "PDF required" });

//     // ── PDF upload ────────────────────────────────────────────
//     const pdfResult = await uploadToCloudinary(req.files.pdf[0].buffer, {
//       folder:        "alco/resources/pdfs",
//       resource_type: "raw",
//       format:        "pdf",
//     });

//     // ── Cover image upload (optional) ─────────────────────────
//     let cover_image_url = "";
//     if (req.files?.image?.[0]) {
//       const imgResult = await uploadToCloudinary(req.files.image[0].buffer, {
//         folder:        "alco/resources/covers",
//         resource_type: "image",
//       });
//       cover_image_url = imgResult.secure_url;
//     }

//     const resource = await Resource.create({
//       title,
//       description,
//       file_url:        pdfResult.secure_url,
//       cover_image_url,
//       uploaded_by:     req.user.id,
//     });

//     res.status(201).json({ success: true, data: resource });
//   } catch (err) {
//     res.status(500).json({ success: false, message: err.message });
//   }
// };

exports.adminCreateResource = async (req, res) => {
  try {
    const { title, description, is_available } = req.body;
    if (!title) return res.status(400).json({ success: false, message: "Title required" });

    const isAvailable = is_available === "true" || is_available === true;

    // PDF only required if is_available = true
    if (isAvailable && !req.files?.pdf?.[0]) {
      return res.status(400).json({ success: false, message: "PDF required when resource is available" });
    }

    let file_url = "";
    if (req.files?.pdf?.[0]) {
      const pdfResult = await uploadToCloudinary(req.files.pdf[0].buffer, {
        folder: "alco/resources/pdfs",
        resource_type: "auto",
      });
      file_url = pdfResult.secure_url;
    }

    let cover_image_url = "";
    if (req.files?.image?.[0]) {
      const imgResult = await uploadToCloudinary(req.files.image[0].buffer, {
        folder: "alco/resources/covers",
        resource_type: "image",
      });
      cover_image_url = imgResult.secure_url;
    }

    const resource = await Resource.create({
      title, description, file_url,
      cover_image_url, is_available: isAvailable,
      uploaded_by: req.user.id,
    });

    res.status(201).json({ success: true, data: resource });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.adminUpdateResource = async (req, res) => {
  try {
    const resource = await Resource.findById(req.params.id);
    if (!resource) return res.status(404).json({ success: false, message: "Not found" });

    const { title, description } = req.body;
    if (title) resource.title = title;
    if (description) resource.description = description;

    if (req.files?.pdf?.[0]) {
      const result = await uploadToCloudinary(req.files.pdf[0].buffer, {
        folder: "alco/resources/pdfs",
        resource_type: "auto",
        format: "pdf",
        public_id: `pdf_${Date.now()}`,
      });
      resource.file_url = result.secure_url;
    }

    if (req.files?.image?.[0]) {
      const result = await uploadToCloudinary(req.files.image[0].buffer, {
        folder: "alco/resources/covers",
        resource_type: "image",
      });
      resource.cover_image_url = result.secure_url;
    }

    await resource.save();
    res.json({ success: true, data: resource });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.adminDeleteResource = async (req, res) => {
  try {
    await Resource.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Resource deleted" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ═════════════════════════════════════════════════════════════
// PUBLIC — Website books
// ═════════════════════════════════════════════════════════════

exports.adminGetPublicResources = async (req, res) => {
  try {
    const resources = await Resource.find({ is_public: true })
      .select("title description cover_image_url file_url is_available") // ← is_available add karo
      .sort({ createdAt: -1 });
    res.json({ success: true, data: resources });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// exports.requestBook = async (req, res) => {
//   try {
//     const resource = await Resource.findOne({ _id: req.params.id, is_public: true });
//     if (!resource) return res.status(404).json({ success: false, message: "Book not found" });

//     const { first_name, last_name, email, phone } = req.body;
//     if (!first_name || !email || !phone) {
//       return res.status(400).json({ success: false, message: "first_name, email, phone required" });
//     }

//     // ── Lead create ───────────────────────────────────────────
//     const lead = await Lead.create({
//       first_name,
//       last_name:  last_name || "",
//       email,
//       phone,
//       source:     `resource-${resource._id}`,
//       query:      `Book request: ${resource.title}`,
//     });

//     // ── Email bhejo ───────────────────────────────────────────
//     await sendEmail({
//       to:           email,
//       subject:      `📖 Your Book: ${resource.title}`,
//       templateName: "book-delivery",
//       replacements: {
//         UserName:  first_name,
//         BookTitle: resource.title,
//         BookUrl:   resource.file_url,
//       },
//     });

//     // ── Super admin ko notify karo ────────────────────────────
//     const superAdmin = await User.findOne({ role: "super_admin" }).select("_id");
//     if (superAdmin) {
//       await notifyBookRequested({
//         adminId:   superAdmin._id,
//         userName:  `${first_name} ${last_name || ""}`.trim(),
//         bookTitle: resource.title,
//         leadId:    lead._id,
//       }).catch(() => {});
//     }

//     res.json({ success: true, message: "Book sent to your email!" });
//   } catch (err) {
//     res.status(500).json({ success: false, message: err.message });
//   }
// };

// ═════════════════════════════════════════════════════════════
// LMS — Logged-in users
// ═════════════════════════════════════════════════════════════


// exports.requestBook = async (req, res) => {
//   try {
//     const resource = await Resource.findOne({ _id: req.params.id, is_public: true });
//     if (!resource) return res.status(404).json({ success: false, message: "Book not found" });

//     const { first_name, last_name, email, phone } = req.body;
//     if (!first_name || !email || !phone) {
//       return res.status(400).json({ success: false, message: "first_name, email, phone required" });
//     }

//     // ── Check: user already exist karta hai? ─────────────────
//     let user = await User.findOne({ email });

//     if (!user) {
//       // ── Naya user banao ──────────────────────────────────────
//       const tempPassword = Math.random().toString(36).slice(-8); // e.g. "x4k9mz2q"
//       const hashedPassword = await bcrypt.hash(tempPassword, 10);
//       const avatarColor = generateColor(email); // tumhara existing helper

//       user = await User.create({
//         name: `${first_name} ${last_name || ""}`.trim(),
//         email,
//         phone,
//         password: hashedPassword,
//         role: "user",
//         isVerified: true,
//         isTemporaryPassword: true,
//         avatarColor,
//         source: "resource",  // ✅ source track
//       });

//       // ── Credentials email ────────────────────────────────────
//       await sendEmail({
//         to: email,
//         subject: "Your Account Credentials 🔑",
//         templateName: "send-user-credentials",
//         replacements: {
//           UserName: first_name,
//           UserEmail: email,
//           UserPassword: tempPassword,
//           SupportEmail: "alco@support.com",
//           YourCompanyName: "Al-and-co",
//           LoginLink: `https://alco-crm-frontend.vercel.app/login?email=${email}&password=${tempPassword}`,
//         },
//       });
//     }

//     // ── Book delivery email (sab ko — new ya existing) ────────
//     await sendEmail({
//       to: email,
//       subject: `📖 Your Book: ${resource.title}`,
//       templateName: "book-delivery",
//       replacements: {
//         UserName: first_name,
//         BookTitle: resource.title,
//         BookUrl: resource.file_url,
//       },
//     });

//     // ── Super admin ko notify karo ────────────────────────────
//     const superAdmin = await User.findOne({ role: "super_admin" }).select("_id");
//     if (superAdmin) {
//       await notifyBookRequested({
//         adminId: superAdmin._id,
//         userName: `${first_name} ${last_name || ""}`.trim(),
//         bookTitle: resource.title,
//         leadId: null,
//       }).catch(() => { });
//     }

//     res.json({ success: true, message: "Book sent to your email!" });
//   } catch (err) {
//     res.status(500).json({ success: false, message: err.message });
//   }
// };
exports.requestBook = async (req, res) => {
  try {
    const resource = await Resource.findOne({ _id: req.params.id, is_public: true });
    if (!resource) return res.status(404).json({ success: false, message: "Book not found" });

    const { first_name, last_name, email, phone } = req.body;
    if (!first_name || !email || !phone) {
      return res.status(400).json({ success: false, message: "first_name, email, phone required" });
    }

    // ── User find ya create karo ──────────────────────────────
    let user = await User.findOne({ email });
    let isNewUser = false;

    if (!user) {
      isNewUser = true;
      const tempPassword   = Math.random().toString(36).slice(-8);
      const hashedPassword = await bcrypt.hash(tempPassword, 10);

      user = await User.create({
        name:                `${first_name} ${last_name || ""}`.trim(),
        email,
        phone,
        password:            hashedPassword,
        role:                "user",
        isVerified:          true,
        isTemporaryPassword: true,
        source:              `resource-${resource._id}`,
      });

      // ── Credentials email ─────────────────────────────────
      await sendEmail({
        to:           email,
        subject:      "Your Account Credentials 🔑",
        templateName: "send-user-credentials",
        replacements: {
          UserName:        first_name,
          UserEmail:       email,
          UserPassword:    tempPassword,
          SupportEmail:    "alco@support.com",
          YourCompanyName: "Al-and-co",
          LoginLink:       `${process.env.LMS_URL}/login`,
        },
      });
    }

    // ── BookRequest save karo (duplicate ignore) ──────────────
    await BookRequest.findOneAndUpdate(
      { user_id: user._id, resource_id: resource._id },
      { user_id: user._id, resource_id: resource._id },
      { upsert: true }
    );

    // ── Book delivery email ───────────────────────────────────
    await sendEmail({
      to:           email,
      subject:      `📖 Your Book: ${resource.title}`,
      templateName: "book-delivery",
      replacements: {
        UserName:  first_name,
        BookTitle: resource.title,
        BookUrl:   resource.file_url,
      },
    });

    // ── Super admin notify ────────────────────────────────────
    const superAdmin = await User.findOne({ role: "super_admin" }).select("_id");
    if (superAdmin) {
      await notifyBookRequested({
        adminId:   superAdmin._id,
        userName:  `${first_name} ${last_name || ""}`.trim(),
        bookTitle: resource.title,
        leadId:    null,
      }).catch(() => {});
    }

    res.json({ success: true, message: "Book sent to your email!" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.lmsGetResources = async (req, res) => {
  try {
    const resources = await Resource.find({ is_public: true })
      .select("title description cover_image_url file_url")
      .sort({ createdAt: -1 });
    res.json({ success: true, data: resources });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};