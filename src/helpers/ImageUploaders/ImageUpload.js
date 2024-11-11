import axios from "axios";
export const getCoordinatesFromAPI = async (file,model, base64Image, thumbnailBase64, visitId, imageFileName, patientID, imageNumber, annotationFileName) => {
  const apiUrl = process.env.REACT_APP_NODEAPIURL;
  const formData = new FormData();
  formData.append('image', file);
  console.log(file)
  if(model==="Segmentation Model"){
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
    console.log(formData)
    const headers = {
      // Don't set Content-Type manually when using FormData!
      // It will be automatically set with the correct boundary
      'Content-Type': 'application/json',
    };
      response = await axios.post(`${apiUrl}/upload/coordinates`,{ 
          base64Image:base64Image,
          thumbnailBase64: thumbnailBase64, 
          visitId:visitId, 
          fileName: imageFileName, 
          patientID: patientID, 
          imageNumber: imageNumber, 
          annotationFileName: annotationFileName,
      },{
        headers: headers,
        maxBodyLength: Infinity,
        maxContentLength: Infinity,
      });
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
      console.error('Error fetching coordinates from API:', error);
      return { error: `${file.name} - Error running model`};
    }
  }
  else{
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
        console.log(response.data)
        const scaledResponse = {
          annotations: response.data,
          status: response.data.status,
        };
        console.log(response)
        // Axios automatically parses JSON response
        const data = response.data;
        console.log(data);
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
          if (error.code === "ECONNREFUSED" || error.code === "ERR_NETWORK" || error.code === "ERR_CONNECTION_TIMED_OUT" || error.code === "ERR_BAD_REQUEST") {
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
      }
      else {
        console.error(response)
      }
    }
    catch (error) {
        console.error('Error fetching coordinates from API:', error);
        return { error: `${file.name} - Error running model`};
      }
  }
};
export const saveImageToFolder = async (file, patientID, imageNumber, model) => {
  if (!file) return;
  const date = new Date().toISOString().replace(/:/g, '-');
  const imageFileName = `${date}_${patientID}_${imageNumber}_${file.name}`;
  console.log(imageFileName)
  const annotationFileName = `${date}_${patientID}_${imageNumber}_${file.name.split('.').slice(0, -1).join('.')}.json`;

  try {
    // Process annotations (assuming getCoordinatesFromAPI is a function you have)
    const base64Image = await getFileAsBase64(file);
    const thumbnailBase64 = await createThumbnail(file);
    const visitId = sessionStorage.getItem('visitId');
    const annotations = await getCoordinatesFromAPI(file,model, base64Image, thumbnailBase64, visitId, imageFileName, patientID, imageNumber, annotationFileName);
    if(annotations.error){
      return {success:false, error:annotations.error}
    }
    else{
      return {success:true}
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