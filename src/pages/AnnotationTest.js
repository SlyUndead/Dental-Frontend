import React, { useState, useEffect } from 'react';
import axios from "axios";
const AnnotationTest = () => {
    const [folderHandle, setFolderHandle] = useState(null);
  const [imageSrc, setImageSrc] = useState(null);
  const [coordinates, setCoordinates] = useState([]);
  const [imageFileName, setImageFileName] = useState('parjut1.jpg');
  const [imageStatus, setImageStatus] = useState('OPEN');

    useEffect(() => {
        const loadImages = async () => {
          const imagesData = await fetchVisitDateImages();
          let mainImageData = [];
          // let recentImagesData = [];
      
          if (imagesData && imagesData.length > 0) {
            mainImageData = imagesData[0];
            // recentImagesData = imagesData.slice(1);
            //setAnnotations(mainImageData.annotations.annotations.annotations);
          }
      
          // Draw the main image on the large canvas
        //   if (mainImageData && mainCanvasRef.current) {
        //     drawImageOnCanvas(mainCanvasRef.current, mainImageData.image, "main");
        //   }
      
        };
      
        loadImages();
      }, []);

    const fetchVisitDateImages = async () => {
        try {
            const response = await axios.get('https://agp-ui-node-api.mdbgo.io/visitid-images?visitID=' + sessionStorage.getItem('visitId')); // Adjust the API endpoint as needed
            const data = response.data;
            sessionStorage.setItem('token', response.headers['new-token'])
            // setMainImage(data.image);
            // setAnnotations(data.annotations);
            return data.images;
        } catch (error) {
          if(error.code==="ECONNREFUSED" || error.code==="ERR_NETWORK" || error.code==="ERR_CONNECTION_TIMED_OUT"||error.code==="ERR_SSL_PROTOCOL_ERROR 200"){
            const response = await axios.get('http://localhost:3000/visitid-images?visitID='+ sessionStorage.getItem('visitId')); // Adjust the API endpoint as needed
            const data = response.data;
            sessionStorage.setItem('token', response.headers['new-token'])
            // setMainImage(data.image);
            // setAnnotations(data.annotations);
            return data.images;
          }
          else{
            console.error('Error fetching most recent image:', error);
          }
        }
    };

    const processImage = (file) => {
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
              const { width, height } = img;
    
              const canvas = document.createElement('canvas');
              const ctx = canvas.getContext('2d');
    
              const targetAspectRatio = 16 / 9;
              let newWidth, newHeight;
    
              if (width / height > targetAspectRatio) {
                newWidth = width;
                newHeight = width / targetAspectRatio;
              } else {
                newHeight = height;
                newWidth = height * targetAspectRatio;
              }
    
              canvas.width = newWidth;
              canvas.height = newHeight;
    
              ctx.fillStyle = 'white';
              ctx.fillRect(0, 0, newWidth, newHeight);
    
              const x = (newWidth - width) / 2;
              const y = (newHeight - height) / 2;
    
              ctx.drawImage(img, x, y, width, height);
    
              const processedDataUrl = canvas.toDataURL('image/png');
    
              console.log('Processed image dimensions:', newWidth, 'x', newHeight);
              resolve({ processedDataUrl, newWidth, newHeight });
            };
            img.src = event.target.result;
          };
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
      };

      return (
        <div>
            <>
              
            </>
          
        </div>
      );
}
export default AnnotationTest