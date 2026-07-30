const mongoose = require('mongoose');

const RegistrationSchema = new mongoose.Schema({
    webinar: { type: mongoose.Schema.Types.ObjectId, ref: 'Webinar', required: true },
    responses: { type: Map, of: mongoose.Schema.Types.Mixed, required: true },
    ip: { type: String },
    webinarTitleSnapshot: { type: String, default: null },   // ✅ NEW — us waqt ka title
    // assignedToSnapshot: { type: String, default: null },     // ✅ NEW — us waqt ka team member naam
}, { timestamps: true });

module.exports = mongoose.model('Registration', RegistrationSchema);
// const mongoose = require('mongoose');

// const RegistrationSchema = new mongoose.Schema({
//     webinar: { type: mongoose.Schema.Types.ObjectId, ref: 'Webinar', required: true },
//     responses: { type: Map, of: mongoose.Schema.Types.Mixed, required: true },
//     ip: { type: String },
//     referredBy: { type: String, default: null },
//     usedTitle: { type: String, default: null },
// }, { timestamps: true });

// module.exports = mongoose.model('Registration', RegistrationSchema);