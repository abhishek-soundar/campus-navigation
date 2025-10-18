const mongoose = require('mongoose');

const EdgeSchema = new mongoose.Schema({
  from: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Node',
    required: [true, 'Starting node is required']
  },
  to: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Node',
    required: [true, 'Ending node is required']
  },
  distance: {
    type: Number,
    required: [true, 'Distance is required'],
    min: [0, 'Distance cannot be negative']
  },
  blocked: {
    type: Boolean,
    default: false
  },
  accessibilityInfo: {
    stairs: {
      type: Boolean,
      default: false
    },
    slope: {
      type: Boolean,
      default: false
    },
    slopeGrade: {
      type: Number,
      min: 0,
      max: 100
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Compound index to ensure uniqueness of edges
EdgeSchema.index({ from: 1, to: 1 }, { unique: true });

module.exports = mongoose.model('Edge', EdgeSchema);
