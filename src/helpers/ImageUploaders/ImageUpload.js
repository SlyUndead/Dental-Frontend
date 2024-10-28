import axios from "axios";
export const getCoordinatesFromAPI = async (file) => {
  const formData = new FormData();
  formData.append('image', file);
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
      console.log(response)
      // Axios automatically parses JSON response
      const data = response.data;
      console.log(data);

      // Format the response data as needed for coordinates
      return data;
    }
    else {
      console.error(response)
    }
  }
  catch (error) {
    if (error.code === "ECONNREFUSED" || error.code === "ERR_NETWORK" || error.code === "ERR_CONNECTION_TIMED_OUT") {
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
      try {
        const response = await axios.post('http://192.168.155.19:5000/coordinates', formData, {
          headers: {
            'Content-Type': 'multipart/form-data', // Set the correct content type for formData
          },
        });
        if (response.status === 200) {
          console.log(response)
          // Axios automatically parses JSON response
          const data = response.data;
          console.log(data);

          // Format the response data as needed for coordinates
          return data;
        }
      }
      catch (err) {
        console.error(err)
        return { error:`${file.name} - Error running model` }
      }
    }
    else {
      console.error('Error fetching coordinates from API:', error);
      return { error: `${file.name} - Error running model`};
    }
  }
};
export const saveImageToFolder = async (file, patientID, imageNumber) => {
  if (!file) return;
  console.log(file, file.name);
  const date = new Date().toISOString().replace(/:/g, '-');
  const imageFileName = `${date}_${patientID}_${imageNumber}_${file.name}`;
  console.log(imageFileName)
  const annotationFileName = `${date}_${patientID}_${imageNumber}_${file.name.split('.').slice(0, -1).join('.')}.json`;

  try {
    // Process annotations (assuming getCoordinatesFromAPI is a function you have)
    const annotations = await getCoordinatesFromAPI(file);
    if(annotations.error){
      return {success:false, error:annotations.error}
    }
    const scaledResponse = {
      annotations: annotations,
      status: annotations.status,
    };

    const base64Image = await getFileAsBase64(file);
    const thumbnailBase64 = await createThumbnail(file);
    const visitId = sessionStorage.getItem('visitId');
    try {
      const apiUrl = process.env.REACT_APP_NODEAPIURL;
      await axios.put(`${apiUrl}/upload/image-and-annotations`, {
      //  await axios.put('http://localhost:3001/upload/image-and-annotations', {
        fileName: imageFileName,
        base64Image: base64Image,
        thumbnailBase64: thumbnailBase64,
        patientID: patientID,
        imageNumber: imageNumber,
        scaledResponse: scaledResponse,
        annotationFileName: annotationFileName,
        visitId:visitId
      }, {
        headers: { 'Content-Type': 'application/json' }
      });
      console.log('Image, annotations and thumbnail uploaded successfully');
      return {success:true};
    } catch (error) {
      if (error.code === "ECONNREFUSED" || error.code === "ERR_NETWORK" || error.code === "ERR_CONNECTION_TIMED_OUT" || error.code == "ERR_BAD_REQUEST") {
        try {
          await axios.put('http://192.168.155.19:3001/upload/image-and-annotations', {
            fileName: imageFileName,
            base64Image: base64Image,
            thumbnailBase64: thumbnailBase64, //AnotatedFiles/fileName
            patientID: patientID,
            imageNumber: imageNumber,
            scaledResponse: scaledResponse,
            annotationFileName: annotationFileName
          }, {
            headers: { 'Content-Type': 'application/json' }
          });
          console.log('Image, annotations and thumbnail uploaded successfully');
          return {success:true};
        }
        catch (err) {
          console.log(err)
          return {success:false, error:`${imageFileName} - Error uploading image and annotations`}
        }
      } else {
        console.error('Error uploading image and annotations:', error);
        return {success:false, error:`${imageFileName} - Error uploading image and annotations`}
      }
    }
  } catch (error) {
    console.error('Error processing image and annotations:', error);
    return {success:false, error:`${imageFileName} - Error uploading image and annotations`}
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

function createImage(file) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}

function getFileAsBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = error => reject(error);
  });
}