import React, { useState, useRef, useEffect } from "react"
import {
  Table, Card, CardBody, Button, Col, Row, FormGroup, Label, Input, Container, InputGroup, InputGroupText, Dropdown,
  DropdownMenu, DropdownToggle, DropdownItem, Popover, PopoverBody, Modal, ModalBody, ModalFooter, ModalHeader, Spinner,
  UncontrolledTooltip, PopoverHeader, Form, CardFooter,
  Tooltip
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
import DentalChatPopup from "./Llama Chat/ChatPopup";
import { findAdjacentTeeth } from "helpers/DrawingTools/tooth-utils";
import ConfirmationModal from "./AnnotationTools/ConfirmationModal";
const AnnotationPage = () => {
  const apiUrl = process.env.REACT_APP_NODEAPIURL;
  const [exitClick, setExitClick] = useState(false);
  const [navigateToTreatmentPlan, setNavigateToTreatmentPlan] = useState(false);
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
  const [isArea, setIsShowArea] = useState(false);
  const [showLabel, setShowLabel] = useState(false);
  const [redirectToLogin, setRedirectToLogin] = useState(false);
  const [message, setMessage] = useState('')
  const [isClassCategoryVisible, setIsClassCategoryVisible] = useState(false);
  const [selectedClassCategory, setSelectedClassCategory] = useState(null);
  const [patient_first_name, setPatient_first_name] = useState('');
  const [patient_last_name, setPatient_last_name] = useState('');
  const [patient_email, setPatient_email] = useState('');
  const [patient_phone, setPatient_phone] = useState('');
  const [patient_gender, setPatient_gender] = useState('');
  const [patient_add, setPatient_add] = useState('');
  const [patient_age, setPatient_age] = useState('');
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [isChatPopupOpen, setIsChatPopupOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [pendingLabelChange, setPendingLabelChange] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredClasses, setFilteredClasses] = useState([]);
  const [isAddingNewClass, setIsAddingNewClass] = useState(false);
  const [newClassName, setNewClassName] = useState('');
  const [newClassCategory, setNewClassCategory] = useState('');
  const [newClassColor, setNewClassColor] = useState('#ffffff');
  const [classSearchModalOpen, setClassSearchModalOpen] = useState(false);
  const [confidenceLevels, setConfidenceLevels] = useState([])
  const [redirectToConfidencePlan, setRedirectToConfidencePlan] = useState(false)
  const [imageGroup, setImageGroup] = useState("")
  const [showOriginalLabels, setShowOriginalLabels] = useState(false)
  const fetchNotesContent = async () => {
    try {
      const response = await axios.get(`${apiUrl}/notes-content?visitID=` + sessionStorage.getItem('visitId'),
        {
          headers: {
            Authorization: sessionStorage.getItem('token')
          }
        }); // Adjust the API endpoint as needed
      const data = response.data;
      // setMainImage(data.image);
      sessionStorage.setItem('token', response.headers['new-token'])
      // console.log(data);
      // setAnnotations(data.annotations);
      return data.notes;
    } catch (error) {
      if (error.status === 403 || error.status === 401) {
        if (sessionStorage.getItem('preLayoutMode')) {
          dispatch(changeMode(preLayoutMode));
          sessionStorage.removeItem('preLayoutMode');
        }
        sessionStorage.removeItem('token');
        setRedirectToLogin(true);
      }
      else {
        logErrorToServer(error, "fetchNotesContent");
        console.error('Error fetching most recent image:', error);
      }
    }
  }
  const fetchVisitDateImages = async () => {
    try {
      const response = await axios.get(`${apiUrl}/visitid-images?visitID=` + sessionStorage.getItem('visitId'),
        {
          headers: {
            Authorization: sessionStorage.getItem('token')
          }
        }); // Adjust the API endpoint as needed
      const data = response.data;
      sessionStorage.setItem('token', response.headers['new-token'])
      // setMainImage(data.image);
      // setAnnotations(data.annotations);
      return data.images;
    } catch (error) {
      if (error.status === 403 || error.status === 401) {
        if (sessionStorage.getItem('preLayoutMode')) {
          dispatch(changeMode(preLayoutMode));
          sessionStorage.removeItem('preLayoutMode');
        }
        sessionStorage.removeItem('token');
        setRedirectToLogin(true);
      }
      else {
        logErrorToServer(error, "fetchVisitDateImages");
        setMessage("Error fetching Images")
        console.error('Error fetching most recent image:', error);
      }
    }
  };
  const fetchClassCategories = async () => {
    try {
      const response = await axios.get(`${apiUrl}/get-classCategories?clientId=` + sessionStorage.getItem('clientId'),
        {
          headers: {
            Authorization: sessionStorage.getItem('token')
          }
        }); // Adjust the API endpoint as needed
      const data = response.data;
      sessionStorage.setItem('token', response.headers['new-token'])
      let updatedClassCategories = {}
      let updatedLabelColors = {}
      let updatedConfidenceLevels = {}
      data.forEach(element => {
        if (updatedClassCategories[element.className.toLowerCase()] === undefined) {
          updatedClassCategories[element.className.toLowerCase()] = element.category
        }
        if (updatedLabelColors[element.className.toLowerCase()] === undefined) {
          updatedLabelColors[element.className.toLowerCase()] = element.color
        }
        if (updatedConfidenceLevels[element.className.toLowerCase()] === undefined) {
          element.confidence ? updatedConfidenceLevels[element.className.toLowerCase()] = element.confidence : updatedConfidenceLevels[element.className.toLowerCase()] = (0.01)
        }
      });
      setLabelColors(updatedLabelColors)
      setClassCategories(updatedClassCategories)
      setConfidenceLevels(updatedConfidenceLevels)
    } catch (error) {
      if (error.status === 403 || error.status === 401) {
        if (sessionStorage.getItem('preLayoutMode')) {
          dispatch(changeMode(preLayoutMode));
          sessionStorage.removeItem('preLayoutMode');
        }
        else {
          logErrorToServer(error, "fetchClassCategories");
          sessionStorage.removeItem('token');
          setRedirectToLogin(true);
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
  const hexToRGBA = (hex, alpha) => {
    let r, g, b;
    if (hex.startsWith('#')) {
      // Convert hex to RGB
      if (hex.length === 4) {  // Short hex format #RGB
        r = parseInt(hex[1] + hex[1], 16);
        g = parseInt(hex[2] + hex[2], 16);
        b = parseInt(hex[3] + hex[3], 16);
      } else if (hex.length === 7) {  // Full hex format #RRGGBB
        r = parseInt(hex.substring(1, 3), 16);
        g = parseInt(hex.substring(3, 5), 16);
        b = parseInt(hex.substring(5, 7), 16);
      }
      return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }
    return hex; // If not hex, return original color (handles named colors)
  }
  const drawAnnotations = (ctx, image, x, y, scale, selectedAnnotation, areaScale) => {
    const fontSize = Math.max(9, Math.ceil(12 / (1000 / image.width)));
    // Scale the spacing values based on image size
    let labelPadding = Math.ceil(5 / (1000 / image.width));
    let verticalOffset = Math.ceil(28 / (1000 / image.width));
    imageGroup === 'bitewing' ? verticalOffset += Math.ceil(28 / (1000 / image.width)) : verticalOffset += 0

    // First find the lower jaw annotation for overlap checking
    let lowerJawVertices = null;
    annotations.forEach((anno) => {
      if (anno.label === "lower jaw") {
        if (model === "segmentation") {
          lowerJawVertices = anno.segmentation ? anno.segmentation : anno.bounding_box;
        } else {
          lowerJawVertices = anno.vertices;
        }
      }
    });

    // Function to check if points are inside a polygon
    const isPointInPolygon = (point, polygon) => {
      // Ray casting algorithm
      let inside = false;
      for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
        const xi = polygon[i].x * scale;
        const yi = polygon[i].y * scale;
        const xj = polygon[j].x * scale;
        const yj = polygon[j].y * scale;

        const intersect = ((yi > point.y) !== (yj > point.y)) &&
          (point.x < (xj - xi) * (point.y - yi) / (yj - yi) + xi);
        if (intersect) inside = !inside;
      }
      return inside;
    };

    // Function to check if an annotation is mostly inside the lower jaw
    const isAnnotationMostlyInLowerJaw = (vertices) => {
      if (!lowerJawVertices) return false;

      // Generate a grid of points within the annotation's bounding box
      const { left, top, width, height } = getBoxDimensions(vertices.map(v => ({ x: v.x * scale, y: v.y * scale })));

      const pointsToCheck = 100; // Number of points to check
      let pointsInside = 0;
      let pointsInsideLowerJaw = 0;

      // Generate grid of points
      const stepX = width / Math.sqrt(pointsToCheck);
      const stepY = height / Math.sqrt(pointsToCheck);

      for (let x = left; x <= left + width; x += stepX) {
        for (let y = top; y <= top + height; y += stepY) {
          const point = { x, y };

          // Check if point is inside the annotation
          if (isPointInPolygon(point, vertices.map(v => ({ x: v.x * scale, y: v.y * scale })))) {
            pointsInside++;

            // Check if point is also inside the lower jaw
            if (isPointInPolygon(point, lowerJawVertices.map(v => ({ x: v.x * scale, y: v.y * scale })))) {
              pointsInsideLowerJaw++;
            }
          }
        }
      }

      // Calculate percentage of the annotation that's inside the lower jaw
      const percentageInside = pointsInside > 0 ? (pointsInsideLowerJaw / pointsInside) * 100 : 0;

      return percentageInside >= 70; // 80% or more is inside
    };

    // Function to determine if label should be positioned below
    const shouldPositionLabelBelow = (anno, vertices) => {

      // For annotations that are mostly inside the lower jaw (but are not the lower jaw itself)
      const isMostlyInLowerJaw = (anno.label !== "lower jaw" && isAnnotationMostlyInLowerJaw(vertices));

      return isMostlyInLowerJaw;
    };

    // Function to get the centroid of a polygon
    const getPolygonCentroid = (vertices) => {
      let sumX = 0;
      let sumY = 0;

      for (let i = 0; i < vertices.length; i++) {
        sumX += vertices[i].x * scale;
        sumY += vertices[i].y * scale;
      }

      return {
        x: sumX / vertices.length,
        y: sumY / vertices.length
      };
    };

    if (model === "segmentation") {
      annotations.forEach((anno, index) => {
        if (!hiddenAnnotations.includes(index) && anno.confidence >= (confidenceLevels[anno.label.toLowerCase()] || 0.001)) {
          if (selectedAnnotation === null || selectedAnnotation === anno) {
            if (anno.label === 'Line') {
              // Draw line
              ctx.beginPath();
              ctx.moveTo(anno.vertices[0].x * scale, anno.vertices[0].y * scale);
              ctx.lineTo(anno.vertices[1].x * scale, anno.vertices[1].y * scale);
              ctx.strokeStyle = labelColors[anno.label.toLowerCase()] || 'white';
              ctx.lineWidth = Math.ceil(2 / (1000 / image.width));
              ctx.stroke();

              // Calculate length
              const dx = (anno.vertices[1].x - anno.vertices[0].x) * scale;
              const dy = (anno.vertices[1].y - anno.vertices[0].y) * scale;
              const length = Math.sqrt(dx * dx + dy * dy) / areaScale;

              // Display length
              const midX = ((anno.vertices[0].x + anno.vertices[1].x) / 2) * scale;
              const midY = ((anno.vertices[0].y + anno.vertices[1].y) / 2) * scale;
              ctx.fillStyle = labelColors[anno.label.toLowerCase()] || '#ffffff';
              ctx.font = `${fontSize}px Arial`;
              if (isArea) {
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
                ctx.lineWidth = Math.ceil(2 / (1000 / image.width));
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
                ctx.lineWidth = Math.ceil(2 / (1000 / image.width));
                ctx.stroke();
              }
              if (selectedAnnotation !== anno) {
                // Get vertices to use
                const vertices = anno.segmentation ? anno.segmentation : anno.bounding_box;
                const { left, top, width, height } = getBoxDimensions(vertices.map(v => ({ x: v.x * scale, y: v.y * scale })));
                const area = calculatePolygonArea(vertices.map(v => ({ x: v.x * scale, y: v.y * scale })), areaScale).toFixed(2);

                // Prepare label text
                let labelText = '';
                if ((isArea && showLabel) || (isArea && index === hoveredAnnotation)) {
                  labelText = showOriginalLabels && anno.orignal_label ? `${anno.original_label} (${area} mm²)` : `${anno.label} (${area} mm²)`;
                }
                else if (showLabel || index === hoveredAnnotation) {
                  labelText = showOriginalLabels && anno.original_label ? `${anno.original_label}` : `${anno.label}`;
                }
                if (labelText !== '') {
                  // Parse label value for comparison - to check if it's a tooth number
                  const labelValue = parseInt(anno.label);
                  const isToothNumber = !isNaN(labelValue) && labelValue >= 1 && labelValue <= 32;

                  // Set font and measure text
                  ctx.font = `${fontSize}px Arial`;
                  const textMetrics = ctx.measureText(labelText);
                  const textWidth = textMetrics.width;
                  const textHeight = parseInt(ctx.font, 10);

                  // Position calculation
                  let centerX, rectY, labelY;

                  // Special handling for bitewing image tooth numbers
                  if (imageGroup === 'bitewing' && isToothNumber) {
                    // For bitewing images, place tooth numbers inside the tooth
                    const centroid = getPolygonCentroid(vertices);
                    centerX = centroid.x - (textWidth / 2);
                    rectY = centroid.y - (textHeight / 2) - labelPadding;
                    labelY = rectY + textHeight + labelPadding;
                  } else {
                    // Standard positioning logic for non-bitewing or non-tooth numbers
                    centerX = left + (width / 2) - (textWidth / 2);

                    // Check if the label would go out of bounds
                    const canvasHeight = ctx.canvas.height;
                    const labelAboveOutOfBounds = (top - verticalOffset - textHeight - labelPadding * 2) < 0;
                    const labelBelowOutOfBounds = (top + height + labelPadding + textHeight + 10) > canvasHeight;

                    // Determine if this label should go below based on our criteria
                    const shouldShowBelow = shouldPositionLabelBelow(anno, vertices);

                    if (shouldShowBelow || labelAboveOutOfBounds) {
                      // Position below the annotation
                      rectY = top + height + labelPadding;
                      labelY = rectY + textHeight + labelPadding;

                      // If below is also out of bounds, position it inside the annotation
                      if (labelBelowOutOfBounds) {
                        rectY = top + height - (textHeight + labelPadding * 3);
                        labelY = rectY + textHeight + labelPadding;
                      }
                    } else if (labelText === "lower jaw") {
                      // Special positioning for lower jaw - place it above the lowest point but still inside the annotation
                      rectY = top + height - (textHeight + labelPadding * 3);
                      labelY = rectY + textHeight + labelPadding;
                    } else {
                      // Position above the annotation
                      rectY = top - verticalOffset - textHeight;
                      labelY = rectY + textHeight + labelPadding;
                    }
                  }

                  // Draw background and text
                  ctx.fillStyle = labelColors[anno.label.toLowerCase()] || '#ffffff';
                  ctx.fillRect(centerX - labelPadding, rectY, textWidth + labelPadding * 2, textHeight + labelPadding * 2);

                  ctx.fillStyle = 'black';
                  ctx.fillText(labelText, centerX, labelY);
                }
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
            ctx.lineWidth = Math.ceil(2 / (1000 / image.width));
            ctx.stroke();

            // Calculate length
            const dx = (anno.vertices[1].x - anno.vertices[0].x) * scale;
            const dy = (anno.vertices[1].y - anno.vertices[0].y) * scale;
            const length = Math.sqrt(dx * dx + dy * dy) / areaScale;

            // Display length
            const midX = ((anno.vertices[0].x + anno.vertices[1].x) / 2) * scale;
            const midY = ((anno.vertices[0].y + anno.vertices[1].y) / 2) * scale;
            ctx.fillStyle = labelColors[anno.label.toLowerCase()] || '#ffffff';
            ctx.font = `${fontSize}px Arial`;
            if (isArea) {
              ctx.fillText(`${length.toFixed(2)} mm`, midX, midY);
            }
          } else {
            const { left, top, width, height } = getBoxDimensions(anno.vertices.map(v => ({ x: v.x * scale, y: v.y * scale })));

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
            ctx.lineWidth = Math.ceil(2 / (1000 / image.width));
            ctx.stroke();
            if (selectedAnnotation !== anno) {
              const area = calculatePolygonArea(anno.vertices.map(v => ({ x: v.x * scale, y: v.y * scale })), areaScale).toFixed(2);

              // Prepare label text
              let labelText = '';
              if ((isArea && showLabel) || (isArea && index === hoveredAnnotation)) {
                labelText = showOriginalLabels && anno.original_label ? `${anno.original_label} (${area} mm²)` : `${anno.label} (${area} mm²)`;
              }
              else if (showLabel || index === hoveredAnnotation) {
                labelText = showOriginalLabels && anno.original_label ? `${anno.original_label}` : `${anno.label}`;
              }
              if (labelText !== '') {
                // Parse label value for comparison
                const labelValue = parseInt(anno.label);
                const isToothNumber = !isNaN(labelValue) && labelValue >= 1 && labelValue <= 32;

                // Set font and measure text
                ctx.font = `${fontSize}px Arial`;
                const textMetrics = ctx.measureText(labelText);
                const textWidth = textMetrics.width;
                const textHeight = parseInt(ctx.font, 10);

                // Position calculation
                let centerX, rectY, labelY;

                // Special handling for bitewing image tooth numbers
                if (imageGroup === 'bitewing' && isToothNumber) {
                  // For bitewing images, place tooth numbers inside the tooth
                  const centroid = getPolygonCentroid(anno.vertices);
                  centerX = centroid.x - (textWidth / 2);
                  rectY = centroid.y - (textHeight / 2) - labelPadding;
                  labelY = rectY + textHeight + labelPadding;
                } else {
                  // Standard positioning logic for non-bitewing or non-tooth numbers
                  centerX = left + (width / 2) - (textWidth / 2);

                  // Check if the label would go out of bounds
                  const canvasHeight = ctx.canvas.height;
                  const labelAboveOutOfBounds = (top - verticalOffset - textHeight - labelPadding * 2) < 0;
                  const labelBelowOutOfBounds = (top + height + labelPadding + textHeight + 10) > canvasHeight;

                  // Standard positioning for non-bitewing images or non-tooth numbers
                  if ((isToothNumber && labelValue >= 17 && labelValue <= 32) || labelAboveOutOfBounds) {
                    // Position below the annotation
                    rectY = top + height + labelPadding;
                    labelY = rectY + textHeight + labelPadding;

                    // If below is also out of bounds, position it inside the annotation
                    if (labelBelowOutOfBounds) {
                      rectY = top + height - (textHeight + labelPadding * 3);
                      labelY = rectY + textHeight + labelPadding;
                    }
                  } else if (labelText === "lower jaw") {
                    // Special positioning for lower jaw - place it above the lowest point but still inside the annotation
                    rectY = top + height - (textHeight + labelPadding * 3);
                    labelY = rectY + textHeight + labelPadding;
                  } else {
                    // Position above the annotation
                    rectY = top - verticalOffset - textHeight;
                    labelY = rectY + textHeight + labelPadding;
                  }
                }

                // Draw background and text
                ctx.fillStyle = labelColors[anno.label.toLowerCase()] || '#ffffff'
                ctx.fillRect(centerX - labelPadding, rectY, textWidth + labelPadding * 2, textHeight + labelPadding * 2);

                ctx.fillStyle = 'black';
                ctx.fillText(labelText, centerX, labelY);
              }
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
      setSubtractPath(e.shiftKey);
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
        updatedAnnotation = { ...selectedAnnotation, segmentation: updatedVertices, created_by: `${sessionStorage.getItem('firstName')} ${sessionStorage.getItem('lastName')}`, created_on: date };
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
        updatedAnnotation = { ...selectedAnnotation, bounding_box: updatedVertices, created_by: `${sessionStorage.getItem('firstName')} ${sessionStorage.getItem('lastName')}`, created_on: date };
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
        updatedAnnotation = { ...selectedAnnotation, vertices: updatedVertices, created_by: `${sessionStorage.getItem('firstName')} ${sessionStorage.getItem('lastName')}`, created_on: date };
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
    setClassSearchModalOpen(true);
    setSearchTerm('');
    setFilteredClasses([]);
    setIsAddingNewClass(false);
  };
  const handleClassSearch = (e) => {
    const term = e.target.value.toLowerCase();
    setSearchTerm(term);

    if (term.trim() === '') {
      setFilteredClasses([]);
      return;
    }

    const matches = Object.keys(labelColors)
      .filter(className => className.toLowerCase().includes(term))
      .sort((a, b) => a.localeCompare(b));

    setFilteredClasses(matches);
  };

  const handleAddNewClass = async () => {
    if (!newClassName || !newClassCategory) return;
    try {
      const response = await axios.post(
        `${apiUrl}/add-className`,
        {
          className: newClassName,
          category: newClassCategory,
          color: newClassColor,
          clientId: sessionStorage.getItem('clientId'),
          created_by: `${sessionStorage.getItem('firstName')} ${sessionStorage.getItem('lastName')}`
        },
        {
          headers: {
            Authorization: sessionStorage.getItem('token')
          }
        }
      );
      sessionStorage.setItem('token', response.headers['new-token'])

      // Update local state
      const updateState = () => {
        return new Promise(resolve => {
          const updatedLabelColors = { ...labelColors, [newClassName.toLowerCase()]: newClassColor };
          const updatedClassCategories = { ...classCategories, [newClassName.toLowerCase()]: newClassCategory };

          // Update the first state
          setLabelColors(updatedLabelColors);

          // Update the second state and use requestAnimationFrame to ensure the
          // state has been updated before resolving
          setClassCategories(updatedClassCategories);

          // Use requestAnimationFrame to wait for React to process the state updates
          requestAnimationFrame(() => {
            // Use another rAF to ensure state updates have been applied
            requestAnimationFrame(() => {
              resolve();
            });
          });
        });
      };

      // Call the function and handle the promise
      updateState().then(() => {
        handleCategorySelect(newClassName);
      });

      // Reset form
      setNewClassName('');
      setNewClassCategory('');
      setNewClassColor('#ffffff');
      setIsAddingNewClass(false);
      setClassSearchModalOpen(false);

      // Refresh class categories
      // fetchClassCategories();
    } catch (error) {
      if (error.status === 403 || error.status === 401) {
        if (sessionStorage.getItem('preLayoutMode')) {
          dispatch(changeMode(preLayoutMode));
          sessionStorage.removeItem('preLayoutMode');
        }
        sessionStorage.removeItem('token');
        setRedirectToLogin(true);
      }
      else {
        logErrorToServer(error, "saveAnnotations");
        console.error('Error saving annotations:', error);
      }
    }
  };

  const handleCategorySelect = (category) => {
    setSelectedClassCategory(category);
    setNewBoxLabel(category);
    setClassSearchModalOpen(false);
    startHybridTracing();
  };
  const mergeEditingPathWithAnnotation = () => {
    if (editingPath.length > 1 && selectedAnnotation) {
      const editingPathVertices = editingPath.map(point => ({ x: point[0], y: point[1] }));
      let newPath;
      let updatedAnnotation = {}
      const date = new Date().toISOString()
      if (selectedAnnotation.segmentation) {
        if (!subtractPath) {
          newPath = modifyPath(selectedAnnotation.segmentation, editingPathVertices, false);
        }
        else {
          newPath = modifyPath(selectedAnnotation.segmentation, editingPathVertices, true);
        }
        updatedAnnotation = { ...selectedAnnotation, segmentation: newPath, created_by: `${sessionStorage.getItem('firstName')} ${sessionStorage.getItem('lastName')}`, created_on: date };
      }
      else if (selectedAnnotation.bounding_box) {
        if (!subtractPath) {
          newPath = modifyPath(selectedAnnotation.bounding_box, editingPathVertices, false);
        }
        else {
          newPath = modifyPath(selectedAnnotation.bounding_box, editingPathVertices, true);
        }
        updatedAnnotation = { ...selectedAnnotation, bounding_box: newPath, created_by: `${sessionStorage.getItem('firstName')} ${sessionStorage.getItem('lastName')}`, created_on: date };
      }
      else {
        if (!subtractPath) {
          newPath = modifyPath(selectedAnnotation.vertices, editingPathVertices, false);
        }
        else {
          newPath = modifyPath(selectedAnnotation.vertices, editingPathVertices, true);
        }
        updatedAnnotation = { ...selectedAnnotation, vertices: newPath, created_by: `${sessionStorage.getItem('firstName')} ${sessionStorage.getItem('lastName')}`, created_on: date };
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
  // Modified handleLabelChange function with recursive updating

  const handleLabelChange = (newValue) => {
    if (selectedAnnotation && !isNaN(Number.parseInt(selectedAnnotation.label))) {
      // Store the new value for use after confirmation
      setPendingLabelChange(newValue);

      // Open the confirmation modal instead of using window.confirm
      setModalOpen(true);
    }
  }

  // Function to handle modal cancellation
  const toggleModal = () => {
    setModalOpen(!modalOpen);
    if (modalOpen) {
      // If we're closing the modal without confirming, clear the pending change
      setPendingLabelChange(null);
    }
  }

  // Calculate the distance between two tooth annotations
  const calculateDistance = (tooth1, tooth2) => {
    // Get centers of the teeth
    const center1 = getToothCenter(tooth1);
    const center2 = getToothCenter(tooth2);

    // Calculate Euclidean distance
    return Math.sqrt(Math.pow(center2.x - center1.x, 2) + Math.pow(center2.y - center1.y, 2));
  }

  // Get center point of a tooth annotation
  const getToothCenter = (tooth) => {
    if (tooth.type === 'rectangle') {
      return {
        x: tooth.x + tooth.width / 2,
        y: tooth.y + tooth.height / 2
      };
    } else if (tooth.segmentation && tooth.segmentation.length > 0) {
      // For polygon, calculate centroid
      let sumX = 0, sumY = 0;
      for (const point of tooth.segmentation) {
        sumX += point.x;
        sumY += point.y;
      }
      return {
        x: sumX / tooth.segmentation.length,
        y: sumY / tooth.segmentation.length
      };
    }
    return { x: 0, y: 0 };
  }

  // Helper function to determine tooth type based on tooth number
  const getToothType = (toothNumber) => {
    // Convert tooth number to integer if it's a string
    const num = typeof toothNumber === 'string' ? parseInt(toothNumber, 10) : toothNumber;

    // Upper Jaw (1-16)
    if (num >= 1 && num <= 16) {
      // Central and lateral incisors (teeth 8-9, 7-10)
      if ([8, 9, 7, 10].includes(num)) return 'incisor';
      // Canines (teeth 6, 11)
      if ([6, 11].includes(num)) return 'canine';
      // Premolars (teeth 4-5, 12-13)
      if ([4, 5, 12, 13].includes(num)) return 'premolar';
      // Molars (teeth 1-3, 14-16)
      if ([1, 2, 3, 14, 15, 16].includes(num)) return 'molar';
    }

    // Lower Jaw (17-32)
    if (num >= 17 && num <= 32) {
      // Central and lateral incisors (teeth 24-25, 23-26)
      if ([24, 25, 23, 26].includes(num)) return 'incisor';
      // Canines (teeth 22, 27)
      if ([22, 27].includes(num)) return 'canine';
      // Premolars (teeth 20-21, 28-29)
      if ([20, 21, 28, 29].includes(num)) return 'premolar';
      // Molars (teeth 17-19, 30-32)
      if ([17, 18, 19, 30, 31, 32].includes(num)) return 'molar';
    }

    // Default case
    return 'unknown';
  };

  // Calculate tooth width for a single tooth
  const calculateToothWidth = (tooth) => {
    if (tooth.type === 'rectangle') {
      return tooth.width;
    } else if (tooth.segmentation && tooth.segmentation.length > 0) {
      // For polygon, calculate width based on bounding box
      let minX = Infinity, maxX = -Infinity;
      for (const point of tooth.segmentation) {
        minX = Math.min(minX, point.x);
        maxX = Math.max(maxX, point.x);
      }
      return maxX - minX;
    }
    return 0;
  };

  // Calculate average tooth width by tooth type
  const calculateAverageToothWidthByType = (annotations) => {
    // Filter annotations to only include those with valid tooth numbers
    const teethAnnotations = annotations.filter((anno) => !isNaN(Number.parseInt(anno.label)));

    if (teethAnnotations.length === 0) return { average: 0, byType: {} };

    // Group teeth by type
    const teethByType = {
      incisor: [],
      canine: [],
      premolar: [],
      molar: [],
      unknown: []
    };

    // Calculate width for each tooth and group by type
    teethAnnotations.forEach(tooth => {
      const toothNumber = Number.parseInt(tooth.label);
      const toothType = getToothType(toothNumber);
      const width = calculateToothWidth(tooth);

      // Add to appropriate type group
      if (width > 0) {
        teethByType[toothType].push(width);
      }
    });

    // Calculate average width for each type
    const averagesByType = {};
    let totalWidth = 0;
    let totalCount = 0;

    for (const [type, widths] of Object.entries(teethByType)) {
      if (widths.length > 0) {
        const sum = widths.reduce((acc, width) => acc + width, 0);
        averagesByType[type] = sum / widths.length;
        totalWidth += sum;
        totalCount += widths.length;
      } else {
        averagesByType[type] = 0;
      }
    }

    // Overall average (fallback)
    const overallAverage = totalCount > 0 ? totalWidth / totalCount : 0;

    return {
      average: overallAverage,
      byType: averagesByType
    };
  };

  // Modified recursive function to update adjacent teeth with improved gap detection
  const recursivelyUpdateTeethWithGapDetection = (
    currentAnnotations,
    currentTooth,
    currentToothNumber,
    updatedTeethIds,
    toothWidthData
  ) => {
    // Get all tooth annotations with numeric labels
    const teethAnnotations = currentAnnotations.filter((anno) => !isNaN(Number.parseInt(anno.label)));

    // Determine if we're in upper or lower jaw
    const isUpperJaw = currentToothNumber >= 1 && currentToothNumber <= 16;
    const isLowerJaw = currentToothNumber >= 17 && currentToothNumber <= 32;

    // Find adjacent teeth based on segmentation proximity
    const adjacentTeeth = findAdjacentTeeth(currentTooth, teethAnnotations);
    let updatedAnnotations = [...currentAnnotations];

    // Process the left adjacent tooth
    if (adjacentTeeth.left) {
      const leftToothIndex = currentAnnotations.findIndex((anno) => anno === adjacentTeeth.left);
      const leftToothId = adjacentTeeth.left.id || leftToothIndex;

      // Only process if we haven't updated this tooth already
      if (leftToothIndex !== -1 && !updatedTeethIds.has(leftToothId)) {
        // Calculate distance between tooth centers
        const distance = calculateDistance(currentTooth, adjacentTeeth.left);

        // Calculate current tooth width
        const currentToothWidth = calculateToothWidth(currentTooth);

        // Calculate left tooth width
        const leftToothWidth = calculateToothWidth(adjacentTeeth.left);

        // Determine what type of tooth would be in the gap
        let gapToothType;
        if (isUpperJaw) {
          // For upper jaw, moving left means increasing tooth number
          gapToothType = getToothType(currentToothNumber - 1);
        } else {
          // For lower jaw, moving left means decreasing tooth number
          gapToothType = getToothType(currentToothNumber + 1);
        }

        // Get the expected width based on tooth type
        let expectedWidth;
        if (toothWidthData.byType[gapToothType] && toothWidthData.byType[gapToothType] > 0) {
          expectedWidth = toothWidthData.byType[gapToothType];
        } else {
          // Fallback to overall average if specific type data is not available
          expectedWidth = toothWidthData.average;
        }

        // Calculate the gap (distance between edges)
        // Subtract half the width of current tooth and half the width of left tooth
        const gap = distance - (currentToothWidth / 2) - (leftToothWidth / 2);

        // Calculate how many teeth would fit in this gap
        const gapSize = Math.max(1, Math.round(gap / expectedWidth) + 1);

        // Determine the new label with gap consideration
        let leftToothNewLabel = 0;
        if (isUpperJaw) {
          leftToothNewLabel = (currentToothNumber - gapSize).toString();
        } else {
          leftToothNewLabel = (currentToothNumber + gapSize).toString();
        }

        // Only update if the new label is valid for the jaw
        if (
          (isUpperJaw && Number.parseInt(leftToothNewLabel) >= 1 && Number.parseInt(leftToothNewLabel) <= 16) ||
          (isLowerJaw && Number.parseInt(leftToothNewLabel) >= 17 && Number.parseInt(leftToothNewLabel) <= 32)
        ) {
          const updatedLeftTooth = {
            ...adjacentTeeth.left,
            label: leftToothNewLabel,
            created_by: `Auto Update Labelling`,
            created_on: new Date().toISOString(),
          };

          // Mark this tooth as updated
          updatedTeethIds.add(leftToothId);

          // Update the annotations array
          updatedAnnotations = updatedAnnotations.map((anno, index) =>
            index === leftToothIndex ? updatedLeftTooth : anno
          );

          // Recursively update teeth starting from this left tooth
          updatedAnnotations = recursivelyUpdateTeethWithGapDetection(
            updatedAnnotations,
            updatedLeftTooth,
            Number.parseInt(leftToothNewLabel),
            updatedTeethIds,
            toothWidthData
          );
        }
      }
    }

    // Process the right adjacent tooth
    if (adjacentTeeth.right) {
      const rightToothIndex = currentAnnotations.findIndex((anno) => anno === adjacentTeeth.right);
      const rightToothId = adjacentTeeth.right.id || rightToothIndex;

      // Only process if we haven't updated this tooth already
      if (rightToothIndex !== -1 && !updatedTeethIds.has(rightToothId)) {
        // Calculate distance between tooth centers
        const distance = calculateDistance(currentTooth, adjacentTeeth.right);

        // Calculate current tooth width
        const currentToothWidth = calculateToothWidth(currentTooth);

        // Calculate right tooth width
        const rightToothWidth = calculateToothWidth(adjacentTeeth.right);

        // Determine what type of tooth would be in the gap
        let gapToothType;
        if (isUpperJaw) {
          // For upper jaw, moving right means decreasing tooth number
          gapToothType = getToothType(currentToothNumber + 1);
        } else {
          // For lower jaw, moving right means increasing tooth number
          gapToothType = getToothType(currentToothNumber - 1);
        }

        // Get the expected width based on tooth type
        let expectedWidth;
        if (toothWidthData.byType[gapToothType] && toothWidthData.byType[gapToothType] > 0) {
          expectedWidth = toothWidthData.byType[gapToothType];
        } else {
          // Fallback to overall average if specific type data is not available
          expectedWidth = toothWidthData.average;
        }

        // Calculate the gap (distance between edges)
        // Subtract half the width of current tooth and half the width of right tooth
        const gap = distance - (currentToothWidth / 2) - (rightToothWidth / 2);

        // Calculate how many teeth would fit in this gap
        const gapSize = Math.max(1, Math.round(gap / expectedWidth) + 1);

        // Determine the new label with gap consideration
        let rightToothNewLabel = 0;
        if (isUpperJaw) {
          rightToothNewLabel = (currentToothNumber + gapSize).toString();
        } else {
          rightToothNewLabel = (currentToothNumber - gapSize).toString();
        }

        // Only update if the new label is valid for the jaw
        if (
          (isUpperJaw && Number.parseInt(rightToothNewLabel) >= 1 && Number.parseInt(rightToothNewLabel) <= 16) ||
          (isLowerJaw && Number.parseInt(rightToothNewLabel) >= 17 && Number.parseInt(rightToothNewLabel) <= 32)
        ) {
          const updatedRightTooth = {
            ...adjacentTeeth.right,
            label: rightToothNewLabel,
            created_by: `Auto Update Labelling`,
            created_on: new Date().toISOString(),
          };

          // Mark this tooth as updated
          updatedTeethIds.add(rightToothId);

          // Update the annotations array
          updatedAnnotations = updatedAnnotations.map((anno, index) =>
            index === rightToothIndex ? updatedRightTooth : anno
          );

          // Recursively update teeth starting from this right tooth
          updatedAnnotations = recursivelyUpdateTeethWithGapDetection(
            updatedAnnotations,
            updatedRightTooth,
            Number.parseInt(rightToothNewLabel),
            updatedTeethIds,
            toothWidthData
          );
        }
      }
    }

    return updatedAnnotations;
  };

  // Update handleConfirmUpdate to use the new width calculation
  const handleConfirmUpdate = (autoUpdate = false) => {
    // Close the modal
    setModalOpen(false);

    if (pendingLabelChange && selectedAnnotation) {
      // First update the selected tooth
      const updatedAnnotation = {
        ...selectedAnnotation,
        label: pendingLabelChange,
        created_by: `${sessionStorage.getItem("firstName")} ${sessionStorage.getItem("lastName")}`,
        created_on: new Date().toISOString(),
      }

      let newAnnotations = annotations.map(anno =>
        anno === selectedAnnotation ? updatedAnnotation : anno
      );

      // If user confirmed auto-update, update adjacent teeth recursively
      if (autoUpdate) {
        // Set to keep track of teeth we've already updated to prevent infinite loops
        const updatedTeethIds = new Set()
        // Add initially selected tooth to updated set
        updatedTeethIds.add(selectedAnnotation.id || annotations.findIndex((anno) => anno === selectedAnnotation))

        // Get the selected tooth number
        const selectedToothNumber = Number.parseInt(pendingLabelChange)

        // Calculate average tooth widths by type for gap detection
        const toothWidthData = calculateAverageToothWidthByType(newAnnotations);

        // Call recursive function starting with the selected tooth
        newAnnotations = recursivelyUpdateTeethWithGapDetection(
          newAnnotations,
          updatedAnnotation,
          selectedToothNumber,
          updatedTeethIds,
          toothWidthData
        )
      }

      // Update the selected annotation
      setSelectedAnnotation(null)

      // Update annotations in the component
      setAnnotations(newAnnotations)
      saveAnnotations(newAnnotations)

      // Update annotations in the small canvas data
      const updatedSmallCanvasData = smallCanvasData
      updatedSmallCanvasData[mainImageIndex].annotations.annotations.annotations = newAnnotations
      setSmallCanvasData(updatedSmallCanvasData)
      updateAnnotationsWithHistory(newAnnotations);
      // Clear the pending label change
      setPendingLabelChange(null);
    }
  }
  // const handleLabelChange = (newValue) => {
  //   if (selectedAnnotation && !isNaN(parseInt(selectedAnnotation.label))) {
  //     const updatedAnnotation = { 
  //       ...selectedAnnotation, 
  //       label: newValue,
  //       created_by: `${sessionStorage.getItem('firstName')} ${sessionStorage.getItem('lastName')}`,
  //       created_on: new Date().toISOString()
  //     };

  //     const newAnnotations = annotations.map(anno =>
  //       anno === selectedAnnotation ? updatedAnnotation : anno
  //     );

  //     // Update the selected annotation
  //     setSelectedAnnotation(updatedAnnotation);

  //     setAnnotations(newAnnotations)
  //     saveAnnotations(newAnnotations);

  //     // Update annotations in the component
  //     let updatedSmallCanvasData = smallCanvasData;
  //     updatedSmallCanvasData[mainImageIndex].annotations.annotations.annotations = newAnnotations;
  //     setSmallCanvasData(updatedSmallCanvasData);
  //   }
  // };
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
    ctx.lineWidth = Math.ceil(2 / (1000 / image.width));
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
      ctx.lineWidth = Math.ceil(2 / (1000 / image.width));
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
      ctx.lineWidth = Math.ceil(2 / (1000 / image.width));
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
    ctx.lineWidth = Math.ceil(2 / (1000 / image.width));
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
      ctx.lineWidth = Math.ceil(2 / (1000 / image.width));
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

      // Store aspect ratio
      const aspectRatio = originalWidth / originalHeight;

      // Clear the canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Apply filters
      if (isNegative) {
        ctx.filter = `brightness(${brightness}%) contrast(${contrast}%) invert(100%)`;
      } else {
        ctx.filter = `brightness(${brightness}%) contrast(${contrast}%)`;
      }

      // Draw the image at its original size
      ctx.drawImage(img, 0, 0, originalWidth, originalHeight);

      // Now scale the canvas to fit the container while maintaining aspect ratio
      const containerWidth = canvas.parentElement.clientWidth;
      const containerHeight = canvas.parentElement.clientHeight;
      let canvasWidth, canvasHeight;

      if (type === "main") {
        drawAnnotations(ctx, img, 0, 0, 1, selectedAnnotation, areaScale);
        setImage(img);

        // Calculate dimensions that maintain aspect ratio
        if (containerWidth / containerHeight > aspectRatio) {
          // Container is wider than the image
          canvasHeight = containerHeight;
          canvasWidth = containerHeight * aspectRatio;
        } else {
          // Container is taller than the image
          canvasWidth = containerWidth;
          canvasHeight = containerWidth / aspectRatio;
        }

        // Apply zoom to the calculated size
        canvasWidth *= (zoom / 100);
        canvasHeight *= (zoom / 100);

        CANVAS_HEIGHT = canvasHeight;
        CANVAS_WIDTH = canvasWidth;

        // Center the image
        setX((CANVAS_WIDTH / 2) - (img.width / 2));
        setY((CANVAS_HEIGHT / 2) - (img.height / 2));

        // Use CSS to resize the entire canvas
        canvas.style.width = `${canvasWidth}px`;
        canvas.style.height = `${canvasHeight}px`;
      } else {
        // For other types, scale while maintaining aspect ratio
        if (containerWidth / containerHeight > aspectRatio) {
          canvas.style.height = `${containerHeight}px`;
          canvas.style.width = `${containerHeight * aspectRatio}px`;
        } else {
          canvas.style.width = `${containerWidth}px`;
          canvas.style.height = `${containerWidth / aspectRatio}px`;
        }
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
  // Add this useEffect for keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ctrl+Z for undo
      if (e.ctrlKey && !e.shiftKey && e.key === 'z') {
        e.preventDefault();
        if (currentStep > 0) {
          undo();
        }
      }

      // Ctrl+Shift+Z for redo
      if (e.ctrlKey && e.shiftKey && e.key === 'Z') {
        e.preventDefault();
        if (currentStep < history.length - 1) {
          redo();
        }
      }

      // Spacebar to complete drawing
      if (e.key === ' ' && !e.ctrlKey && !e.shiftKey) {
        e.preventDefault();
        if (isHybridDrawingActive && isDrawingStartedRef.current) {
          completeHybridDrawing();
        }
        else if (isDrawingFreehand && isDrawingRef.current) {
          completeFreehandDrawing();
        } else if (isLiveWireTracingActive && isLiveWireTracing) {
          completePolygon();
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
      }
    };

    // Add event listener
    document.addEventListener('keydown', handleKeyDown);

    // Clean up
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [currentStep, history, isDrawingFreehand, isDrawingRef, isHybridDrawingActive,
    isDrawingStartedRef, isLiveWireTracingActive, isLiveWireTracing, isLineDrawingActive,
    lineStart, lineEnd, annotations, hybridPath]);

  // Add this useEffect to prevent the default context menu
  useEffect(() => {
    const preventContextMenu = (e) => {
      if (e.target === mainCanvasRef.current) {
        e.preventDefault();
      }
    };

    // Add event listener
    document.addEventListener('contextmenu', preventContextMenu);

    // Clean up
    return () => {
      document.removeEventListener('contextmenu', preventContextMenu);
    };
  }, [mainCanvasRef]);
  const loadImages = async () => {
    try {
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
        setImageGroup(mainImageData.annotations.annotations.group)
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
      else if (imagesData) {
        setMessage("There are no images for this visit.")
      }
    }
    catch (error) {
      logErrorToServer(error, "loadImages");
      console.log(error);
      setMessage("Unable to load this visit images. Pls contact admin.")
    }
  };
  const calculateAge = (dob) => {
    try {
      const today = new Date();
      const birthDate = new Date(dob);
      let calculatedAge = today.getFullYear() - birthDate.getFullYear();
      const monthDifference = today.getMonth() - birthDate.getMonth();

      if (monthDifference < 0 || (monthDifference === 0 && today.getDate() < birthDate.getDate())) {
        calculatedAge--;
      }
      return calculatedAge;
    }
    catch (error) {
      console.log(error);
      logErrorToServer(error, "calculateAge");
    }
  };
  const getPatientDetails = async () => {
    try {
      const response = await axios.get(`${apiUrl}/getPatientByID?patientId=` + sessionStorage.getItem('patientId'),
        {
          headers: {
            Authorization: sessionStorage.getItem('token')
          }
        });
      setPatient_first_name(response.data.patientList.first_name)
      setPatient_last_name(response.data.patientList.last_name)
      setPatient_email(response.data.patientList.email)
      setPatient_phone(response.data.patientList.telephone)
      setPatient_gender(response.data.patientList.gender)
      setPatient_add(response.data.patientList.address)
      if (response.data.patientList.date_of_birth)
        setPatient_age(calculateAge(response.data.patientList.date_of_birth));
      else if (response.data.patientList.reference_dob_for_age)
        setPatient_age(calculateAge(response.data.patientList.reference_dob_for_age));
    }
    catch (error) {
      if (error.status === 403 || error.status === 401) {
        if (sessionStorage.getItem('preLayoutMode')) {
          dispatch(changeMode(preLayoutMode));
          sessionStorage.removeItem('preLayoutMode');
        }
        sessionStorage.removeItem('token');
        setRedirectToLogin(true);
      }
      else {
        logErrorToServer(error, "getPatientDetails");
        console.error('Error getting patient details:', error);
      }
    }
  }
  useEffect(() => {
    try {
      setFirstVisit(sessionStorage.getItem('first') === 'true' ? true : false)
      setLastVisit(sessionStorage.getItem('last') === 'true' ? true : false)
      loadImages();
      getPatientDetails();
      fetchClassCategories();
      if (!sessionStorage.getItem('preLayoutMode')) {
        setPreLayoutMode(mode);
        sessionStorage.setItem('preLayoutMode', mode);
      }
      dispatch(changeMode('dark'));
      setFullName(sessionStorage.getItem('patientName'));
    }
    catch (error) {
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
  }, [zoom, brightness, contrast, areaScale, hiddenAnnotations, annotations, hoveredAnnotation, editingMode, isNegative, selectedAnnotation, isArea, showLabel, showOriginalLabels]);
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
    isHybridDrawingActive, livewirePath, hybridPath, lastPointRef, startPointRef, isDrawingRef, drawingPaths, editingPath, erasePoints, selectedAnnotation, showOriginalLabels]);

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
            headers: {
              Authorization: sessionStorage.getItem('token')
            }
          });
        const data = response.data;
        sessionStorage.setItem('token', response.headers['new-token'])
        setOldNotesContent(notesContent);
        return data.notes;
      } catch (error) {
        // Fallback logic if connection fails
        if (error.status === 403 || error.status === 401) {
          if (sessionStorage.getItem('preLayoutMode')) {
            dispatch(changeMode(preLayoutMode));
            sessionStorage.removeItem('preLayoutMode');
          }
          sessionStorage.removeItem('token');
          setRedirectToLogin(true);
        }
        else {
          logErrorToServer(error, "saveNotes");
          console.error('Error saving notes:', error);
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
          headers: {
            Authorization: sessionStorage.getItem('token')
          }
        }
      );
      const data = response.data;
      sessionStorage.setItem('token', response.headers['new-token'])
      return data;
    } catch (error) {
      if (error.status === 403 || error.status === 401) {
        if (sessionStorage.getItem('preLayoutMode')) {
          dispatch(changeMode(preLayoutMode));
          sessionStorage.removeItem('preLayoutMode');
        }
        sessionStorage.removeItem('token');
        setRedirectToLogin(true);
      }
      else {
        logErrorToServer(error, "saveAnnotations");
        console.error('Error saving annotations:', error);
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
    const date = new Date().toISOString()
    let newAnnotation = {}
    if (model === "segmentation") {
      newAnnotation = {
        label: newBoxLabel,
        segmentation: newBoxVertices,
        created_by: `${sessionStorage.getItem('firstName')} ${sessionStorage.getItem('lastName')}`,
        created_on: date,
      };
    }
    else {
      newAnnotation = {
        label: newBoxLabel,
        vertices: newBoxVertices,
        created_by: `${sessionStorage.getItem('firstName')} ${sessionStorage.getItem('lastName')}`,
        created_on: date,
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
          headers: {
            Authorization: sessionStorage.getItem('token')
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
      if (error.status === 403 || error.status === 401) {
        if (sessionStorage.getItem('preLayoutMode')) {
          dispatch(changeMode(preLayoutMode));
          sessionStorage.removeItem('preLayoutMode');
        }
        sessionStorage.removeItem('token');
        setRedirectToLogin(true);
      }
      else {
        logErrorToServer(error, "handleNextClick");
        console.error('Error fetching most recent image:', error);
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
          headers: {
            Authorization: sessionStorage.getItem('token')
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
      if (error.status === 403 || error.status === 401) {
        if (sessionStorage.getItem('preLayoutMode')) {
          dispatch(changeMode(preLayoutMode));
          sessionStorage.removeItem('preLayoutMode');
        }
        sessionStorage.removeItem('token');
        setRedirectToLogin(true);
      }

      else {
        logErrorToServer(error, "handlePreviousClick");
        console.error('Error fetching most recent image:', error);
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
      setImageGroup(selectedImageData.annotations.annotations.group)
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
  if (navigateToTreatmentPlan) {
    localStorage.removeItem('globalCheckedAnnotations')
    dispatch(changeMode(preLayoutMode));
    sessionStorage.removeItem('preLayoutMode');
    return <Navigate to="/treatmentPlan" />
  }
  if (exitClick) {
    localStorage.removeItem('globalCheckedAnnotations')
    dispatch(changeMode(preLayoutMode));
    sessionStorage.removeItem('preLayoutMode');
    return <Navigate to="/patientImagesList" />
  }
  if (redirectToLogin) {
    return <Navigate to="/login" />
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
  if (redirectToConfidencePlan) {
    return <Navigate to="/confidenceLevelPage" />
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
                      label !== "Line" ? <option key={label} value={label} style={{ backgroundColor: 'none', color: labelColors[label] }}>{label}</option> : null
                    ))}
                  </Input>
                </FormGroup>
              </ModalBody>
              <ModalFooter>
                <Button color="primary" onClick={() => handleAddBox(newBoxVertices)}>Add Box</Button>
                <Button color="secondary" onClick={handleCloseDialog}>Cancel</Button>
              </ModalFooter>
            </Modal>
            <Row>
              <Col md={9}>
                <Table>
                  {message !== '' ? <Row>
                    <Col md={4}>
                      <h5 id="patientDetails" style={{ cursor: "pointer" }}>Name :  {fullName}</h5>
                    </Col>
                    <Popover
                      placement="bottom"
                      isOpen={popoverOpen}
                      toggle={() => { setPopoverOpen(!popoverOpen) }}
                      target="patientDetails"
                    >
                      <PopoverHeader>Patient Details</PopoverHeader>
                      <PopoverBody>
                        {/* Content of the Popover */}
                        <Row>
                          <Col sm={4} className="card">
                            <table>
                              <Row>
                                <label
                                  htmlFor="example-text-input"
                                  className="col-md-6 col-form-label"
                                >
                                  First Name:
                                </label>
                                <label
                                  style={{ fontWeight: 100 }}
                                  className="col-md-6 col-form-label"
                                >
                                  {patient_first_name}
                                </label>
                              </Row>
                              <Row>
                                <label
                                  htmlFor="example-text-input"
                                  className="col-md-6 col-form-label"
                                >
                                  Last Name:
                                </label>
                                <label
                                  style={{ fontWeight: 100 }}
                                  className="col-md-6 col-form-label"
                                >
                                  {patient_last_name}
                                </label>
                              </Row>
                              <Row>
                                <label
                                  htmlFor="example-text-input"
                                  className="col-md-6 col-form-label"
                                >
                                  Email:
                                </label>
                                <label
                                  style={{ fontWeight: 100 }}
                                  className="col-md-6 col-form-label"
                                >
                                  {patient_email}
                                </label>
                              </Row>
                            </table>
                          </Col>
                          <Col sm={4} className="card">
                            <table>
                              <Row>
                                <label
                                  htmlFor="example-text-input"
                                  className="col-md-7 col-form-label"
                                >
                                  Telephone:
                                </label>
                                <label
                                  style={{ fontWeight: 100 }}
                                  className="col-md-5 col-form-label"
                                >
                                  {patient_phone}
                                </label>
                              </Row>
                              <Row>
                                <label
                                  htmlFor="example-text-input"
                                  className="col-md-6 col-form-label"
                                >
                                  Gender:
                                </label>
                                <label
                                  style={{ fontWeight: 100 }}
                                  className="col-md-6 col-form-label"
                                >
                                  {patient_gender}
                                </label>
                              </Row>
                              <Row>
                                <label
                                  htmlFor="example-text-input"
                                  className="col-md-6 col-form-label"
                                >
                                  Age:
                                </label>
                                <label
                                  style={{ fontWeight: 100 }}
                                  className="col-md-6 col-form-label"
                                >
                                  {patient_age}
                                </label>
                              </Row>
                            </table>
                          </Col>

                          <Col sm={4} className="card">
                            <table>
                              <Row>
                                <label
                                  htmlFor="example-text-input"
                                  className="col-md-6 col-form-label"
                                >
                                  Address:
                                </label>
                                <label
                                  style={{ fontWeight: 100 }}
                                  className="col-md-6 col-form-label"
                                >
                                  {patient_add}
                                </label>
                              </Row>
                            </table>
                          </Col>
                        </Row>
                      </PopoverBody>
                    </Popover>
                    <Col md={4}>
                      <h5 style={{ color: 'red', whiteSpace: 'pre-line' }}>
                        {message}
                      </h5>
                    </Col>
                    <Col md={4} style={{
                      display: 'flex',
                      justifyContent: 'flex-end', // Align content to the right
                      alignItems: 'center',
                      height: '100%'
                    }}>
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
                        <h5 style={{ padding: 0, cursor: "pointer" }} id="patientDetails">Name :  {fullName}</h5>
                      </Col>

                      <Popover
                        placement="bottom"
                        isOpen={popoverOpen}
                        toggle={() => { setPopoverOpen(!popoverOpen) }}
                        target="patientDetails"
                      >
                        <PopoverHeader>Patient Details</PopoverHeader>
                        <PopoverBody>
                          {/* Content of the Popover */}
                          <Row>
                            <Col sm={4} className="card">
                              <table>
                                <Row>
                                  <label
                                    htmlFor="example-text-input"
                                    className="col-md-6 col-form-label"
                                  >
                                    First Name:
                                  </label>
                                  <label
                                    style={{ fontWeight: 100 }}
                                    className="col-md-6 col-form-label"
                                  >
                                    {patient_first_name}
                                  </label>
                                </Row>
                                <Row>
                                  <label
                                    htmlFor="example-text-input"
                                    className="col-md-6 col-form-label"
                                  >
                                    Last Name:
                                  </label>
                                  <label
                                    style={{ fontWeight: 100 }}
                                    className="col-md-6 col-form-label"
                                  >
                                    {patient_last_name}
                                  </label>
                                </Row>
                                <Row>
                                  <label
                                    htmlFor="example-text-input"
                                    className="col-md-6 col-form-label"
                                  >
                                    Email:
                                  </label>
                                  <label
                                    style={{ fontWeight: 100 }}
                                    className="col-md-6 col-form-label"
                                  >
                                    {patient_email}
                                  </label>
                                </Row>
                              </table>
                            </Col>
                            <Col sm={4} className="card">
                              <table>
                                <Row>
                                  <label
                                    htmlFor="example-text-input"
                                    className="col-md-7 col-form-label"
                                  >
                                    Telephone:
                                  </label>
                                  <label
                                    style={{ fontWeight: 100 }}
                                    className="col-md-5 col-form-label"
                                  >
                                    {patient_phone}
                                  </label>
                                </Row>
                                <Row>
                                  <label
                                    htmlFor="example-text-input"
                                    className="col-md-6 col-form-label"
                                  >
                                    Gender:
                                  </label>
                                  <label
                                    style={{ fontWeight: 100 }}
                                    className="col-md-6 col-form-label"
                                  >
                                    {patient_gender}
                                  </label>
                                </Row>
                                <Row>
                                  <label
                                    htmlFor="example-text-input"
                                    className="col-md-6 col-form-label"
                                  >
                                    Age:
                                  </label>
                                  <label
                                    style={{ fontWeight: 100 }}
                                    className="col-md-6 col-form-label"
                                  >
                                    {patient_age}
                                  </label>
                                </Row>
                              </table>
                            </Col>

                            <Col sm={4} className="card">
                              <table>
                                <Row>
                                  <label
                                    htmlFor="example-text-input"
                                    className="col-md-6 col-form-label"
                                  >
                                    Address:
                                  </label>
                                  <label
                                    style={{ fontWeight: 100 }}
                                    className="col-md-6 col-form-label"
                                  >
                                    {patient_add}
                                  </label>
                                </Row>
                              </table>
                            </Col>
                          </Row>
                        </PopoverBody>
                      </Popover>
                      <Col md={6} style={{
                        display: 'flex',
                        justifyContent: 'flex-end', // Align content to the right
                        alignItems: 'center',
                        height: '100%'
                      }}>
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
                        <img src={isClassCategoryVisible ? imgEditActive : imgEdit} alt="Trace" style={{ width: '30px', height: '30px' }} />
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
                        <InputGroupText>Area</InputGroupText>
                        <Input
                          type="switch"
                          id="area-toggle"
                          checked={isArea}
                          onChange={(e) => setIsShowArea(!isArea)}
                          style={{ width: '2%', paddingRight: '0', height: '30px' }}
                        />
                        <InputGroupText>Labels</InputGroupText>
                        <Input
                          type="switch"
                          id="labels-toggle"
                          checked={showLabel}
                          onChange={(e) => setShowLabel(!showLabel)}
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
                  <Row style={{ height: 'calc(70vh)', margin: '0px', paddingBottom: '0px', display: 'flex', flexGrow: 1, overflow: 'hidden', color: '#fff' }}
                  >
                    {isClassCategoryVisible ? (
                      <Col
                        md={12}
                        className="d-flex flex-column"
                        style={{ maxHeight: '100%' }}
                      >
                        <Card style={{ height: '100%', padding: 0 }}>
                          <CardBody
                            style={{
                              padding: 0,
                              height: '100%',
                              overflow: 'auto',
                              position: 'relative',
                              maxHeight: '600px',
                            }}
                            ref={containerRef}
                          >
                            <canvas
                              ref={mainCanvasRef}
                              style={{
                                cursor: 'default',
                                position: 'absolute',
                                top: 0,
                                left: 0
                              }}
                              onMouseDown={(e) => handleMouseDown(e)}
                              onMouseMove={(e) => handleMouseMove(e)}
                              onMouseUp={(e) => handleMouseUp(e)}
                            />
                          </CardBody>
                        </Card>
                      </Col>
                    ) : (
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
                                overflow: 'auto',
                                position: 'relative',
                                maxHeight: '600px',
                              }}
                            >
                              <canvas
                                ref={mainCanvasRef}
                                style={{
                                  cursor: 'default',
                                  position: 'absolute',
                                  top: 0,
                                  left: 0
                                }}
                                onMouseDown={(e) => handleMouseDown(e)}
                                onMouseMove={(e) => handleMouseMove(e)}
                                onMouseUp={(e) => handleMouseUp(e)}
                              />
                            </CardBody>
                          </Card>
                        </Col>
                      </>
                    )}
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
                          handleLabelChange={handleLabelChange}
                          mainImageIndex={mainImageIndex}
                          confidenceLevels={confidenceLevels}
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
                    <Row>
                      <Col md={4} style={{
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'flex-end',
                        height: '100%',
                        alignItems: 'start'
                      }}>
                        <Button onClick={() => handleNotesClick()} color="primary" id="notes-btn">
                          <i className="fas fa-sticky-note"></i>
                          <UncontrolledTooltip target={"notes-btn"}>{isNotesOpen ? "Close Notes" : "Open Notes"}</UncontrolledTooltip>
                        </Button>
                      </Col>
                      <Col md={4} style={{
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'flex-end',
                        height: '100%',
                        alignItems: 'start'
                      }}>
                        <Button
                          id="dentalChatButton"
                          color="primary"
                          onClick={() => { setIsChatPopupOpen(!isChatPopupOpen) }}
                        >
                          <i className="fas fa-comments" style={{ height: '80%', width: '80%' }} />
                          <UncontrolledTooltip target={"dentalChatButton"}>Chat with Dental AI</UncontrolledTooltip>
                        </Button>

                        <DentalChatPopup
                          isOpen={isChatPopupOpen}
                          toggle={() => { setIsChatPopupOpen(!isChatPopupOpen) }}
                          target="dentalChatButton"
                        />
                      </Col>
                      <Col md={4} style={{
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'flex-end',
                        height: '100%',
                        alignItems: 'end'
                      }}>
                        {/* <h4 className="card-title mb-6">Model : {model !== "" ? model ? model : "Object Det." : "Older Model"}</h4> */}
                        <Button
                          id="navigateToTreatmentPlan"
                          color="primary"
                          onClick={() => setNavigateToTreatmentPlan(true)}
                        >
                          Treatment Plan
                        </Button>
                        <UncontrolledTooltip target={"navigateToTreatmentPlan"}>Go To Treatment Plan</UncontrolledTooltip>
                        {sessionStorage.getItem('clientId') === "67161fcbadd1249d59085f9a" && (
                          <div style={{ margin: '4px' }}>
                            <Button
                              id="navigateToConfidenceLevelPage"
                              color="primary"
                              onClick={() => setRedirectToConfidencePlan(true)}
                            >
                              Confidence
                            </Button>
                            <UncontrolledTooltip target={"navigateToConfidenceLevelPage"}>Go To Confidence Level Page</UncontrolledTooltip>
                            <Input
                              type="checkbox"
                              color="primary"
                              checked={showOriginalLabels}
                              onClick={() => { setShowOriginalLabels(!showOriginalLabels) }}>
                              <InputGroupText>Show Original Labels</InputGroupText>
                            </Input>
                          </div>
                        )}
                      </Col>
                    </Row>
                  </Row>
                </div>
              </Col>
            </Row>
          </Container>
        </CardBody>
        <CardFooter>
          <Col md={9}>
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
                      {index === mainImageIndex ? <> <canvas
                        ref={smallCanvasRefs[index]}
                        id={`image-${index}`}
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
                        <UncontrolledTooltip target={`image-${index}`}>{smallCanvasData[index].name.split('_').slice(3).join('_')}</UncontrolledTooltip></>
                        : <>
                          <canvas
                            ref={smallCanvasRefs[index]}
                            id={`image-${index}`}
                            width="100%"
                            height="100%"
                            style={{
                              cursor: 'pointer',
                              width: '100%',
                              height: '100%',
                              display: 'block',
                            }}
                            onClick={() => handleSmallCanvasClick(index)}
                          />
                          <UncontrolledTooltip target={`image-${index}`}>{smallCanvasData[index].name.split('_').slice(3).join('_')}</UncontrolledTooltip></>}
                    </CardBody>
                  </Card>
                </Col>
              ))}
            </Row>
          </Col>
        </CardFooter>
        <ConfirmationModal
          isOpen={modalOpen}
          toggle={toggleModal}
          onConfirm={() => handleConfirmUpdate(true)}
          onClose={() => handleConfirmUpdate(false)}
          message="Would you like to automatically update adjacent teeth labels?"
        />
        <Modal isOpen={classSearchModalOpen} toggle={() => setClassSearchModalOpen(false)} size="lg">
          <ModalHeader toggle={() => setClassSearchModalOpen(false)}>
            {isAddingNewClass ? 'Add New Class' : 'Search Classes'}
          </ModalHeader>
          <ModalBody>
            {!isAddingNewClass ? (
              <>
                <FormGroup>
                  <Label for="classSearch">Search for a class</Label>
                  <Input
                    type="text"
                    id="classSearch"
                    placeholder="Type to search..."
                    value={searchTerm}
                    onChange={handleClassSearch}
                    autoFocus
                  />
                </FormGroup>

                {filteredClasses.length > 0 ? (
                  <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                    <Table bordered hover>
                      <thead>
                        <tr>
                          <th>Class Name</th>
                          <th>Category</th>
                          <th>Color</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredClasses.map(className => (
                          <tr
                            key={className}
                            onClick={() => handleCategorySelect(className)}
                            style={{ cursor: 'pointer' }}
                          >
                            <td>{className}</td>
                            <td>{classCategories[className] || 'Unknown'}</td>
                            <td>
                              <div
                                style={{
                                  backgroundColor: labelColors[className] || '#ffffff',
                                  width: '20px',
                                  height: '20px',
                                  borderRadius: '4px',
                                  border: '1px solid #ccc'
                                }}
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </div>
                ) : searchTerm.trim() !== '' ? (
                  <div className="text-center my-4">
                    <p>No matching classes found.</p>
                    <Button color="primary" onClick={() => { setIsAddingNewClass(true); setNewClassName(searchTerm) }}>
                      Add New Class
                    </Button>
                  </div>
                ) : null}

                {searchTerm.trim() === '' && (
                  <div className="text-center my-4">
                    <p>Type to search for classes or add a new one.</p>
                    <Button color="primary" onClick={() => setIsAddingNewClass(true)}>
                      Add New Class
                    </Button>
                  </div>
                )}
              </>
            ) : (
              <Form>
                <FormGroup>
                  <Label for="newClassName">Class Name</Label>
                  <Input
                    type="text"
                    id="newClassName"
                    value={newClassName}
                    onChange={(e) => setNewClassName(e.target.value)}
                    placeholder="Enter class name"
                    autoFocus
                  />
                </FormGroup>
                <FormGroup>
                  <Label for="newClassCategory">Category</Label>
                  <Input
                    type="select"
                    id="newClassCategory"
                    value={newClassCategory}
                    onChange={(e) => setNewClassCategory(e.target.value)}
                  >
                    <option value="">Select a category</option>
                    {Array.from(new Set(Object.values(classCategories))).map(category => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </Input>
                </FormGroup>
                <FormGroup>
                  <Label for="newClassColor">Color</Label>
                  <Input
                    type="color"
                    id="newClassColor"
                    value={newClassColor}
                    onChange={(e) => setNewClassColor(e.target.value)}
                  />
                </FormGroup>
              </Form>
            )}
          </ModalBody>
          <ModalFooter>
            {isAddingNewClass ? (
              <>
                <Button color="primary" onClick={handleAddNewClass}>
                  Add Class
                </Button>
                <Button color="secondary" onClick={() => setIsAddingNewClass(false)}>
                  Back to Search
                </Button>
              </>
            ) : (
              <Button color="secondary" onClick={() => setClassSearchModalOpen(false)}>
                Cancel
              </Button>
            )}
          </ModalFooter>
        </Modal>
      </Card>
    </React.Fragment>

  )
}
export default AnnotationPage;