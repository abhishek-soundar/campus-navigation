const pathService = require('../services/pathService');
const Node = require('../models/Node');

/**
 * Simple haversine distance (meters) used server-side for nearest-node selection.
 */
function haversineMeters(a, b) {
  if (!a || !b) return Infinity;
  const toRad = (v) => (v * Math.PI) / 180;
  const R = 6371000;
  const lat1 = toRad(a.lat), lat2 = toRad(b.lat);
  const dLat = toRad(b.lat - a.lat), dLon = toRad(b.lng - a.lng);
  const sinDLat = Math.sin(dLat / 2), sinDLon = Math.sin(dLon / 2);
  const hav = sinDLat * sinDLat + Math.cos(lat1) * Math.cos(lat2) * sinDLon * sinDLon;
  const c = 2 * Math.atan2(Math.sqrt(hav), Math.sqrt(1 - hav));
  return R * c;
}

// @desc    Find shortest path between two nodes
// @route   GET /path
// @access  Public
exports.findPath = async (req, res, next) => {
  try {
    let { from, to, fromLat, fromLng } = req.query;

    // If fromLat/fromLng provided, attempt to resolve nearest node as 'from'
    if ((!from || from === 'null') && fromLat && fromLng) {
      const lat = parseFloat(fromLat);
      const lng = parseFloat(fromLng);
      if (!isNaN(lat) && !isNaN(lng)) {
        // fetch nodes and choose nearest via haversine
        const allNodes = await Node.find({});
        if (!allNodes || !allNodes.length) {
          return res.status(404).json({ success: false, error: 'No nodes available to route from' });
        }
        let best = null;
        let bestDist = Infinity;
        for (const n of allNodes) {
          if (!n.coordinates) continue;
          const d = haversineMeters({ lat, lng }, { lat: n.coordinates.lat, lng: n.coordinates.lng });
          if (d < bestDist) {
            bestDist = d;
            best = n;
          }
        }
        if (!best) {
          return res.status(404).json({ success: false, error: 'Unable to find nearby node for start location' });
        }
        // Use nearest node id as 'from'
        from = best._id.toString();
        // optionally you could attach info about the snapped distance
        req.nearestStart = { nodeId: from, distanceMeters: Math.round(bestDist) };
      }
    }

    if (!from || !to) {
      return res.status(400).json({
        success: false,
        error: 'Please provide both from and to node IDs (or fromLat/fromLng and to)'
      });
    }

    // Verify that both nodes exist
    const fromNode = await Node.findById(from);
    const toNode = await Node.findById(to);

    if (!fromNode || !toNode) {
      return res.status(404).json({
        success: false,
        error: 'One or both nodes not found'
      });
    }

    // Find the shortest path
    const result = await pathService.findShortestPath(from, to);

    if (!result.path.length) {
      return res.status(404).json({
        success: false,
        error: 'No path found between the specified nodes'
      });
    }

    res.status(200).json({
      success: true,
      data: result,
      nearestStart: req.nearestStart || null
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Health check endpoint
// @route   GET /health
// @access  Public
exports.healthCheck = (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString()
  });
};
