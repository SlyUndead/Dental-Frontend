import axios from "axios";
import { logErrorToServer } from "utils/logError";
import { calculateOverlap, polygonArea } from "../../pages/AnnotationTools/path-utils";
import sessionManager from "utils/sessionManager";
export const getCoordinatesFromAPI = async (file, model, base64Image, thumbnailBase64, visitId, imageFileName, patientID, imageNumber, annotationFileName) => {
  const apiUrl = process.env.REACT_APP_NODEAPIURL;
  const formData = new FormData();
  formData.append('image', file);
  // console.log(file)
  if (model === "Segmentation Model") {
    try {
      // const response = await axios.post('https://agp-dental-agp_flask_server.mdbgo.io/coordinates', formData, {
      //   headers: {
      //     'Content-Type': 'multipart/form-data', // Set the correct content type for formData
      //   },
      // });
      // const response = await axios.post('https://dental-flask.onrender.com/coordinates', formData, {
      //   headers: {
      //     'Content-Type': 'multipart/form-data', // Set the correct content type for formData
      //   },
      // });
      let response;
      // console.log(formData)
      const headers = {
        'Content-Type': 'application/json',
        Authorization: sessionManager.getItem('token')
      };
      response = await axios.post(`${apiUrl}/upload/coordinates`, {
        base64Image: base64Image,
        thumbnailBase64: thumbnailBase64,
        visitId: visitId,
        fileName: imageFileName,
        patientID: patientID,
        imageNumber: imageNumber,
        annotationFileName: annotationFileName,
      }, {
        headers: headers,
        maxBodyLength: Infinity,
        maxContentLength: Infinity,
      });
      if (response.status === 200) {
        // console.log(response)
        sessionManager.setItem('token', response.headers['new-token'])
        // Axios automatically parses JSON response
        const data = response.data;
        console.log(data)
        // Add associatedTooth field to each annotation
        const processedData = addAssociatedToothToAnnotations(data);
        console.log(processedData)
        // Format the response data as needed for coordinates
        return processedData;
      }
      else {
        if (response.status === 403 || response.status === 401) {
          return { success: false, error: "Unauthorized" }
        }
        else {
          console.error(response)
          logErrorToServer(response, "getCoordinatesFromAPI");
        }
      }
    }
    catch (error) {
      if (error.status === 403 || error.status === 401) {
        return { success: false, error: "Unauthorized" }
      }
      else {
        logErrorToServer(error, "getCoordinatesFromAPI");
        console.error('Error fetching coordinates from API:', error);
      }
      return { error: `${file.name} - Error running model` };
    }
  }
  else {
    try {
      let response;
      if (localStorage.getItem('apiIpAdd')) {
        response = await axios.post(`http://${localStorage.getItem('apiIpAdd')}:5000/coordinates`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data', // Set the correct content type for formData
          },
        });
      }
      else {
        response = await axios.post(`http://localhost:5000/coordinates`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data', // Set the correct content type for formData
          },
        });
      }
      if (response.status === 200) {
        // console.log(response.data)
        // Process the response to add associatedTooth field
        const processedData = addAssociatedToothToAnnotations({
          annotations: response.data,
          status: response.data.status
        });

        const scaledResponse = {
          annotations: processedData.annotations,
          status: processedData.status,
        };
        // console.log(response)
        // console.log(processedData);
        try {
          const apiUrl = process.env.REACT_APP_NODEAPIURL;
          const response = await axios.put(`${apiUrl}/upload/image-and-annotations`, {
            //  await axios.put('http://localhost:3001/upload/image-and-annotations', {
            fileName: imageFileName,
            base64Image: base64Image,
            thumbnailBase64: thumbnailBase64,
            patientID: patientID,
            imageNumber: imageNumber,
            scaledResponse: scaledResponse,
            annotationFileName: annotationFileName,
            visitId: visitId
          }, {
            headers: {
              'Content-Type': 'application/json',
              Authorization: sessionManager.getItem('token')
            }
          });
          sessionManager.setItem('token', response.headers['new-token'])
          // console.log('Image, annotations and thumbnail uploaded successfully');
          return { success: true };
        } catch (error) {
          if (error.status === 403 || error.status === 401) {
            return { success: false, error: "Unauthorized" }
          }
          console.error('Error uploading image and annotations:', error);
          return { success: false, error: `${imageFileName} - Error uploading image and annotations` }
        }
      }
      else {
        console.error(response)
      }
    }
    catch (error) {

      if (error.status === 403 || error.status === 401) {
        return { success: false, error: "Unauthorized" }
      }

      else {
        logErrorToServer(error, "getCoordinatesFromAPI");
        console.error('Error fetching coordinates from API:', error);
      }
      return { error: `${file.name} - Error running model` };
    }
  }
};
export const saveImageToFolder = async (file, patientID, imageNumber, model) => {
  if (!file) return;
  const date = new Date().toISOString().replace(/:/g, '-');
  const imageFileName = `${date}_${patientID}_${imageNumber}_${file.name}`;
  // console.log(imageFileName)
  const annotationFileName = `${date}_${patientID}_${imageNumber}_${file.name.split('.').slice(0, -1).join('.')}.json`;

  try {
    // Process annotations (assuming getCoordinatesFromAPI is a function you have)
    const base64Image = await getFileAsBase64(file);
    const thumbnailBase64 = await createThumbnail(file);
    const visitId = sessionManager.getItem('visitId');
    const annotations = await getCoordinatesFromAPI(file, model, base64Image, thumbnailBase64, visitId, imageFileName, patientID, imageNumber, annotationFileName);
    console.log(annotations)
    if (annotations.error) {
      return { success: false, error: annotations.error }
    }
    else {
      return { success: true }
    }
  } catch (error) {
    logErrorToServer(error, "saveImageToFolder");
    console.error('Error processing image and annotations:', error);
    return { success: false, error: `${imageFileName} - Error uploading image and annotations` }
  }
};

// Function to create thumbnail
const createThumbnail = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const scaleFactor = 200 / img.width;
        canvas.width = 200;
        canvas.height = img.height * scaleFactor;
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.7));
      };
      img.onerror = (error) => reject(error);
    };
    reader.onerror = (error) => reject(error);
  });
};

// Removed unused createImage function

function getFileAsBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = error => reject(error);
  });
}

// Function to add associatedTooth field to each annotation
function addAssociatedToothToAnnotations(data) {
  console.log(data,data.annotations)
  if (!data || !data.annotations || !Array.isArray(data.annotations)) {
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
    return data;
  }

  // Helper function to find tooth range for bone loss
  const findToothRangeForBoneLoss = (anomaly, toothAnnotations) => {
    const overlappingTeeth = [];

    toothAnnotations.forEach((toothAnno) => {
      const toothNumber = Number.parseInt(toothAnno.label);
      if (
        !isNaN(toothNumber) &&
        toothNumber >= 1 &&
        toothNumber <= 32 &&
        anomaly.segmentation &&
        toothAnno.segmentation
      ) {
        try {
          const overlap = calculateOverlap(anomaly.segmentation, toothAnno.segmentation);
          const annoArea = polygonArea(anomaly.segmentation.map((point) => [point.x, point.y]));
          const overlapPercentage = annoArea > 0 ? overlap / annoArea : 0;

          // For bone loss, include any tooth with even minimal overlap (2% threshold)
          if (overlapPercentage > 0.02) {
            overlappingTeeth.push(toothNumber);
          }
        } catch (error) {
          console.error("Error calculating overlap:", error);
        }
      }
    });

    // Sort teeth by number to create a range
    overlappingTeeth.sort((a, b) => a - b);

    if (overlappingTeeth.length > 0) {
      // Format the range as "X-Y" if it's a range, or just "X" if it's a single tooth
      return overlappingTeeth.length > 1
        ? `${overlappingTeeth[0]}-${overlappingTeeth[overlappingTeeth.length - 1]}`
        : `${overlappingTeeth[0]}`;
    }

    return null;
  };

  // Process each annotation to find associated tooth
  const processedAnnotations = data.annotations.map(anno => {
    // Skip tooth annotations (they don't need an associatedTooth field)
    if (!isNaN(Number.parseInt(anno.label))) {
      return anno;
    }

    let associatedTooth = null;

    // Special handling for bone loss annotations - use the tooth range
    if (anno.label && anno.label.toLowerCase().includes("bone loss")) {
      associatedTooth = findToothRangeForBoneLoss(anno, toothAnnotations);
    }

    // If not bone loss or no range found, use standard single tooth method
    if (!associatedTooth) {
      // Check overlap with each tooth for single tooth association
      let maxOverlap = 0;

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