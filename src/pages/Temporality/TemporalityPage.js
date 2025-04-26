import React, { useState, useEffect } from "react";
import {
  Card,
  CardBody,
  Container,
  Row,
  Col,
  Spinner,
  Dropdown,
  DropdownToggle,
  DropdownMenu,
  DropdownItem
} from "reactstrap";
import { Navigate } from "react-router-dom";
import { changeMode } from "../../store/actions";
import { useDispatch, useSelector } from "react-redux";
import "bootstrap/dist/css/bootstrap.min.css";
import { logErrorToServer } from "utils/logError";
import DentalChart from "../AnnotationTools/DentalChart";
import ToothAnnotationTable from "./ToothAnnotationTable";
import axios from "axios";

const TemporalityPage = () => {
  const apiUrl = process.env.REACT_APP_NODEAPIURL;
  const [redirectToLogin, setRedirectToLogin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [preLayoutMode, setPreLayoutMode] = useState('');
  const [lastVisitAnnotations, setLastVisitAnnotations] = useState([]);
  const [selectedVisitAnnotations, setSelectedVisitAnnotations] = useState([]);
  const [hiddenAnnotations, setHiddenAnnotations] = useState([]);
  const [classCategories, setClassCategories] = useState({});
  const [confidenceLevels, setConfidenceLevels] = useState({});
  const [selectedTooth, setSelectedTooth] = useState(null);
  const [comparisonTooth, setComparisonTooth] = useState(null);
  const [patientVisits, setPatientVisits] = useState([]);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [selectedVisit, setSelectedVisit] = useState(null);
  const [isComparisonMode, setIsComparisonMode] = useState(false);
  const dispatch = useDispatch();

  // Toggle dropdown
  const toggleDropdown = () => setDropdownOpen(prevState => !prevState);

  // Fetch all patient visits
  const fetchPatientVisits = async () => {
    try {
      setPatientVisits([]);
      const response = await axios.get(
        `${apiUrl}/getPatientVisitsByID?patientId=${sessionStorage.getItem('patientId')}`,
        {
          headers: {
            Authorization: sessionStorage.getItem('token')
          }
        }
      );

      if (response.status === 200) {
        const visitData = response.data;
        sessionStorage.setItem('token', response.headers['new-token']);

        // Format dates and set state
        if (visitData.patienVisits && visitData.patienVisits.length > 0) {
          const formattedVisits = visitData.patienVisits.map(visit => ({
            ...visit,
            formattedDate: formatDate(new Date(visit.date_of_visit))
          }));

          // Set the first visit as the current one
          setSelectedVisit(formattedVisits[0]._id);

          // Store all visits
          setPatientVisits(formattedVisits);
          return formattedVisits;
        } else {
          setMessage("No visits found for this patient.");
          return [];
        }
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
        logErrorToServer(error, "fetchPatientVisits");
        setMessage("Error fetching patient visits");
        console.error('Error fetching patient visits:', error);
      }
      return [];
    }
  };

  // Format date for display
  const formatDate = (date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: '2-digit',
      year: 'numeric'
    }).format(date);
  };

  // Fetch annotations for both the last visit and a selected visit (if provided)
  const fetchLastVisitAnnotations = async (visitId = null) => {
    try {
      setIsLoading(true);

      // First, fetch annotations for the last visit (treatment plan)
      const lastVisitResponse = await axios.get(
        `${apiUrl}/get-annotations-for-treatment-plan?patientId=${sessionStorage.getItem('patientId')}`,
        {
          headers: {
            Authorization: sessionStorage.getItem('token')
          }
        }
      );

      if (lastVisitResponse.status === 200) {
        sessionStorage.setItem('token', lastVisitResponse.headers['new-token']);
        const lastVisitData = lastVisitResponse.data;

        // Process last visit annotations
        let lastVisitAnnots = [];
        if (lastVisitData.images && lastVisitData.images.length > 0) {
          lastVisitData.images.forEach(image => {
            if (image.annotations &&
                image.annotations.annotations &&
                image.annotations.annotations.annotations) {
              lastVisitAnnots = [...lastVisitAnnots, ...image.annotations.annotations.annotations];
            }
          });
          setLastVisitAnnotations(lastVisitAnnots);
        } else {
          setMessage("No annotations found for the last visit.");
          setLastVisitAnnotations([]);
        }

        // If a specific visit is selected, fetch its annotations too
        if (visitId) {
          setIsComparisonMode(true);

          // Fetch images for the selected visit
          const selectedVisitResponse = await axios.get(
            `${apiUrl}/visitid-images?visitID=${visitId}`,
            {
              headers: {
                Authorization: sessionStorage.getItem('token')
              }
            }
          );

          if (selectedVisitResponse.status === 200) {
            sessionStorage.setItem('token', selectedVisitResponse.headers['new-token']);
            const imagesData = selectedVisitResponse.data.images;

            // Process selected visit annotations
            let selectedVisitAnnots = [];
            if (imagesData && imagesData.length > 0) {
              imagesData.forEach(image => {
                if (image.annotations &&
                    image.annotations.annotations &&
                    image.annotations.annotations.annotations) {
                  selectedVisitAnnots = [...selectedVisitAnnots, ...image.annotations.annotations.annotations];
                }
              });
              setSelectedVisitAnnotations(selectedVisitAnnots);
            } else {
              setMessage("No images found for the selected visit.");
              setSelectedVisitAnnotations([]);
            }
          }
        } else {
          // If no comparison visit is selected, just show the last visit
          setIsComparisonMode(false);
          setSelectedVisitAnnotations([]);
        }

        return lastVisitAnnots;
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
        setMessage("Error fetching annotations");
        console.error('Error fetching annotations:', error);
      }
      setLastVisitAnnotations([]);
      setSelectedVisitAnnotations([]);
      return [];
    } finally {
      setIsLoading(false);
    }
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

  // Handle visit selection
  const handleVisitSelect = async (visitId) => {
    setSelectedVisit(visitId);
    // Fetch annotations for the selected visit
    await fetchLastVisitAnnotations(visitId);
    // Reset tooth selection when changing visits
    setSelectedTooth(null);
  };

  // Initialize on component mount
  useEffect(() => {
    try {
      fetchClassCategories();
      fetchPatientVisits();
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
          <div className="d-flex justify-content-between align-items-center">
            <p className="text-muted mb-0">
              {isComparisonMode
                ? `Comparing last visit with visit on ${patientVisits.find(v => v._id === selectedVisit)?.formattedDate || 'selected date'}`
                : 'Viewing dental chart from the last visit'
              }
            </p>
            <div className="d-flex align-items-center">
              <span className="mr-2">Choose another visit to compare:</span>
              <Dropdown isOpen={dropdownOpen} toggle={toggleDropdown} direction="down">
                <DropdownToggle color="light" className="btn-sm">
                  <i className="fa fa-plus"></i>
                </DropdownToggle>
                <DropdownMenu>
                  {patientVisits.map((visit, index) => (
                    <DropdownItem
                      key={visit._id}
                      onClick={() => handleVisitSelect(visit._id)}
                      active={selectedVisit === visit._id}
                    >
                      {visit.formattedDate}
                      {index === 0 && <span className="ml-2 badge badge-info">Latest</span>}
                    </DropdownItem>
                  ))}
                  {patientVisits.length === 0 && (
                    <DropdownItem disabled>No other visits available</DropdownItem>
                  )}
                </DropdownMenu>
              </Dropdown>
            </div>
          </div>
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
        <div>
          {isComparisonMode ? (
            // Side-by-side comparison view
            <Row className="mb-4">
              <Col md={6}>
                <Card>
                  <CardBody>
                    <h5 className="text-center mb-3">Last Visit</h5>
                    <DentalChart
                      annotations={lastVisitAnnotations}
                      classCategories={classCategories}
                      confidenceLevels={confidenceLevels}
                      setHiddenAnnotations={setHiddenAnnotations}
                      onToothSelect={setSelectedTooth}
                    />
                  </CardBody>
                </Card>
              </Col>
              <Col md={6}>
                <Card>
                  <CardBody>
                    <h5 className="text-center mb-3">
                      {patientVisits.find(v => v._id === selectedVisit)?.formattedDate || 'Selected Visit'}
                    </h5>
                    <DentalChart
                      annotations={selectedVisitAnnotations}
                      classCategories={classCategories}
                      confidenceLevels={confidenceLevels}
                      setHiddenAnnotations={setHiddenAnnotations}
                      onToothSelect={setComparisonTooth}
                    />
                  </CardBody>
                </Card>
              </Col>
            </Row>
          ) : (
            // Single view (last visit only)
            <Row className="mb-4">
              <Col md={12}>
                <Card>
                  <CardBody>
                    <DentalChart
                      annotations={lastVisitAnnotations}
                      classCategories={classCategories}
                      confidenceLevels={confidenceLevels}
                      setHiddenAnnotations={setHiddenAnnotations}
                      onToothSelect={setSelectedTooth}
                    />
                  </CardBody>
                </Card>
              </Col>
            </Row>
          )}

          {isComparisonMode ? (
            // Side-by-side tables in comparison mode
            <Row>
              <Col md={6}>
                <Card>
                  <CardBody>
                    <h4>Last Visit - Tooth Anomalies/Procedures</h4>
                    <ToothAnnotationTable
                      annotations={lastVisitAnnotations}
                      classCategories={classCategories}
                      selectedTooth={selectedTooth}
                    />
                  </CardBody>
                </Card>
              </Col>
              <Col md={6}>
                <Card>
                  <CardBody>
                    <h4>Selected Visit - Tooth Anomalies/Procedures</h4>
                    <ToothAnnotationTable
                      annotations={selectedVisitAnnotations}
                      classCategories={classCategories}
                      selectedTooth={comparisonTooth}
                    />
                  </CardBody>
                </Card>
              </Col>
            </Row>
          ) : (
            // Single table when not in comparison mode
            <Row>
              <Col md={6} className="mx-auto">
                <Card>
                  <CardBody>
                    <h4>Tooth Anomalies/Procedures</h4>
                    <ToothAnnotationTable
                      annotations={lastVisitAnnotations}
                      classCategories={classCategories}
                      selectedTooth={selectedTooth}
                    />
                  </CardBody>
                </Card>
              </Col>
            </Row>
          )}
        </div>
      )}
    </Container>
  );
};

export default TemporalityPage;