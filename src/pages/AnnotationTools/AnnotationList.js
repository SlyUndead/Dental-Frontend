import React, { useEffect, useState, useRef } from 'react';
import { labelColors } from './constants';
import { Card, CardBody, Button, ListGroup, ListGroupItem, Row, Col, UncontrolledTooltip, PopoverBody, UncontrolledPopover, Input, InputGroup, InputGroupText } from 'reactstrap';
import axios from 'axios';
import { changeMode } from "../../store/actions"
import { Navigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import 'bootstrap/dist/css/bootstrap.min.css';
import '../../assets/scss/custom/components/_popover.scss';
import { logErrorToServer } from 'utils/logError';
import { desiredOrder } from './constants';

const AnnotationList = ({
  annotations,
  hiddenAnnotations,
  setHiddenAnnotations,
  deleteBox,
  setHoveredAnnotation,
  setSelectedAnnotation,
  selectedAnnotation,
  classCategories,
  setIsEraserActive,
  handleLabelChange,
}) => {
  // Check if setHoveredAnnotation is a function, if not, use a no-op function
  const apiUrl = process.env.REACT_APP_NODEAPIURL;
  const [hideAllAnnotations, setHideAllAnnotations] = useState(false);
  const [redirectToLogin, setRedirectToLogin] = useState(false);
  const popoverRef = useRef(null);
  const handleHover = typeof setHoveredAnnotation === 'function'
    ? setHoveredAnnotation
    : () => { };
  const [popoverData, setPopoverData] = useState({});
  const [popoverOpen, setPopoverOpen] = useState(null); // Track which annotation's popover is open
  const [groupedAnnotations, setGroupedAnnotations] = useState({});
  const [hideGroup, setHideGroup] = useState({});
  // New state to track checked annotations
  const [checkedAnnotations, setCheckedAnnotations] = useState([]);
  // Treatment plan related states
  const [treatments, setTreatments] = useState([]);
  const [selectedTeeth, setSelectedTeeth] = useState([]);
  const [dctCodes, setDctCodes] = useState([]);
  const [filteredCodes, setFilteredCodes] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [generatingPlan, setGeneratingPlan] = useState(false);
  const [savingPlan, setSavingPlan] = useState(false);
  const [treatmentPlanSaved, setTreatmentPlanSaved] = useState(false);
  const [anomalyCache, setAnomalyCache] = useState({});
  const [newLabel, setNewLabel] = useState("");
  const [lockedAnnotations, setLockedAnnotations] = useState([]);

// Add this useEffect to fetch existing treatment plan on component mount
useEffect(() => {
  const loadExistingTreatmentPlan = async () => {
    // Fetch the existing treatment plan
    const response = await fetch(`${apiUrl}/get-treatment-plan?patientId=${sessionStorage.getItem('patientId')}`, {
      method: "GET",
      headers: {
        Authorization: sessionStorage.getItem("token"),
      },
    });

    const data = await response.json();
    console.log(data)
    if (data.success && data.treatmentPlan) {
      setTreatments(data.treatmentPlan.treatments || []);
      
      // Get unique anomaly types from the treatments
      const anomalyTypesInTreatment = [...new Set(
        data.treatmentPlan.treatments
          .filter(t => t.anomalyType) // Only consider treatments with anomalyType
          .map(t => t.anomalyType)
      )];
      
      // Find the annotation indices for these specific anomaly types
      const lockedAnomalies = [];
      
      annotations.forEach((anno, index) => {
        if (anomalyTypesInTreatment.includes(anno.label)) {
          lockedAnomalies.push(index);
        }
      });
      
      // Lock these specific anomalies and check them
      setLockedAnnotations(lockedAnomalies);
      setCheckedAnnotations(prev => [...new Set([...prev, ...lockedAnomalies])]);
      
      // Update selectedTeeth based on treatments
      const teethFromTreatments = data.treatmentPlan.treatments
        .filter(t => !isNaN(parseInt(t.toothNumber)))
        .map(t => parseInt(t.toothNumber));
      
      setSelectedTeeth([...new Set(teethFromTreatments)]);
    }
  };
  
  if (annotations.length > 0) {
    loadExistingTreatmentPlan();
  }
}, [annotations]);

// Update this effect to keep locked annotations checked
useEffect(() => {
  // Ensure all locked annotations remain checked
  setCheckedAnnotations(prev => {
    const newChecked = [...prev];
    lockedAnnotations.forEach(index => {
      if (!newChecked.includes(index)) {
        newChecked.push(index);
      }
    });
    return newChecked;
  });
}, [lockedAnnotations]);
  // Group annotations by their category
  const handleAnnotationClick = async (anno, index) => {
    if (index !== popoverOpen) {
      try {
        // Fetch data from the API
        const response = await axios.get(`${apiUrl}/get-className?className=` + anno.label,{
          headers:{
            Authorization:sessionStorage.getItem('token')
          }
        });
        // console.log(response.data)
        setPopoverData(response.data);
        sessionStorage.setItem('token', response.headers['new-token'])
        setPopoverOpen(index);
        if (response.data === null) {
          setPopoverData({ description: "Please contact admin", className: "Data Missing" })
          setPopoverOpen(index);
        }
      } catch (err) {
        if(err.status===403||err.status===401){
          sessionStorage.removeItem('token');
          setRedirectToLogin(true);
        }
        else{
          logErrorToServer(err, "handleAnnotationClick");
        setPopoverData({ description: "unable to fetch data", className: "error" })
        setPopoverOpen(index);
        console.log('Error fetching className:', err);
        }
      }
    }
    else {
      setPopoverOpen(null);
    }
  };

  // Function to convert CDT code response
  const convertCdtCode = (cdtCodes) => {
    return cdtCodes.map(code => ({
      code: code["Procedure Code"],
      description: code["Description of Service"],
      price: code["Average Fee"] || 0,
      unit: code["Unit"] || "tooth"
    }));
  };

  // Calculate overlap between two bounding boxes
  const calculateOverlap = (boxA, boxB) => {
    const [ax1, ay1, ax2, ay2] = [boxA[0].x, boxA[0].y, boxA[2].x, boxA[2].y];
    const [bx1, by1, bx2, by2] = [boxB[0].x, boxB[0].y, boxB[2].x, boxB[2].y];
  
    const x_overlap = Math.max(0, Math.min(ax2, bx2) - Math.max(ax1, bx1));
    const y_overlap = Math.max(0, Math.min(ay2, by2) - Math.max(ay1, by1));
  
    return x_overlap * y_overlap;
  };
  // Find which tooth each anomaly is associated with
const findToothForAnomaly = (annotationsList, anomalyCacheData = anomalyCache) => {
  const toothAnnotations = annotationsList.filter(a => !isNaN(parseInt(a.label)));
  const anomalyAnnotations = annotationsList.filter(a => anomalyCacheData[a.label]);
  console.log(toothAnnotations, anomalyAnnotations, annotationsList)
  const anomalyToToothMap = {};

  anomalyAnnotations.forEach(anomaly => {
    let teethWithOverlap = [];

    toothAnnotations.forEach(tooth => {
      const overlapArea = calculateOverlap(anomaly.bounding_box, tooth.bounding_box);
      if (overlapArea > 0) {
        teethWithOverlap.push({ tooth: tooth.label, overlap: overlapArea });
      }
    });

    if (teethWithOverlap.length > 0) {
      teethWithOverlap.sort((a, b) => b.overlap - a.overlap);
      anomalyToToothMap[anomaly.label] = teethWithOverlap.map(t => t.tooth);
    }
  });
  return anomalyToToothMap;
};

  // Get which quadrant a tooth belongs to
  const getQuadrantForTooth = (toothNumber) => {
    const num = parseInt(toothNumber);
    if (num >= 1 && num <= 8) return "UR"; // Upper Right
    if (num >= 9 && num <= 16) return "UL"; // Upper Left
    if (num >= 17 && num <= 24) return "LL"; // Lower Left
    if (num >= 25 && num <= 32) return "LR"; // Lower Right
    return "unknown";
  };

  // Check anomalies with server to populate cache
  const checkAnomaliesWithServer = async (annotations) => {
    const uniqueLabels = [...new Set(annotations
      .filter(a => isNaN(parseInt(a.label))) // Non-numeric labels
      .map(a => a.label)
    )];
    
    const uncheckedLabels = uniqueLabels.filter(label => !(label in anomalyCache));

    if (uncheckedLabels.length > 0) {
      try {
        const response = await fetch(`${apiUrl}/checkAnomalies`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: sessionStorage.getItem("token"),
          },
          body: JSON.stringify({ labels: uncheckedLabels }),
        });

        const data = await response.json();
        
        Object.assign(anomalyCache, data);
      } catch (error) {
        console.error("Error checking anomalies:", error);
      }
    }

    return anomalyCache;
  };

  // Fetch CDT codes from RAG system
  const fetchCdtCodesFromRAG = async (anomaly, convertedCdtCode) => {
    try {
      const response = await fetch(`${apiUrl}/chat-with-rag`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: sessionStorage.getItem("token"),
        },
        body: JSON.stringify({ 
          query: `Give me the CDT codes for treating moderate risk ${anomaly} only. it should in the form D____.`,
          promptTemplate: "You are an expert in dentistry"
        }),
      });
  
      const ragText = await response.json();
      return parseCdtCodes(ragText.answer, convertedCdtCode, anomaly);
    } catch (error) {
      console.error("Error fetching CDT codes:", error);
      return [];
    }
  };

  // Parse CDT codes from RAG response
  const parseCdtCodes = (ragResponse, convertedCdtCode, anomalyType) => {
    const cdtCodes = [];
    const lines = ragResponse.split("\n");
    const codeList = [];
      
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      // Match D followed by 4 or 5 digits, with optional colon
      const codeMatches = line.match(/D\d{4,5}/g);
      if (codeMatches) {
        for (const code of codeMatches) {
          // Find the complete details from the dctCodes array and add only if it does not already exist
          const codeDetails = convertedCdtCode.find(c => c.code === code);
          console.log(codeDetails, code)
          if (codeDetails && !codeList.find(c => c.code === code)) {
            console.log(codeDetails)
            cdtCodes.push({
              code: code,
              description: codeDetails.description,
              price: codeDetails.price,
              unit: codeDetails.unit || "tooth", // Include unit information
              anomalyType: anomalyType // Store the anomaly type with the treatment
            });
            codeList.push({
              code: code,
              description: codeDetails.description,
              price: codeDetails.price,
              unit: codeDetails.unit || "tooth",
              anomalyType: anomalyType
            });
          }
        }
      }
    }
    console.log(cdtCodes, ragResponse, convertedCdtCode, anomalyType)
    return cdtCodes;
  };

  // Autofill treatments based on annotations
  const autofillTreatments = async (annotationsList, convertedCdtCode) => {
    await checkAnomaliesWithServer(annotationsList);
  
    const anomalyToToothMap = findToothForAnomaly(annotationsList);
    console.log(anomalyToToothMap)
    for (const [anomaly, toothNumbers] of Object.entries(anomalyToToothMap)) {
      const cdtCodes = await fetchCdtCodesFromRAG(anomaly, convertedCdtCode);
      if (cdtCodes.length > 0) {
        return handleAutoFillTreatments(toothNumbers, cdtCodes, anomaly);
      }
    }
  };

  // Handle auto-filling treatments
  const handleAutoFillTreatments = (toothNumberArray, cdtData, anomalyType) => {
    const newTreatments = [];
    console.log(newTreatments, toothNumberArray, cdtData, anomalyType)
    cdtData.forEach(code => {
      // Handle different unit types
      if (code.unit && code.unit.toLowerCase() === "full mouth") {
        // For full mouth, create only one treatment with a special tooth number
        newTreatments.push({
          id: Date.now() + Math.random(),
          toothNumber: "fullmouth", // Special identifier for full mouth
          anomalyType: anomalyType,
          ...code
        });
      } else if (code.unit && code.unit.toLowerCase() === "visit") {
        // For per visit, create only one treatment with a special tooth number
        newTreatments.push({
          id: Date.now() + Math.random(),
          toothNumber: "visit", // Special identifier for per visit
          anomalyType: anomalyType,
          ...code
        });
      } else if (code.unit && code.unit.toLowerCase() === "quadrant") {
        // For quadrant, group teeth by quadrant
        const quadrants = {};
        
        toothNumberArray.forEach(tooth => {
          const quadrant = getQuadrantForTooth(tooth);
          if (!quadrants[quadrant]) {
            quadrants[quadrant] = [];
          }
          quadrants[quadrant].push(tooth);
        });
        
        // Create one treatment per quadrant
        Object.keys(quadrants).forEach(quadrant => {
          newTreatments.push({
            id: Date.now() + Math.random(),
            toothNumber: quadrant, // Use quadrant as the identifier
            affectedTeeth: quadrants[quadrant], // Store affected teeth
            anomalyType: anomalyType,
            ...code
          });
        });
      } else {
        // For individual teeth (default case)
        toothNumberArray.forEach(toothNumber => {
          newTreatments.push({
            id: Date.now() + Math.random(),
            toothNumber: toothNumber.toString(),
            anomalyType: anomalyType,
            ...code
          });
        });
      }
    });
    
    if (newTreatments.length > 0) {
      const updatedTreatments = [...treatments, ...newTreatments]
      setTreatments(prev => [...prev, ...newTreatments]);
      console.log(newTreatments)
      // Ensure all new tooth numbers are added to selectedTeeth (avoid duplicates)
      const toothNumsToAdd = toothNumberArray.filter(t => !isNaN(parseInt(t)));
      setSelectedTeeth(prev => [...new Set([...prev, ...toothNumsToAdd])]);
      return updatedTreatments
    }
  };

  // Save treatment plan
  const saveTreatmentPlan = async (updatedTreatments) => {
    setSavingPlan(true);
    try {
      const response = await fetch(`${apiUrl}/save-treatment-plan`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: sessionStorage.getItem("token"),
        },
        body: JSON.stringify({
          patientId: sessionStorage.getItem('patientId'),
          treatments: updatedTreatments,
          created_by: "test"
        }),
      });

      const data = await response.json();
      if (data.success) {
        setTreatmentPlanSaved(true);
        alert("Treatment plan saved successfully!");
      }
    } catch (error) {
      console.error("Error saving treatment plan:", error);
      alert("Error saving treatment plan");
    } finally {
      setSavingPlan(false);
    }
  };

  // Generate treatment plan
const generateTreatmentPlan = async () => {
  setIsLoading(true);
  setGeneratingPlan(true);
  
  try {
    // Get only the non-locked selected annotations
    const nonLockedCheckedAnnotations = checkedAnnotations.filter(
      index => !lockedAnnotations.includes(index)
    );
    
    // First fetch the DCT codes if they're not already loaded
    if (dctCodes.length === 0) {
      const response = await fetch(`${apiUrl}/getCDTCodes`, {
        headers: {
          Authorization: sessionStorage.getItem('token')
        }
      });
      const data = await response.json();
      const convertedCodes = convertCdtCode(data.cdtCodes);
      setDctCodes(convertedCodes);
      setFilteredCodes(convertedCodes);
      
      // Now handle ONLY the non-locked selected annotations
      if (nonLockedCheckedAnnotations.length > 0) {
        // Get the non-locked selected annotations
        const newAnomalyAnnotations = nonLockedCheckedAnnotations.map(index => annotations[index]);
        
        // Get all tooth annotations (numeric labels) regardless of locked status
        const toothAnnotations = annotations.filter(anno => !isNaN(parseInt(anno.label)));
        
        // Combine them for processing
        const selectedAnnos = [...newAnomalyAnnotations, ...toothAnnotations];
        
        const updatedTreatments = await autofillTreatments(selectedAnnos, convertedCodes);
        
        // Lock the newly added anomalies
        const newLockedAnnotations = nonLockedCheckedAnnotations.filter(index => {
          const anno = annotations[index];
          return isNaN(parseInt(anno.label)) && anomalyCache[anno.label]; // Only lock anomalies
        });
        setLockedAnnotations(prev => [...new Set([...prev, ...newLockedAnnotations])]);
        saveTreatmentPlan(updatedTreatments)
      }
    } else {
      // DCT codes already loaded, just process selected annotations
      if (nonLockedCheckedAnnotations.length > 0) {
        // Get the non-locked selected annotations
        const newAnomalyAnnotations = nonLockedCheckedAnnotations.map(index => annotations[index]);
        
        // Get all tooth annotations (numeric labels) regardless of locked status
        const toothAnnotations = annotations.filter(anno => !isNaN(parseInt(anno.label)));
        
        // Combine them for processing
        const selectedAnnos = [...newAnomalyAnnotations, ...toothAnnotations];
        
        const updatedTreatments = await autofillTreatments(selectedAnnos, dctCodes);
        
        // Lock the newly added anomalies
        const newLockedAnnotations = nonLockedCheckedAnnotations.filter(index => {
          const anno = annotations[index];
          return isNaN(parseInt(anno.label)) && anomalyCache[anno.label]; // Only lock anomalies
        });
        setLockedAnnotations(prev => [...new Set([...prev, ...newLockedAnnotations])]);
        saveTreatmentPlan(updatedTreatments)
      }
    }
  } catch (error) {
    console.error("Error generating treatment plan:", error);
    alert("Error generating treatment plan");
  } finally {
    setGeneratingPlan(false);
    setIsLoading(false);
  }
};

  // Function to handle checkbox changes
  const handleCheckboxChange = (index) => {
    // If the annotation is locked, don't allow unchecking
    if (lockedAnnotations.includes(index)) {
      return; // Do nothing - the checkbox must remain checked
    }
    
    setCheckedAnnotations(prev => {
      if (prev.includes(index)) {
        return prev.filter(i => i !== index);
      } else {
        return [...prev, index];
      }
    });
  };

  // Function to handle "Add to Treatment Plan" button click
  const handleAddToTreatmentPlan = () => {
    if (checkedAnnotations.length - lockedAnnotations.length === 0) {
      alert("Please select at least one annotation");
      return;
    }
    
    generateTreatmentPlan();
  };

  const dispatch = useDispatch();
  
  const getYouTubeId = (url) => {
    if (!url) return null; // Return null if the URL is undefined or null
    const match = url.match(/(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([^&?\n]+)/);
    return match ? match[1] : null;
  };
  
  const isCategoryHidden = (category) => {
    const categoryAnnotations = groupedAnnotations[category].map((anno) =>
      annotations.findIndex((a) => a === anno)
    );
    return categoryAnnotations.every((index) => hiddenAnnotations.includes(index));
  };
  
  const hideBox = (id) => {
    setHiddenAnnotations([...hiddenAnnotations, id]);
  };

  const unhideBox = (id) => {
    setHiddenAnnotations(hiddenAnnotations.filter(hid => hid !== id));
  };
  
  const hideCategory = (category) => {
    const annotationsToHide = groupedAnnotations[category].map((anno) => 
        annotations.findIndex(a => a === anno)
    );
    setHiddenAnnotations(prev => [...prev, ...annotationsToHide]);
  };
  
  const unhideCategory = (category) => {
    const annotationsToUnhide = groupedAnnotations[category].map((anno) => 
        annotations.findIndex(a => a === anno)
    );
    setHiddenAnnotations(prev => prev.filter(index => !annotationsToUnhide.includes(index)));
  };
  
  const unhideAllBoxes = () => {
    setHiddenAnnotations([]);
  };
  
  const hideAllBoxes = () => {
    const allIndices = annotations.map((_, index) => index);
    setHiddenAnnotations(allIndices);
  };
  
  useEffect(() => {
    dispatch(changeMode('dark'));
  }, []);
  
  const handleClickOutside = (event) => {
    if (popoverRef.current && !popoverRef.current.contains(event.target)) {
      setPopoverOpen(null);
    }
  };
  const handleSelectAnnotation =()=>{
    setSelectedAnnotation(null); 
    setIsEraserActive(false);
  }
  
  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  useEffect(()=>{
    let updatedGroupedAnnotations={}
    let updatedHideGroups={}
    annotations.forEach(anno => {
      const category = classCategories[anno.label.toLowerCase()]; // Get category from label
      if (category) {
        if(updatedGroupedAnnotations[category]===undefined){
          updatedGroupedAnnotations[category]=[]
          updatedHideGroups[category]=false
        }
        updatedGroupedAnnotations[category].push(anno);
      } else {
        if(updatedGroupedAnnotations['Others']===undefined){
          updatedGroupedAnnotations['Others']=[]
          updatedHideGroups['Others']=false
        }
        updatedGroupedAnnotations['Others'].push(anno); // Add to 'Others' if no matching category
      }
      setGroupedAnnotations(updatedGroupedAnnotations);
      setHideGroup(updatedHideGroups);
    });
  },[classCategories,annotations])
  
  useEffect(() => {
    hiddenAnnotations.length !== annotations.length ? setHideAllAnnotations(false) : setHideAllAnnotations(true);
    const updatedHideGroup = { ...hideGroup };
    Object.keys(groupedAnnotations).forEach((category) => {
      updatedHideGroup[category]=isCategoryHidden(category);
    });
    setHideGroup(updatedHideGroup);

  }, [hiddenAnnotations, annotations, groupedAnnotations]);
  
  if(redirectToLogin){
    return <Navigate to="/login"/>
  }
  
  return (
    <Card style={{ maxHeight: '90vh', maxWidth: '100%', borderRight: '1px solid #ccc', overflowY:'auto' }}>
      <CardBody>
        <Row>
          <Col md={8}><h5>Annotations ({annotations.length})</h5></Col>
          <Col md={4} style={{ justifyContent: 'right', alignItems: 'right', textAlign: 'right' }}>
            <button
                id="btnHideShowAll"
                type="button"
                style={{
                  cssText: 'padding: 2px !important',
                }}
                className="btn noti-icon"
                onClick={(e) => {
                  e.stopPropagation();
                  if (hideAllAnnotations) {
                    unhideAllBoxes();
                    setHideAllAnnotations(false);
                  } else {
                    hideAllBoxes();
                    setHideAllAnnotations(true);
                  }
                }}
              >
                <i className={`ion ${hideAllAnnotations ? 'ion-md-eye-off' : 'ion-md-eye'}`}></i>
              </button>
                <UncontrolledTooltip placement="bottom" target="btnHideShowAll">
                  {`${hideAllAnnotations ? 'Show All' : 'Hide All'}`}
                </UncontrolledTooltip>
          </Col>
        </Row>
        <Row>
          <Col md={12}>
          <div>
    {/* Loop over each category */}
    {desiredOrder.map((category) => {
      if (groupedAnnotations[category]) {
        return (
          <div key={category}>
            {/* Display the category name */}
            <h5>
              {category}
              <button
                id={`btnHide${category}`}
                type="button"
                className="btn noti-icon"
                onClick={(e) => {
                  e.stopPropagation();
                  if (hideGroup[category]) {
                    unhideCategory(category);
                    setHideGroup((prev) => ({ ...prev, [category]: false }));
                  } else {
                    hideCategory(category);
                    setHideGroup((prev) => ({ ...prev, [category]: true }));
                  }
                }}
              >
                <i className={`ion ${hideGroup[category] ? 'ion-md-eye-off' : 'ion-md-eye'}`}></i>
              </button>
            </h5>

            <ListGroup flush>
              {/* Loop over each annotation in the current category */}
              {groupedAnnotations[category].map((anno, index) => {
                const globalIndex = annotations.findIndex((a) => a === anno);
                if (globalIndex !== -1) {
                  return (
                    <ListGroupItem
                      key={globalIndex}
                      id={`annotation-${globalIndex}`}
                      className="d-flex align-items-center justify-content-between list-group-item-hover"
                      style={{
                        cursor: 'pointer',
                        paddingRight: '0',
                        paddingLeft: '0',
                        paddingTop: '0',
                        paddingBottom: '0',
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAnnotationClick(anno, globalIndex);
                      }}
                      onMouseEnter={() => handleHover(globalIndex)}
                      onMouseLeave={() => handleHover(null)}
                    >
                      {/* Checkbox */}
                      <div className="pl-2 pr-2 d-flex align-items-center">
                        <Input
                          type="checkbox"
                          checked={checkedAnnotations.includes(globalIndex)}
                          onChange={(e) => {
                            e.stopPropagation();
                            handleCheckboxChange(globalIndex);
                          }}
                          onClick={(e) => e.stopPropagation()}
                          disabled={lockedAnnotations.includes(globalIndex)}
                          style={{
                            cursor: lockedAnnotations.includes(globalIndex) ? 'not-allowed' : 'pointer'
                          }}
                        />
                        {lockedAnnotations.includes(globalIndex) && (
                          <>
                          <span
                            className="ml-1 text-muted"
                            style={{ fontSize: '12px' }}
                            id={`locked-${globalIndex}`}
                          >
                            <i className="mdi mdi-lock-outline"></i>
                          </span>
                        
                        <UncontrolledTooltip placement="top" target={`locked-${globalIndex}`}>
                          This anomaly is included in the treatment plan and cannot be unchecked
                        </UncontrolledTooltip></>
                        )}
                      </div>
                      
                      {/* Show dropdown if this annotation is selected and has a numeric label */}
                      {selectedAnnotation === anno && !isNaN(parseInt(anno.label)) ? (
                        <div style={{ flexGrow: 1 }} onClick={e => e.stopPropagation()}>
                          <InputGroup size="sm">
                            <Input
                              type="select"
                              value={newLabel || anno.label}
                              onChange={e => {
                                setNewLabel(e.target.value);
                                handleLabelChange(e.target.value);
                              }}
                            >
                              {Array.from({ length: 32 }, (_, i) => i + 1).map(num => (
                                <option key={num} value={num.toString()}>
                                  {num}
                                </option>
                              ))}
                            </Input>
                          </InputGroup>
                        </div>
                      ) : (
                        <span style={{ flexGrow: 1 }}>{anno.label}{anno.created_by ? anno.created_by.startsWith("Model v") ? "" : " (M)" : ""}</span>
                      )}
                      
                      <div className="d-flex">
                        {/* Delete Button */}
                        <button
                          id="btnRemove"
                          type="button"
                          style={{ cssText: 'padding: 2px !important', fontSize: '20px' }}
                          className="btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteBox(globalIndex);
                          }}
                        >
                          <i className="mdi mdi-trash-can"></i>
                        </button>

                        {/* Hide/Show Button */}
                        <button
                          id="btnHideShow"
                          type="button"
                          className="btn noti-icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            hiddenAnnotations.includes(globalIndex)
                              ? unhideBox(globalIndex)
                              : hideBox(globalIndex);
                          }}
                        >
                          <i className={`ion ${hiddenAnnotations.includes(globalIndex) ? 'ion-md-eye-off' : 'ion-md-eye'}`}></i>
                        </button>

                        {/* Edit Button */}
                        <button
                          id="btnEdit"
                          type="button"
                          style={{ cssText: 'padding: 2px !important', fontSize: '20px' }}
                          className="btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (selectedAnnotation === anno) {
                              handleSelectAnnotation();
                            } else {
                              setSelectedAnnotation(anno);
                              if (!isNaN(parseInt(anno.label))) {
                                setNewLabel(anno.label);
                              }
                            }
                          }}
                        >
                          <i
                            className={`mdi ${
                              selectedAnnotation === anno
                                ? 'mdi-lead-pencil'
                                : 'mdi-pencil-box-outline'
                            }`}
                          ></i>
                        </button>
                      </div>
                    </ListGroupItem>
                  );
                }
              })}
            </ListGroup>
          </div>
        );
      }
    })}
            </div>
            </Col>
        </Row>
        
        {/* Add the "Add to Treatment Plan" button */}
        <Row className="mt-3">
          <Col md={12}>
            <Button 
              color="primary" 
              block
              disabled={checkedAnnotations.length - lockedAnnotations.length === 0 || isLoading || generatingPlan}
              onClick={handleAddToTreatmentPlan}
            >
              {isLoading || generatingPlan ? 
                "Processing..." : 
                `Add to Treatment Plan (${checkedAnnotations.length - lockedAnnotations.length} selected)`}
            </Button>
          </Col>
        </Row>

        {/* Show saved confirmation if applicable */}
        {treatmentPlanSaved && (
          <Row className="mt-2">
            <Col md={12}>
              <div className="alert alert-success">
                Treatment plan saved successfully!
              </div>
            </Col>
          </Row>
        )}
      </CardBody>
    </Card>
  );
};

export default AnnotationList;