const mongoose = require('mongoose');

const FieldSchema = new mongoose.Schema({
  label: { type: String, required: true },
  fieldKey: { type: String, required: true }, // slug used as response key, e.g. "phone_number"
  type: {
    type: String,
    enum: ['text', 'email', 'phone', 'number', 'textarea', 'select', 'checkbox', 'date'],
    required: true
  },
  required: { type: Boolean, default: false },
  options: [{ type: String }], // for select/checkbox
  order: { type: Number, default: 0 }
}, { _id: false });

const WebinarSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  date: { type: Date, required: true },
  status: { type: String, enum: ['draft', 'published', 'closed'], default: 'draft' },
  fields: [FieldSchema],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

module.exports = mongoose.model('Webinar', WebinarSchema);