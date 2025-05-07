"use client"

import { useState, useEffect } from "react"
import {
  Card,
  CardBody,
  Row,
  Col,
  Spinner,
  Dropdown,
  DropdownToggle,
  DropdownMenu,
  DropdownItem,
  Button,
  FormGroup,
  Label,
  Input,
} from "reactstrap"
import { Navigate } from "react-router-dom"
import "bootstrap/dist/css/bootstrap.min.css"
import { logErrorToServer } from "utils/logError"
import DentalChart from "../AnnotationTools/DentalChart"
import ToothAnnotationTable from "./ToothAnnotationTable"
import axios from "axios"
import { setBreadcrumbItems } from "../../store/actions"
import { connect } from "react-redux"
import ConsolidatedToothTable from "./ConsolidatedToothTable"
import { calculateOverlap, polygonArea } from "../AnnotationTools/path-utils"
import DateSlider from "./DateSlider"

const TemporalityPage = (props) => {
  document.title = "Temporality View | AGP Dental Tool"
  const apiUrl = process.env.REACT_APP_NODEAPIURL
  const [redirectToLogin, setRedirectToLogin] = useState(false)
  const [isFirstLoading, setIsFirstLoading] = useState(false)
  const [isSecondLoading, setIsSecondLoading] = useState(false)
  const [message, setMessage] = useState("")
  const [lastVisitAnnotations, setLastVisitAnnotations] = useState([])
  const [selectedVisitAnnotations, setSelectedVisitAnnotations] = useState([])
  const [hiddenAnnotations, setHiddenAnnotations] = useState([])
  const [classCategories, setClassCategories] = useState({})
  const [confidenceLevels, setConfidenceLevels] = useState({})
  const [selectedTooth, setSelectedTooth] = useState(null)
  const [comparisonTooth, setComparisonTooth] = useState(null)
  const [patientVisits, setPatientVisits] = useState([])
  const [firstDropdownOpen, setFirstDropdownOpen] = useState(false)
  const [secondDropdownOpen, setSecondDropdownOpen] = useState(false)
  const [firstVisitId, setFirstVisitId] = useState(null)
  const [secondVisitId, setSecondVisitId] = useState(null)
  const [isComparisonMode, setIsComparisonMode] = useState(true)
  const [redirectToPatientVisitPage, setRedirectToPatientVisitPage] = useState(false)
  const [isConsolidatedView, setIsConsolidatedView] = useState(false)
  const [consolidatedAnnotations, setConsolidatedAnnotations] = useState([])
  const [allVisitsAnnotations, setAllVisitsAnnotations] = useState({})
  const [isLoadingConsolidated, setIsLoadingConsolidated] = useState(false)

  const breadcrumbItems = [
    { title: `${sessionStorage.getItem("firstName")} ${sessionStorage.getItem("lastName")}`, link: "/practiceList" },
    { title: sessionStorage.getItem("practiceName"), link: "/patientList" },
    { title: `${sessionStorage.getItem("patientName")} Images List`, link: "/patientImagesList" },
    { title: `Temporality View`, link: "/temporalityPage" },
  ]

  // Toggle dropdowns
  const toggleFirstDropdown = () => setFirstDropdownOpen((prevState) => !prevState)
  const toggleSecondDropdown = () => setSecondDropdownOpen((prevState) => !prevState)

  // Toggle consolidated view
  const toggleConsolidatedView = async () => {
    const newValue = !isConsolidatedView
    setIsConsolidatedView(newValue)

    if (newValue) {
      // When enabling consolidated view, fetch all visits' annotations if not already done
      await fetchAllVisitsAnnotations()
    }
  }

  // Fetch all patient visits
  const fetchPatientVisits = async () => {
    try {
      setPatientVisits([]);
      const response = await axios.get(
        `${apiUrl}/getPatientVisitsByID?patientId=${sessionStorage.getItem("patientId")}`,
        {
          headers: {
            Authorization: sessionStorage.getItem("token"),
          },
        },
      );

      if (response.status === 200) {
        const visitData = response.data;
        sessionStorage.setItem("token", response.headers["new-token"]);

        // Format dates and set state
        if (visitData.patienVisits && visitData.patienVisits.length > 0) {
          const formattedVisits = visitData.patienVisits.map((visit) => {
            const visitDate = new Date(visit.date_of_visit);
            const creationDate = visit.created_on ? new Date(visit.created_on) : visitDate;

            // Format time as HH:MM AM/PM
            const timeString = creationDate.toLocaleTimeString('en-US', {
              hour: '2-digit',
              minute: '2-digit',
              hour12: true
            });

            return {
              ...visit,
              formattedDate: formatDate(visitDate),
              formattedDateTime: `${formatDate(visitDate)} ${timeString}`,
              creationTime: timeString
            };
          });

          // Store all visits (ungrouped)
          setPatientVisits(formattedVisits);

          const groupedVisits = groupVisitsByDate(formattedVisits);
          // Set default visits for comparison (last and second-to-last)
          if (groupedVisits.length >= 2) {
            // Ensure the first visit is the more recent one (should already be sorted this way)
            const firstVisitDate = new Date(groupedVisits[0].date);
            const secondVisitDate = new Date(groupedVisits[1].date);

            if (firstVisitDate >= secondVisitDate) {
              // Normal case - first visit is more recent
              setFirstVisitId(groupedVisits[0]._id);
              setSecondVisitId(groupedVisits[1]._id);
              setIsComparisonMode(true);
              // Fetch annotations for both visits
              handleFirstVisitSelect(groupedVisits[0]._id, formattedVisits);
              handleSecondVisitSelect(groupedVisits[1]._id, formattedVisits);
            } else {
              // Swap needed - second visit is more recent
              setFirstVisitId(groupedVisits[1]._id);
              setSecondVisitId(groupedVisits[0]._id);
              setIsComparisonMode(true);
              // Fetch annotations for both visits
              handleFirstVisitSelect(groupedVisits[1]._id, formattedVisits);
              handleSecondVisitSelect(groupedVisits[0]._id, formattedVisits);
            }
          } else if (groupedVisits.length === 1) {
            setFirstVisitId(groupedVisits[0]._id);
            handleFirstVisitSelect(groupedVisits[0]._id, formattedVisits);
          }
          return formattedVisits;
        } else {
          setMessage("No visits found for this patient.");
          return [];
        }
      }
    } catch (error) {
      if (error.status === 403 || error.status === 401) {
        sessionStorage.removeItem("token");
        setRedirectToLogin(true);
      } else {
        logErrorToServer(error, "fetchPatientVisits");
        setMessage("Error fetching patient visits");
        console.error("Error fetching patient visits:", error);
      }
      return [];
    }
  }

  // Format date for display
  const formatDate = (date) => {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "2-digit",
      year: "numeric",
    }).format(date)
  }

  // Format date with time for display
  const formatDateWithTime = (date) => {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true
    }).format(date)
  }

  function groupVisitsByDate(visits) {
    const groupedVisits = {}

    visits.forEach((visit) => {
      const dateKey = visit.formattedDate

      if (!groupedVisits[dateKey]) {
        groupedVisits[dateKey] = {
          date: dateKey,
          visits: [visit],
          _id: visit._id, // Use the first visit's ID as the group ID
        }
      } else {
        groupedVisits[dateKey].visits.push(visit)
      }
    })

    return Object.values(groupedVisits)
  }

  // Fetch annotations for a specific visit
  const fetchVisitAnnotations = async (visitId) => {
    try {
      // Fetch images for the selected visit
      const response = await axios.get(`${apiUrl}/visitid-images?visitID=${visitId}`, {
        headers: {
          Authorization: sessionStorage.getItem("token"),
        },
      })

      if (response.status === 200) {
        sessionStorage.setItem("token", response.headers["new-token"])
        const imagesData = response.data.images

        // Process visit annotations
        let visitAnnots = []
        if (imagesData && imagesData.length > 0) {
          imagesData.forEach((image, index) => {
            if (image.annotations && image.annotations.annotations && image.annotations.annotations.annotations) {
              // Add image ID to each annotation
              const annotationsWithImageId = image.annotations.annotations.annotations.map((annotation) => ({
                ...annotation,
                imageId: image._id,
                imageNumber: image.imageNumber || index + 1,
              }))
              visitAnnots = [...visitAnnots, ...annotationsWithImageId]
            }
          })
          return visitAnnots
        } else {
          console.log(`No images found for visit ${visitId}`)
          return []
        }
      }
    } catch (error) {
      logErrorToServer(error, "fetchVisitAnnotations")
      console.error(`Error fetching annotations for visit ${visitId}:`, error)
      return []
    }
  }

  // Fetch annotations for all visits
  const fetchAllVisitsAnnotations = async () => {
    if (Object.keys(allVisitsAnnotations).length > 0 && !isLoadingConsolidated) {
      // If we already have all annotations, just generate the consolidated view
      generateConsolidatedView()
      return
    }

    setIsLoadingConsolidated(true)
    try {
      const visitAnnotations = {}

      // First, get the latest visit annotations (treatment plan)
      const lastVisitResponse = await axios.get(
        `${apiUrl}/get-annotations-for-treatment-plan?patientId=${sessionStorage.getItem("patientId")}`,
        {
          headers: {
            Authorization: sessionStorage.getItem("token"),
          },
        },
      )

      if (lastVisitResponse.status === 200) {
        sessionStorage.setItem("token", lastVisitResponse.headers["new-token"])
        const lastVisitData = lastVisitResponse.data

        // Process last visit annotations
        let lastVisitAnnots = []
        if (lastVisitData.images && lastVisitData.images.length > 0) {
          lastVisitData.images.forEach((image, index) => {
            if (image.annotations && image.annotations.annotations && image.annotations.annotations.annotations) {
              const annotationsWithImageId = image.annotations.annotations.annotations.map((annotation) => ({
                ...annotation,
                imageId: image._id,
                imageNumber: image.imageNumber || index + 1,
              }))
              lastVisitAnnots = [...lastVisitAnnots, ...annotationsWithImageId]
            }
          })

          // Store the latest visit annotations
          if (patientVisits.length > 0) {
            visitAnnotations[patientVisits[0]._id] = lastVisitAnnots
          }
        }
      }

      // Then fetch annotations for all other visits
      for (let i = 1; i < patientVisits.length; i++) {
        const visitId = patientVisits[i]._id
        const annotations = await fetchVisitAnnotations(visitId)
        visitAnnotations[visitId] = annotations
      }
      setAllVisitsAnnotations(visitAnnotations)
      generateConsolidatedView(visitAnnotations)
    } catch (error) {
      logErrorToServer(error, "fetchAllVisitsAnnotations")
      setMessage("Error fetching all visit annotations")
      console.error("Error fetching all visit annotations:", error)
    } finally {
      setIsLoadingConsolidated(false)
    }
  }

  // Generate consolidated view from all visits' annotations
  const generateConsolidatedView = (visitAnnots = null) => {
    const annotations = visitAnnots || allVisitsAnnotations
    if (!annotations || Object.keys(annotations).length === 0) return

    // Get all tooth numbers across all visits
    const allTeethNumbers = new Set()
    const consolidatedTeeth = {}

    // Process visits in order (newest to oldest)
    for (let i = 0; i < patientVisits.length; i++) {
      const visitId = patientVisits[i]._id
      const visitAnnotations = annotations[visitId] || []

      // Get tooth annotations for this visit
      const toothAnnots = visitAnnotations.filter((anno) => !isNaN(Number.parseInt(anno.label)))

      // Add all tooth numbers to our set
      toothAnnots.forEach((anno) => {
        const toothNumber = Number.parseInt(anno.label)
        allTeethNumbers.add(toothNumber)
      })

      // For each tooth in this visit
      toothAnnots.forEach((toothAnno) => {
        const toothNumber = Number.parseInt(toothAnno.label)

        // If we haven't already found this tooth in a more recent visit
        if (!consolidatedTeeth[toothNumber]) {
          // Find all anomalies that overlap with this tooth
          const anomalies = []

          visitAnnotations.forEach((anno) => {
            // Skip tooth annotations and annotations without segmentation
            if (!isNaN(Number.parseInt(anno.label)) || !anno.segmentation || !toothAnno.segmentation) {
              return
            }

            try {
              // Calculate overlap
              const overlap = calculateOverlap(anno.segmentation, toothAnno.segmentation)
              const annoArea = polygonArea(anno.segmentation.map((point) => [point.x, point.y]))
              const overlapPercentage = annoArea > 0 ? overlap / annoArea : 0

              // Only include if overlap is at least 80%
              if (overlapPercentage >= 0.8) {
                anomalies.push({
                  name: anno.label,
                  category: classCategories[anno.label.toLowerCase()] || "Unknown",
                  confidence: anno.confidence,
                  overlapPercentage: Math.round(overlapPercentage * 100),
                  visitDate: patientVisits[i].formattedDate,
                  visitIndex: i,
                  visitId: patientVisits[i]._id,
                  imageNumber: anno.imageNumber,
                })
              }
            } catch (error) {
              console.error("Error calculating overlap:", error)
            }
          })

          // Store this tooth with its anomalies and visit info
          consolidatedTeeth[toothNumber] = {
            toothNumber,
            anomalies:
              anomalies.length > 0
                ? anomalies
                : [
                  {
                    name: "No anomalies detected",
                    category: "Info",
                    visitDate: patientVisits[i].formattedDate,
                    visitIndex: i,
                  },
                ],
            visitDate: patientVisits[i].formattedDate,
            visitIndex: i,
          }
        }
      })
    }

    // Convert to array and sort by tooth number
    const consolidatedArray = Object.values(consolidatedTeeth).sort((a, b) => a.toothNumber - b.toothNumber)
    setConsolidatedAnnotations(consolidatedArray)
  }
  const processVisitsForSlider = (visits) => {
    if (!visits || visits.length === 0) return [];

    // Group visits by date
    const groupedByDate = {};
    visits.forEach(visit => {
      const dateKey = visit.formattedDate;
      if (!groupedByDate[dateKey]) {
        groupedByDate[dateKey] = {
          date: dateKey,
          visitIds: [visit._id],
          visits: [visit]
        };
      } else {
        groupedByDate[dateKey].visitIds.push(visit._id);
        groupedByDate[dateKey].visits.push(visit);
      }
    });

    // Convert to array and sort by date (newest first)
    return Object.values(groupedByDate).sort((a, b) => {
      return new Date(b.date) - new Date(a.date);
    });
  }
  // Fetch class categories
  const fetchClassCategories = async () => {
    try {
      const response = await fetch(`${apiUrl}/get-classCategories?clientId=${sessionStorage.getItem("clientId")}`, {
        method: "GET",
        headers: {
          Authorization: sessionStorage.getItem("token"),
        },
      })

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`)
      }

      const data = await response.json()

      const updatedClassCategories = {}
      const updatedConfidenceLevels = {}

      data.forEach((element) => {
        if (updatedClassCategories[element.className.toLowerCase()] === undefined) {
          updatedClassCategories[element.className.toLowerCase()] = element.category
        }
        if (updatedConfidenceLevels[element.className.toLowerCase()] === undefined) {
          element.confidence
            ? (updatedConfidenceLevels[element.className.toLowerCase()] = element.confidence)
            : (updatedConfidenceLevels[element.className.toLowerCase()] = 0.01)
        }
      })

      setClassCategories(updatedClassCategories)
      setConfidenceLevels(updatedConfidenceLevels)
    } catch (error) {
      if (error.status === 403 || error.status === 401) {
        sessionStorage.removeItem("token")
        setRedirectToLogin(true)
      } else {
        logErrorToServer(error, "fetchClassCategories")
        console.error("Error fetching class categories:", error)
      }
    }
  }

  // Handle first visit selection
  const handleFirstVisitSelect = async (visitId, patientVisits) => {
    setFirstVisitId(visitId)
    setIsFirstLoading(true)
    // Find all visits with the same date
    const selectedVisit = patientVisits.find((v) => v._id === visitId)
    if (!selectedVisit) {
      setIsFirstLoading(false);
      return;
    }

    const visitsOnSameDate = patientVisits.filter((v) => v.formattedDate === selectedVisit.formattedDate);

    try {
      // Fetch annotations for ALL visits on the same date
      let combinedAnnotations = [];

      for (const visit of visitsOnSameDate) {
        const response = await axios.get(`${apiUrl}/visitid-images?visitID=${visit._id}`,
          {
            headers: {
              Authorization: sessionStorage.getItem("token"),
            },
          },
        );

        if (response.status === 200) {
          sessionStorage.setItem("token", response.headers["new-token"]);
          const imagesData = response.data.images;

          // Process visit annotations
          if (imagesData && imagesData.length > 0) {
            imagesData.forEach((image, index) => {
              if (image.annotations && image.annotations.annotations && image.annotations.annotations.annotations) {
                const annotationsWithImageId = image.annotations.annotations.annotations.map((annotation) => ({
                  ...annotation,
                  imageId: image._id,
                  imageNumber: image.imageNumber || index + 1,
                  visitId: visit._id, // Add visit ID to trace back which visit this annotation came from
                }));
                combinedAnnotations = [...combinedAnnotations, ...annotationsWithImageId];
              }
            });
          }
        }
      }

      setLastVisitAnnotations(combinedAnnotations);
      if (combinedAnnotations.length === 0) {
        setMessage("No annotations found for the selected date's visits.");
      }
    } catch (error) {
      logErrorToServer(error, "handleFirstVisitSelect");
      setMessage("Error fetching annotations for the first visit");
      console.error("Error fetching annotations:", error);
      setLastVisitAnnotations([]);
    } finally {
      setIsFirstLoading(false);
    }
  }
  // Modified handleSecondVisitSelect function to fetch annotations from all visits on the same date
  const handleSecondVisitSelect = async (visitId, patientVisits) => {
    setSecondVisitId(visitId);
    setIsSecondLoading(true);
    // Find all visits with the same date
    const selectedVisit = patientVisits.find((v) => v._id === visitId);
    if (!selectedVisit) {
      setIsSecondLoading(false);
      return;
    }

    const visitsOnSameDate = patientVisits.filter((v) => v.formattedDate === selectedVisit.formattedDate);

    try {
      // Fetch annotations for ALL visits on the same date
      let combinedAnnotations = [];

      for (const visit of visitsOnSameDate) {
        const response = await axios.get(
          `${apiUrl}/visitid-images?visitID=${visit._id}`,
          {
            headers: {
              Authorization: sessionStorage.getItem("token"),
            },
          },
        );

        if (response.status === 200) {
          sessionStorage.setItem("token", response.headers["new-token"]);
          const imagesData = response.data.images;

          // Process visit annotations
          if (imagesData && imagesData.length > 0) {
            imagesData.forEach((image, index) => {
              if (image.annotations && image.annotations.annotations && image.annotations.annotations.annotations) {
                const annotationsWithImageId = image.annotations.annotations.annotations.map((annotation) => ({
                  ...annotation,
                  imageId: image._id,
                  imageNumber: image.imageNumber || index + 1,
                  visitId: visit._id, // Add visit ID to trace back which visit this annotation came from
                }));
                combinedAnnotations = [...combinedAnnotations, ...annotationsWithImageId];
              }
            });
          }
        }
      }

      setSelectedVisitAnnotations(combinedAnnotations);
      if (combinedAnnotations.length === 0) {
        setMessage("No annotations found for the selected date's visits.");
      }
    } catch (error) {
      logErrorToServer(error, "handleSecondVisitSelect");
      setMessage("Error fetching annotations for the second visit");
      console.error("Error fetching annotations:", error);
      setSelectedVisitAnnotations([]);
    } finally {
      setIsSecondLoading(false);
    }
  }

  // Initialize on component mount
  useEffect(() => {
    props.setBreadcrumbItems("Temporality View", breadcrumbItems)
    try {
      fetchClassCategories()
      fetchPatientVisits()
      // fetchLastVisitAnnotations is now called from handleFirstVisitSelect
    } catch (error) {
      logErrorToServer(error, "temporalityPageInit")
      console.error("Error initializing TemporalityPage:", error)
      setMessage("Unable to load annotations. Please contact admin.")
    }
  }, [])

  if (redirectToLogin) {
    return <Navigate to="/login" />
  }
  if (redirectToPatientVisitPage) {
    return <Navigate to="/patientImagesList" />
  }

  return (
    <Card>
      <CardBody>
        <Row>
          <Col md={12} className="d-flex align-items-center mb-3">
            <Button color="primary" onClick={() => setRedirectToPatientVisitPage(true)} className="mr-3">
              Patient Visits
            </Button>
            <FormGroup check className="ml-3 mb-0">
              <Label check>
                <Input type="checkbox" checked={isConsolidatedView} onChange={toggleConsolidatedView} /> Consolidated
                View
              </Label>
            </FormGroup>
          </Col>
        </Row>

        {!isConsolidatedView && (<>
          <Row>
            <Col md={12}>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <p className="text-muted mb-0">
                  {isComparisonMode
                    ? `Comparing visits from ${patientVisits.find((v) => v._id === firstVisitId)?.formattedDateTime || "first visit"} and ${patientVisits.find((v) => v._id === secondVisitId)?.formattedDateTime || "second visit"}`
                    : `Viewing dental chart from ${patientVisits.find((v) => v._id === firstVisitId)?.formattedDateTime || "selected visit"}`}
                </p>
              </div>
            </Col>
            <Col md={12}>
              {/* Date range slider component */}
              <DateSlider
                visits={patientVisits}
                selectedFirstVisitId={firstVisitId}
                selectedSecondVisitId={secondVisitId}
                onRangeChange={(firstVisitObj, secondVisitObj) => {
                  // This is just for updating the UI and previewing the selection
                  console.log("Range changed", firstVisitObj, secondVisitObj);
                }}
                onApplySelection={(firstVisitObj, secondVisitObj) => {
                  // This is called when the "Apply Selection" button is clicked
                  console.log("Applying selection", firstVisitObj, secondVisitObj);

                  // Check if visits need to be switched based on creation time
                  // Note: In our UI, we want the newer visit (more recent) to be the first visit
                  // and the older visit to be the second visit
                  const firstCreationDate = firstVisitObj.visitObj.created_on
                    ? new Date(firstVisitObj.visitObj.created_on)
                    : new Date(firstVisitObj.visitObj.date_of_visit);

                  const secondCreationDate = secondVisitObj.visitObj.created_on
                    ? new Date(secondVisitObj.visitObj.created_on)
                    : new Date(secondVisitObj.visitObj.date_of_visit);

                  // If the second visit is more recent than the first visit, swap them
                  // This ensures the more recent visit is always the first visit
                  if (secondCreationDate > firstCreationDate) {
                    console.log("Swapping visits because second visit is more recent than first visit");

                    // Swap the visit objects
                    const tempVisitObj = firstVisitObj;
                    firstVisitObj = secondVisitObj;
                    secondVisitObj = tempVisitObj;
                  }

                  // Get the first visit ID
                  if (firstVisitObj && firstVisitObj.id) {
                    handleFirstVisitSelect(firstVisitObj.id, patientVisits);
                  }

                  // Get the second visit ID
                  if (secondVisitObj && secondVisitObj.id) {
                    handleSecondVisitSelect(secondVisitObj.id, patientVisits);
                  }

                  // Update comparison mode flag if needed
                  setIsComparisonMode(firstVisitObj.id !== secondVisitObj.id);
                }}
              />
            </Col>
          </Row>
          <Row>
            <Col md={12}>
              <div className="d-flex justify-content-between align-items-center">
                <p className="text-muted mb-0">
                  {isComparisonMode
                    ? `Comparing visits from ${patientVisits.find((v) => v._id === firstVisitId)?.formattedDateTime || "first visit"} and ${patientVisits.find((v) => v._id === secondVisitId)?.formattedDateTime || "second visit"}`
                    : `Viewing dental chart from ${patientVisits.find((v) => v._id === firstVisitId)?.formattedDateTime || "selected visit"}`}
                </p>
                <div className="d-flex align-items-center">
                  <div className="mr-4">
                    <span className="mr-2">First Visit:</span>
                    <Dropdown
                      isOpen={firstDropdownOpen}
                      toggle={toggleFirstDropdown}
                      direction="down"
                      className="d-inline-block"
                    >
                      <DropdownToggle color="primary" className="btn-sm">
                        {patientVisits.find((v) => v._id === firstVisitId)?.formattedDateTime || "Select Visit"}
                      </DropdownToggle>
                      <DropdownMenu className="overflow-auto">
                        {patientVisits.sort((a, b) => {
                          // Sort by creation date (newest first)
                          const dateA = a.created_on ? new Date(a.created_on) : new Date(a.date_of_visit);
                          const dateB = b.created_on ? new Date(b.created_on) : new Date(b.date_of_visit);
                          return dateB - dateA;
                        }).map((visit, index) => (
                          <DropdownItem
                            key={visit._id}
                            onClick={() => {
                              // Check if we need to swap visits based on creation dates
                              const secondVisitObj = patientVisits.find((v) => v._id === secondVisitId);

                              if (visit && secondVisitObj) {
                                const selectedCreationDate = visit.created_on
                                  ? new Date(visit.created_on)
                                  : new Date(visit.date_of_visit);

                                const secondCreationDate = secondVisitObj.created_on
                                  ? new Date(secondVisitObj.created_on)
                                  : new Date(secondVisitObj.date_of_visit);

                                // If the selected visit is older than the second visit, swap them
                                if (selectedCreationDate < secondCreationDate) {
                                  console.log("Swapping visits because selected first visit is older than second visit");
                                  handleSecondVisitSelect(visit._id, patientVisits);
                                  handleFirstVisitSelect(secondVisitId, patientVisits);
                                  return;
                                }
                              }

                              // Normal case - no swap needed
                              handleFirstVisitSelect(visit._id, patientVisits);
                            }}
                            active={firstVisitId === visit._id}
                            disabled={visit._id === secondVisitId}
                          >
                            {visit.formattedDateTime}
                            {index === 0 && <span className="ml-2 badge badge-info">Latest</span>}
                          </DropdownItem>
                        ))}
                        {patientVisits.length === 0 && <DropdownItem disabled>No visits available</DropdownItem>}
                      </DropdownMenu>
                    </Dropdown>
                  </div>

                  <div>
                    <span className="mr-2">Second Visit:</span>
                    <Dropdown
                      isOpen={secondDropdownOpen}
                      toggle={toggleSecondDropdown}
                      direction="down"
                      className="d-inline-block"
                    >
                      <DropdownToggle color="primary" className="btn-sm">
                        {patientVisits.find((v) => v._id === secondVisitId)?.formattedDateTime || "Select Visit"}
                      </DropdownToggle>
                      <DropdownMenu className="overflow-auto">
                        {patientVisits.sort((a, b) => {
                          // Sort by creation date (newest first)
                          const dateA = a.created_on ? new Date(a.created_on) : new Date(a.date_of_visit);
                          const dateB = b.created_on ? new Date(b.created_on) : new Date(b.date_of_visit);
                          return dateB - dateA;
                        }).map((visit, index) => (
                          <DropdownItem
                            key={visit._id}
                            onClick={() => {
                              // Check if we need to swap visits based on creation dates
                              const firstVisitObj = patientVisits.find((v) => v._id === firstVisitId);

                              if (visit && firstVisitObj) {
                                const selectedCreationDate = visit.created_on
                                  ? new Date(visit.created_on)
                                  : new Date(visit.date_of_visit);

                                const firstCreationDate = firstVisitObj.created_on
                                  ? new Date(firstVisitObj.created_on)
                                  : new Date(firstVisitObj.date_of_visit);

                                // If the selected visit is more recent than the first visit, swap them
                                if (selectedCreationDate > firstCreationDate) {
                                  console.log("Swapping visits because selected second visit is more recent than first visit");
                                  handleFirstVisitSelect(visit._id, patientVisits);
                                  handleSecondVisitSelect(firstVisitId, patientVisits);
                                  return;
                                }
                              }

                              // Normal case - no swap needed
                              handleSecondVisitSelect(visit._id, patientVisits);
                            }}
                            active={secondVisitId === visit._id}
                            disabled={visit._id === firstVisitId}
                          >
                            {visit.formattedDateTime}
                            {index === 0 && <span className="ml-2 badge badge-info">Latest</span>}
                          </DropdownItem>
                        ))}
                        {patientVisits.length === 0 && <DropdownItem disabled>No visits available</DropdownItem>}
                      </DropdownMenu>
                    </Dropdown>
                  </div>
                </div>
              </div>
            </Col>
            <br />
            <br />
          </Row>
        </>
        )}

        {isFirstLoading || isSecondLoading || (isConsolidatedView && isLoadingConsolidated) ? (
          <div className="text-center mt-5">
            <Spinner color="primary" />
            <p className="mt-2">
              {isConsolidatedView ? "Loading consolidated dental chart..." : "Loading dental chart..."}
            </p>
          </div>
        ) : message ? (
          <div className="alert alert-info mt-3">{message}</div>
        ) : (
          <div>
            {isConsolidatedView ? (
              // Consolidated view
              <Row>
                <Col md={12}>
                  <Card>
                    <CardBody>
                      <h4 className="mb-4">Consolidated View - Latest Data Across All Visits</h4>
                      <ConsolidatedToothTable
                        consolidatedAnnotations={consolidatedAnnotations}
                        classCategories={classCategories}
                        patientVisits={patientVisits}
                      />
                    </CardBody>
                  </Card>
                </Col>
              </Row>
            ) : isComparisonMode ? (
              // Side-by-side comparison view
              <>
                <Row className="mb-4">
                  <Col md={6}>
                    <Card>
                      <CardBody>
                        <h5 className="text-center mb-3">
                          {patientVisits.find((v) => v._id === secondVisitId)?.formattedDateTime || "Second Visit"}
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
                  <Col md={6}>
                    <Card>
                      <CardBody>
                        <h5 className="text-center mb-3">
                          {patientVisits.find((v) => v._id === firstVisitId)?.formattedDateTime || "First Visit"}
                        </h5>
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

                <Row>
                  <Col md={6}>
                    <Card>
                      <CardBody>
                        <h4>
                          {patientVisits.find((v) => v._id === secondVisitId)?.formattedDateTime || "Second Visit"} - Tooth
                          Anomalies/Procedures
                        </h4>
                        <ToothAnnotationTable
                          annotations={selectedVisitAnnotations}
                          classCategories={classCategories}
                          selectedTooth={selectedTooth}
                          otherSideAnnotations={lastVisitAnnotations}
                          visitId={secondVisitId}
                        />
                      </CardBody>
                    </Card>
                  </Col>
                  <Col md={6}>
                    <Card>
                      <CardBody>
                        <h4>
                          {patientVisits.find((v) => v._id === firstVisitId)?.formattedDateTime || "First Visit"} - Tooth
                          Anomalies/Procedures
                        </h4>
                        <ToothAnnotationTable
                          annotations={lastVisitAnnotations}
                          classCategories={classCategories}
                          selectedTooth={comparisonTooth}
                          otherSideAnnotations={selectedVisitAnnotations}
                          visitId={firstVisitId}
                        />
                      </CardBody>
                    </Card>
                  </Col>
                </Row>
              </>
            ) : (
              // Single view (last visit only)
              <>
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

                <Row>
                  <Col md={6} className="mx-auto">
                    <Card>
                      <CardBody>
                        <h4>Tooth Anomalies/Procedures</h4>
                        <ToothAnnotationTable
                          annotations={lastVisitAnnotations}
                          classCategories={classCategories}
                          selectedTooth={selectedTooth}
                          visitId={firstVisitId}
                        />
                      </CardBody>
                    </Card>
                  </Col>
                </Row>
              </>
            )}
          </div>
        )}
      </CardBody>
    </Card>
  )
}

export default connect(null, { setBreadcrumbItems })(TemporalityPage)