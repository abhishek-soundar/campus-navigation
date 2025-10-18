const mongoose = require('mongoose');

const NodeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    unique: true
  },
  type: {
    type: String,
    required: [true, 'Type is required'],
    enum: ['building', 'intersection', 'entrance', 'exit', 'landmark', 'other'],
    default: 'building'
  },
  accessibility: {
    wheelchair: {
      type: Boolean,
      default: true
    },
    visuallyImpaired: {
      type: Boolean,
      default: false
    }
  },
  coordinates: {
    lat: {
      type: Number,
      required: [true, 'Latitude is required']
    },
    lng: {
      type: Number,
      required: [true, 'Longitude is required']
    }
  },
  description: {
    type: String,
    trim: true
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

// Index for geospatial queries
NodeSchema.index({ coordinates: '2dsphere' });

module.exports = mongoose.model('Node', NodeSchema);
