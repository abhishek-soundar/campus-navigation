const Edge = require('../models/Edge');
const Node = require('../models/Node');

/**
 * Find the shortest path between two nodes using Dijkstra's algorithm
 * @param {string} startId - Starting node ID
 * @param {string} endId - Ending node ID
 * @returns {Object} - Path and total distance
 */
exports.findShortestPath = async (startId, endId) => {
  // Get all nodes and edges
  const nodes = await Node.find();
  const edges = await Edge.find({ blocked: false });
  
  // Create a graph representation
  const graph = {};
  
  // Initialize graph with all nodes
  nodes.forEach(node => {
    graph[node._id] = {};
  });
  
  // Add edges to the graph
  edges.forEach(edge => {
    const fromId = edge.from.toString();
    const toId = edge.to.toString();
    
    // Add bidirectional edges (assuming paths can be traversed in both directions)
    graph[fromId][toId] = edge.distance;
    graph[toId][fromId] = edge.distance;
  });
  
  // Dijkstra's algorithm implementation
  const distances = {};
  const previous = {};
  const unvisited = new Set();
  
  // Initialize distances with infinity and add all nodes to unvisited set
  nodes.forEach(node => {
    const id = node._id.toString();
    distances[id] = id === startId ? 0 : Infinity;
    previous[id] = null;
    unvisited.add(id);
  });
  
  while (unvisited.size > 0) {
    // Find the unvisited node with the smallest distance
    let current = null;
    let smallestDistance = Infinity;
    
    for (const nodeId of unvisited) {
      if (distances[nodeId] < smallestDistance) {
        smallestDistance = distances[nodeId];
        current = nodeId;
      }
    }
    
    // If we can't find a node or we've reached the end node, break
    if (current === null || current === endId || smallestDistance === Infinity) {
      break;
    }
    
    // Remove current node from unvisited set
    unvisited.delete(current);
    
    // Check all neighbors of current node
    for (const neighbor in graph[current]) {
      if (unvisited.has(neighbor)) {
        const distance = graph[current][neighbor];
        const totalDistance = distances[current] + distance;
        
        // If we found a shorter path, update it
        if (totalDistance < distances[neighbor]) {
          distances[neighbor] = totalDistance;
          previous[neighbor] = current;
        }
      }
    }
  }
  
  // Reconstruct the path
  const path = [];
  let current = endId;
  
  // If there's no path to the end node
  if (previous[endId] === null && endId !== startId) {
    return { path: [], distance: 0 };
  }
  
  // Start node is the same as end node
  if (endId === startId) {
    return {
      path: [{ _id: startId }],
      distance: 0
    };
  }
  
  // Build the path by working backwards from the end node
  while (current) {
    path.unshift(current);
    current = previous[current];
  }
  
  // Get the full node objects for the path
  const pathNodes = await Node.find({
    _id: { $in: path }
  });
  
  // Map node IDs to their full objects
  const nodeMap = {};
  pathNodes.forEach(node => {
    nodeMap[node._id.toString()] = node;
  });
  
  // Create the final path with full node objects
  const fullPath = path.map(nodeId => nodeMap[nodeId]);
  
  return {
    path: fullPath,
    distance: distances[endId]
  };
};
