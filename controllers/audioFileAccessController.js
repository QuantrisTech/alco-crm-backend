const AudioFileAccess = require("../models/audioFileAccessModel");
// const PinConfig = require("../models/pinConfigModel");
const Enrollment = require("../models/enrollmentModel");
const Program = require("../models/programModel");
const User = require("../models/userModel");
const bcrypt = require("bcryptjs");
const sendEmailDynamic = require("../utils/sendEmailDynamic");

// const PIN_KEY = "audio_access_pin";

// ── Helper: user._id + program ids se check kro kon se already enrolled hain ──
const checkAlreadyEnrolled = async (userId, programIds) => {
  if (!userId) return new Set();

  const enrollments = await Enrollment.find({
    user: userId,
    program: { $in: programIds },
    status: { $nin: ["cancelled", "blocked"] }, // ✅ sirf genuinely inactive exclude karo
  }).select("program status user");

  return new Set(enrollments.map((e) => e.program.toString()));
};
// ── Public: form open krny se pehle pin verify ──────────────
// exports.verifyPin = async (req, res) => {
//   try {
//     const { pin } = req.body;
//     if (!pin) {
//       return res.status(400).json({ success: false, message: "Pin required" });
//     }

//     const config = await PinConfig.findOne({ key: PIN_KEY });

//     // pehli dafa koi pin set nh hui, tw galat treat karo (safe default)
//     if (!config || config.pin !== pin) {
//       return res.status(400).json({ success: false, message: "Incorrect pin" });
//     }

//     return res.status(200).json({ success: true, message: "Pin verified" });
//   } catch (error) {
//     res.status(500).json({ success: false, message: error.message });
//   }
// };

// // ── Admin: pin change/set krna ──────────────────────────────
// exports.updatePin = async (req, res) => {
//   try {
//     const { pin } = req.body;
//     if (!pin || pin.length < 4) {
//       return res.status(400).json({ success: false, message: "Valid pin required" });
//     }

//     const updated = await PinConfig.findOneAndUpdate(
//       { key: PIN_KEY },
//       { pin, updatedBy: req.user?._id || null },
//       { new: true, upsert: true }
//     );

//     res.status(200).json({ success: true, message: "Pin updated", data: updated });
//   } catch (error) {
//     res.status(500).json({ success: false, message: error.message });
//   }
// };

// ── Public: form submit ──────────────────────────────────────
exports.requestAccess = async (req, res) => {
  try {
    const { first_name, last_name, email, phone, programsRequested, source } = req.body;
    const normalizedEmail = email?.toLowerCase().trim();
    const cleanFirstName = first_name?.trim();
    const cleanSource = ["access-request", "resource", "other"].includes(source)
      ? source
      : "access-request"; // ✅ default fallback schema jasa

    if (!normalizedEmail || !cleanFirstName) {
      return res.status(400).json({ success: false, message: "First name and email are required" });
    }

    if (!Array.isArray(programsRequested) || programsRequested.length === 0) {
      return res.status(400).json({ success: false, message: "Select at least one program" });
    }

    // ── STEP 1: User exists check — nahi tw create karo ──
    let userIsAlready = false;
    let existingUser = await User.findOne({ email: normalizedEmail });

    if (existingUser) {
      userIsAlready = true;
    } else {
      userIsAlready = false;

      const plainPassword = Math.random().toString(36).slice(-8);
      const hashedPassword = await bcrypt.hash(plainPassword, 10);

      existingUser = await User.create({
        name: `${cleanFirstName} ${last_name?.trim() || ""}`.trim(),
        email: normalizedEmail,
        phone: phone || null,
        password: hashedPassword,
        role: "user",
        isVerified: true,
        isActive: true,
        isTemporaryPassword: true,
        source: "other",
      });

      await sendEmailDynamic({
        to: normalizedEmail,
        subject: "Your Account Credentials 🔑",
        templateName: "send-user-credentials",
        replacements: {
          UserName: cleanFirstName,
          UserEmail: normalizedEmail,
          UserPassword: plainPassword,
          SupportEmail: "alco@support.com",
          YourCompanyName: "Al-and-co",
          LoginLink: `https://app.arslanlarik.com/auth?email=${normalizedEmail}&password=${plainPassword}`,
        },
      });
    }

    // ── STEP 2: Per-program enrollment check — ab user._id se ──
    const enrolledSet = await checkAlreadyEnrolled(existingUser._id, programsRequested);

    const buildProgramEntries = (programIds) =>
      programIds.map((programId) => {
        const already = enrolledSet.has(programId.toString());

        return {
          program: programId,
          isAlready: already,
          status: already ? "enrolled" : "pending",
        };
      });

    console.log("enrolledSet:", [...enrolledSet]);

    const entries = buildProgramEntries(programsRequested);

    console.log("entries:", JSON.stringify(entries, null, 2));

    // ── STEP 3: Same email dubara request — update, naya document nahi ──
    const existing = await AudioFileAccess.findOne({ email: normalizedEmail });

    if (existing) {
      const existingProgramIds = existing.programsRequested.map((p) => p.program.toString());
      const allProgramIds = Array.from(new Set([...existingProgramIds, ...programsRequested.map(String)]));

      // ✅ ab sab programs (purane + naye) ka enrollment status dobara check karo
      const enrolledSetAll = await checkAlreadyEnrolled(existingUser._id, allProgramIds);

      existing.programsRequested = allProgramIds.map((programId) => {
        const oldProgram = existing.programsRequested.find(
          (p) => p.program.toString() === programId.toString()
        );

        const already = enrolledSetAll.has(programId.toString());

        return {
          program: programId,
          isAlready: already,
          status: already
            ? "enrolled"
            : oldProgram?.status === "rejected"
              ? "rejected"
              : "pending",
          rejectReason:
            oldProgram?.status === "rejected"
              ? oldProgram.rejectReason
              : null,
        };
      });

      existing.first_name = cleanFirstName;
      existing.last_name = last_name?.trim() || existing.last_name;
      existing.phone = phone || existing.phone;
      existing.isAlready = true;
      existing.source = cleanSource; // ✅ latest request ka source overwrite kr dia

      const grantedIds = existing.programsGranted.map((g) => g.toString());
      const hasNewUngranted = existing.programsRequested.some(
        (p) => !grantedIds.includes(p.program.toString())
      );
      if (hasNewUngranted) existing.accessStatus = "pending";


      console.log(
        "before save:",
        JSON.stringify(existing.programsRequested, null, 2)
      );
      await existing.save();

      return res.status(200).json({
        success: true,
        duplicate: true,
        message: "Request updated. Admin will review your access shortly.",
        data: existing,
      });
    }

    // 🆕 first time request
    const newRequest = await AudioFileAccess.create({
      first_name: cleanFirstName,
      last_name: last_name?.trim() || "",
      email: normalizedEmail,
      phone: phone || null,
      isAlready: userIsAlready,
      source: cleanSource, // ✅
      programsRequested: buildProgramEntries(programsRequested),
      accessStatus: "pending",
    });

    console.log(
      "Saved:",
      JSON.stringify(newRequest.programsRequested, null, 2)
    );

    return res.status(201).json({
      success: true,
      duplicate: false,
      message: "Request submitted. Admin will review your access shortly.",
      data: newRequest,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(200).json({
        success: true,
        duplicate: true,
        message: "You're already in our system, admin will review your access.",
      });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── Admin: sab requests list (screen k lia) ─────────────────
exports.getAllRequests = async (req, res) => {
  try {
    const { status } = req.query;
    const filter = status ? { accessStatus: status } : {};

    const requests = await AudioFileAccess.find(filter)
      .populate("programsRequested.program", "name")
      .populate("programsGranted", "name")
      .sort({ createdAt: -1 });

    console.log(
      JSON.stringify(requests[0].programsRequested, null, 2)
    );

    res.status(200).json({ success: true, data: requests });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── Admin: kisi ek requested program mein directly enroll kro (batch ke sath) ──
exports.enrollInProgram = async (req, res) => {
  try {
    const { id } = req.params;
    const { programId, batchId } = req.body;

    if (!programId || !batchId) {
      return res.status(400).json({ success: false, message: "Program and batch are required" });
    }

    const record = await AudioFileAccess.findById(id);
    if (!record) {
      return res.status(404).json({ success: false, message: "Request not found" });
    }

    const user = await User.findOne({ email: record.email });
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found for this request" });
    }

    // ✅ existing enrollment ho tw update karo, warna naya create karo
    const existingEnrollment = await Enrollment.findOne({ user: user._id, program: programId });

    let enrollment;
    if (existingEnrollment) {
      existingEnrollment.batch = batchId;
      existingEnrollment.status = "active";
      existingEnrollment.accessStatus = "ACTIVE";
      enrollment = await existingEnrollment.save();
    } else {
      enrollment = await Enrollment.create({
        user: user._id,
        program: programId,
        batch: batchId,
        status: "active",
        accessStatus: "ACTIVE",
      });
    }

    record.programsRequested = record.programsRequested.map((p) =>
      p.program.toString() === programId.toString()
        ? {
          ...(p.toObject ? p.toObject() : p),
          isAlready: true,
          status: "enrolled",
          rejectReason: null,
        }
        : p
    );

    await record.save();
    await record.populate("programsRequested.program", "name");
    await record.populate("programsGranted", "name");

    res.status(200).json({
      success: true,
      message: "Enrolled successfully",
      data: { enrollment, record },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── Admin: EK specific program reject krna, reason ke sath ──
exports.rejectProgramAccess = async (req, res) => {
  try {
    const { id } = req.params; // AudioFileAccess record id
    const { programId, reason } = req.body;

    if (!programId || !reason?.trim()) {
      return res.status(400).json({ success: false, message: "Program and reason are required" });
    }

    const record = await AudioFileAccess.findById(id);
    if (!record) {
      return res.status(404).json({ success: false, message: "Request not found" });
    }

    const entry = record.programsRequested.find(
      (p) => p.program.toString() === programId.toString()
    );

    if (!entry) {
      return res.status(404).json({ success: false, message: "Program not found in this request" });
    }

    if (entry.isAlready) {
      return res.status(400).json({ success: false, message: "Cannot reject an already enrolled program" });
    }

    entry.status = "rejected";
    entry.rejectReason = reason.trim();

    await record.save();
    await record.populate("programsRequested.program", "name");
    await record.populate("programsGranted", "name");

    res.status(200).json({
      success: true,
      message: "Program request rejected",
      data: record,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── Admin: kisi ek request mein naya program add krna (already requested programs ke sath) ──
exports.addProgramToRequest = async (req, res) => {
  try {
    const { id } = req.params; // AudioFileAccess record id
    const { programId } = req.body;

    if (!programId) {
      return res.status(400).json({ success: false, message: "Program is required" });
    }

    const record = await AudioFileAccess.findById(id);
    if (!record) {
      return res.status(404).json({ success: false, message: "Request not found" });
    }

    // ✅ already added hy tw dobara add na karo
    const alreadyExists = record.programsRequested.some(
      (p) => p.program.toString() === programId.toString()
    );
    if (alreadyExists) {
      return res.status(400).json({ success: false, message: "Program already added to this request" });
    }

    // ✅ enrollment check — user pehle se enrolled tw nahi is program mein
    const user = await User.findOne({ email: record.email });
    const enrolledSet = await checkAlreadyEnrolled(user?._id, [programId]);
    const already = enrolledSet.has(programId.toString());

    record.programsRequested.push({
      program: programId,
      isAlready: already,
      status: already ? "enrolled" : "pending",
      rejectReason: null,
    });

    if (record.accessStatus === "rejected") {
      record.accessStatus = "pending"; // naya program aya hy tw dobara review mein le aao
    }

    await record.save();

    await record.populate("programsRequested.program", "name");
    await record.populate("programsGranted", "name");

    res.status(200).json({
      success: true,
      message: "Program added to request",
      data: record,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── Admin: match kr k access grant krna ─────────────────────
exports.grantAccess = async (req, res) => {
  try {
    const { id } = req.params;
    const { programsGranted } = req.body;

    if (!Array.isArray(programsGranted) || programsGranted.length === 0) {
      return res.status(400).json({ success: false, message: "Select programs to grant" });
    }

    const record = await AudioFileAccess.findById(id);
    if (!record) {
      return res.status(404).json({ success: false, message: "Request not found" });
    }

    record.programsGranted = Array.from(
      new Set([...record.programsGranted.map((p) => p.toString()), ...programsGranted])
    );
    record.accessStatus = "granted";
    record.grantedBy = req.user?._id || null;
    record.grantedAt = new Date();

    await record.save();

    res.status(200).json({ success: true, message: "Access granted", data: record });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ── Admin: reject krna (optional) ───────────────────────────
exports.rejectAccess = async (req, res) => {
  try {
    const { id } = req.params;
    const record = await AudioFileAccess.findByIdAndUpdate(
      id,
      { accessStatus: "rejected" },
      { new: true }
    );
    if (!record) return res.status(404).json({ success: false, message: "Request not found" });

    res.status(200).json({ success: true, message: "Request rejected", data: record });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};