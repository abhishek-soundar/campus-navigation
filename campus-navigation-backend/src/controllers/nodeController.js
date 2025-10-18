// src/controllers/nodeController.js
const Node = require('../models/Node');
const Edge = require('../models/Edge'); // << added

// @desc    Get all nodes
// @route   GET /nodes
// @access  Public
exports.getNodes = async (req, res, next) => {
  try {
    const nodes = await Node.find();
    
    res.status(200).json({
      success: true,
      count: nodes.length,
      data: nodes
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get single node
// @route   GET /nodes/:id
// @access  Public
exports.getNode = async (req, res, next) => {
  try {
    const node = await Node.findById(req.params.id);
    
    if (!node) {
      return res.status(404).json({
        success: false,
        error: 'Node not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: node
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Create new node
// @route   POST /nodes
// @access  Private
exports.createNode = async (req, res, next) => {
  try {
    const node = await Node.create(req.body);
    
    res.status(201).json({
      success: true,
      data: node
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update node
// @route   PUT /nodes/:id
// @access  Private
exports.updateNode = async (req, res, next) => {
  try {
    const node = await Node.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true
      }
    );
    
    if (!node) {
      return res.status(404).json({
        success: false,
        error: 'Node not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: node
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete node
// @route   DELETE /nodes/:id
// @access  Private
exports.deleteNode = async (req, res, next) => {
  try {
    const node = await Node.findById(req.params.id);
    
    if (!node) {
      return res.status(404).json({
        success: false,
        error: 'Node not found'
      });
    }
    
    // Remove any edges referencing this node to keep graph consistent
    await Edge.deleteMany({ $or: [{ from: node._id }, { to: node._id }] });

    await node.deleteOne();
    
    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (err) {
    next(err);
  }
};
