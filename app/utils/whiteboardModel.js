const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const WhiteboardSchema = new Schema({
  drawings: [Schema.Types.Mixed],
  addedAt: {
    type: Date,
    default: Date.now
  }
}, {
  strict: false
});

const Whiteboard = new mongoose.model("whiteboard", WhiteboardSchema);

module.exports = Whiteboard;
