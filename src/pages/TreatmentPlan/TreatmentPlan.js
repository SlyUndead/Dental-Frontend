import React, { useState, useEffect } from 'react';
import {
  Card,
  CardBody,
  CardHeader,
  CardTitle,
  Table,
  Button,
  ButtonGroup,
  Input,
  InputGroup,
  InputGroupText,
  Modal,
  ModalHeader,
  ModalBody,
  Badge,
  Row,
  Col,
  Spinner,
  Collapse,
  CardFooter
} from 'reactstrap';
import { setBreadcrumbItems } from 'store/actions';
import { connect } from "react-redux";
import { calculateOverlap } from 'pages/AnnotationTools/path-utils';
import { Navigate } from 'react-router-dom';
import { logErrorToServer } from 'utils/logError';

const DentalTreatmentPlan = (props) => {
  const [selectedTeeth, setSelectedTeeth] = useState([]);
  const [treatments, setTreatments] = useState([]);
  const [dctCodes, setDctCodes] = useState([]);
  const [selectedTooth, setSelectedTooth] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredCodes, setFilteredCodes] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [openGroups, setOpenGroups] = useState({});
  const [redirectToLogin, setRedirectToLogin] = useState(false);
  const [redirectToAnnotationPage, setRedirectToAnnotationPage] = useState(false);
  const [treatmentCodes, setTreatmentCodes] = useState([])
  const apiUrl = process.env.REACT_APP_NODEAPIURL;
  document.title = "Treatment Plan | AGP Dental Tool";
  const breadcrumbItems = [
    { title: `${sessionStorage.getItem('firstName')} ${sessionStorage.getItem('lastName')}`, link: "/practiceList" },
    { title: sessionStorage.getItem('practiceName'), link: "/patientList" },
    { title: `${sessionStorage.getItem('patientName')}`, link: "/patientImagesList" },
    { title: "Treatment Plan", link:"/treatmentPlan"}
  ];
  // Add these to your existing useState declarations at the top
const [treatmentPlanSaved, setTreatmentPlanSaved] = useState(false);
const [savingPlan, setSavingPlan] = useState(false);
const [generatingPlan, setGeneratingPlan] = useState(false);

// Add these functions to handle saving and fetching treatment plans
const saveTreatmentPlan = async () => {
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
        treatments: treatments,
        created_by:"test"
      }),
    });

    const data = await response.json();
    if (data.success) {
      setTreatmentPlanSaved(true);
      // Show success message or notification here
    }
  } catch (error) {
    if(error.status===403||error.status===401){
      sessionStorage.removeItem('token');
      setRedirectToLogin(true);
    }
    else{
      logErrorToServer(error, "getPatientList");
      console.log(error)
    }
  } finally {
    setSavingPlan(false);
  }
};

const fetchExistingTreatmentPlan = async () => {
  try {
    const response = await fetch(`${apiUrl}/get-treatment-plan?patientId=${sessionStorage.getItem('patientId')}`, {
      method: "GET",
      headers: {
        Authorization: sessionStorage.getItem("token"),
      },
    });

    const data = await response.json();
    if (data.success && data.treatmentPlan) {
      setTreatments(data.treatmentPlan.treatments || []);
      
      // Update selectedTeeth based on treatments
      const teethFromTreatments = data.treatmentPlan.treatments
        .filter(t => !isNaN(parseInt(t.toothNumber)))
        .map(t => parseInt(t.toothNumber));
      
      setSelectedTeeth([...new Set(teethFromTreatments)]);
      setTreatmentPlanSaved(true);
      return teethFromTreatments
    }
    else {
        return []
    }
  } catch (error) {
    if(error.status===403||error.status===401){
      sessionStorage.removeItem('token');
      setRedirectToLogin(true);
    }
    else{
    logErrorToServer(error, "getPatientList");
    console.log(error)
    }
  }
};

const generateTreatmentPlan = async () => {
  setIsLoading(true);
  setGeneratingPlan(true);
  
  try {
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
      
      // Now fetch JSON files and process them
      const jsonResponse = await fetch(`${apiUrl}/get-annotations-for-treatment-plan?patientId=` + sessionStorage.getItem('patientId'), {
        method: "GET",
        headers: {
          Authorization: sessionStorage.getItem("token"),
        },
      });
      
      const jsonFiles = await jsonResponse.json();
      if (jsonFiles.images && jsonFiles.images.length > 0) {
        await processJsonFiles(jsonFiles.images, convertedCodes);
      }
    } else {
      // DCT codes already loaded, just fetch and process JSON files
      const response = await fetch(`${apiUrl}/get-annotations-for-treatment-plan?patientId=` + sessionStorage.getItem('patientId'), {
        method: "GET",
        headers: {
          Authorization: sessionStorage.getItem("token"),
        },
      });
      
      const jsonFiles = await response.json();
      if (jsonFiles.images && jsonFiles.images.length > 0) {
        await processJsonFiles(jsonFiles.images, dctCodes);
      }
    }
  } catch (error) {
    if(error.status===403||error.status===401){
      sessionStorage.removeItem('token');
      setRedirectToLogin(true);
    }
    else{
    logErrorToServer(error, "getPatientList");
    console.log(error)
    }
  } finally {
    setGeneratingPlan(false);
    setIsLoading(false);
  }
};
  // Fetch DCT codes from your server
  const convertCdtCode = (cdtData) => {
    return cdtData.map(cdt => ({
      code: cdt["Procedure Code"],
      description: cdt["Description of Service"],
      price: parseFloat(cdt["Average Fee"]),
      unit: cdt["Unit"] || "tooth", // Include unit information
    }));
  };

  // Handle search filter
  useEffect(() => {
    const filtered = dctCodes.filter(code => 
      code.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      code.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      treatmentCodes.some(treatment => 
        treatment.anomaly.toLowerCase().includes(searchTerm.toLowerCase()) &&
        treatment.treatment_codes.includes(code.code) // Ensure it matches a relevant treatment code
    )
    );
    setFilteredCodes(filtered);
  }, [searchTerm, dctCodes]);

  const getToothTreatments = (toothNumber) => {
    // Ensure consistent comparison by converting both to numbers
    return treatments.filter(t => parseInt(t.toothNumber) === parseInt(toothNumber));
  };

  // Determine which quadrant a tooth belongs to
  const getQuadrantForTooth = (toothNumber) => {
    const tooth = parseInt(toothNumber);
    if (tooth >= 1 && tooth <= 8) return "1st Quadrant";
    if (tooth >= 9 && tooth <= 16) return "2nd Quadrant";
    if (tooth >= 17 && tooth <= 24) return "3rd Quadrant";
    if (tooth >= 25 && tooth <= 32) return "4th Quadrant";
    return "Unknown Quadrant";
  };

  const handleToothClick = (toothNumber) => {
    if (!selectedTeeth.includes(toothNumber)) {
      setSelectedTeeth([...selectedTeeth, toothNumber]);
    }
    setSelectedTooth(toothNumber);
    setModalOpen(true);
  };

  const findToothForAnomaly = (annotations) => {
    const toothAnnotations = annotations.filter(a => !isNaN(parseInt(a.label)));
    const anomalyAnnotations = annotations.filter(a => anomalyCache[a.label]);

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
      if(error.status===403||error.status===401){
        sessionStorage.removeItem('token');
        setRedirectToLogin(true);
      }
      else{
      logErrorToServer(error, "getPatientList");
      console.log(error)
      }
      return [];
    }
  };
  
  const parseCdtCodes = (ragResponse, convertedCdtCode, anomalyType) => {
    const cdtCodes = [];
    const lines = ragResponse.split("\n");
      const codeList =[]
      for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      // Match D followed by 4 or 5 digits, with optional colon
      const codeMatches = line.match(/D\d{4,5}/g);
      if (codeMatches) {
        for (const code of codeMatches) {
          // Find the complete details from the dctCodes array and add only if it does not already exist
          const codeDetails = convertedCdtCode.find(c => c.code === code);
          if (codeDetails && !codeList.find(c=>c.code===code)) {
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
    
    return cdtCodes;
  };
  
  const autofillTreatments = async (annotations, convertedCdtCode) => {
    await checkAnomaliesWithServer(annotations.annotations);
  
    const anomalyToToothMap = findToothForAnomaly(annotations.annotations);
    for (const [anomaly, toothNumbers] of Object.entries(anomalyToToothMap)) {
      const cdtCodes = await fetchCdtCodesFromRAG(anomaly, convertedCdtCode);
      if (cdtCodes.length > 0) {
        handleAutoFillTreatments(toothNumbers, cdtCodes, anomaly);
      }
    }
  };
  
  const handleAutoFillTreatments = (toothNumberArray, cdtData, anomalyType) => {
    // Create treatments for each tooth in the array
    const newTreatments = [];
    
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
      setTreatments(prev => [...prev, ...newTreatments]);
  
      // Ensure all new tooth numbers are added to selectedTeeth (avoid duplicates)
      const toothNumsToAdd = toothNumberArray.filter(t => !isNaN(parseInt(t)));
      setSelectedTeeth(prev => [...new Set([...prev, ...toothNumsToAdd])]);
    }
  };
  
  const processJsonFiles = async (jsonFiles, convertedCdtCode) => {
    for (const jsonFile of jsonFiles) {
      if (jsonFile.annotations && jsonFile.annotations.annotations) {
        await autofillTreatments(jsonFile.annotations.annotations, convertedCdtCode);
      }
    }
    setIsLoading(false);
  };
  
  useEffect(() => {
    props.setBreadcrumbItems('Treatment Plan', breadcrumbItems);
    const fetchData = async () => {
      // First check if there's an existing treatment plan
      const treatmentPlanExists = await fetchExistingTreatmentPlan();
      
      // Then fetch the DCT codes
      try {
        const response = await fetch(`${apiUrl}/getCDTCodes`, {
          headers: {
            Authorization: sessionStorage.getItem('token')
          }
        });
        const data = await response.json();
        const convertedCodes = convertCdtCode(data.cdtCodes);
        setDctCodes(convertedCodes);
        setFilteredCodes(convertedCodes);
        const response1 = await fetch(`${apiUrl}/get-treatment-codes`, {
          headers: {
            Authorization: sessionStorage.getItem('token')
          }
        });
        const data1 = await response1.json()
        setTreatmentCodes(data1.user1)
        // Only fetch JSON files if we don't already have a treatment plan
        setIsLoading(false);
      } catch (error) {
        if(error.status===403||error.status===401){
          sessionStorage.removeItem('token');
          setRedirectToLogin(true);
        }
        else{
        logErrorToServer(error, "getPatientList");
        console.log(error)
        console.error('Error fetching DCT codes:', error);
        // Sample data as fallback
        const sampleData = [
          { code: 'D2140', description: 'Amalgam filling - one surface', price: 150.00, unit: "tooth" },
          { code: 'D2150', description: 'Amalgam filling - two surfaces', price: 200.00, unit: "tooth" },
          { code: 'D2160', description: 'Amalgam filling - three surfaces', price: 250.00, unit: "tooth" },
        ];
        setDctCodes(sampleData);
        setFilteredCodes(sampleData);
        
        // Still fetch JSON files even after using fallback data
        if (treatments.length === 0) {
          await fetchJsonFiles(sampleData);
        } else {
          setIsLoading(false);
        }
      }
    }
    };
    
    const fetchJsonFiles = async (convertedCdtCode) => {
      try {
        const response = await fetch(`${apiUrl}/get-annotations-for-treatment-plan?patientId=` + sessionStorage.getItem('patientId'), {
          method: "GET",
          headers: {
            Authorization: sessionStorage.getItem("token"),
          },
        });
  
        const jsonFiles = await response.json();
        if (jsonFiles.images && jsonFiles.images.length > 0) {
          processJsonFiles(jsonFiles.images, convertedCdtCode);
        } else {
          setIsLoading(false);
        }
      } catch (error) {
        if(error.status===403||error.status===401){
          sessionStorage.removeItem('token');
          setRedirectToLogin(true);
        }
        else{
        logErrorToServer(error, "getPatientList");
        console.log(error)
        setIsLoading(false);
      }
    }
    };
    
    // Start the sequence
    setIsLoading(true);
    fetchData();
  }, []);

  const anomalyCache = {}; // Cache to store label anomaly status

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
        if(error.status===403||error.status===401){
          sessionStorage.removeItem('token');
          setRedirectToLogin(true);
        }
        else{
        logErrorToServer(error, "getPatientList");
        console.log(error)
        }
      }
    }

    return anomalyCache;
  };
  
  const handleDctCodeSelect = (code) => {
    if (code.unit && code.unit.toLowerCase() === "full mouth") {
      // For full mouth treatment
      const newTreatment = {
        id: Date.now(),
        toothNumber: "fullmouth",
        anomalyType: "Manually Selected Procedures",
        ...code
      };
      setTreatments([...treatments, newTreatment]);
    } else if (code.unit && code.unit.toLowerCase() === "visit") {
      // For per visit treatment
      const newTreatment = {
        id: Date.now(),
        toothNumber: "visit",
        anomalyType: "Manually Selected Procedures",
        ...code
      };
      setTreatments([...treatments, newTreatment]);
    } else if (code.unit && code.unit.toLowerCase() === "quadrant") {
      // For quadrant treatment, use the quadrant of the selected tooth
      const quadrant = getQuadrantForTooth(selectedTooth);
      const newTreatment = {
        id: Date.now(),
        toothNumber: quadrant,
        affectedTeeth: [selectedTooth], // Initially only includes the selected tooth
        anomalyType: "Manually Selected Procedures",
        ...code
      };
      setTreatments([...treatments, newTreatment]);
    } else {
      // For individual tooth treatment (default)
      const newTreatment = {
        id: Date.now(),
        toothNumber: selectedTooth.toString(),
        anomalyType: "Manually Selected Procedures",
        ...code
      };
      setTreatments([...treatments, newTreatment]);
    }
    
    setSearchTerm('');
    setModalOpen(false); // Close modal after selection
  };

  const removeTreatment = (id) => {
    const updatedTreatments = treatments.filter(t => t.id !== id);
    setTreatments(updatedTreatments);
    
    // Remove tooth from selected teeth if it has no more treatments
    const treatmentToRemove = treatments.find(t => t.id === id);
    if (treatmentToRemove && !isNaN(parseInt(treatmentToRemove.toothNumber))) {
      const remainingTreatmentsForTooth = updatedTreatments.filter(
        t => t.toothNumber === treatmentToRemove.toothNumber
      );
      if (remainingTreatmentsForTooth.length === 0) {
        setSelectedTeeth(selectedTeeth.filter(t => t !== parseInt(treatmentToRemove.toothNumber)));
      }
    }
  };

  const renderToothButton = (number) => {
    const toothTreatments = getToothTreatments(number);
    return (
      <div key={number} className="d-inline-block text-center m-1">
        <Button
          color={toothTreatments.length>0 ? "primary" : "secondary"}
          onClick={() => handleToothClick(number)}
          className="mb-1"
          size="sm"
        >
          {number}
        </Button>
        {toothTreatments.length > 0 && (
          <Badge
            color="info"
            className="d-block"
            pill
          >
            {toothTreatments.length}
          </Badge>
        )}
      </div>
    );
  };

  // Get treatments organized by their unit type
  const getOrganizedTreatments = () => {
    const organized = {
      teeth: {}, // Individual teeth treatments
      quadrants: {}, // Treatments per quadrant
      fullmouth: [], // Full mouth treatments
      visit: [] // Per visit treatments
    };

    treatments.forEach(treatment => {
      if (treatment.toothNumber === "fullmouth") {
        organized.fullmouth.push(treatment);
      } else if (treatment.toothNumber === "visit") {
        organized.visit.push(treatment);
      } else if (treatment.toothNumber && treatment.toothNumber.includes("Quadrant")) {
        // Quadrant treatments
        if (!organized.quadrants[treatment.toothNumber]) {
          organized.quadrants[treatment.toothNumber] = {};
        }
        
        const anomalyKey = treatment.anomalyType || "Unknown";
        if (!organized.quadrants[treatment.toothNumber][anomalyKey]) {
          organized.quadrants[treatment.toothNumber][anomalyKey] = [];
        }
        
        organized.quadrants[treatment.toothNumber][anomalyKey].push(treatment);
      } else {
        // Individual tooth treatments
        const toothKey = treatment.toothNumber;
        if (!organized.teeth[toothKey]) {
          organized.teeth[toothKey] = {};
        }
        
        const anomalyKey = treatment.anomalyType || "Unknown";
        if (!organized.teeth[toothKey][anomalyKey]) {
          organized.teeth[toothKey][anomalyKey] = [];
        }
        
        organized.teeth[toothKey][anomalyKey].push(treatment);
      }
    });

    return organized;
  };

  // Toggle group collapse
  const toggleGroup = (sectionKey, groupKey) => {
    const groupId = `${sectionKey}-${groupKey}`;
    setOpenGroups({
      ...openGroups,
      [groupId]: !openGroups[groupId]
    });
  };

  // Check if a group is open
  const isGroupOpen = (sectionKey, groupKey) => {
    const groupId = `${sectionKey}-${groupKey}`;
    return !!openGroups[groupId];
  };

  // Calculate total price for a group
  const calculateGroupTotal = (treatments) => {
    return treatments.reduce((sum, t) => sum + t.price, 0).toFixed(2);
  };

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
    );
  }
  if(redirectToLogin){
    return <Navigate to="/login"/>
  }
  if(redirectToAnnotationPage){
    return <Navigate to="/annotationPage"/>
  }
  const organizedTreatments = getOrganizedTreatments();
  const totalPrice = treatments.reduce((sum, t) => sum + t.price, 0).toFixed(2);

  // Render function for each treatment group
  const renderTreatmentGroup = (treatmentList, groupTitle, anomalyKey) => {
    const groupKey = groupTitle.replace(/\s+/g, '-').toLowerCase();
    
    return (
      <div key={`${groupKey}-${anomalyKey}`} className="border-bottom">
        <Button 
          color="link" 
          className="d-flex justify-content-between align-items-center w-100 p-3 text-decoration-none"
          onClick={() => toggleGroup(groupKey, anomalyKey)}
        >
          <div>
            <strong>{anomalyKey}</strong> 
            <Badge color="primary" pill className="ms-2">
              {treatmentList.length}
            </Badge>
          </div>
          <div>
            ${calculateGroupTotal(treatmentList)}
            <i className={`ms-2 mdi mdi-chevron-${isGroupOpen(groupKey, anomalyKey) ? 'up' : 'down'}`}></i>
          </div>
        </Button>
        <Collapse isOpen={isGroupOpen(groupKey, anomalyKey)}>
          <Table responsive bordered className="mb-0">
            <thead className="bg-light">
              <tr>
                <th>DCT Code</th>
                <th>Description</th>
                <th>Unit</th>
                <th>Price</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {treatmentList.map(treatment => (
                <tr key={treatment.id}>
                  <td>{treatment.code}</td>
                  <td>{treatment.description}</td>
                  <td>{treatment.unit || "tooth"}</td>
                  <td>${treatment.price.toFixed(2)}</td>
                  <td>
                    <Button
                      color="danger"
                      size="sm"
                      onClick={() => removeTreatment(treatment.id)}
                    >
                      Remove
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Collapse>
      </div>
    );
  };

  return (
    <div className="p-4">
      <Card>
        <CardHeader>
          <CardTitle tag="h4">Dental Treatment Plan</CardTitle>
        </CardHeader>
        <CardBody>
          {/* Upper teeth */}
          <div className="d-flex flex-wrap justify-content-center mb-4">
            {[...Array(16)].map((_, i) => renderToothButton(i + 1))}
          </div>
          
          {/* Lower teeth */}
          <div className="d-flex flex-wrap justify-content-center mb-4">
            {[...Array(16)].map((_, i) => renderToothButton(32 - i))}
          </div>

          {/* Full Mouth Treatments */}
          {organizedTreatments.fullmouth.length > 0 && (
            <Card className="mb-3">
              <CardHeader className="bg-light">
                <CardTitle tag="h5">Full Mouth Treatments</CardTitle>
              </CardHeader>
              <CardBody className="p-0">
                {renderTreatmentGroup(organizedTreatments.fullmouth, "Full-Mouth", "Full Mouth Procedures")}
              </CardBody>
            </Card>
          )}

          {/* Per Visit Treatments */}
          {organizedTreatments.visit.length > 0 && (
            <Card className="mb-3">
              <CardHeader className="bg-light">
                <CardTitle tag="h5">Per Visit Treatments</CardTitle>
              </CardHeader>
              <CardBody className="p-0">
                {renderTreatmentGroup(organizedTreatments.visit, "Per-Visit", "Visit Procedures")}
              </CardBody>
            </Card>
          )}

          {/* Quadrant Treatments */}
          {Object.keys(organizedTreatments.quadrants).length > 0 && (
            <Card className="mb-3">
              <CardHeader className="bg-light">
                <CardTitle tag="h5">Quadrant Treatments</CardTitle>
              </CardHeader>
              <CardBody className="p-0">
                {Object.keys(organizedTreatments.quadrants).map(quadrantKey => (
                  <div key={quadrantKey} className="border-bottom mb-3">
                    <h6 className="p-3 bg-light">{quadrantKey}</h6>
                    {Object.keys(organizedTreatments.quadrants[quadrantKey]).map(anomalyKey => (
                      renderTreatmentGroup(
                        organizedTreatments.quadrants[quadrantKey][anomalyKey],
                        quadrantKey,
                        anomalyKey
                      )
                    ))}
                  </div>
                ))}
              </CardBody>
            </Card>
          )}

          {/* Individual Tooth Treatments */}
          {Object.keys(organizedTreatments.teeth).length > 0 && (
            <>
              <h5 className="mt-4 mb-3">Individual Tooth Treatments</h5>
              {Object.keys(organizedTreatments.teeth).sort((a, b) => parseInt(a) - parseInt(b)).map(toothKey => (
                <Card key={toothKey} className="mb-3">
                  <CardHeader className="bg-light">
                    <CardTitle tag="h5">Tooth #{toothKey}</CardTitle>
                  </CardHeader>
                  <CardBody className="p-0">
                    {Object.keys(organizedTreatments.teeth[toothKey]).map(anomalyKey => (
                      renderTreatmentGroup(
                        organizedTreatments.teeth[toothKey][anomalyKey],
                        `tooth-${toothKey}`,
                        anomalyKey
                      )
                    ))}
                  </CardBody>
                </Card>
              ))}
            </>
          )}

          {treatments.length === 0 && (
            <div className="text-center p-4">
              <p>No treatments added yet. Click on a tooth to begin or add anomalies from annotation page.</p>
            </div>
          )}

          {/* Total at the bottom */}
          {treatments.length > 0 && (
            <Card className="mt-3">
              <CardBody className="d-flex justify-content-between">
                <h5 className="mb-0">Total Cost:</h5>
                <h5 className="mb-0">${totalPrice}</h5>
              </CardBody>
            </Card>
          )}
        </CardBody>
        <CardFooter className="d-flex justify-content-between">
            <Button 
                color="primary" 
                onClick={generateTreatmentPlan} 
                disabled={generatingPlan}
            >
                {generatingPlan ? (
                <>
                    <Spinner size="sm" className="me-2" /> Generating Treatment Plan...
                </>
                ) : (
                "Generate Treatment Plan"
                )}
            </Button>
            <Button
              color='primary'
              onClick={()=>setRedirectToAnnotationPage(true)}
              disabled={savingPlan||generatingPlan}
              >
                Annotation Page
              </Button>
            <Button 
                color="success" 
                onClick={saveTreatmentPlan} 
                disabled={treatments.length === 0 || savingPlan}
            >
                {savingPlan ? (
                <>
                    <Spinner size="sm" className="me-2" /> Saving...
                </>
                ) : (
                "Save Treatment Plan"
                )}
            </Button>
            </CardFooter>
      </Card>

      {/* DCT Code Selection Modal */}
      <Modal isOpen={modalOpen} toggle={() => setModalOpen(!modalOpen)} size="lg">
        <ModalHeader toggle={() => setModalOpen(!modalOpen)}>
          {selectedTooth && (
            <>
              Select Treatments for Tooth #{selectedTooth}
              {getToothTreatments(selectedTooth).length > 0 && (
                <div className="mt-2">
                  <small className="text-muted">
                    Current treatments for this tooth: {getToothTreatments(selectedTooth).length}
                  </small>
                </div>
              )}
            </>
          )}
        </ModalHeader>
        <ModalBody>
          <InputGroup className="mb-3">
            <InputGroupText>Search</InputGroupText>
            <Input
              placeholder="Search by code or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </InputGroup>
          <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
            <Table hover>
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Description</th>
                  <th>Unit</th>
                  <th>Price</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredCodes.map(code => (
                  <tr key={code.code}>
                    <td>{code.code}</td>
                    <td>{code.description}</td>
                    <td>{code.unit || "tooth"}</td>
                    <td>${code.price.toFixed(2)}</td>
                    <td>
                      <Button
                        color="primary"
                        size="sm"
                        onClick={() => handleDctCodeSelect(code)}
                      >
                        Add Treatment
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        </ModalBody>
      </Modal>
    </div>
  );
};

export default connect(null, { setBreadcrumbItems })(DentalTreatmentPlan);