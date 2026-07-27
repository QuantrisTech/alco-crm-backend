const mongoose = require('mongoose');

const RegistrationSchema = new mongoose.Schema({
  webinar: { type: mongoose.Schema.Types.ObjectId, ref: 'Webinar', required: true },
  responses: { type: Map, of: mongoose.Schema.Types.Mixed, required: true },
  ip: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Registration', RegistrationSchema);