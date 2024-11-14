import React, { useState, useEffect, useCallback } from 'react';

function ImageUploader({ onImageSelect, currentImageIndex, onNextImage, onPreviousImage, images }) {
    const [dragActive, setDragActive] = useState(false);
    const [imagePreviews, setImagePreviews] = useState({});
    const folderHandle='../../AnnotatedFiles'
    const handleImageClick = async (imageName) => {
        try {
            const fileHandle = await folderHandle.getFileHandle(imageName);
            const file = await fileHandle.getFile();
            onImageSelect(file, imageName);
        } catch (error) {
            console.error('Error selecting image:', error);
        }
    };

    const handleFileUpload = async (file) => {
        if (file) {
            onImageSelect(file, file.name);
        }
    };

    const handleDrag = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    const handleDrop = useCallback(async (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            await handleFileUpload(e.dataTransfer.files[0]);
        }
    }, [handleFileUpload]);

    const loadImagePreview = useCallback(async (imageName) => {
        try {
            const fileHandle = await folderHandle.getFileHandle(imageName);
            const file = await fileHandle.getFile();
            const reader = new FileReader();
            reader.onload = (e) => {
                setImagePreviews(prev => ({ ...prev, [imageName]: e.target.result }));
            };
            reader.readAsDataURL(file);
        } catch (error) {
            console.error('Error loading image preview:', error);
        }
    }, [folderHandle]);

    useEffect(() => {
        images.slice(0, 5).forEach(loadImagePreview);
    }, [images, loadImagePreview]);

    return (
        <div>
            <div>
                <button onClick={onPreviousImage} disabled={currentImageIndex <= 0}>Previous</button>
                <button onClick={onNextImage} disabled={currentImageIndex >= images.length - 1}>Next</button>
            </div>
            <h3>Select an existing image:</h3>
            <ul style={{ listStyle: 'none', padding: 0 }}>
                {images.slice(0, 5).map((image, index) => (
                    <li 
                        key={index} 
                        onClick={() => handleImageClick(image)}
                        style={{
                            fontWeight: index === currentImageIndex ? 'bold' : 'normal',
                            display: 'flex',
                            alignItems: 'center',
                            marginBottom: '10px',
                            cursor: 'pointer'
                        }}
                    >
                        {imagePreviews[image] && (
                            <img 
                                src={imagePreviews[image]} 
                                alt={image} 
                                style={{ width: '50px', height: '50px', objectFit: 'cover', marginRight: '10px' }}
                            />
                        )}
                        {image}
                    </li>
                ))}
            </ul>
            <h3>Or upload a new image:</h3>
            <div 
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                style={{
                    border: `2px dashed ${dragActive ? 'blue' : 'gray'}`,
                    padding: '20px',
                    textAlign: 'center',
                    cursor: 'pointer'
                }}
            >
                <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileUpload(e.target.files[0])}
                    style={{ display: 'none' }}
                    id="file-upload"
                />
                <label htmlFor="file-upload">
                    Drag and drop an image here, or click to select a file
                </label>
            </div>
        </div>
    );
}

export default ImageUploader;

