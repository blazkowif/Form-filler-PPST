const mongoose = require("mongoose");

const sequenceCounterSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true },
  value: { type: Number, default: 0 },
}, { timestamps: true });

module.exports = mongoose.model("SequenceCounter", sequenceCounterSchema);
