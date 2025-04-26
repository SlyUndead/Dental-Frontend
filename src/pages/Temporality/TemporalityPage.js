import React, { useState, useEffect } from "react";
import {
  Card,
  CardBody,
  Container,
  Row,
  Col,
  Spinner,
  Table
} from "reactstrap";
import { Navigate } from "react-router-dom";
import { changeMode } from "../../store/actions";
import { useDispatch, useSelector } from "react-redux";
import "bootstrap/dist/css/bootstrap.min.css";
import { logErrorToServer } from "utils/logError";
import DentalChart from "../AnnotationTools/DentalChart";
import { calculateOverlap, polygonArea } from "../AnnotationTools/path-utils";

const TemporalityPage = () => {
  const apiUrl = process.env.REACT_APP_NODEAPIURL;
  const [redirectToLogin, setRedirectToLogin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [preLayoutMode, setPreLayoutMode] = useState('');
  const [annotations, setAnnotations] = useState([]);
  const [hiddenAnnotations, setHiddenAnnotations] = useState([]);
  const [classCategories, setClassCategories] = useState({});
  const [confidenceLevels, setConfidenceLevels] = useState({});
  const [toothAnnotations, setToothAnnotations] = useState([]);
  const dispatch = useDispatch();

  // Get the current layout mode from Redux
  const currentMode = useSelector(state => state.Layout.layoutMode);

  // Store the current layout mode to restore it later
  useEffect(() => {
    if (currentMode && currentMode !== 'dark') {
      setPreLayoutMode(currentMode);
      sessionStorage.setItem('preLayoutMode', currentMode);
    }
  }, [currentMode]);

  // Fetch annotations from the last visit
  const fetchLastVisitAnnotations = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(
        `${apiUrl}/get-annotations-for-treatment-plan?patientId=${sessionStorage.getItem('patientId')}`,
        {
          method: "GET",
          headers: {
            Authorization: sessionStorage.getItem('token')
          }
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();

      if (data.images && data.images.length > 0) {
        // Combine all annotations from all images
        let allAnnotations = [];
        data.images.forEach(image => {
          if (image.annotations &&
              image.annotations.annotations &&
              image.annotations.annotations.annotations) {
            allAnnotations = [...allAnnotations, ...image.annotations.annotations.annotations];
          }
        });

        // Remove duplicates (based on label and coordinates)
        const uniqueAnnotations = removeDuplicateAnnotations(allAnnotations);
        setAnnotations(uniqueAnnotations);

        // Organize annotations for the table
        const teethData = organizeToothAnnotations(uniqueAnnotations);
        setToothAnnotations(teethData);

        return uniqueAnnotations;
      } else {
        setMessage("No annotations found for the last visit.");
        return [];
      }
    } catch (error) {
      if (error.status === 403 || error.status === 401) {
        if (sessionStorage.getItem('preLayoutMode')) {
          dispatch(changeMode(preLayoutMode));
          sessionStorage.removeItem('preLayoutMode');
        }
        sessionStorage.removeItem('token');
        setRedirectToLogin(true);
      } else {
        logErrorToServer(error, "fetchLastVisitAnnotations");
        setMessage("Error fetching annotations from the last visit");
        console.error('Error fetching last visit annotations:', error);
      }
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  // Remove duplicate annotations
  const removeDuplicateAnnotations = (annotations) => {
    const uniqueMap = new Map();

    annotations.forEach(anno => {
      // Create a key based on label and a simplified representation of coordinates
      let key = anno.label;

      // For tooth annotations (numbers), we want to keep them unique by tooth number
      if (!isNaN(Number.parseInt(anno.label))) {
        uniqueMap.set(key, anno);
      } else {
        // For other annotations, check if we already have this type
        if (!uniqueMap.has(key)) {
          uniqueMap.set(key, anno);
        }
      }
    });

    return Array.from(uniqueMap.values());
  };

  // Fetch class categories
  const fetchClassCategories = async () => {
    try {
      const response = await fetch(
        `${apiUrl}/get-classCategories?clientId=${sessionStorage.getItem('clientId')}`,
        {
          method: "GET",
          headers: {
            Authorization: sessionStorage.getItem('token')
          }
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();

      let updatedClassCategories = {};
      let updatedConfidenceLevels = {};

      data.forEach(element => {
        if (updatedClassCategories[element.className.toLowerCase()] === undefined) {
          updatedClassCategories[element.className.toLowerCase()] = element.category;
        }
        if (updatedConfidenceLevels[element.className.toLowerCase()] === undefined) {
          element.confidence ?
            updatedConfidenceLevels[element.className.toLowerCase()] = element.confidence :
            updatedConfidenceLevels[element.className.toLowerCase()] = (0.01);
        }
      });

      setClassCategories(updatedClassCategories);
      setConfidenceLevels(updatedConfidenceLevels);
    } catch (error) {
      if (error.status === 403 || error.status === 401) {
        if (sessionStorage.getItem('preLayoutMode')) {
          dispatch(changeMode(preLayoutMode));
          sessionStorage.removeItem('preLayoutMode');
        }
        sessionStorage.removeItem('token');
        setRedirectToLogin(true);
      } else {
        logErrorToServer(error, "fetchClassCategories");
        console.error('Error fetching class categories:', error);
      }
    }
  };

  // Find the tooth with maximum overlap for an anomaly
  const findToothForAnomaly = (anomaly, toothAnnotations) => {
    let maxOverlap = 0;
    let associatedTooth = null;
    let overlapPercentage = 0;

    toothAnnotations.forEach(tooth => {
      if (!anomaly.segmentation || !tooth.segmentation) return;

      try {
        const overlap = calculateOverlap(anomaly.segmentation, tooth.segmentation);

        // Calculate the total area of the anomaly
        const anomalyArea = polygonArea(anomaly.segmentation.map(point => [point.x, point.y]));

        // Calculate the percentage of the anomaly that overlaps with the tooth
        const percentage = anomalyArea > 0 ? overlap / anomalyArea : 0;

        if (overlap > maxOverlap) {
          maxOverlap = overlap;
          associatedTooth = tooth.label;
          overlapPercentage = percentage;
        }
      } catch (error) {
        console.error('Error calculating overlap:', error);
      }
    });

    return {
      toothNumber: associatedTooth,
      overlapPercentage: Math.round(overlapPercentage * 100)
    };
  };

  // Organize tooth annotations for the table
  const organizeToothAnnotations = (annotations) => {
    const teethData = {};

    // First, filter out only the tooth annotations (numeric labels)
    const toothAnnotations = annotations.filter(anno => !isNaN(Number.parseInt(anno.label)));

    // Then, find all non-tooth annotations (anomalies/procedures)
    const anomalyAnnotations = annotations.filter(anno => isNaN(Number.parseInt(anno.label)));

    // Initialize entries for each tooth
    toothAnnotations.forEach(toothAnno => {
      const toothNumber = toothAnno.label;
      teethData[toothNumber] = {
        toothNumber,
        anomalies: []
      };
    });

    // For each anomaly, find the associated tooth with maximum overlap
    anomalyAnnotations.forEach(anomaly => {
      const { toothNumber, overlapPercentage } = findToothForAnomaly(anomaly, toothAnnotations);

      if (toothNumber) {
        // Create the tooth entry if it doesn't exist
        if (!teethData[toothNumber]) {
          teethData[toothNumber] = {
            toothNumber,
            anomalies: []
          };
        }

        // Add the anomaly to the tooth's list
        teethData[toothNumber].anomalies.push({
          name: anomaly.label,
          category: classCategories[anomaly.label.toLowerCase()] || 'Unknown',
          confidence: anomaly.confidence,
          overlapPercentage: overlapPercentage,
          // Only show in the table if overlap is at least 80%
          showInTable: overlapPercentage >= 80
        });
      }
    });

    // Convert the object to an array and filter anomalies
    const result = Object.values(teethData).map(tooth => {
      // Filter anomalies to only include those with 80% or more overlap
      const filteredAnomalies = tooth.anomalies.filter(anomaly => anomaly.showInTable);

      return {
        toothNumber: tooth.toothNumber,
        anomalies: filteredAnomalies.length > 0 ? filteredAnomalies : [{ name: 'No anomalies detected', category: 'Info' }]
      };
    });

    // If there are no tooth annotations but there are anomalies, create a generic entry
    if (toothAnnotations.length === 0 && anomalyAnnotations.length > 0) {
      const anomalies = anomalyAnnotations.map(anomaly => ({
        name: anomaly.label,
        category: classCategories[anomaly.label.toLowerCase()] || 'Unknown'
      }));

      result.push({
        toothNumber: 'N/A',
        anomalies
      });
    }

    // Sort by tooth number (except for 'N/A')
    return result.sort((a, b) => {
      if (a.toothNumber === 'N/A') return 1;
      if (b.toothNumber === 'N/A') return -1;
      return Number(a.toothNumber) - Number(b.toothNumber);
    });
  };

  // Initialize on component mount
  useEffect(() => {
    try {
      dispatch(changeMode('dark'));
      fetchClassCategories();
      fetchLastVisitAnnotations();
    } catch (error) {
      logErrorToServer(error, "temporalityPageInit");
      console.error('Error initializing TemporalityPage:', error);
      setMessage("Unable to load annotations. Please contact admin.");
    }
  }, []);

  if (redirectToLogin) {
    return <Navigate to="/login" />;
  }

  return (
    <Container fluid className="page-content">
      <Row>
        <Col md={12}>
          <h3 className="page-title">Temporality View</h3>
          <p className="text-muted">Viewing dental chart from the last visit</p>
        </Col>
      </Row>

      {isLoading ? (
        <div className="text-center mt-5">
          <Spinner color="primary" />
          <p className="mt-2">Loading dental chart...</p>
        </div>
      ) : message ? (
        <div className="alert alert-info mt-3">{message}</div>
      ) : (
        <Row>
          <Col md={6}>
            <Card>
              <CardBody>
                <DentalChart
                  annotations={annotations}
                  classCategories={classCategories}
                  confidenceLevels={confidenceLevels}
                  setHiddenAnnotations={setHiddenAnnotations}
                />
              </CardBody>
            </Card>
          </Col>
          <Col md={6}>
            <Card>
              <CardBody>
                <h4>Tooth Anomalies/Procedures</h4>
                <p className="text-muted small">
                  <i className="fa fa-info-circle mr-1"></i>
                  Only showing anomalies/procedures with ≥80% overlap with each tooth. Each anomaly is associated with the tooth it overlaps the most.
                </p>
                <Table striped bordered hover responsive className="mt-3">
                  <thead className="bg-primary text-white">
                    <tr>
                      <th style={{ width: '20%' }}>Tooth Number</th>
                      <th style={{ width: '50%' }}>Anomaly/Procedure</th>
                      <th style={{ width: '15%' }}>Confidence</th>
                      <th style={{ width: '15%' }}>Overlap %</th>
                    </tr>
                  </thead>
                  <tbody>
                    {toothAnnotations.length > 0 ? (
                      toothAnnotations.map((tooth, index) => (
                        <React.Fragment key={index}>
                          {tooth.anomalies.map((anomaly, idx) => (
                            <tr key={`${index}-${idx}`}>
                              {idx === 0 ? (
                                <td
                                  className="text-center font-weight-bold"
                                  rowSpan={tooth.anomalies.length}
                                >
                                  {tooth.toothNumber}
                                </td>
                              ) : null}
                              <td>
                                <div className="d-flex justify-content-between align-items-center">
                                  <span>{anomaly.name}</span>
                                  {anomaly.category !== 'Info' && (
                                    <span className="badge bg-info ml-2">{anomaly.category}</span>
                                  )}
                                </div>
                              </td>
                              <td className="text-center">
                                {anomaly.confidence ? (
                                  <span>{anomaly.confidence.toFixed(2).toString().slice(1)}</span>
                                ) : (
                                  anomaly.category === 'Info' ? '-' : '0.80'
                                )}
                              </td>
                              <td className="text-center">
                                {anomaly.overlapPercentage ? (
                                  <span className="badge bg-success">{anomaly.overlapPercentage}%</span>
                                ) : (
                                  anomaly.category === 'Info' ? '-' : '≥80%'
                                )}
                              </td>
                            </tr>
                          ))}
                        </React.Fragment>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="4" className="text-center">No tooth annotations found</td>
                      </tr>
                    )}
                  </tbody>
                </Table>
              </CardBody>
            </Card>
          </Col>
        </Row>
      )}
    </Container>
  );
};

export default TemporalityPage;