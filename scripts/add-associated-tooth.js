require('dotenv').config({ path: '../.env' });
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const polygonClipping = require('polygon-clipping');

// Configuration
const apiUrl = process.env.REACT_APP_NODEAPIURL || 'https://agp-ui-node-api.mdbgo.io';

// Initialize token and practiceId from sessionStorage
let currentToken = '';
let practiceId = '';

// Try to get token and practiceId from sessionStorage
try {
  // In Node.js environment with jsdom
  const { JSDOM } = require('jsdom');
  const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', {
    url: 'http://localhost'
  });
  global.window = dom.window;
  global.document = dom.window.document;
  global.sessionStorage = dom.window.sessionStorage;

  // Try to access sessionStorage
  if (typeof window !== 'undefined' && window.sessionStorage) {
    // Get token
    const storedToken = window.sessionStorage.getItem('token');
    if (storedToken) {
      currentToken = storedToken;
      console.log('Token retrieved from sessionStorage');
    }

    // Get practiceId
    const storedPracticeId = window.sessionStorage.getItem('practiceId');
    if (storedPracticeId) {
      practiceId = storedPracticeId;
      console.log('PracticeId retrieved from sessionStorage');
    }
  }
} catch (error) {
  console.log('Unable to access sessionStorage directly, will try alternative methods');
}

// Function to update token after API calls
const updateToken = (response) => {
  if (response && response.headers && response.headers['new-token']) {
    currentToken = response.headers['new-token'];
    console.log('Token updated');

    // Try to update sessionStorage if available
    try {
      if (typeof window !== 'undefined' && window.sessionStorage) {
        window.sessionStorage.setItem('token', currentToken);
      }
    } catch (error) {
      console.log('Unable to update token in sessionStorage');
    }
  }
};

// Utility functions for polygon operations
const calculateOverlap = (segA, segB) => {
  // Convert segmentation arrays to proper format
  const polygonA = segA.map(point => [point.x, point.y]);
  const polygonB = segB.map(point => [point.x, point.y]);

  try {
    // Calculate intersection area
    const intersection = polygonClipping.intersection([polygonA], [polygonB]);

    if (intersection.length === 0) return 0; // No overlap

    // Calculate the overlapping area using Shoelace formula
    return intersection.reduce((area, poly) => area + polygonArea(poly[0]), 0);
  } catch (error) {
    console.error('Error calculating overlap:', error);
    return 0;
  }
};

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
};

// Function to add associatedTooth field to annotations
function addAssociatedToothToAnnotations(data) {
  console.log("Processing annotations data");
  
  // Validate data structure
  if (!data || !data.annotations || !Array.isArray(data.annotations)) {
    console.log("Invalid annotation data structure");
    return data;
  }

  // First, filter out tooth annotations (numeric labels)
  const toothAnnotations = data.annotations.filter(anno => {
    return !isNaN(Number.parseInt(anno.label)) &&
           Number.parseInt(anno.label) >= 1 &&
           Number.parseInt(anno.label) <= 32;
  });

  // If no tooth annotations found, return original data
  if (toothAnnotations.length === 0) {
    console.log("No tooth annotations found");
    return data;
  }

  // Process each annotation to find associated tooth
  const processedAnnotations = data.annotations.map(anno => {
    // Skip tooth annotations (they don't need an associatedTooth field)
    if (!isNaN(Number.parseInt(anno.label))) {
      return anno;
    }

    // If annotation already has associatedTooth field, keep it
    if (anno.associatedTooth !== undefined) {
      return anno;
    }

    // Check overlap with each tooth
    let maxOverlap = 0;
    let associatedTooth = null;

    for (const toothAnno of toothAnnotations) {
      // Skip if either annotation doesn't have segmentation
      if (!anno.segmentation || !toothAnno.segmentation) {
        continue;
      }

      try {
        // Calculate overlap
        const overlap = calculateOverlap(anno.segmentation, toothAnno.segmentation);
        const annoArea = polygonArea(anno.segmentation.map(point => [point.x, point.y]));
        const overlapPercentage = annoArea > 0 ? overlap / annoArea : 0;

        // Only consider if overlap is at least 80%
        if (overlapPercentage >= 0.8 && overlap > maxOverlap) {
          maxOverlap = overlap;
          associatedTooth = Number.parseInt(toothAnno.label);
        }
      } catch (error) {
        console.error("Error calculating overlap:", error);
      }
    }

    // Add associatedTooth field to the annotation
    return {
      ...anno,
      associatedTooth: associatedTooth
    };
  });

  // Return the updated data
  return {
    ...data,
    annotations: processedAnnotations
  };
}

// Function to get all patients
async function getAllPatients() {
  try {
    // Use the global practiceId variable that was set earlier
    const response = await axios.get(`${apiUrl}/getPatient?practiceId=${practiceId}`, {
      headers: {
        Authorization: currentToken
      }
    });

    // Update token after successful API call
    updateToken(response);

    return response.data.patientList;
  } catch (error) {
    console.error('Error fetching patients:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
    throw error;
  }
}

// Function to get all visits for a patient
async function getPatientVisits(patientId) {
  try {
    const response = await axios.get(`${apiUrl}/getPatientVisitsByID?patientId=${patientId}`, {
      headers: {
        Authorization: currentToken
      }
    });

    // Update token after successful API call
    updateToken(response);

    // The endpoint returns patienVisits (note the typo in the backend)
    return response.data.patienVisits;
  } catch (error) {
    console.error(`Error fetching visits for patient ${patientId}:`, error.message);
    throw error;
  }
}

// Function to get all images for a visit
async function getVisitImages(visitId) {
  try {
    const response = await axios.get(`${apiUrl}/visitid-annotations?visitID=${visitId}`, {
      headers: {
        Authorization: currentToken
      }
    });

    // Update token after successful API call
    updateToken(response);

    return response.data.images;
  } catch (error) {
    console.error(`Error fetching images for visit ${visitId}:`, error.message);
    throw error;
  }
}

// Function to save updated annotations
async function saveAnnotations(patientId, visitId, imageNumber, annotationPath, updatedAnnotations) {
  try {
    const scaledResponse = {
      annotations: updatedAnnotations,
      status: "OPEN"
    };

    const response = await axios.put(`${apiUrl}/save-annotations`, {
      patientId: patientId,
      visitId: visitId,
      scaledResponse: scaledResponse,
      imageNumber: imageNumber,
      annotationPath: annotationPath
    }, {
      headers: {
        Authorization: currentToken
      }
    });

    // Update token after successful API call
    updateToken(response);

    return response.data;
  } catch (error) {
    console.error(`Error saving annotations for image ${imageNumber} in visit ${visitId}:`, error.message);
    throw error;
  }
}

// Main function to process all annotations
async function processAllAnnotations() {
  try {
    console.log('Starting to process all annotations...');

    // Check if we have a token
    if (!currentToken) {
      // Try to get token from command line as a fallback
      const cmdToken = process.argv[2];
      if (cmdToken) {
        currentToken = cmdToken;
        console.log('Using token from command line argument');
      } else {
        console.error('No token found in sessionStorage or command line.');
        console.log('Please run this script from a context where sessionStorage is available,');
        console.log('or provide a token as a command line argument:');
        console.log('npm run add-associated-tooth YOUR_AUTH_TOKEN YOUR_PRACTICE_ID');
        process.exit(1);
      }
    }

    // Check if we have a practiceId
    if (!practiceId) {
      // Try to get practiceId from command line as a fallback
      const cmdPracticeId = process.argv[3];
      if (cmdPracticeId) {
        practiceId = cmdPracticeId;
        console.log('Using practiceId from command line argument');
      } else {
        console.error('No practiceId found in sessionStorage or command line.');
        console.log('Please run this script from a context where sessionStorage is available,');
        console.log('or provide a practiceId as a command line argument:');
        console.log('npm run add-associated-tooth YOUR_AUTH_TOKEN YOUR_PRACTICE_ID');
        process.exit(1);
      }
    }

    // Get all patients
    const patients = await getAllPatients();
    console.log(`Found ${patients.length} patients`);

    let totalVisits = 0;
    let totalImages = 0;
    let totalAnnotationsUpdated = 0;

    // Process each patient
    for (const patient of patients) {
      console.log(`Processing patient: ${patient.first_name} ${patient.last_name} (ID: ${patient._id})`);

      // Get all visits for this patient
      const visits = await getPatientVisits(patient._id);
      console.log(`Found ${visits.length} visits for this patient`);
      totalVisits += visits.length;

      // Process each visit
      for (const visit of visits) {
        console.log(`Processing visit: ${visit.date_of_visit} (ID: ${visit._id})`);

        // Get all images for this visit
        const images = await getVisitImages(visit._id);
        console.log(`Found ${images.length} images for this visit`);
        totalImages += images.length;

        // Process each image
        for (let i = 0; i < images.length; i++) {
          const image = images[i];
          console.log(`Processing image: ${image.name} (${i + 1}/${images.length})`);

          // Skip if no annotations
          if (!image.annotations || !image.annotations.annotations || !image.annotations.annotations.annotations) {
            console.log(`No annotations found for this image, skipping`);
            continue;
          }

          // Process annotations to add associatedTooth field
          const originalAnnotations = image.annotations.annotations;
          const updatedAnnotations = addAssociatedToothToAnnotations(originalAnnotations);

          // Count how many annotations were updated
          const originalCount = originalAnnotations.annotations.filter(a => a.associatedTooth !== undefined).length;
          const updatedCount = updatedAnnotations.annotations.filter(a => a.associatedTooth !== undefined).length;
          const newlyAddedCount = updatedCount - originalCount;
            
            console.log(`Added associatedTooth field to ${newlyAddedCount} annotations`);
            totalAnnotationsUpdated += newlyAddedCount;
            
            // Save if changes were made
            if (newlyAddedCount > 0) {
              const annotationPath = image.name.split('.').slice(0, -1).join('.') + '.json';
              await saveAnnotations(patient._id, visit._id, i + 1, annotationPath, updatedAnnotations);
              console.log(`Successfully saved updated annotations`);
            } else {
              console.log(`No changes needed, skipping save`);
            }
        }
      }
    }

    console.log('\nSummary:');
    console.log(`Processed ${patients.length} patients`);
    console.log(`Processed ${totalVisits} visits`);
    console.log(`Processed ${totalImages} images`);
    console.log(`Updated ${totalAnnotationsUpdated} annotations with associatedTooth field`);

  } catch (error) {
    console.error('Error processing annotations:', error);
  }
}

// Run the script
processAllAnnotations().then(() => {
  console.log('Script completed');
}).catch(error => {
  console.error('Script failed:', error);
});