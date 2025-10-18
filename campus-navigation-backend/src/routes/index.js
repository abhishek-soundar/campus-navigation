// src/routes/index.js
const express = require('express');
const router = express.Router();

// Import controllers
const nodeController = require('../controllers/nodeController');
const edgeController = require('../controllers/edgeController');
const pathController = require('../controllers/pathController');

// Import auth routes
const authRoutes = require('./auth');

// Import middleware / auth
const { protect, restrictTo } = require('../controllers/authController'); // NOTE: using restrictTo here

// Import validators and validation handler
const {
  nodeCreateValidator,
  nodeUpdateValidator,
  edgeCreateValidator,
  edgeUpdateValidator
} = require('../middleware/validators');
const handleValidation = require('../middleware/handleValidationResult');

// ==================== AUTH ====================
router.use('/api/auth', authRoutes);

// ==================== NODE ROUTES ====================
router.route('/api/nodes')
  .get(protect, nodeController.getNodes)
  .post(protect, restrictTo('admin'), nodeCreateValidator, handleValidation, nodeController.createNode);

router.route('/api/nodes/:id')
  .get(protect, nodeController.getNode)
  .put(protect, restrictTo('admin'), nodeUpdateValidator, handleValidation, nodeController.updateNode)
  .delete(protect, restrictTo('admin'), nodeController.deleteNode);

// ==================== EDGE ROUTES ====================
router.route('/api/edges')
  .get(protect, edgeController.getEdges)
  .post(protect, restrictTo('admin'), edgeCreateValidator, handleValidation, edgeController.createEdge);

router.route('/api/edges/:id')
  .get(protect, edgeController.getEdge)
  .put(protect, restrictTo('admin'), edgeUpdateValidator, handleValidation, edgeController.updateEdge)
  .delete(protect, restrictTo('admin'), edgeController.deleteEdge);

router.route('/api/edges/:id/block')
  .patch(protect, restrictTo('admin'), edgeController.toggleBlockEdge);

// ==================== PATH ROUTES ====================
router.route('/api/path')
  .get(protect, pathController.findPath);

// ==================== HEALTH ====================
router.route('/api/health')
  .get(pathController.healthCheck);

module.exports = router;
