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
} from "reactstrap"
import { Navigate } from "react-router-dom"
import "bootstrap/dist/css/bootstrap.min.css"
import { logErrorToServer } from "utils/logError"
import DentalChart from "../AnnotationTools/DentalChart"
import ToothAnnotationTable from "./ToothAnnotationTable"
import axios from "axios"
import { setBreadcrumbItems } from "../../store/actions"
import { connect } from "react-redux"

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
  const breadcrumbItems = [
    { title: `${sessionStorage.getItem("firstName")} ${sessionStorage.getItem("lastName")}`, link: "/practiceList" },
    { title: sessionStorage.getItem("practiceName"), link: "/patientList" },
    { title: `${sessionStorage.getItem("patientName")} Images List`, link: "/patientImagesList" },
    { title: `Temporality View`, link: "/temporalityPage" },
  ]
  // Toggle dropdowns
  const toggleFirstDropdown = () => setFirstDropdownOpen((prevState) => !prevState)
  const toggleSecondDropdown = () => setSecondDropdownOpen((prevState) => !prevState)

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

  // Fetch annotations for both the last visit and a selected visit (if provided)
  const fetchLastVisitAnnotations = async (visitId = null) => {
    try {
      setIsLoading(true)

      // First, fetch annotations for the last visit (treatment plan)
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
          setLastVisitAnnotations(lastVisitAnnots)
        } else {
          setMessage("No annotations found for the last visit.")
          setLastVisitAnnotations([])
        }

        // If a specific visit is selected, fetch its annotations too
        if (visitId) {
          setIsComparisonMode(true)

          // Fetch images for the selected visit
          const selectedVisitResponse = await axios.get(`${apiUrl}/visitid-images?visitID=${visitId}`, {
            headers: {
              Authorization: sessionStorage.getItem("token"),
            },
          })

          if (selectedVisitResponse.status === 200) {
            sessionStorage.setItem("token", selectedVisitResponse.headers["new-token"])
            const imagesData = selectedVisitResponse.data.images

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
        } else {
          // If no comparison visit is selected, just show the last visit
          setIsComparisonMode(false)
          setSelectedVisitAnnotations([])
        }

        return lastVisitAnnots
      }
    } catch (error) {
      if (error.status === 403 || error.status === 401) {
        sessionStorage.removeItem("token")
        setRedirectToLogin(true)
      } else {
        logErrorToServer(error, "fetchLastVisitAnnotations")
        setMessage("Error fetching annotations")
        console.error("Error fetching annotations:", error)
      }
      setLastVisitAnnotations([])
      setSelectedVisitAnnotations([])
      return []
    } finally {
      setIsLoading(false)
    }
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
          <Col md={12}>
            <Button color="primary" onClick={() => setRedirectToPatientVisitPage(true)}>
              Patient Visits
            </Button>
            <br />
            <br />
          </Col>
        </Row>
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
                      <h4>
                        {patientVisits.find((v) => v._id === firstVisitId)?.formattedDate || "First Visit"} - Tooth
                        Anomalies/Procedures
                      </h4>
                      <ToothAnnotationTable
                        annotations={lastVisitAnnotations}
                        classCategories={classCategories}
                        selectedTooth={selectedTooth}
                        otherSideAnnotations={selectedVisitAnnotations}
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
      </CardBody>
    </Card>
  )
}

export default connect(null, { setBreadcrumbItems })(TemporalityPage)