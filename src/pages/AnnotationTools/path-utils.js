// path-utils.js
import polygonClipping from 'polygon-clipping'
import * as polyclip from 'polygon-clipping';
import { logErrorToServer } from 'utils/logError';
const isValidPath = (path) => {
  return Array.isArray(path) && path.length > 0 && path.every(point => point && typeof point.x === 'number' && typeof point.y === 'number');
};

export const modifyPath = (existingPath, newPath, isSubtract = false) => {
  // Validate paths
  if (!isValidPath(existingPath) || !isValidPath(newPath)) {
    console.error('Invalid paths provided to modifyPath function.', existingPath, newPath);
    return existingPath;
  }

  // Convert to format required by polygon-clipping library
  const polygon1 = [existingPath.map(p => [p.x, p.y])];
  const polygon2 = [newPath.map(p => [p.x, p.y])];

  try {
    let result;
    if (isSubtract) {
      result = polygonClipping.difference(polygon1, polygon2);
    } else {
      result = polygonClipping.union(polygon1, polygon2);
    }
    
    // Check if the result is valid
    if (result.length === 0 || result[0].length === 0) {
      console.warn('Path modification resulted in an empty path.');
      return existingPath; // Return the original path as a fallback
    }
    
    // Get the outer contour of the result
    const outerContour = result[0][0];
    
    // Convert result back to the format used in the application
    const simplifiedPath = outerContour.map(p => ({ x: p[0], y: p[1] }));
    
    return simplifiedPath;
  } catch (error) {
    logErrorToServer(error, "modifyPath");
    console.error('Error during path modification:', error);
    return existingPath; // Return the original path as a fallback
  }
};

export const calculateOverlap = (segA, segB) => {
    // Convert segmentation arrays to proper format
    const polygonA = segA.map(point => [point.x, point.y]);
    const polygonB = segB.map(point => [point.x, point.y]);

    // Calculate intersection area
    const intersection = polyclip.intersection([polygonA], [polygonB]);

    if (intersection.length === 0) return 0; // No overlap

    // Calculate the overlapping area using Shoelace formula
    return intersection.reduce((area, poly) => area + polygonArea(poly[0]), 0);
}

// Shoelace formula to calculate the area of a polygon
const polygonArea = (points) => {
    let area = 0;
    const n = points.length;
    for (let i = 0; i < n; i++) {
        const [x1, y1] = points[i];
        const [x2, y2] = points[(i + 1) % n]; // Wrap around for last point
        area += x1 * y2 - x2 * y1;
    }
    return Math.abs(area / 2);
}
