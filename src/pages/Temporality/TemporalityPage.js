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
import {calculateOverlap, polygonArea} from "../AnnotationTools/path-utils"

const TemporalityPage = (props) => {
  document.title = "Temporality View | AGP Dental Tool"
  const apiUrl = process.env.REACT_APP_NODEAPIURL
  const [redirectToLogin, setRedirectToLogin] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
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
  const [isComparisonMode, setIsComparisonMode] = useState(false)
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
      setPatientVisits([])
      const response = await axios.get(
        `${apiUrl}/getPatientVisitsByID?patientId=${sessionStorage.getItem("patientId")}`,
        {
          headers: {
            Authorization: sessionStorage.getItem("token"),
          },
        },
      )

      if (response.status === 200) {
        const visitData = response.data
        sessionStorage.setItem("token", response.headers["new-token"])

        // Format dates and set state
        if (visitData.patienVisits && visitData.patienVisits.length > 0) {
          const formattedVisits = visitData.patienVisits.map((visit) => ({
            ...visit,
            formattedDate: formatDate(new Date(visit.date_of_visit)),
          }))

          // Store all visits
          setPatientVisits(formattedVisits)

          // Set default visits for comparison (last and second-to-last)
          if (formattedVisits.length >= 2) {
            setFirstVisitId(formattedVisits[0]._id)
            setSecondVisitId(formattedVisits[1]._id)
            setIsComparisonMode(true)

            // Fetch annotations for both visits
            handleFirstVisitSelect(formattedVisits[0]._id)
            handleSecondVisitSelect(formattedVisits[1]._id)
          } else if (formattedVisits.length === 1) {
            setFirstVisitId(formattedVisits[0]._id)
            handleFirstVisitSelect(formattedVisits[0]._id)
          }
          return formattedVisits
        } else {
          setMessage("No visits found for this patient.")
          return []
        }
      }
    } catch (error) {
      if (error.status === 403 || error.status === 401) {
        sessionStorage.removeItem("token")
        setRedirectToLogin(true)
      } else {
        logErrorToServer(error, "fetchPatientVisits")
        setMessage("Error fetching patient visits")
        console.error("Error fetching patient visits:", error)
      }
      return []
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
          imagesData.forEach((image) => {
            if (image.annotations && image.annotations.annotations && image.annotations.annotations.annotations) {
              visitAnnots = [...visitAnnots, ...image.annotations.annotations.annotations]
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
          lastVisitData.images.forEach((image) => {
            if (image.annotations && image.annotations.annotations && image.annotations.annotations.annotations) {
              lastVisitAnnots = [...lastVisitAnnots, ...image.annotations.annotations.annotations]
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
                  visitId: patientVisits[i]._id
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
  const handleFirstVisitSelect = async (visitId) => {
    setFirstVisitId(visitId)
    setIsLoading(true)

    try {
      // Fetch annotations for the first visit
      const response = await axios.get(
        `${apiUrl}/get-annotations-for-treatment-plan?patientId=${sessionStorage.getItem("patientId")}`,
        {
          headers: {
            Authorization: sessionStorage.getItem("token"),
          },
        },
      )

      if (response.status === 200) {
        sessionStorage.setItem("token", response.headers["new-token"])
        const visitData = response.data

        // Process visit annotations
        let visitAnnots = []
        if (visitData.images && visitData.images.length > 0) {
          visitData.images.forEach((image) => {
            if (image.annotations && image.annotations.annotations && image.annotations.annotations.annotations) {
              visitAnnots = [...visitAnnots, ...image.annotations.annotations.annotations]
            }
          })
          setLastVisitAnnotations(visitAnnots)
        } else {
          setMessage("No annotations found for the selected visit.")
          setLastVisitAnnotations([])
        }
      }
    } catch (error) {
      logErrorToServer(error, "handleFirstVisitSelect")
      setMessage("Error fetching annotations for the first visit")
      console.error("Error fetching annotations:", error)
      setLastVisitAnnotations([])
    } finally {
      setIsLoading(false)
    }

    // If second visit is also selected, enable comparison mode
    if (secondVisitId) {
      setIsComparisonMode(true)
    }

    // Reset tooth selection
    setSelectedTooth(null)
  }

  // Handle second visit selection
  const handleSecondVisitSelect = async (visitId) => {
    setSecondVisitId(visitId)
    setIsLoading(true)

    try {
      // Fetch annotations for the second visit
      const response = await axios.get(`${apiUrl}/visitid-images?visitID=${visitId}`, {
        headers: {
          Authorization: sessionStorage.getItem("token"),
        },
      })

      if (response.status === 200) {
        sessionStorage.setItem("token", response.headers["new-token"])
        const imagesData = response.data.images

        // Process selected visit annotations
        let selectedVisitAnnots = []
        if (imagesData && imagesData.length > 0) {
          imagesData.forEach((image) => {
            if (image.annotations && image.annotations.annotations && image.annotations.annotations.annotations) {
              selectedVisitAnnots = [...selectedVisitAnnots, ...image.annotations.annotations.annotations]
            }
          })
          setSelectedVisitAnnotations(selectedVisitAnnots)
        } else {
          setMessage("No images found for the selected visit.")
          setSelectedVisitAnnotations([])
        }
      }
    } catch (error) {
      logErrorToServer(error, "handleSecondVisitSelect")
      setMessage("Error fetching annotations for the second visit")
      console.error("Error fetching annotations:", error)
      setSelectedVisitAnnotations([])
    } finally {
      setIsLoading(false)
    }

    // If first visit is also selected, enable comparison mode
    if (firstVisitId) {
      setIsComparisonMode(true)
    }

    // Reset tooth selection
    setComparisonTooth(null)
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

        {!isConsolidatedView && (
          <Row>
            <Col md={12}>
              <div className="d-flex justify-content-between align-items-center">
                <p className="text-muted mb-0">
                  {isComparisonMode
                    ? `Comparing visits from ${patientVisits.find((v) => v._id === firstVisitId)?.formattedDate || "first visit"} and ${patientVisits.find((v) => v._id === secondVisitId)?.formattedDate || "second visit"}`
                    : `Viewing dental chart from ${patientVisits.find((v) => v._id === firstVisitId)?.formattedDate || "selected visit"}`}
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
                        {patientVisits.find((v) => v._id === firstVisitId)?.formattedDate || "Select Visit"}
                      </DropdownToggle>
                      <DropdownMenu>
                        {patientVisits.map((visit, index) => (
                          <DropdownItem
                            key={visit._id}
                            onClick={() => handleFirstVisitSelect(visit._id)}
                            active={firstVisitId === visit._id}
                            disabled={visit._id === secondVisitId}
                          >
                            {visit.formattedDate}
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
                        {patientVisits.find((v) => v._id === secondVisitId)?.formattedDate || "Select Visit"}
                      </DropdownToggle>
                      <DropdownMenu>
                        {patientVisits.map((visit, index) => (
                          <DropdownItem
                            key={visit._id}
                            onClick={() => handleSecondVisitSelect(visit._id)}
                            active={secondVisitId === visit._id}
                            disabled={visit._id === firstVisitId}
                          >
                            {visit.formattedDate}
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
        )}

        {isLoading || (isConsolidatedView && isLoadingConsolidated) ? (
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
                          {patientVisits.find((v) => v._id === firstVisitId)?.formattedDate || "First Visit"}
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
                  <Col md={6}>
                    <Card>
                      <CardBody>
                        <h5 className="text-center mb-3">
                          {patientVisits.find((v) => v._id === secondVisitId)?.formattedDate || "Second Visit"}
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

                <Row>
                  <Col md={6}>
                    <Card>
                      <CardBody>
                        <h4>
                          {patientVisits.find((v) => v._id === firstVisitId)?.formattedDate || "First Visit"} - Tooth
                          Anomalies/Procedures
                        </h4>
                        <ToothAnnotationTable
                          annotations={lastVisitAnnotations}
                          classCategories={classCategories}
                          selectedTooth={selectedTooth}
                          otherSideAnnotations={selectedVisitAnnotations}
                          visitId={firstVisitId}
                        />
                      </CardBody>
                    </Card>
                  </Col>
                  <Col md={6}>
                    <Card>
                      <CardBody>
                        <h4>
                          {patientVisits.find((v) => v._id === secondVisitId)?.formattedDate || "Second Visit"} - Tooth
                          Anomalies/Procedures
                        </h4>
                        <ToothAnnotationTable
                          annotations={selectedVisitAnnotations}
                          classCategories={classCategories}
                          selectedTooth={comparisonTooth}
                          otherSideAnnotations={lastVisitAnnotations}
                          visitId={secondVisitId}
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