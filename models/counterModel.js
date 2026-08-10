// models/counterModel.js
const mongoose = require("mongoose");
const counterSchema = new mongoose.Schema({
  _id: String,
  seq: { type: Number, default: 2090 },
});
module.exports = mongoose.model("Counter", counterSchema);