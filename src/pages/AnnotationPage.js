import React, { useState, useRef, useEffect, useCallback } from "react"
import {
  Table, Card, CardBody, Button, Col, Row, FormGroup, Label, Input, Container, InputGroup, InputGroupText, Dropdown,
  DropdownMenu, DropdownToggle, DropdownItem, Popover, PopoverBody, Modal, ModalBody, ModalFooter, ModalHeader, Spinner,
  UncontrolledTooltip
} from "reactstrap";
import AnnotationList from "./AnnotationTools/AnnotationList";
import { MAX_HISTORY } from "./AnnotationTools/constants";
import { LivewireScissors } from '../helpers/DrawingTools/LivewireScissors.ts';
import axios from "axios";
import { Navigate } from "react-router-dom";
import { changeMode } from "../store/actions"
import { useDispatch, useSelector } from 'react-redux';
import imgExit from "../assets/images/exit.svg"
import imgEdit from "../assets/images/edit.svg"
import imgEditActive from "../assets/images/editActive.svg"
import '../assets/scss/custom/custom.scss';
import { modifyPath } from "./AnnotationTools/path-utils";
import { logErrorToServer } from "utils/logError";
import { desiredOrder } from "./AnnotationTools/constants";
const AnnotationPage = () => {
  const apiUrl = process.env.REACT_APP_NODEAPIURL;
  const [exitClick, setExitClick] = useState(false);
  const [annotations, setAnnotations] = useState([]);
  const [hiddenAnnotations, setHiddenAnnotations] = useState([]);
  const [drawingBox, setDrawingBox] = useState(null);
  const [showDialog, setShowDialog] = useState(false);
  const [newBoxLabel, setNewBoxLabel] = useState('');
  const [newBoxVertices, setNewBoxVertices] = useState([]);
  const [isDrawingActive, setIsDrawingActive] = useState(false);
  const [isDrawingFreehand, setIsDrawingFreehand] = useState(false);
  const [drawingPaths, setDrawingPaths] = useState([]);
  const [image, setImage] = useState(null);
  const [x, setX] = useState(0);
  const [y, setY] = useState(0);
  // const [scale, setScale] = useState(1);
  const [isLiveWireTracingActive, setIsLiveWireTracingActive] = useState(false);
  const [hoveredAnnotation, setHoveredAnnotation] = useState(null);
  const [isHybridDrawingActive, setIsHybridDrawing] = useState(false);
  const [selectedAnnotation, setSelectedAnnotation] = useState(null);
  const [isEraserActive, setIsEraserActive] = useState(false);
  const [history, setHistory] = useState([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [eraserSize, setEraserSize] = useState(5);
  const [zoom, setZoom] = useState(100);
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [areaScale, setAreaScale] = useState(1);
  const [isLineDrawingActive, setIsLineDrawingActive] = useState(false);
  const mainCanvasRef = useRef(null);
  const [smallCanvasRefs, setSmallCanvasRefs] = useState([]);
  const containerRef = useRef(null);
  const [editingMode, setEditingMode] = useState(false)
  const [brightnessPopoverOpen, setBrightnessPopoverOpen] = useState(false);
  const [zoomDropdownOpen, setZoomDropdownOpen] = useState(false);
  const predefinedZooms = [25, 50, 75, 100, 150, 200];
  const [mainCanvasData, setMainCanvasData] = useState(null);
  const [smallCanvasData, setSmallCanvasData] = useState([]);
  const [lineStart, setLineStart] = useState(null);
  const [lineEnd, setLineEnd] = useState(null);
  const isDrawingRef = useRef(null);
  let CANVAS_HEIGHT = 0;
  let CANVAS_WIDTH = 0;
  const livewireRef = useRef(null);
  const [isLiveWireTracing, setIsLiveWireTracing] = useState(false);
  const isErasing = useRef(null);
  const [erasePoints, setErasePoints] = useState([]);
  const [fixedPoints, setFixedPoints] = useState([]);
  const [currentPath, setCurrentPath] = useState([]);
  const SNAP_THRESHOLD = 10;
  const [mainImageIndex, setMainImageIndex] = useState(0);
  const [hybridPath, setHybridPath] = useState([]);
  const startPointRef = useRef(null);
  const lastPointRef = useRef(null);
  const isDrawingStartedRef = useRef(null);
  const [isMouseDown, setIsMouseDown] = useState(false);
  const [livewirePath, setLivewirePath] = useState([]);
  const [labelColors, setLabelColors] = useState({})
  const [preLayoutMode, setPreLayoutMode] = useState('');
  const [lastVisit, setLastVisit] = useState(false);
  const [firstVisit, setFirstVisit] = useState(false);
  const mode = useSelector((state) => state.Layout.layoutMode);
  const dispatch = useDispatch();
  const [isLoading, setIsLoading] = useState(false);
  const [editingPath, setEditingPath] = useState([]);
  const [subtractPath, setSubtractPath] = useState([]);
  const [model, setModel] = useState("")
  const [isNegative, setIsNegative] = useState(false)
  const [classCategories, setClassCategories] = useState({})
  const [isNotesOpen, setIsNotesOpen] = useState(false); // State to toggle Notes view
  const [notesContent, setNotesContent] = useState('');
  const [oldNotesContent, setOldNotesContent] = useState('');
  const AUTO_SAVE_DELAY = 1000;
  const [saveTimeout, setSaveTimeout] = useState(null); // Timeout for debounced auto-save
  const [autoSaveInterval, setAutoSaveInterval] = useState(null)
  const [fullName, setFullName] = useState("")
  const [isArea ,setIsShowArea] = useState(true);
  const [redirectToLogin, setRedirectToLogin] = useState(false);
  const [message, setMessage] = useState('')
  const [isClassCategoryVisible, setIsClassCategoryVisible] = useState(false);
  const [selectedClassCategory, setSelectedClassCategory] = useState(null);
  // const fetchMostRecentImage = async () => {
  //     try {
  //         const response = await axios.get('https://agp-ui-node-api.mdbgo.io/most-recent-image'); // Adjust the API endpoint as needed
  //         const data = response.data;
  //         // setMainImage(data.image);
  //         // setAnnotations(data.annotations);
  //         console.log(data)
  //         return data;
  //     } catch (error) {
  //       if(error.code==="ECONNREFUSED" || error.code==="ERR_NETWORK" || error.code==="ERR_CONNECTION_TIMED_OUT"){
  //         const response = await axios.get('https://agp-ui-node-api.mdbgo.io/most-recent-image'); // Adjust the API endpoint as needed
  //         const data = response.data;
  //         // setMainImage(data.image);
  //         // setAnnotations(data.annotations);
  //         return data;
  //       }
  //       else{
  //         console.error('Error fetching most recent image:', error);
  //       }
  //     }
  // };

  // // Function to fetch up to 3 other recent images
  // const fetchRecentImages = async () => {
  //     try {
  //         const response = await axios.get('https://agp-ui-node-api.mdbgo.io/recent-images?limit=3'); // Adjust the API endpoint as needed
  //         const data = response.data;
  //         // setRecentImages(data.images);
  //         return data;
  //     } catch (error) {
  //       if(error.code==="ECONNREFUSED" || error.code==="ERR_NETWORK" || error.code==="ERR_CONNECTION_TIMED_OUT"){
  //         const response = await axios.get('https://agp-ui-node-api.mdbgo.io/recent-images?limit=3'); // Adjust the API endpoint as needed
  //         const data = response.data;
  //         // setRecentImages(data.images);
  //         return data;
  //       }
  //       else{
  //         console.error('Error fetching recent images:', error);
  //       }
  //     }
  // };
  const fetchNotesContent = async () => {
    try {
      const response = await axios.get(`${apiUrl}/notes-content?visitID=` + sessionStorage.getItem('visitId'),
      {
        headers:{
          Authorization:sessionStorage.getItem('token')
        }
      }); // Adjust the API endpoint as needed
      const data = response.data;
      // setMainImage(data.image);
      sessionStorage.setItem('token', response.headers['new-token'])
      // console.log(data);
      // setAnnotations(data.annotations);
      return data.notes;
    } catch (error) {
      if (error.code === "ECONNREFUSED" || error.code === "ERR_NETWORK" || error.code === "ERR_CONNECTION_TIMED_OUT" || error.code === "ERR_SSL_PROTOCOL_ERROR 200") {
        const response = await axios.get('http://localhost:3000/notes-content?visitID=' + sessionStorage.getItem('visitId')); // Adjust the API endpoint as needed
        const data = response.data;
        sessionStorage.setItem('token', response.headers['new-token'])
        // setMainImage(data.image);
        // setAnnotations(data.annotations);
        return data.notes;
      }
      else {
      if(error.status===403||error.status===401){
        if(sessionStorage.getItem('preLayoutMode')){
          dispatch(changeMode(preLayoutMode));
          sessionStorage.removeItem('preLayoutMode');
        }
        sessionStorage.removeItem('token');
        setRedirectToLogin(true);
        }
        else{
        logErrorToServer(error, "fetchNotesContent");
        console.error('Error fetching most recent image:', error);
        }
      }
    }
  }
  const fetchVisitDateImages = async () => {
    try {
      const response = await axios.get(`${apiUrl}/visitid-images?visitID=` + sessionStorage.getItem('visitId'),
      {
        headers:{
          Authorization:sessionStorage.getItem('token')
        }
      }); // Adjust the API endpoint as needed
      const data = response.data;
      sessionStorage.setItem('token', response.headers['new-token'])
      // setMainImage(data.image);
      // setAnnotations(data.annotations);
      return data.images;
    } catch (error) {
      if (error.code === "ECONNREFUSED" || error.code === "ERR_NETWORK" || error.code === "ERR_CONNECTION_TIMED_OUT" || error.code === "ERR_SSL_PROTOCOL_ERROR 200") {
        const response = await axios.get('http://localhost:3000/visitid-images?visitID=' + sessionStorage.getItem('visitId')); // Adjust the API endpoint as needed
        const data = response.data;
        sessionStorage.setItem('token', response.headers['new-token'])
        // setMainImage(data.image);
        // setAnnotations(data.annotations);
        return data.images;
      }
      else {
        
      if(error.status===403||error.status===401){
        if(sessionStorage.getItem('preLayoutMode')){
          dispatch(changeMode(preLayoutMode));
          sessionStorage.removeItem('preLayoutMode');
        }
        sessionStorage.removeItem('token');
        setRedirectToLogin(true);
        }
        else{
        logErrorToServer(error, "fetchVisitDateImages");
        setMessage("Error fetching Images")
        console.error('Error fetching most recent image:', error);
        }
      }
    }
  };
  const fetchClassCategories = async () => {
    try {
      const response = await axios.get(`${apiUrl}/get-classCategories`,
        {
          headers:{
            Authorization:sessionStorage.getItem('token')
          }
        }); // Adjust the API endpoint as needed
      const data = response.data;
      sessionStorage.setItem('token', response.headers['new-token'])
      let updatedClassCategories = {}
      let updatedLabelColors = {}
      data.forEach(element => {
        if (updatedClassCategories[element.className.toLowerCase()] === undefined) {
          updatedClassCategories[element.className.toLowerCase()] = element.category
        }
        if (updatedLabelColors[element.className.toLowerCase()] === undefined) {
          updatedLabelColors[element.className.toLowerCase()] = element.color
        }
      });
      setLabelColors(updatedLabelColors)
      setClassCategories(updatedClassCategories)
    } catch (error) {
      if (error.code === "ECONNREFUSED" || error.code === "ERR_NETWORK" || error.code === "ERR_CONNECTION_TIMED_OUT" || error.code === "ERR_SSL_PROTOCOL_ERROR 200") {
        const response = await axios.get('http://localhost:3000/get-classCategories'); // Adjust the API endpoint as needed
        const data = response.data;
        sessionStorage.setItem('token', response.headers['new-token'])
        let updatedClassCategories = {}
        let updatedLabelColors = {}
        data.forEach(element => {
          if (updatedClassCategories[element.className] === undefined) {
            updatedClassCategories[element.className] = element.category
          }
          if (updatedLabelColors[element.className] === undefined) {
            updatedLabelColors[element.className.toLowerCase()] = element.color
          }
        });
        setLabelColors(updatedLabelColors)
        setClassCategories(updatedClassCategories)
      }
      else{
        if(error.status===403||error.status===401){
          if(sessionStorage.getItem('preLayoutMode')){
            dispatch(changeMode(preLayoutMode));
            sessionStorage.removeItem('preLayoutMode');
          }
          else{
          logErrorToServer(error, "fetchClassCategories");
          sessionStorage.removeItem('token');
          setRedirectToLogin(true);
          }
      }
      }
    }
  };
  const getBoxDimensions = (vertices) => {
    const xCoords = vertices.map(v => v.x);
    const yCoords = vertices.map(v => v.y);
    const left = Math.min(...xCoords);
    const top = Math.min(...yCoords);
    const width = Math.max(...xCoords) - left;
    const height = Math.max(...yCoords) - top;
    return { left, top, width, height };
  };
  const calculatePolygonArea = (vertices, areaScale) => {
    let area = 0;
    const n = vertices.length;

    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n;
      area += vertices[i].x * vertices[j].y;
      area -= vertices[j].x * vertices[i].y;
    }

    return Math.abs(area / 2) / areaScale;
  };
  const drawAnnotations = (ctx, image, x, y, scale, selectedAnnotation, areaScale) => {
    const fontSize=Math.ceil(12/(1000/image.width));
    // console.log(mainCanvasRef.current.width,image.width)
    if (model === "segmentation") {
      annotations.forEach((anno, index) => {
        if (!hiddenAnnotations.includes(index)) {
          if (selectedAnnotation === null || selectedAnnotation === anno) {
            if (anno.label === 'Line') {
              // Draw line
              ctx.beginPath();
              ctx.moveTo(anno.vertices[0].x * scale, anno.vertices[0].y * scale);
              ctx.lineTo(anno.vertices[1].x * scale, anno.vertices[1].y * scale);
              ctx.strokeStyle = labelColors[anno.label.toLowerCase()] || 'white';
              ctx.lineWidth = 2;
              ctx.stroke();

              // Calculate length
              const dx = (anno.vertices[1].x - anno.vertices[0].x) * scale;
              const dy = (anno.vertices[1].y - anno.vertices[0].y) * scale;
              const length = Math.sqrt(dx * dx + dy * dy) / areaScale;

              // Display length
              const midX = ((anno.vertices[0].x + anno.vertices[1].x) / 2) * scale;
              const midY = ((anno.vertices[0].y + anno.vertices[1].y) / 2) * scale;
              ctx.fillStyle = labelColors[anno.label.toLowerCase()] || 'white';
              ctx.font = `${fontSize}px Arial`;
              if(isArea){
                ctx.fillText(`${length.toFixed(2)} mm`, midX, midY);
              }
            } else {
              if (anno.segmentation) {
                ctx.beginPath();
                ctx.moveTo(anno.segmentation[0].x * scale, anno.segmentation[0].y * scale);

                for (let i = 1; i < anno.segmentation.length; i++) {
                  ctx.lineTo(anno.segmentation[i].x * scale, anno.segmentation[i].y * scale);
                }
                ctx.closePath();
                if (index === hoveredAnnotation) {
                  ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
                  ctx.fill();
                }
                ctx.strokeStyle = labelColors[anno.label.toLowerCase()] || 'white';
                ctx.lineWidth = 2;
                ctx.stroke();
              }
              else if (anno.bounding_box) {
                ctx.beginPath();
                ctx.moveTo(anno.bounding_box[0].x * scale, anno.bounding_box[0].y * scale);
                for (let i = 1; i < anno.bounding_box.length; i++) {
                  ctx.lineTo(anno.bounding_box[i].x * scale, anno.bounding_box[i].y * scale);
                }
                ctx.closePath();
                if (index === hoveredAnnotation) {
                  ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
                  ctx.fill();
                }
                ctx.strokeStyle = labelColors[anno.label.toLowerCase()] || 'white';
                ctx.lineWidth = 2;
                ctx.stroke();
              }
              if (selectedAnnotation !== anno) {
                const { left, top } = getBoxDimensions(anno.segmentation.map(v => ({ x: v.x * scale, y: v.y * scale })));
                const area = calculatePolygonArea(anno.segmentation.map(v => ({ x: v.x * scale, y: v.y * scale })), areaScale).toFixed(2);
                ctx.fillStyle = labelColors[anno.label.toLowerCase()] || 'white';
                let labelText=''
                if(isArea){
                  labelText = `${anno.label} (${area} mm²)`;
                }
                else{
                  labelText = `${anno.label}`;
                }
                ctx.font = `${fontSize}px Arial`;

                // Measure the text width and height
                const textMetrics = ctx.measureText(labelText);
                const textHeight = parseInt(ctx.font, 10); // Get the font size as height
                ctx.fillRect(left, top - 28 - textHeight, textMetrics.width + 10, textHeight + 10); // Draw background

                ctx.fillStyle = 'black'; // Set text color
                ctx.fillText(labelText, left + 5, top - 25);
              }
            }
          }
        }
      })
    }
    else {
      annotations.forEach((anno, index) => {
        if (!hiddenAnnotations.includes(index)) {
          if (anno.label === 'Line') {
            // Draw line
            ctx.beginPath();
            ctx.moveTo(anno.vertices[0].x * scale, anno.vertices[0].y * scale);
            ctx.lineTo(anno.vertices[1].x * scale, anno.vertices[1].y * scale);
            ctx.strokeStyle = labelColors[anno.label.toLowerCase()] || 'white';
            ctx.lineWidth = 2;
            ctx.stroke();

            // Calculate length
            const dx = (anno.vertices[1].x - anno.vertices[0].x) * scale;
            const dy = (anno.vertices[1].y - anno.vertices[0].y) * scale;
            const length = Math.sqrt(dx * dx + dy * dy) / areaScale;

            // Display length
            const midX = ((anno.vertices[0].x + anno.vertices[1].x) / 2) * scale;
            const midY = ((anno.vertices[0].y + anno.vertices[1].y) / 2) * scale;
            ctx.fillStyle = labelColors[anno.label.toLowerCase()] || 'white';
            ctx.font = `${fontSize}px Arial`;
            if(isArea){
              ctx.fillText(`${length.toFixed(2)} mm`, midX, midY);
            }
          } else {
            const { left, top } = getBoxDimensions(anno.vertices.map(v => ({ x: v.x * scale, y: v.y * scale })));

            ctx.beginPath();
            ctx.moveTo(anno.vertices[0].x * scale, anno.vertices[0].y * scale);

            for (let i = 1; i < anno.vertices.length; i++) {
              ctx.lineTo(anno.vertices[i].x * scale, anno.vertices[i].y * scale);
            }
            ctx.closePath();
            if (index === hoveredAnnotation) {
              ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
              ctx.fill();
            }
            ctx.strokeStyle = labelColors[anno.label.toLowerCase()] || 'white';
            ctx.lineWidth = 2;
            ctx.stroke();
            if (selectedAnnotation !== anno) {
              const area = calculatePolygonArea(anno.vertices.map(v => ({ x: v.x * scale, y: v.y * scale })), areaScale).toFixed(2);
              ctx.fillStyle = labelColors[anno.label.toLowerCase()] || 'white';
              let labelText=''
                if(isArea){
                  labelText = `${anno.label} (${area} mm²)`;
                }
                else{
                  labelText = `${anno.label}`;
                }
                ctx.font = `${fontSize}px Arial`;

                // Measure the text width and height
                const textMetrics = ctx.measureText(labelText);
                const textHeight = parseInt(ctx.font, 10); // Get the font size as height
                ctx.fillRect(left, top - 28 - textHeight, textMetrics.width + 10, textHeight + 10); // Draw background

                ctx.fillStyle = 'black'; // Set text color
                ctx.fillText(labelText, left + 5, top - 25);
            }
          }
        }
      })
    }
  };
  //   const isPointInImage = (point) => {
  //     return point[0] >= 0 && point[0] < image.width  && 
  //            point[1] >= 0 && point[1] < image.height;
  // };
  const handleMouseUp = () => {
    if (isEraserActive && isErasing.current) {
      isErasing.current = false;
      handleErase();
      updateHistory();
      setErasePoints([]);
    } else if (selectedAnnotation && !isEraserActive) {
      isDrawingRef.current = false;
      mergeEditingPathWithAnnotation();
    } else if (isDrawingFreehand && isDrawingRef.current) {
      isDrawingRef.current = false;
      completeFreehandDrawing();
    } else if (isHybridDrawingActive) {
      setIsMouseDown(false);
      if (livewirePath.length > 0) {
        setHybridPath(prevPath => [...prevPath, ...livewirePath]);
        setLivewirePath([]);
      }
      if (lastPointRef.current) {
        livewireRef.current.startSearch(lastPointRef.current);
      }
    } else if (isLineDrawingActive && lineStart && lineEnd) {
      const newLine = {
        label: 'Line',
        vertices: [
          { x: lineStart[0], y: lineStart[1] },
          { x: lineEnd[0], y: lineEnd[1] }
        ]
      };
      updateAnnotationsWithHistory([...annotations, newLine]);
      setLineStart(null);
      setLineEnd(null);
      setIsLineDrawingActive(false);
    }
  };
  const handleMouseDown = (e) => {
    const rect = mainCanvasRef.current.getBoundingClientRect(); // Get the canvas bounds
    const zoomScale = zoom / 100;
    const canvas = mainCanvasRef.current;
    const tmpX = Math.round((e.clientX - rect.left) * (canvas.width / rect.width));
    const tmpY = Math.round((e.clientY - rect.top) * (canvas.height / rect.height));
    const clickPoint = [
      tmpX,
      tmpY
    ];
    // const context = mainCanvasRef.current.getContext('2d');
    // context.beginPath();
    // context.arc(tmpX, tmpY, 5, 0, Math.PI * 2);
    // context.fill();

    // const clickPoint = [
    //     (e.nativeEvent.clientX) ,
    //     (e.nativeEvent.clientY)
    // ];
    // console.log(clickPoint,isPointInImage(clickPoint))
    // if (!isPointInImage(clickPoint)) {
    //   return;
    // }
    if (isEraserActive && selectedAnnotation) {
      isErasing.current = true;
      setErasePoints([clickPoint]);
    } else if (selectedAnnotation && !isEraserActive) {
      setEditingPath([clickPoint]); // Start a new editing path
      isDrawingRef.current = true;
      setSubtractPath(e.button === 2);
    } else if (isHybridDrawingActive) {
      if (!isDrawingStartedRef.current) {
        startPointRef.current = clickPoint;
        setHybridPath([clickPoint]);
        isDrawingStartedRef.current = true;
      } else {
        const distance = Math.sqrt(
          Math.pow(clickPoint[0] - startPointRef.current[0], 2) +
          Math.pow(clickPoint[1] - startPointRef.current[1], 2)
        );

        if (distance <= SNAP_THRESHOLD && hybridPath.length > 2) {
          completeHybridDrawing();
        } else {
          setHybridPath([...hybridPath, ...livewirePath, clickPoint]);
        }
      }

      setIsMouseDown(true);
      livewireRef.current.startSearch(clickPoint);
      setLivewirePath([]);
      lastPointRef.current = clickPoint;
    } if (isLiveWireTracingActive) {
      if (!isLiveWireTracing) {
        setFixedPoints([clickPoint]);
        setIsLiveWireTracing(true);
      } else {
        let cPath = []
        currentPath.forEach((point, index) => {
          const [px, py] = [point[0], point[1]];
          cPath = [...cPath, [px, py]]
        });
        setFixedPoints([...fixedPoints, ...cPath]);
      }

      livewireRef.current.startSearch(clickPoint);
      setCurrentPath([]);

      if (fixedPoints.length > 0) {
        const firstPoint = fixedPoints[0];
        const distance = Math.sqrt(
          (clickPoint[0] - firstPoint[0]) ** 2 + (clickPoint[1] - firstPoint[1]) ** 2
        );
        if (distance < SNAP_THRESHOLD && fixedPoints.length > 2) {
          completePolygon();
        }
      }
    } else if (isDrawingFreehand) {
      isDrawingRef.current = true;
      setDrawingPaths(prevPaths => [...prevPaths, [clickPoint]]);
    } else if (isLineDrawingActive) {
      setLineStart(clickPoint);
      setLineEnd(clickPoint);
    }
  };

  const handleMouseMove = (e) => {
    e.preventDefault();
    if (isLiveWireTracingActive || isDrawingFreehand || isLineDrawingActive || isHybridDrawingActive || isEraserActive || selectedAnnotation) {
      const rect = mainCanvasRef.current.getBoundingClientRect(); // Get the canvas bounds
      const zoomScale = zoom / 100;
      const canvas = mainCanvasRef.current;
      const tmpX = Math.round((e.clientX - rect.left) * (canvas.width / rect.width));
      const tmpY = Math.round((e.clientY - rect.top) * (canvas.height / rect.height));
      const currentPoint = [
        tmpX, tmpY
      ];
      // if (!isPointInImage(currentPoint)) {
      //   return;
      // }
      if (isEraserActive && isErasing.current && selectedAnnotation) {
        setErasePoints(prevPoints => [...prevPoints, currentPoint]);
        const ctx = mainCanvasRef.current.getContext('2d');
        ctx.beginPath();
        ctx.arc(currentPoint[0], currentPoint[1], eraserSize, 0, 2 * Math.PI);
        ctx.fillStyle = 'rgba(255, 0, 0, 0.3)'; // Adjust the color and opacity as needed
        ctx.fill();
        handleErase();
      } else if (selectedAnnotation && isDrawingRef.current && !isEraserActive) {
        setEditingPath(prevPath => [...prevPath, currentPoint]);
      } else if (isHybridDrawingActive && isDrawingStartedRef.current) {
        if (isMouseDown) {
          setHybridPath(prevPath => [...prevPath, currentPoint]);
          lastPointRef.current = currentPoint;
        } else if (hybridPath.length > 0) {
          const path = livewireRef.current.findPathToPoint(currentPoint);
          setLivewirePath(path);
          drawHybridPath([...hybridPath, ...path]);
        }
      } else if (isLiveWireTracing) {
        const path = livewireRef.current.findPathToPoint(currentPoint);
        setCurrentPath(path);
        drawLivewirePath(mainCanvasRef.current.getContext('2d'));
      } else if (isDrawingFreehand && isDrawingRef.current) {
        setDrawingPaths(prevPaths => {
          const lastPathIndex = prevPaths.length - 1;
          const updatedLastPath = [...prevPaths[lastPathIndex], currentPoint];
          return [...prevPaths.slice(0, lastPathIndex), updatedLastPath];
        });
      } else if (isLineDrawingActive && lineStart) {
        setLineEnd(currentPoint);
      }
    }
  };
  const unZoomVertices = (vertices) => {
    const unzoomedVertices = vertices.map(vertex => ({
      x: vertex.x / (zoom / 100),
      y: vertex.y / (zoom / 100)
    }));
    return (unzoomedVertices)
  }
  const handleErase = () => {
    if (isEraserActive && selectedAnnotation) {
      // console.log(erasePoints)
      let updatedVertices = []
      let updatedAnnotation = {}
      const date = new Date().toISOString()
      if (selectedAnnotation.segmentation) {
        updatedVertices = selectedAnnotation.segmentation.filter(vertex => {
          return !erasePoints.some(erasePoint => {
            const dx = vertex.x - erasePoint[0];
            const dy = vertex.y - erasePoint[1];
            const distance = Math.sqrt(dx * dx + dy * dy);
            return distance <= eraserSize;
          });
        });
        updatedAnnotation = { ...selectedAnnotation, segmentation: updatedVertices, created_by:`${sessionStorage.getItem('firstName')} ${sessionStorage.getItem('lastName')}`, created_on:date };
      }
      else if (selectedAnnotation.bounding_box) {
        updatedVertices = selectedAnnotation.bounding_box.filter(vertex => {
          return !erasePoints.some(erasePoint => {
            const dx = vertex.x - erasePoint[0];
            const dy = vertex.y - erasePoint[1];
            const distance = Math.sqrt(dx * dx + dy * dy);
            return distance <= eraserSize;
          });
        });
        updatedAnnotation = { ...selectedAnnotation, bounding_box: updatedVertices, created_by:`${sessionStorage.getItem('firstName')} ${sessionStorage.getItem('lastName')}`, created_on:date };
      }
      else if (selectedAnnotation.vertices) {
        updatedVertices = selectedAnnotation.vertices.filter(vertex => {
          return !erasePoints.some(erasePoint => {
            const dx = vertex.x - erasePoint[0];
            const dy = vertex.y - erasePoint[1];
            const distance = Math.sqrt(dx * dx + dy * dy);
            return distance <= eraserSize;
          });
        });
        updatedAnnotation = { ...selectedAnnotation, vertices: updatedVertices, created_by:`${sessionStorage.getItem('firstName')} ${sessionStorage.getItem('lastName')}`, created_on:date };
      }
      const newAnnotations = annotations.map(anno =>
        anno === selectedAnnotation ? updatedAnnotation : anno
      );
      setAnnotations(newAnnotations);
      saveAnnotations(newAnnotations);
      let updatedSmallCanvasData = smallCanvasData
      updatedSmallCanvasData[mainImageIndex].annotations.annotations.annotations = newAnnotations
      setSmallCanvasData(updatedSmallCanvasData)
      setSelectedAnnotation(updatedAnnotation);
    }
  };
  const handleTraceClick = () => {
    setIsClassCategoryVisible(!isClassCategoryVisible); // Show the class category selection
  };
  const handleCategorySelect = (category) => {
    setSelectedClassCategory(category); // Set the selected category
    setIsClassCategoryVisible(false); // Hide the category list
    setNewBoxLabel(category);
    startHybridTracing(); // Start hybrid tracing
  };    
  const mergeEditingPathWithAnnotation = () => {
    if (editingPath.length > 1 && selectedAnnotation) {
      const editingPathVertices = editingPath.map(point => ({ x: point[0], y: point[1] }));
      let newPath;
      let updatedAnnotation = {}
      const date=new Date().toISOString()
      if (selectedAnnotation.segmentation) {
        if (!subtractPath) {
          newPath = modifyPath(selectedAnnotation.segmentation, editingPathVertices, false);
        }
        else {
          newPath = modifyPath(selectedAnnotation.segmentation, editingPathVertices, true);
        }
        updatedAnnotation = { ...selectedAnnotation, segmentation: newPath, created_by:`${sessionStorage.getItem('firstName')} ${sessionStorage.getItem('lastName')}`, created_on:date };
      }
      else if (selectedAnnotation.bounding_box) {
        if (!subtractPath) {
          newPath = modifyPath(selectedAnnotation.bounding_box, editingPathVertices, false);
        }
        else {
          newPath = modifyPath(selectedAnnotation.bounding_box, editingPathVertices, true);
        }
        updatedAnnotation = { ...selectedAnnotation, bounding_box: newPath, created_by:`${sessionStorage.getItem('firstName')} ${sessionStorage.getItem('lastName')}`, created_on:date };
      }
      else {
        if (!subtractPath) {
          newPath = modifyPath(selectedAnnotation.vertices, editingPathVertices, false);
        }
        else {
          newPath = modifyPath(selectedAnnotation.vertices, editingPathVertices, true);
        }
        updatedAnnotation = { ...selectedAnnotation, vertices: newPath, created_by:`${sessionStorage.getItem('firstName')} ${sessionStorage.getItem('lastName')}`, created_on:date };
      }
      const newAnnotations = annotations.map(anno =>
        anno === selectedAnnotation ? updatedAnnotation : anno
      );
      updateAnnotationsWithHistory(newAnnotations);
      saveAnnotations(newAnnotations);
      let updatedSmallCanvasData = smallCanvasData
      updatedSmallCanvasData[mainImageIndex].annotations.annotations.annotations = newAnnotations
      setSmallCanvasData(updatedSmallCanvasData)
      setEditingPath([]);
      // console.log(newAnnotations)
      setSelectedAnnotation(null);
    }
  };
  const completeFreehandDrawing = () => {
    const lastPath = drawingPaths[drawingPaths.length - 1];
    if (lastPath && lastPath.length > 2) {
      const vertices = lastPath.map(point => ({ x: point[0], y: point[1] }));
      setNewBoxVertices(unZoomVertices(vertices));
      setShowDialog(true);
      setDrawingPaths([]);
      setIsDrawingFreehand(false);
    }
  };
  const completeHybridDrawing = () => {
    const vertices = hybridPath.map(point => ({ x: point[0], y: point[1] }));
    setNewBoxVertices(unZoomVertices(vertices));
    // setShowDialog(true);
    setIsHybridDrawing(false);
    setHybridPath([]);
    setLivewirePath([]);
    startPointRef.current = null;
    isDrawingStartedRef.current = false;
    handleAddBox(vertices);
  };
  const completePolygon = () => {
    setIsLiveWireTracing(false);
    const zoomScale = zoom / 100;
    const vertices = [...fixedPoints, ...currentPath].map(point => ({
      x: point[0],
      y: point[1]
    }));
    setNewBoxVertices(unZoomVertices(vertices));
    setShowDialog(true);
    setIsLiveWireTracingActive(false);
    setFixedPoints([]);
    setCurrentPath([]);
  };
  const drawEditingPath = (ctx) => {
    ctx.beginPath();
    ctx.moveTo(editingPath[0][0], editingPath[0][1]);
    for (let i = 1; i < editingPath.length; i++) {
      ctx.lineTo(editingPath[i][0], editingPath[i][1]);
    }
    ctx.strokeStyle = 'blue';
    ctx.lineWidth = 2;
    ctx.stroke();
  };
  const drawHybridPath = (path) => {
    const ctx = mainCanvasRef.current.getContext('2d');
    if (path.length > 0) {
      ctx.beginPath();
      ctx.moveTo(path[0][0], path[0][1]);
      for (let i = 1; i < path.length; i++) {
        ctx.lineTo(path[i][0], path[i][1]);
      }
      ctx.strokeStyle = 'purple';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Draw start point
      // if (startPointRef.current) {
      //   ctx.beginPath();
      //   ctx.arc(startPointRef.current[0] + x, startPointRef.current[1] + y, SNAP_THRESHOLD, 0, 2 * Math.PI);
      //   ctx.fillStyle = 'rgba(255, 0, 0, 0.5)';
      //   ctx.fill();
      // }
    }
  };
  const drawLinePath = (ctx) => {
    if (lineStart && lineEnd) {
      ctx.beginPath();
      ctx.moveTo(lineStart[0], lineStart[1]);
      ctx.lineTo(lineEnd[0], lineEnd[1]);
      ctx.strokeStyle = 'blue';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Calculate and display length
      const dx = lineEnd[0] - lineStart[0];
      const dy = lineEnd[1] - lineStart[1];
      const length = Math.sqrt(dx * dx + dy * dy) / areaScale;
      const midX = (lineStart[0] + lineEnd[0]) / 2;
      const midY = (lineStart[1] + lineEnd[1]) / 2;
      ctx.fillStyle = 'blue';
      ctx.font = '12px Arial';
      ctx.fillText(`${length.toFixed(2)} mm`, midX, midY);
    }
  }
  const drawFreehandPath = (ctx) => {
    ctx.beginPath();
    drawingPaths.forEach(path => {
      if (path.length > 0) {
        ctx.moveTo(path[0][0], path[0][1]); // Adjusted for x, y
        for (let i = 1; i < path.length; i++) {
          ctx.lineTo(path[i][0], path[i][1]); // Adjusted for x, y
        }
      }
    });
    ctx.strokeStyle = 'blue';
    ctx.lineWidth = 2;
    ctx.stroke();
  };
  const drawLivewirePath = (ctx) => {
    const zoomScale = zoom / 100;
    const rect = mainCanvasRef.current.getBoundingClientRect()
    if (currentPath.length > 0 || fixedPoints.length > 1) {
      ctx.beginPath();
      fixedPoints.forEach((point, index) => {
        const [px, py] = [point[0], point[1]];
        if (index === 0) {
          ctx.moveTo(px, py);
        } else {
          ctx.lineTo(px, py);
        }
      });
      currentPath.forEach(point => {
        const [px, py] = [point[0], point[1]];
        ctx.lineTo(px, py);
      });
      ctx.strokeStyle = 'red';
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  };

  const drawImageOnCanvas = (canvas, imageSrc, type) => {
    const ctx = canvas.getContext("2d");
    const img = new Image();
    img.src = imageSrc;
    img.onload = () => {
      // Set canvas size to the original image size
      const originalWidth = img.width;
      const originalHeight = img.height;
      canvas.width = originalWidth;
      canvas.height = originalHeight;

      // Clear the canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      if (isNegative) {
        ctx.filter = `brightness(${brightness}%) contrast(${contrast}%) invert(100%)`;
      }
      else {
        ctx.filter = `brightness(${brightness}%) contrast(${contrast}%)`
      }
      // Draw the image at its original size
      ctx.drawImage(img, 0, 0, originalWidth, originalHeight);
      // Now scale the canvas to fit the container or apply zoom
      const containerWidth = canvas.parentElement.clientWidth;
      const containerHeight = canvas.parentElement.clientHeight;
      let canvasWidth, canvasHeight;
      if (type === "main") {
        drawAnnotations(ctx, img, 0, 0, 1, selectedAnnotation, areaScale);
        // if (containerWidth / containerHeight > aspectRatio) {
        //     // Container is wider than the image
        //     canvasWidth = containerHeight * aspectRatio;
        //     canvasHeight = containerHeight;
        // } else {
        //     // Container is taller than the image
        //     canvasWidth = containerWidth;
        //     canvasHeight = containerWidth / aspectRatio;
        // }
        setImage(img);
        canvasWidth = containerWidth;
        canvasHeight = containerHeight;
        // Apply zoom to the calculated size
        canvasWidth *= (zoom / 100);
        canvasHeight *= (zoom / 100);
        CANVAS_HEIGHT = canvasHeight;
        CANVAS_WIDTH = canvasWidth;
        setX((CANVAS_WIDTH / 2) - (img.width / 2));
        setY((CANVAS_HEIGHT / 2) - (img.height / 2));
        // console.log(x, y, (canvasWidth / 2) - (img.width / 2), (canvasHeight / 2) - (img.height / 2))
        // Use CSS or context scaling to resize the entire canvas
        canvas.style.width = `${canvasWidth}px`;
        canvas.style.height = `${canvasHeight}px`;

      } else {
        // For other types, just scale the canvas to fit the container
        canvas.style.width = `${containerWidth}px`;
        canvas.style.height = `${containerHeight}px`;
      }
    };
  };
  useEffect(() => {
    if (image && isLiveWireTracingActive) {
      const ctx = mainCanvasRef.current.getContext('2d');
      // console.log(x, y, image.width, image.height)
      const imageData = ctx.getImageData(x, y, image.width, image.height);
      livewireRef.current = LivewireScissors.createInstanceFromRawPixelData(
        new Float32Array(imageData.data),
        image.width,
        image.height,
        { lower: 0, upper: 255 }
      );
    }
  }, [image, isLiveWireTracingActive]);
  const loadImages = async () => {
    try{
      const imagesData = await fetchVisitDateImages();
      const visitNotes = await fetchNotesContent();
      setNotesContent(visitNotes)
      setIsNotesOpen(false);
      let mainImageData = [];
      // let recentImagesData = [];
      if (imagesData && imagesData.length > 0) {
        mainImageData = imagesData[0];
        // recentImagesData = imagesData.slice(1);
        setAnnotations(mainImageData.annotations.annotations.annotations);
      // Initialize smallCanvasRefs with dynamic refs based on the number of images
      const refsArray = imagesData.map(() => React.createRef());
      setSmallCanvasRefs(refsArray);
      
      // Draw the main image on the large canvas
      if (mainImageData && mainCanvasRef.current) {
        // console.log(mainImageData)
        setModel(mainImageData.annotations.annotations.model)
        drawImageOnCanvas(mainCanvasRef.current, mainImageData.image, "main");
        setHistory([mainImageData.annotations.annotations.annotations])
      }

      // Draw the thumbnails on small canvases after refs are initialized
      refsArray.forEach((ref, index) => {
        if (ref.current) {
          drawImageOnCanvas(ref.current, imagesData[index].image, null, "small");
        }
      });
      setSmallCanvasData(imagesData);
      setMainCanvasData(mainImageData);
    }
    else if(imagesData){
      setMessage("There are no images for this visit.")
    }
    }
    catch(error){
        logErrorToServer(error, "loadImages");
      console.log(error);
        setMessage("Unable to load this visit images. Pls contact admin.")
    }
  };

  useEffect(() => {
    try{
      setFirstVisit(sessionStorage.getItem('first') === 'true' ? true : false)
      setLastVisit(sessionStorage.getItem('last') === 'true' ? true : false)
      loadImages();
      fetchClassCategories();
      if(!sessionStorage.getItem('preLayoutMode')){
        setPreLayoutMode(mode);
        sessionStorage.setItem('preLayoutMode', mode);
      }
      dispatch(changeMode('dark'));
      setFullName(sessionStorage.getItem('patientName'));
    }
    catch(error){
        logErrorToServer(error, "firstUseEffect");
      console.log(error);
      setMessage("Unable to load this visit images. Pls contact admin")
    }
  }, []);
  // useEffect(() => { 
  //   const handleNavigationAway = () => {
  //     console.log("Exited through button")
  //     dispatch(changeMode(preLayoutMode));
  //     sessionStorage.removeItem('preLayoutMode');
  //   };

  //   // Listen for back/forward navigation
  //   window.addEventListener('popstate', handleNavigationAway);
  //   window.addEventListener('pagehide', handleNavigationAway);

  //   return () => {
  //     window.removeEventListener('popstate', handleNavigationAway);
  //     window.removeEventListener('pagehide', handleNavigationAway);
  //   };
  // }, []);
  useEffect(() => {
    // Draw the main image on the large canvas
    if (mainCanvasRef.current && mainCanvasData) {
      drawImageOnCanvas(mainCanvasRef.current, mainCanvasData.image, "main");
    }
    // Draw images on smaller canvases
    smallCanvasRefs.forEach((ref, index) => {
      if (ref.current && smallCanvasData.length !== 0 && smallCanvasData[index]) {
        drawImageOnCanvas(ref.current, smallCanvasData[index].image, null, "small");
      }
    });
  }, [zoom, brightness, contrast, areaScale, hiddenAnnotations, annotations, hoveredAnnotation, editingMode, isNegative, selectedAnnotation, isArea]);
  useEffect(() => {
    if (image) {
      const canvas = mainCanvasRef.current;
      const ctx = canvas.getContext('2d');
      const zoomScale = zoom / 100;

      // ctx.clearRect(0, 0, image.width, image.height);
      // ctx.save();
      // ctx.scale(zoomScale, zoomScale);
      // ctx.filter = `brightness(${brightness}%) contrast(${contrast}%)`;
      // ctx.drawImage(image, 0, 0, image.width, image.height);
      // // Reset the filter for annotations
      // ctx.filter = 'none';
      // ctx.restore();
      if (isLiveWireTracingActive) {
        ctx.clearRect(0, 0, image.width, image.height);
        ctx.save();
        ctx.scale(zoomScale, zoomScale);
        ctx.filter = `brightness(${brightness}%) contrast(${contrast}%)`;
        ctx.drawImage(image, 0, 0, image.width, image.height);
        // Reset the filter for annotations
        ctx.filter = 'none';
        ctx.restore();
        drawLivewirePath(ctx);
      }
      if (isDrawingFreehand) {
        drawFreehandPath(ctx);
      }
      if (isLineDrawingActive) {
        ctx.clearRect(0, 0, image.width, image.height);
        ctx.save();
        ctx.scale(zoomScale, zoomScale);
        ctx.filter = `brightness(${brightness}%) contrast(${contrast}%)`;
        ctx.drawImage(image, 0, 0, image.width, image.height);
        // Reset the filter for annotations
        ctx.filter = 'none';
        ctx.restore();
        drawLinePath(ctx);
      }
      if (isHybridDrawingActive) {
        ctx.clearRect(0, 0, image.width, image.height);
        ctx.save();
        ctx.scale(zoomScale, zoomScale);
        ctx.filter = `brightness(${brightness}%) contrast(${contrast}%)`;
        ctx.drawImage(image, 0, 0, image.width, image.height);
        // Reset the filter for annotations
        ctx.filter = 'none';
        ctx.restore();
        drawHybridPath([...hybridPath, ...livewirePath]);
      }
      if (selectedAnnotation && editingPath.length > 0 && !isEraserActive) {
        drawEditingPath(ctx);
        drawAnnotations(mainCanvasRef.current.getContext("2d"), image, 0, 0, 1, selectedAnnotation, areaScale);
      }
      if (isEraserActive || selectedAnnotation) {
        drawAnnotations(mainCanvasRef.current.getContext("2d"), image, 0, 0, 1, selectedAnnotation, areaScale);
      }
    }
  }, [isLiveWireTracingActive, fixedPoints, currentPath, lineEnd, lineStart, isDrawingFreehand, isLineDrawingActive, drawingPaths,
    isHybridDrawingActive, livewirePath, hybridPath, lastPointRef, startPointRef, isDrawingRef, drawingPaths, editingPath, erasePoints, selectedAnnotation]);

  useEffect(() => {
    if (!isHybridDrawingActive) {
      setHybridPath([]);
      setLivewirePath([]);
      startPointRef.current = null;
      isDrawingStartedRef.current = false;
    }
    if (!isLiveWireTracingActive) {
      setFixedPoints([]);
      setCurrentPath([]);
      setIsLiveWireTracing(false);
    }
  }, [isHybridDrawingActive, isLiveWireTracingActive]);
  useEffect(() => {
    if (image && isHybridDrawingActive) {
      const ctx = mainCanvasRef.current.getContext('2d');
      const imageData = ctx.getImageData(x, y, image.width, image.height);
      livewireRef.current = LivewireScissors.createInstanceFromRawPixelData(
        new Float32Array(imageData.data),
        image.width,
        image.height,
        { lower: 0, upper: 255 }
      );
    }
  }, [image, isHybridDrawingActive]);
  useEffect(() => {
    const handleWheel = (e) => {
      e.preventDefault();
      // Adjust zoom level based on the wheel scroll direction
      let newZoom = zoom + (e.deltaY < 0 ? 2 : -2);
      newZoom = Math.max(1, Math.min(newZoom, 200));
      setZoom(newZoom);
    };

    // Attach wheel event listener to the main canvas
    const canvas = mainCanvasRef.current;
    if (canvas) {
      canvas.addEventListener('wheel', handleWheel);
    }

    // Cleanup the event listener on unmount
    return () => {
      if (canvas) {
        canvas.removeEventListener('wheel', handleWheel);
      }
    };
  }, [zoom, mainCanvasRef]);
  useEffect(() => {
    if (isNotesOpen) {
      // Start the 5-second auto-save interval when notes are open
      const intervalId = setInterval(() => {
        saveNotes(notesContent); // Save notes every 30 seconds
      }, 30000); // 30000 ms = 30 seconds

      setAutoSaveInterval(intervalId);
    } else {
      // Clear the interval when notes are closed
      if (autoSaveInterval) {
        clearInterval(autoSaveInterval);
      }
    }

    // Clear the interval when the component unmounts
    return () => {
      if (autoSaveInterval) {
        clearInterval(autoSaveInterval);
      }
    };
  }, [isNotesOpen]);
  // useEffect(()=>{
  //   saveAnnotations();
  // },[annotations])
  const eraserSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="${eraserSize}" height="${eraserSize}" fill="white" class="bi bi-eraser-fill" viewBox="0 0 ${eraserSize} ${eraserSize}">
    <path transform="scale(${eraserSize / 16})" d="M8.086 2.207a2 2 0 0 1 2.828 0l3.879 3.879a2 2 0 0 1 0 2.828l-5.5 5.5A2 2 0 0 1 7.879 15H5.12a2 2 0 0 1-1.414-.586l-2.5-2.5a2 2 0 0 1 0-2.828zm.66 11.34L3.453 8.254 1.914 9.793a1 1 0 0 0 0 1.414l2.5 2.5a1 1 0 0 0 .707.293H7.88a1 1 0 0 0 .707-.293z"/>
    </svg>`;

  const eraserCursor = `url("data:image/svg+xml,${encodeURIComponent(eraserSvg)}") ${eraserSize / 2} ${eraserSize / 2}, auto`;
  const handleEraserClick = () => {
    setIsEraserActive(!isEraserActive);
  };
  const handleZoomChange = (event) => {
    setZoom(Number(event.target.value));
  };

  const handleBrightnessChange = (event) => {
    setBrightness(Number(event.target.value));
  };

  const handleContrastChange = (event) => {
    setContrast(Number(event.target.value));
  };
  const updateHistory = () => {
    setHistory(prevHistory => [...prevHistory.slice(0, currentStep + 1), annotations]);
    setCurrentStep(prevStep => Math.min(prevStep + 1, MAX_HISTORY - 1));
  };
  const undo = () => {
    if (currentStep > 0) {
      // console.log(history, currentStep)
      setAnnotations(history[currentStep - 1]);
      setCurrentStep(currentStep - 1);
      // console.log(currentStep)
    }
  };

  const redo = () => {
    if (currentStep < history.length - 1) {
      setAnnotations(history[currentStep + 1]);
      setCurrentStep(currentStep + 1);
    }
  };
  const deleteBox = (id) => {
    updateAnnotationsWithHistory(annotations.filter((_, index) => index !== id));
    setShowDialog(false);
    setIsDrawingActive(false);
    saveAnnotations(annotations.filter((_, index) => index !== id));
    let updatedSmallCanvasData = smallCanvasData
    updatedSmallCanvasData[mainImageIndex].annotations.annotations.annotations = annotations.filter((_, index) => index !== id)
    // console.log(updatedSmallCanvasData)
    setSmallCanvasData(updatedSmallCanvasData)
  };

  const updateAnnotationsWithHistory = (newAnnotations) => {
    setAnnotations(newAnnotations);
    setHistory([...history.slice(0, currentStep + 1), newAnnotations]);
    setCurrentStep(Math.min(currentStep + 1, MAX_HISTORY - 1));
    // console.log(history, currentStep)
  };
  const saveNotes = async (notesContent) => {
    if (notesContent !== oldNotesContent) {
      try {
        const response = await axios.put(`${apiUrl}/save-notes`, {
          visitID: sessionStorage.getItem('visitId'),
          notes: notesContent  // Send notes in the body instead of query string
        },
      {
        headers:{
          Authorization:sessionStorage.getItem('token')
        }
      });
        const data = response.data;
        sessionStorage.setItem('token', response.headers['new-token'])
        setOldNotesContent(notesContent);
        return data.notes;
      } catch (error) {
        // Fallback logic if connection fails
        if (["ECONNREFUSED", "ERR_NETWORK", "ERR_CONNECTION_TIMED_OUT", "ERR_SSL_PROTOCOL_ERROR"].includes(error.code)) {
          const response = await axios.get('http://localhost:3000/save-notes', {
            params: {
              visitID: sessionStorage.getItem('visitId'),
              notes: notesContent
            }
          });
          const data = response.data;
          sessionStorage.setItem('token', response.headers['new-token'])
          setOldNotesContent(notesContent);
          return data.notes;
        } else {
            if(error.status===403||error.status===401){
              if(sessionStorage.getItem('preLayoutMode')){
                dispatch(changeMode(preLayoutMode));
                sessionStorage.removeItem('preLayoutMode');
              }
              sessionStorage.removeItem('token');
              setRedirectToLogin(true);
          }
        else{
          logErrorToServer(error, "saveNotes");
          console.error('Error saving notes:', error);
        }
        }
      }
    }
  };

  const saveAnnotations = async (newAnnotations) => {
    try {
      const scaledResponse = {
        annotations: {
          model: model,
          status: "OPEN",
          annotations: newAnnotations
        },
        status: "OPEN"
      }
      const filePath = smallCanvasData[mainImageIndex].name.split('.').slice(0, -1).join('.') + '.json';
      const response = await axios.put(`${apiUrl}/save-annotations`,
        {
          patientId: sessionStorage.getItem('patientId'),
          visitId: sessionStorage.getItem('visitId'),
          scaledResponse: scaledResponse,
          imageNumber: (mainImageIndex + 1),
          annotationPath: filePath
        },
        {
          headers:{
            Authorization:sessionStorage.getItem('token')
          }
        }
      );
      const data = response.data;
      sessionStorage.setItem('token', response.headers['new-token'])
      return data;
    } catch (error) {
      if (error.code === "ECONNREFUSED" || error.code === "ERR_NETWORK" || error.code === "ERR_CONNECTION_TIMED_OUT" || error.code === "ERR_SSL_PROTOCOL_ERROR 200") {
        const scaledResponse = {
          annotations: {
            model: model,
            status: "OPEN",
            annotations: newAnnotations
          },
          status: "OPEN"
        }
        const response = await axios.put(`http://localhost:3000/save-annotations`,
          {
            patientId: sessionStorage.getItem('patientId'),
            visitId: sessionStorage.getItem('visitId'),
            scaledResponse: scaledResponse,
            imageNumber: (mainImageIndex + 1)
          }
        );
        const data = response.data;
        sessionStorage.setItem('token', response.headers['new-token'])
        return data;
      }
      else {
          if(error.status===403||error.status===401){
            if(sessionStorage.getItem('preLayoutMode')){
              dispatch(changeMode(preLayoutMode));
              sessionStorage.removeItem('preLayoutMode');
            }
            sessionStorage.removeItem('token');
            setRedirectToLogin(true);
        }
      else{
        logErrorToServer(error, "saveAnnotations");
        console.error('Error saving annotations:', error);
      }
      }
    }
  }
  const handleNotesClick = () => {
    if (!isNotesOpen) {
      setIsNotesOpen(true);
    }
    else {
      saveNotes(notesContent);
      setIsNotesOpen(false);
    }
  }
  const handleNotesChange = (e) => {
    setNotesContent(e.target.value);
    // Clear the previous timeout if the user keeps typing
    if (saveTimeout) {
      clearTimeout(saveTimeout);
    }

    // Set a new timeout to auto-save notes after the delay
    const newTimeout = setTimeout(() => {
      saveNotes(e.target.value);
    }, AUTO_SAVE_DELAY);

    setSaveTimeout(newTimeout);
  };

  const handleAddBox = (newBoxVertices) => {
    console.log(newBoxLabel, newBoxVertices)
      const date=new Date().toISOString()
      let newAnnotation = {}
    if (model === "segmentation") {
      newAnnotation = {
        label: newBoxLabel,
        segmentation: newBoxVertices,
        created_by:`${sessionStorage.getItem('firstName')} ${sessionStorage.getItem('lastName')}`,
        created_on:date,
      };
    }
    else {
      newAnnotation = {
        label: newBoxLabel,
        vertices: newBoxVertices,
        created_by:`${sessionStorage.getItem('firstName')} ${sessionStorage.getItem('lastName')}`,
        created_on:date,
      };
    }
    saveAnnotations([...annotations, newAnnotation])
    let updatedSmallCanvasData = smallCanvasData
    updatedSmallCanvasData[mainImageIndex].annotations.annotations.annotations = [...annotations, newAnnotation]
    // console.log(smallCanvasData[mainImageIndex])
    setSmallCanvasData(updatedSmallCanvasData)
    setShowDialog(false);
    setIsDrawingActive(false);
    setNewBoxLabel('');
    setNewBoxVertices([]);
    setIsLiveWireTracingActive(false);
    updateAnnotationsWithHistory([...annotations, newAnnotation]);
    setIsDrawingFreehand(false);
    setIsHybridDrawing(false);
  };
  const handleCloseDialog = () => {
    setShowDialog(false);
    setDrawingBox(null);
    setIsDrawingActive(false);
    setIsLiveWireTracingActive(false);
    setIsDrawingFreehand(false);
    setNewBoxLabel('');
    setIsHybridDrawing(false);
    setNewBoxVertices([]);
    drawImageOnCanvas(mainCanvasRef.current, mainCanvasData.image, "main");
  };

  const startHybridTracing = () => {
    if (!isHybridDrawingActive) {
      setIsLiveWireTracingActive(false);
      setIsDrawingFreehand(false);
      setIsEraserActive(false);
      setSelectedAnnotation(null);
      setIsHybridDrawing(true);
    } else {
      setIsHybridDrawing(false);
    }
  };

  const startLiveWireTracing = () => {
    if (!isLiveWireTracingActive) {
      setIsLiveWireTracingActive(true);
      setIsDrawingFreehand(false);
      setIsEraserActive(false);
      setSelectedAnnotation(null);
      setIsHybridDrawing(false);
    } else {
      setIsLiveWireTracingActive(false);
    }
  };

  const startFreehandDrawing = () => {
    setSelectedAnnotation(null);
    setIsLiveWireTracingActive(false);
    setIsEraserActive(false);
    setIsHybridDrawing(false);
    setIsDrawingFreehand(true);
  };

  const clearFreehandDrawings = () => {
    setDrawingPaths([]);
    setIsDrawingFreehand(false);
  };
  const handleNextClick = async () => {
    setIsLoading(true)
    setMessage('')
    setMainCanvasData(null)
    setAnnotations([])
    setCurrentStep(0)
    setHistory([])
    setSmallCanvasData([])
    setSmallCanvasRefs([])
    mainCanvasRef.current = null
    setHiddenAnnotations([])
    try {
      const response = await axios.get(`${apiUrl}/next-previousVisit?patientId=` + sessionStorage.getItem('patientId') + '&visitId=' + sessionStorage.getItem('visitId') + '&next=true',
      {
        headers:{
          Authorization:sessionStorage.getItem('token')
        }
      });
      const data = response.data;
      sessionStorage.setItem('token', response.headers['new-token'])
      // setMainImage(data.image);
      // setAnnotations(data.annotations);
      sessionStorage.setItem('visitId', data.visitId._id)
      sessionStorage.setItem('xrayDate', data.visitId.date_of_xray)
      // console.log(data);
      setLastVisit(data.last);
      setMainImageIndex(0);
      setFirstVisit(false);
      sessionStorage.setItem('first', false);
      sessionStorage.setItem('last', data.last)
      setHiddenAnnotations([]);
      loadImages();
    } catch (error) {
      if (error.code === "ECONNREFUSED" || error.code === "ERR_NETWORK" || error.code === "ERR_CONNECTION_TIMED_OUT" || error.code === "ERR_SSL_PROTOCOL_ERROR 200" || error.code === "ERR_BAD_REQUEST") {
        const response = await axios.get('http://localhost:3000/next-previousVisit?patientId=' + sessionStorage.getItem('patientId') + '&visitId=' + sessionStorage.getItem('visitId') + '&next=true');
        const data = response.data;
        // setMainImage(data.image);
        // setAnnotations(data.annotations);
        sessionStorage.setItem('visitId', data.visitId._id)
        sessionStorage.setItem('token', response.headers['new-token'])
        sessionStorage.setItem('xrayDate', data.visitId.date_of_xray)
        // console.log(data);
        setLastVisit(data.last);
        setMainImageIndex(0);
        setFirstVisit(false);
        sessionStorage.setItem('first', false);
        sessionStorage.setItem('last', data.last);
        setHiddenAnnotations([]);
        loadImages();
      }
      else {
          if(error.status===403||error.status===401){
            if(sessionStorage.getItem('preLayoutMode')){
              dispatch(changeMode(preLayoutMode));
              sessionStorage.removeItem('preLayoutMode');
            }
            sessionStorage.removeItem('token');
            setRedirectToLogin(true);
        }
      else{
        logErrorToServer(error, "handleNextClick");
        console.error('Error fetching most recent image:', error);
      }
      }
    }
    setIsLoading(false)
  }
  const handlePreviousClick = async () => {
    setIsLoading(true)
    setMainCanvasData(null)
    setMessage('')
    setCurrentStep(0)
    setHistory([])
    setAnnotations([])
    setSmallCanvasData([])
    setSmallCanvasRefs([])
    mainCanvasRef.current = null
    setHiddenAnnotations([])
    try {
      const response = await axios.get(`${apiUrl}/next-previousVisit?patientId=` + sessionStorage.getItem('patientId') + '&visitId=' + sessionStorage.getItem('visitId') + '&next=false',
      {
        headers:{
          Authorization:sessionStorage.getItem('token')
        }
      });
      const data = response.data;
      // setMainImage(data.image);
      // setAnnotations(data.annotations);
      sessionStorage.setItem('visitId', data.visitId._id)
      sessionStorage.setItem('token', response.headers['new-token'])
      sessionStorage.setItem('xrayDate', data.visitId.date_of_xray)
      // console.log(data);
      setLastVisit(false);
      setMainImageIndex(0);
      setFirstVisit(data.first)
      sessionStorage.setItem('first', data.first);
      sessionStorage.setItem('last', false);
      setHiddenAnnotations([]);
      loadImages();
    } catch (error) {
      if (error.code === "ECONNREFUSED" || error.code === "ERR_NETWORK" || error.code === "ERR_CONNECTION_TIMED_OUT" || error.code === "ERR_SSL_PROTOCOL_ERROR 200" || error.code === "ERR_BAD_REQUEST") {
        const response = await axios.get('http://localhost:3000/next-previousVisit?patientId=' + sessionStorage.getItem('patientId') + '&visitId=' + sessionStorage.getItem('visitId') + '&next=false');
        const data = response.data;
        // setMainImage(data.image);
        // setAnnotations(data.annotations);
        sessionStorage.setItem('visitId', data.visitId._id)
        sessionStorage.setItem('token', response.headers['new-token'])
        sessionStorage.setItem('xrayDate', data.visitId.date_of_xray)
        // console.log(data);
        setLastVisit(false);
        setFirstVisit(data.first);
        sessionStorage.setItem('first', data.first);
        sessionStorage.setItem('last', false);
        setMainImageIndex(0);
        setHiddenAnnotations([]);
        loadImages();
      }
      else {
          if(error.status===403||error.status===401){
            if(sessionStorage.getItem('preLayoutMode')){
              dispatch(changeMode(preLayoutMode));
              sessionStorage.removeItem('preLayoutMode');
            }
            sessionStorage.removeItem('token');
            setRedirectToLogin(true);
        }
        
      else{
        logErrorToServer(error, "handlePreviousClick");
        console.error('Error fetching most recent image:', error);
      }
      }
    }
    setIsLoading(false)
  }
  const DateFormatter = (date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: '2-digit',
      year: 'numeric',
    }).format(date);
  }
  const handleSmallCanvasClick = (index) => {
    // console.log(smallCanvasData)
    // const selectedImageIndex = index % smallCanvasData.length; // Cyclic access
    const selectedImageData = smallCanvasData[index];
    setMainImageIndex(index)
    if (selectedImageData && mainCanvasRef.current) {
      // Update thumbnails to show the next set of images
      // const updatedThumbnails = smallCanvasData.slice(selectedImageIndex + 1).concat(mainCanvasData).concat(
      //   smallCanvasData.slice(0, selectedImageIndex)
      // );
      setModel(selectedImageData.annotations.annotations.model)
      // Display selected image on main canvas
      drawImageOnCanvas(mainCanvasRef.current, selectedImageData.image, "main");
      setMainCanvasData(selectedImageData);
      setAnnotations(selectedImageData.annotations.annotations.annotations);
      setHiddenAnnotations([]);
      setHistory([selectedImageData.annotations.annotations.annotations])
      // // Re-draw the updated thumbnails
      // updatedThumbnails.forEach((image, i) => {
      //     const canvasIndex = i % smallCanvasRefs.length; // Cyclic thumbnails
      //     if (smallCanvasRefs[canvasIndex].current) {
      //         drawImageOnCanvas(smallCanvasRefs[canvasIndex].current, image.image, null, "small");
      //     }
      // });

      // setSmallCanvasData(updatedThumbnails); // Update thumbnail data
    }
  };
  if (exitClick) {
      dispatch(changeMode(preLayoutMode));
      sessionStorage.removeItem('preLayoutMode');
    return <Navigate to="/patientImagesList" />
  }
  if(redirectToLogin){
    return <Navigate to="/login"/>
  }
  if (isLoading) {
    return (
      <Row className="justify-content-center align-items-center" style={{ minHeight: '80vh' }}>
        <Col xs="12" sm="8" md="6" lg="4">
          <Card>
            <CardBody className="text-center">
              <Spinner color="primary" style={{ width: '3rem', height: '3rem' }} />
              <p className="mt-3">Loading Please Wait...</p>
            </CardBody>
          </Card>
        </Col>
      </Row>
    )
  }
  return (
    <React.Fragment>
      <Card style={{ height: '100vh', marginBottom: '0px', paddingBottom: '0px', overflow: 'hidden' }}>
        <CardBody style={{ marginBottom: '0px', paddingBottom: '0px' }}>
          <Container fluid style={{ maxHeight: 'calc(100vh-75px)', overflowY: 'auto', paddingBottom: '-20px' }}>
            <Modal isOpen={showDialog} toggle={() => { setShowDialog(!showDialog) }} centered>
              <ModalHeader toggle={() => { setShowDialog(!showDialog) }}>Select a Label</ModalHeader>
              <ModalBody>
                <FormGroup>
                  <Label for="labelSelect">Label</Label>
                  <Input type="select" id="labelSelect" onChange={(e) => { setNewBoxLabel(e.target.value) }} value={newBoxLabel}>
                    <option value="">Select Label</option>
                    {Object.keys(labelColors).map(label => (
                      label !== "Line" ? <option key={label} value={label} style={{backgroundColor:'none', color:labelColors[label]}}>{label}</option> : null
                    ))}
                  </Input>
                </FormGroup>
              </ModalBody>
              <ModalFooter>
                <Button color="primary" onClick={()=>handleAddBox(newBoxVertices)}>Add Box</Button>
                <Button color="secondary" onClick={handleCloseDialog}>Cancel</Button>
              </ModalFooter>
            </Modal>
            <Row>
              <Col md={9}>
                <Table>
                  {message!==''?<Row>
                    <Col md={4}>
                      <h5>Name :  {fullName}</h5>
                    </Col>
                    <Col md={4}>
                          <h5 style={{ color: 'red', whiteSpace: 'pre-line' }}>
                              {message}
                          </h5>
                        </Col>
                        <Col md={4} style={{
                      display: 'flex',
                      justifyContent: 'flex-end', // Align content to the right
                      alignItems: 'center',
                      height: '100%'}}>
                      <h5>
                        <Button id="btnPreVisit" type="button" color="secondary" onClick={handlePreviousClick} disabled={firstVisit}>
                          <i class="fas fa-backward"></i>
                          <UncontrolledTooltip placement="bottom" target="btnPreVisit">Show Previous Visit</UncontrolledTooltip>
                        </Button>&nbsp;
                        Xray Date : {DateFormatter(new Date(sessionStorage.getItem('xrayDate')))}
                        &nbsp;
                        <Button id="btnNextVisit" type="button" color="secondary" disabled={lastVisit} onClick={handleNextClick}>
                          <i class="fas fa-forward"></i>
                          <UncontrolledTooltip placement="bottom" target="btnNextVisit">Show Next Visit</UncontrolledTooltip>
                        </Button>
                      </h5>

                    </Col>
                  </Row>
                  :
                  <Row>
                    <Col md={6}>
                      <h5 style={{ padding: 0 }}>Name :  {fullName}</h5>
                    </Col>
                    <Col md={6} style={{
                      display: 'flex',
                      justifyContent: 'flex-end', // Align content to the right
                      alignItems: 'center',
                      height: '100%'}}>
                      <h5 style={{ padding: 0 }}>
                        <Button id="btnPreVisit" type="button" color="secondary" onClick={handlePreviousClick} disabled={firstVisit}>
                          <i class="fas fa-backward"></i>
                          <UncontrolledTooltip placement="bottom" target="btnPreVisit">Show Previous Visit</UncontrolledTooltip>
                        </Button>&nbsp;
                        Xray Date : {DateFormatter(new Date(sessionStorage.getItem('xrayDate')))}
                        &nbsp;
                        <Button id="btnNextVisit" type="button" color="secondary" disabled={lastVisit} onClick={handleNextClick}>
                          <i class="fas fa-forward"></i>
                          <UncontrolledTooltip placement="bottom" target="btnNextVisit">Show Next Visit</UncontrolledTooltip>
                        </Button>
                      </h5>

                    </Col>
                  </Row>}
                  <Row>
                    <Col md={1}>
                      <button id="btnExit" onClick={() => { setExitClick(true) }} style={{ background: 'none', border: 'none', padding: '0' }}>
                        <img src={imgExit} alt="Exit" style={{ width: '30px', height: '30px' }} />
                      </button> &nbsp;
                      <UncontrolledTooltip placement="bottom" target="btnExit">Exit</UncontrolledTooltip>

                      <button id="btnTrace" onClick={handleTraceClick} style={{ background: 'none', border: 'none', padding: '0' }}>
                        <img src={isClassCategoryVisible?imgEditActive:imgEdit} alt="Trace" style={{ width: '30px', height: '30px' }} />
                      </button>
                      <UncontrolledTooltip placement="bottom" target="btnTrace">Add New</UncontrolledTooltip>

                    </Col>
                    <Col md={11}>
                      <FormGroup role="group" aria-label="First group" className="d-flex flex-row" style={{ padding: 0, justifyContent: 'center', alignItems: 'flex-start' }}>
                        <Button id="btnScale" type="button" color="secondary"><i id="icnScale" class="fas fa-ruler"></i>
                          <UncontrolledTooltip placement="bottom" target="btnScale">Scale: {areaScale}px to 1mm</UncontrolledTooltip>
                        </Button>

                        <Input
                          type="number"
                          id="area-calculator"
                          min="1"
                          max="200"
                          value={areaScale}
                          onChange={(e) => setAreaScale(e.target.value)}
                          style={{ maxWidth: '60px', marginRight: '5px' }}
                        />
                        <div className="slider-button-container">
                          <FormGroup role="group" className="slider-button d-flex flex-row" aria-label="second group" style={{ paddingTop: 0, background: 'none', marginBottom: 0, paddingBottom: 0 }}>
                            <Dropdown id="ddlZoom" isOpen={zoomDropdownOpen} toggle={() => { setZoomDropdownOpen(!zoomDropdownOpen) }}>
                              <DropdownToggle id="btnZoom" type="button"><i class="fas fa-search"></i></DropdownToggle>
                              <DropdownMenu>
                                {predefinedZooms.map(size => (
                                  <DropdownItem key={size} onClick={() => setZoom(size)}>
                                    {size}%
                                  </DropdownItem>
                                ))}
                              </DropdownMenu>
                            </Dropdown>
                            <Input
                              type="number"
                              min="1"
                              max="200"
                              value={zoom}
                              onChange={handleZoomChange}
                              aria-label="zoom value"
                              style={{ maxWidth: '60px' }}
                            />
                          </FormGroup>
                          <UncontrolledTooltip placement="bottom" target="ddlZoom">Select Zoom %</UncontrolledTooltip>
                          {/* <UncontrolledTooltip placement="bottom" target="btnZoom">Zoom</UncontrolledTooltip> */}
                          <Input
                            type="range"
                            id="zoom-slider"
                            min="1"
                            max="200"
                            value={zoom}
                            onChange={handleZoomChange}
                            style={{ maxWidth: '90%', paddingTop: 0 }}
                            className="slider"
                          />
                        </div>
                        <Button
                          id="zoomIncreaseButton"
                          //color="primary"
                          onClick={() => setZoom(zoom + 10)}
                        // style={{ marginLeft: '10px', }}
                        >
                          +
                        </Button>
                        <UncontrolledTooltip placement="bottom" target="zoomIncreaseButton">Zoom In</UncontrolledTooltip>
                        <Button
                          id="zoomDecreaseButton"
                          //color="primary"
                          onClick={() => setZoom(zoom - 10)}
                        // style={{ marginLeft: '10px', }}
                        >
                          -
                        </Button>
                        <UncontrolledTooltip placement="bottom" target="zoomDecreaseButton">Zoom Out</UncontrolledTooltip>
                        {/* Brightness/Contrast Button */}
                        <Button
                          id="brightnessContrastButton"
                          //color="primary"
                          onClick={() => setBrightnessPopoverOpen(!brightnessPopoverOpen)}
                          style={{ marginRight: '5px', marginLeft: '5px' }}
                        //style={{ marginTop: '-2%', marginLeft: '10px' }}
                        >
                          +/-
                        </Button>
                        <UncontrolledTooltip placement="bottom" target="brightnessContrastButton" >Change Brightness/Contrast</UncontrolledTooltip>
                        {/* Brightness/Contrast Popover */}
                        <Popover
                          placement="bottom"
                          isOpen={brightnessPopoverOpen}
                          target="brightnessContrastButton"
                          toggle={() => setBrightnessPopoverOpen(!brightnessPopoverOpen)}
                          trigger="legacy"
                          modifiers={[
                            {
                              name: 'setStyle', // Custom modifier to add inline styles
                              enabled: true,
                              phase: 'write',
                              fn: ({ state }) => {
                                Object.assign(state.styles.popper, {
                                  minWidth: '300px !important', // Set your desired min-width
                                  maxWidth: '400px !important', // Optional: Set max-width if needed
                                });
                              },
                            },
                          ]}
                        >
                          <PopoverBody style={{ padding: '20px', width: '300px', boxShadow: '0 0 10px rgba(0,0,0,0.1)' }}>
                            {/* Brightness Control */}
                            <FormGroup>
                              {/* Input Group for Contrast */}
                              <InputGroup className="mb-2">
                                {/* Label for Contrast */}
                                <InputGroupText style={{ marginLeft: '-5%', marginRight: '5%' }}>Brightness:</InputGroupText>
                                <Input
                                  type="range"
                                  id="brightness-slider"
                                  min="1"
                                  max="200"
                                  value={brightness}
                                  onChange={handleBrightnessChange}
                                  style={{ maxWidth: '30%', paddingRight: '5%' }}
                                />
                                {/* Input Box for Contrast Value */}
                                <Input
                                  type="number"
                                  min="1"
                                  max="200"
                                  value={brightness}
                                  onChange={handleBrightnessChange}
                                  aria-label="Contrast value"
                                  style={{ maxWidth: '30%', paddingRight: '0' }}
                                />
                                <InputGroupText>%</InputGroupText>
                              </InputGroup>
                            </FormGroup>

                            {/* Contrast Control */}
                            <FormGroup>
                              {/* Input Group for Contrast */}
                              <InputGroup className="mb-2">
                                {/* Label for Contrast */}
                                <InputGroupText style={{ paddingRight: '9%', marginLeft: '-5%', marginRight: '5%' }}>{'Contrast:'}</InputGroupText>
                                <Input
                                  type="range"
                                  id="contrast-slider"
                                  min="1"
                                  max="200"
                                  value={contrast}
                                  onChange={handleContrastChange}
                                  style={{ maxWidth: '30%', paddingRight: '5%' }}
                                />
                                {/* Input Box for Contrast Value */}
                                <Input
                                  type="number"
                                  min="1"
                                  max="200"
                                  value={contrast}
                                  onChange={handleContrastChange}
                                  aria-label="Contrast value"
                                  style={{ maxWidth: '30%', paddingRight: '0' }}
                                />
                                <InputGroupText>%</InputGroupText>
                              </InputGroup>
                            </FormGroup>
                            <FormGroup>
                              <InputGroup className="mb-2">
                                <InputGroupText style={{ marginLeft: '-5%', marginRight: '5%' }}>Negative Image</InputGroupText>
                                <Input
                                  type="switch"
                                  id="negative-toggle"
                                  checked={isNegative}
                                  onChange={(e) => setIsNegative(!isNegative)}
                                  style={{ width: '10%', paddingRight: '0', height: '30px' }}
                                />
                              </InputGroup>
                            </FormGroup>
                          </PopoverBody>
                        </Popover>

                        <Button id="btnUndo" onClick={undo} disabled={currentStep <= 0}>
                          <i id="icnScale" class="fas fa-undo"></i>
                        </Button>
                        <UncontrolledTooltip placement="bottom" target="btnUndo">Undo</UncontrolledTooltip>
                        <Button onClick={redo} id="btnRedo"
                          disabled={currentStep >= history.length - 1} style={{ marginRight: '5px' }}
                        >
                          <i id="icnScale" class="fas fa-redo"></i>
                        </Button>
                          <InputGroupText>Show Area</InputGroupText>
                          <Input
                            type="switch"
                            id="area-toggle"
                            checked={isArea}
                            onChange={(e) => setIsShowArea(!isArea)}
                            style={{ width: '2%', paddingRight: '0', height: '30px' }}
                          />
                        <UncontrolledTooltip placement="bottom" target="btnRedo">Redo</UncontrolledTooltip>
                        {selectedAnnotation && (
                          <Button onClick={handleEraserClick}>
                            <i class="fa fa-eraser" aria-hidden={isEraserActive}></i>
                          </Button>
                        )}
                        {/* Eraser Size Controls */}
                        {isEraserActive && selectedAnnotation && (
                          <FormGroup>
                            <Row style={{ alignContent: 'baseline', alignItems: 'baseline', marginBottom: '-5%' }}>
                              <Col xs={4}>
                                <Label for="eraserSize">Eraser Size</Label>
                              </Col>
                              <Col xs={4}>
                                <Input
                                  type="range"
                                  id="eraserSize"
                                  name="eraserSize"
                                  min="1"
                                  max="50"
                                  value={eraserSize}
                                  onChange={(e) => setEraserSize(Number(e.target.value))}
                                />
                              </Col>
                              <Col xs={4}>
                                <Input
                                  type="number"
                                  min="1"
                                  max="50"
                                  value={eraserSize}
                                  onChange={(e) => setEraserSize(Number(e.target.value))}
                                  style={{ width: '100%' }}
                                />
                              </Col>
                            </Row>
                          </FormGroup>
                        )}
                      </FormGroup>
                    </Col>
                  </Row>
                  <Row style={{ height: 'calc(100vh - 225px)', margin: '0px', paddingBottom: '0px', display: 'flex', flexGrow: 1, overflow: 'hidden', color: '#fff' }}
                  >
                    {isClassCategoryVisible ? (
                      <>
                      <Col md={1} style={{marginLeft:'0px', paddingLeft:'0px'}}>
                      <div style={{ marginTop: '10px', height: 'calc(100vh - 235px)', overflowY:"auto", overflowX:"hidden",marginLeft:'0%', paddingLeft:'0px', zIndex:10 }}>
                        <Table bordered style={{paddingLeft:'0px', marginLeft:'1%'}} >
                          {/* <thead>
                            <tr>
                              <th>Class Name</th>
                              {console.log(classCategories)}
                            </tr>
                          </thead> */}
                          <tbody>
                          {desiredOrder.map((group) => {
                              // Filter classCategories to get items in this group
                              const groupItems = Object.keys(classCategories)
                                .filter(category => 
                                  classCategories[category].toLowerCase() === group.toLowerCase()
                                );
                              
                              // Only render groups that have items
                              if (groupItems.length === 0) return null;
                              
                              return (
                                <>
                                  {/* Group Header */}
                                  <tr>
                                    <td 
                                      colSpan="1" 
                                      style={{
                                        fontWeight: 'bold', 
                                        backgroundColor: '#333', 
                                        color: 'white',
                                        padding: '8px'
                                      }}
                                    >
                                      {group}
                                    </td>
                                  </tr>
                                  {/* Group Items */}
                                  {groupItems.map((category) => {
                                    const safeId = category.replace(/\s+/g, '-').toLowerCase();
                                    
                                    return (
                                      <tr 
                                        key={`row-${safeId}`}
                                        className="category-row"
                                        style={{
                                          color: 'white'
                                        }}
                                      >
                                        <td 
                                          id={`${safeId}-Start`} 
                                          className="category-cell"
                                          style={{
                                            cursor: 'pointer', 
                                            padding: '0px',
                                            color: 'white'
                                          }} 
                                          onMouseEnter={(e) => {
                                            const color = labelColors[category.toLowerCase()] || 'white';
                                            e.target.style.color = color;
                                            e.target.parentElement.style.color = color;
                                          }}
                                          onMouseLeave={(e) => {
                                            e.target.style.color = 'white';
                                            e.target.parentElement.style.color = 'white';
                                          }}
                                          onClick={() => handleCategorySelect(category)}
                                        >
                                          {category}
                                        </td>
                                        <UncontrolledTooltip 
                                          placement="right" 
                                          target={`${safeId}-Start`}
                                        >
                                          Start New
                                        </UncontrolledTooltip>
                                      </tr>
                                    );
                                  })}
                              </>);
                            })}
                          </tbody>
                        </Table>
                      </div>
                      </Col>
                      <Col
                        md={11}
                        className="d-flex flex-column"
                        style={{ maxHeight: '100%' }}
                      >
                        <Card style={{ height: '100%', padding: 0 }}>
                          <CardBody
                            style={{
                              padding: 0,
                              height: '100%',
                              overflow: 'auto',  // Add scrollbars
                              position: 'relative',  // For absolute positioning of canvas                              
                              maxHeight: '600px',
                            }}
                            ref={containerRef}
                          >
                            <canvas
                              ref={mainCanvasRef}
                              style={{
                                cursor: 'default',
                                position: 'absolute',  // Position absolutely within container
                                top: 0,
                                left: 0
                              }}
                              onMouseDown={handleMouseDown}
                              onMouseMove={handleMouseMove}
                              onMouseUp={handleMouseUp}
                            />
                          </CardBody>
                        </Card>
                      </Col></>
                    ):<>
                        <Col md={1} />
                        <Col
                          md={11}
                          className="d-flex flex-column"
                          style={{ maxHeight: '100%' }}
                        >
                          <Card style={{ height: '100%', padding: 0, margin: 0 }}>
                            <CardBody
                              style={{
                                padding: 0,
                                height: '100%',
                                overflow: 'auto',  // Add scrollbars
                                position: 'relative',  // For absolute positioning of canvas
                                maxHeight: '600px',
                              }}
                            >
                              <canvas
                                ref={mainCanvasRef}
                                style={{
                                  cursor: 'default',
                                  position: 'absolute',  // Position absolutely within container
                                  top: 0,
                                  left: 0
                                }}
                                onMouseDown={handleMouseDown}
                                onMouseMove={handleMouseMove}
                                onMouseUp={handleMouseUp}
                              />
                            </CardBody>
                          </Card>
                        </Col>
                      </>}
                    {/* {editingMode ? <>
                      <Col
                        md={1}
                        //className="d-flex flex-column"
                        style={{ marginTop: 12, padding: 0 }}
                      >
                        {/* Control Buttons 
                        <div className="mb-4" style={{ margin: 0, padding: 0 }}>
                          <Button color="primary" className="mb-2 w-100" onClick={startLiveWireTracing}>
                            {!isLiveWireTracingActive ? 'Start LiveWire' : 'Stop LiveWire'}
                          </Button>
                          <Button
                            color="primary"
                            className="mb-2 w-100"
                            onClick={isDrawingFreehand ? clearFreehandDrawings : startFreehandDrawing}
                          >
                            {!isDrawingFreehand ? 'Start Freehand' : 'Stop Freehand'}
                          </Button>
                          <Button
                            color="primary"
                            className="mb-2 w-100"
                            onClick={() => startHybridTracing()}
                          >
                            {isHybridDrawingActive ? 'Stop Hybrid' : 'Start Hybrid'}
                          </Button>
                          <Button
                            color="primary"
                            className="mb-2 w-100"
                            onClick={() => setIsLineDrawingActive(!isLineDrawingActive)}
                          >
                            {isLineDrawingActive ? 'Stop Line' : 'Draw Line'}
                          </Button>
                        </div>
                      </Col>
                      <Col
                        md={11}
                        className="d-flex flex-column"
                        style={{ maxHeight: '100%' }}
                      >
                        <Card style={{ height: '100%', padding: 0 }}>
                          <CardBody
                            style={{
                              padding: 0,
                              height: '100%',
                              overflow: 'auto',  // Add scrollbars
                              position: 'relative',  // For absolute positioning of canvas                              
                              maxHeight: '600px',
                            }}
                            ref={containerRef}
                          >
                            <canvas
                              ref={mainCanvasRef}
                              style={{
                                cursor: 'default',
                                position: 'absolute',  // Position absolutely within container
                                top: 0,
                                left: 0
                              }}
                              onMouseDown={handleMouseDown}
                              onMouseMove={handleMouseMove}
                              onMouseUp={handleMouseUp}
                            />
                          </CardBody>
                        </Card>
                      </Col></>
                      :
                      <>
                        <Col md={1} />
                        <Col
                          md={11}
                          className="d-flex flex-column"
                          style={{ maxHeight: '100%' }}
                        >
                          <Card style={{ height: '100%', padding: 0, margin: 0 }}>
                            <CardBody
                              style={{
                                padding: 0,
                                height: '100%',
                                overflow: 'auto',  // Add scrollbars
                                position: 'relative',  // For absolute positioning of canvas
                                maxHeight: '600px',
                              }}
                            >
                              <canvas
                                ref={mainCanvasRef}
                                style={{
                                  cursor: 'default',
                                  position: 'absolute',  // Position absolutely within container
                                  top: 0,
                                  left: 0
                                }}
                                onMouseDown={handleMouseDown}
                                onMouseMove={handleMouseMove}
                                onMouseUp={handleMouseUp}
                              />
                            </CardBody>
                          </Card>
                        </Col>
                      </>} */}
                  </Row>

                  <Row style={{ overflowX: 'auto', maxWidth: '100%', maxHeight: '15vh', display: 'flex', justifyContent: 'center', alignItems: 'center', textAlign: 'center' }}>
                    {smallCanvasData.map((image, index) => (
                      <Col
                        key={index}
                        md={2}
                        className="d-flex flex-column"
                        style={{ height: '15vh', overflowY: 'hidden', paddingBottom: '10px' }}
                      >
                        <Card style={{ height: '100%' }}>
                          <CardBody style={{ padding: 0, height: '80%' }}>
                            {index === mainImageIndex ? <canvas
                              ref={smallCanvasRefs[index]}
                              width="100%"
                              height="100%"
                              style={{
                                cursor: 'pointer',
                                width: '100%',
                                height: '100%',
                                display: 'block',
                                borderColor: 'yellow',
                                borderWidth: '5px',
                                borderStyle: 'solid',
                              }}
                              onClick={() => handleSmallCanvasClick(index)}
                            />
                              :
                              <canvas
                                ref={smallCanvasRefs[index]}
                                width="100%"
                                height="100%"
                                style={{
                                  cursor: 'pointer',
                                  width: '100%',
                                  height: '100%',
                                  display: 'block',
                                }}
                                onClick={() => handleSmallCanvasClick(index)}
                              />}
                          </CardBody>
                        </Card>
                      </Col>
                    ))}
                  </Row>
                </Table>
              </Col>
              <Col md={3} style={{
                position: 'fixed',
                right: 0,
                top: 0,
                height: '100vh',
                overflowY: 'auto',
                borderLeft: '1px solid #ccc',
                paddingBottom: '0px',
                marginBottom: '0px',
                zIndex: 20,
              }}>
                <div style={{
                  display: 'flex',
                  flexDirection: 'column', // Column layout for the entire page
                  justifyContent: 'space-between', // Ensure bottom alignment
                  height: '100vh' // Full viewport height
                }}>
                  <Row style={{ height: '100%' }}>
                    <Col>
                      {/* AnnotationList with conditional height */}
                      <div style={{ height: isNotesOpen ? '50%' : '100%', overflowY: 'auto' }}>
                        <AnnotationList
                          annotations={annotations}
                          hiddenAnnotations={hiddenAnnotations}
                          setHiddenAnnotations={setHiddenAnnotations}
                          deleteBox={deleteBox}
                          setHoveredAnnotation={setHoveredAnnotation}
                          setSelectedAnnotation={setSelectedAnnotation}
                          selectedAnnotation={selectedAnnotation}
                          classCategories={classCategories}
                          setIsEraserActive={setIsEraserActive}
                        />
                      </div>

                      {/* Notes Input with conditional rendering and height */}
                      {isNotesOpen && (
                        <div style={{ height: '50%', marginTop: '10px' }}>
                          <Input
                            type="textarea"
                            value={notesContent}
                            onChange={(e) => handleNotesChange(e)}
                            style={{ width: '100%', height: '100%' }}
                            placeholder="Type your notes here..."
                          />
                        </div>
                      )}
                    </Col>
                  </Row>
                  <Row style={{ marginTop: 'auto', width: '100%' }}> {/* Push to bottom */}
                    <Col md={6} style={{
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'flex-end',
                      height: '100%',
                      alignItems: 'start'
                    }}>
                      <Button onClick={() => handleNotesClick()} color="primary">
                        {isNotesOpen ? 'Close Notes' : 'Open Notes'}
                      </Button>
                    </Col>
                    <Col md={6} style={{
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'flex-end',
                      height: '100%',
                      alignItems: 'end'
                    }}>
                      <h4 className="card-title mb-6">Model : {model !== "" ? model ? model : "Object Det." : "Older Model"}</h4>
                    </Col>
                  </Row>
                </div>
              </Col>
            </Row>
          </Container>
        </CardBody>
      </Card>
    </React.Fragment>

  )
}
export default AnnotationPage;