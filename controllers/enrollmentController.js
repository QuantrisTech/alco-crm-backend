// controllers/enrollmentController.js
const Enrollment = require("../models/enrollmentModel.js");


// CREATE ENROLLMENT (Improved)
exports.createEnrollment = async (req, res) => {
  try {
    const { user, program, batch, paymentPlan } = req.body; // Include paymentPlan

    if (!user || !program || !paymentPlan) {
      return res.status(400).json({
        success: false,
        message: "User, Program, and Payment Plan are required",
      });
    }
    


    const existing = await Enrollment.findOne({ user, program });

    if (existing) {
      return res.status(409).json({
        success: false,
        message: "User already enrolled in this program",
      });
    }

    const enrollment = await Enrollment.create({
      user,
      program,
      batch,
      paymentPlan, // Save payment plan details
      status: "Pending" // Set initial status to Pending
    });

    res.status(201).json({
      success: true,
      data: enrollment,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

exports.createEnrollmentDirect = async (req, res) => {
  try {
    // const { user, program, batch, paymentPlan } = req.body; // Include paymentPlan

    // if (!user || !program || !paymentPlan) {
    //   return res.status(400).json({
    //     success: false,
    //     message: "User, Program, and Payment Plan are required",
    //   });
    // }
    const { user, program, batch } = req.body; // Include paymentPlan

    if (!user || !program) {
      return res.status(400).json({
        success: false,
        message: "User, Program, and Payment Plan are required",
      });
    }


    const existing = await Enrollment.findOne({ user, program });

    if (existing) {
      return res.status(409).json({
        success: false,
        message: "User already enrolled in this program",
      });
    }

    const enrollment = await Enrollment.create({
      user,
      program,
      batch,
      // paymentPlan, // Save payment plan details
      status: "Pending" // Set initial status to Pending
    });

    res.status(201).json({
      success: true,
      data: enrollment,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// MY ENROLLMENTS
exports.getMyEnrollments = async (req, res) => {
  try {
    const enrollments = await Enrollment.find({ user: req.user.id })
      .populate("program batch");

    res.json({
      success: true,
      data: enrollments,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ALL ENROLLMENTS (ADMIN)
// exports.getAllEnrollments = async (req, res) => {
//   try {
//     const page = Number(req.query.page) || 1;
//     const limit = Number(req.query.limit) || 10;

//     const enrollments = await Enrollment.find()
//       .populate("user program batch")
//       .skip((page - 1) * limit)
//       .limit(limit)
//       .sort({ createdAt: -1 });

//     const total = await Enrollment.countDocuments();

//     res.json({
//       success: true,
//       data: enrollments,
//       meta: {
//         page,
//         limit,
//         total,
//         totalPages: Math.ceil(total / limit),
//       },
//     });
//   } catch (err) {
//     res.status(500).json({ success: false, message: err.message });
//   }
// };
// ALL ENROLLMENTS (ADMIN) — grouped by user
// exports.getAllEnrollments = async (req, res) => {
//   try {
//     const page = Number(req.query.page) || 1;
//     const limit = Number(req.query.limit) || 10;

//     // Step 1: Pehle unique users count karo pagination ke liye
//     const uniqueUsers = await Enrollment.distinct("user");
//     const total = uniqueUsers.length;

//     // Step 2: Paginated unique user IDs nikalo
//     const paginatedUserIds = uniqueUsers.slice(
//       (page - 1) * limit,
//       page * limit
//     );

//     // Step 3: Sirf un users ki enrollments fetch karo
//     const enrollments = await Enrollment.find({
//       user: { $in: paginatedUserIds },
//     })
//       .populate("user program batch")
//       .sort({ createdAt: -1 });

//     // Step 4: Group by user
//     const groupedMap = {};

//     for (const enrollment of enrollments) {
//       const userId = enrollment.user?._id?.toString();
//       if (!userId) continue;

//       if (!groupedMap[userId]) {
//         groupedMap[userId] = {
//           user: enrollment.user,         // user object ek baar
//           enrollments: [],               // programs array
//         };
//       }

//       // Enrollment object se user hata do (duplicate avoid)
//       const { user, ...enrollmentData } = enrollment.toObject();

//       groupedMap[userId].enrollments.push(enrollmentData);
//     }

//     const data = Object.values(groupedMap);

//     res.json({
//       success: true,
//       data,
//       meta: {
//         page,
//         limit,
//         total,                                    // total unique users
//         totalPages: Math.ceil(total / limit),
//       },
//     });
//   } catch (err) {
//     res.status(500).json({ success: false, message: err.message });
//   }
// };

exports.getAllEnrollments = async (req, res) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;

    // const { search, status } = req.query;
    const { search, status, assigned_to } = req.query;

    // Step 1: Enrollment level filter (status)
    const enrollmentFilter = {};
    if (status) enrollmentFilter.status = status;
    if (assigned_to) enrollmentFilter.assigned_to = assigned_to;

    // Step 2: Pehle sari matching enrollments fetch karo (populate ke saath)
    // const allEnrollments = await Enrollment.find(enrollmentFilter)
    //   .populate("user program batch")
    //   .sort({ createdAt: -1 });
    const allEnrollments = await Enrollment.find(enrollmentFilter)
      .populate("user", "name email phone role")
      .populate("program")
      .populate("batch")
      .populate("assigned_to", "name email role")
      .sort({ createdAt: -1 });

    // Step 3: Search filter — user name, email, phone pe
    // const filtered = search
    //   ? allEnrollments.filter((e) => {
    //     const q = search.toLowerCase();
    //     return (
    //       e.user?.name?.toLowerCase().includes(q) ||
    //       e.user?.email?.toLowerCase().includes(q) ||
    //       e.user?.phone?.toLowerCase().includes(q) ||
    //       e.program?.name?.toLowerCase().includes(q)
    //     );
    //   })
    //   : allEnrollments;
    const filtered = search
      ? allEnrollments.filter((e) => {
        const q = search.toLowerCase();
        return (
          e.user?.name?.toLowerCase().includes(q) ||
          e.user?.email?.toLowerCase().includes(q) ||
          e.user?.phone?.toLowerCase().includes(q) ||
          e.program?.name?.toLowerCase().includes(q) ||
          e.assigned_to?.name?.toLowerCase().includes(q)
        );
      })
      : allEnrollments;

    // Step 4: Group by user
    const groupedMap = {};
    for (const enrollment of filtered) {
      const userId = enrollment.user?._id?.toString();
      if (!userId) continue;

      if (!groupedMap[userId]) {
        groupedMap[userId] = {
          user: enrollment.user,
          enrollments: [],
        };
      }

      const { user, ...enrollmentData } = enrollment.toObject();
      groupedMap[userId].enrollments.push(enrollmentData);
    }

    const allGrouped = Object.values(groupedMap);

    // Step 5: Pagination — grouped users pe
    const total = allGrouped.length;
    const paginated = allGrouped.slice((page - 1) * limit, page * limit);

    res.json({
      success: true,
      data: paginated,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// SINGLE
exports.getEnrollmentById = async (req, res) => {
  try {
    const enrollment = await Enrollment.findById(req.params.id)
      .populate("user program batch");

    if (!enrollment) {
      return res.status(404).json({
        success: false,
        message: "Enrollment not found",
      });
    }

    res.json({ success: true, data: enrollment });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// UPDATE (SAFE)
exports.updateEnrollment = async (req, res) => {
  try {
    const enrollment = await Enrollment.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    );

    if (!enrollment) {
      return res.status(404).json({
        success: false,
        message: "Enrollment not found",
      });
    }

    res.json({ success: true, data: enrollment });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// DELETE
exports.deleteEnrollment = async (req, res) => {
  try {
    const deleted = await Enrollment.findByIdAndDelete(req.params.id);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: "Enrollment not found",
      });
    }

    res.json({
      success: true,
      message: "Enrollment deleted successfully",
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GRADUATE
exports.graduateEnrollment = async (req, res) => {
  try {
    const enrollment = await Enrollment.findByIdAndUpdate(
      req.params.id,
      {
        isGraduated: true,
        status: "completed",
        completedAt: new Date(),
      },
      { new: true }
    );

    res.json({ success: true, data: enrollment });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// SUSPEND
exports.suspendEnrollment = async (req, res) => {
  try {
    const enrollment = await Enrollment.findByIdAndUpdate(
      req.params.id,
      { status: "suspended" },
      { new: true }
    );

    res.json({ success: true, data: enrollment });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// REACTIVATE
exports.reactivateEnrollment = async (req, res) => {
  try {
    const enrollment = await Enrollment.findByIdAndUpdate(
      req.params.id,
      { status: "active" },
      { new: true }
    );

    res.json({ success: true, data: enrollment });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.assignEnrollment = async (req, res) => {
  const { assigned_to } = req.body;

  const enrollment = await Enrollment.findByIdAndUpdate(
    req.params.id,
    {
      assigned_to,
    },
    { new: true }
  )
    .populate("assigned_to", "name email")
    .populate("user", "name email");

  res.status(200).json({
    success: true,
    data: enrollment,
  });
};