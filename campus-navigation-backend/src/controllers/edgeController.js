const Edge = require('../models/Edge');
const Node = require('../models/Node');

// @desc    Get all edges
// @route   GET /edges
// @access  Public
exports.getEdges = async (req, res, next) => {
  try {
    const edges = await Edge.find().populate('from to', 'name coordinates');
    
    res.status(200).json({
      success: true,
      count: edges.length,
      data: edges
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get single edge
// @route   GET /edges/:id
// @access  Public
exports.getEdge = async (req, res, next) => {
  try {
    const edge = await Edge.findById(req.params.id).populate('from to', 'name coordinates');
    
    if (!edge) {
      return res.status(404).json({
        success: false,
        error: 'Edge not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: edge
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Create new edge
// @route   POST /edges
// @access  Private
exports.createEdge = async (req, res, next) => {
  try {
    // Verify that both nodes exist
    const fromNode = await Node.findById(req.body.from);
    const toNode = await Node.findById(req.body.to);
    
    if (!fromNode || !toNode) {
      return res.status(404).json({
        success: false,
        error: 'One or both nodes not found'
      });
    }
    
    const edge = await Edge.create(req.body);
    
    res.status(201).json({
      success: true,
      data: edge
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update edge
// @route   PUT /edges/:id
// @access  Private
exports.updateEdge = async (req, res, next) => {
  try {
    const edge = await Edge.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true
      }
    ).populate('from to', 'name coordinates');
    
    if (!edge) {
      return res.status(404).json({
        success: false,
        error: 'Edge not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: edge
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete edge
// @route   DELETE /edges/:id
// @access  Private
exports.deleteEdge = async (req, res, next) => {
  try {
    const edge = await Edge.findById(req.params.id);
    
    if (!edge) {
      return res.status(404).json({
        success: false,
        error: 'Edge not found'
      });
    }
    
    await edge.deleteOne();
    
    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Block/unblock edge
// @route   PATCH /edges/:id/block
// @access  Private
exports.toggleBlockEdge = async (req, res, next) => {
  try {
    const { blocked } = req.body;
    
    if (typeof blocked !== 'boolean') {
      return res.status(400).json({
        success: false,
        error: 'Blocked status must be a boolean'
      });
    }
    
    const edge = await Edge.findByIdAndUpdate(
      req.params.id,
      { blocked },
      {
        new: true,
        runValidators: true
      }
    ).populate('from to', 'name coordinates');
    
    if (!edge) {
      return res.status(404).json({
        success: false,
        error: 'Edge not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: edge
    });
  } catch (err) {
    next(err);
  }
};
