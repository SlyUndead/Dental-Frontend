"use client"

import { useState, useEffect, useRef } from "react"
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
import "../../assets/scss/custom/plugins/icons/_fontawesome.scss"
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
  const printRef = useRef(null)
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

    if (newValue) {
      // When enabling consolidated view, fetch all visits' annotations if not already done
      setIsConsolidatedView(true) // Set this first to show loading state
      await fetchAllVisitsAnnotations()
    } else {
      // When disabling consolidated view, clear the consolidated data to free up memory
      // This prevents the 3-second delay when toggling off
      setIsConsolidatedView(false)

      // Use setTimeout to clear data after the UI has updated
      // This prevents the UI from freezing during the state update
      if (!isConsolidatedView) { // Double-check we're still in non-consolidated mode
        setAllVisitsAnnotations({})
        setConsolidatedAnnotations([])
      }
    }
  }

  // Handle print functionality
  const handlePrint = () => {
    const patientName = sessionStorage.getItem('patientName')
    const printWindow = window.open('', '_blank')

    // Collect all stylesheets
    const styles = Array.from(document.styleSheets).map((styleSheet) => {
      try {
        const rules = Array.from(styleSheet.cssRules)
          .filter(rule => {
            // Ignore table hover styles
            return !rule.selectorText || !rule.selectorText.includes(':hover')
          })
          .map(rule => rule.cssText)
          .join('\n')
        return `<style>${rules}</style>`
      } catch (e) {
        // Handle CORS issues if styleSheet is from another domain
        return ''
      }
    }).join('\n')

    // Get the content to print
    const contentToPrint = printRef.current.innerHTML

    // Write to the new window
    printWindow.document.write(`
      <html>
        <head>
          <title>Temporality View - ${patientName}</title>
          ${styles}
          <style>
            body {
              font-family: Arial, sans-serif;
              padding: 20px;
            }
            .header {
              text-align: center;
              margin-bottom: 20px;
              font-size: 24px;
              font-weight: bold;
            }
            @media print {
              @page {
                margin: 10mm;
              }
              button, .no-print {
                display: none !important;
              }
            }
          </style>
        </head>
        <body>
          <div class="header">
            Temporality View - ${patientName}
          </div>
          <div>
            ${contentToPrint}
          </div>
        </body>
      </html>
    `)

    printWindow.document.close()

    // Wait for styles to load then print
    setTimeout(() => {
      printWindow.print()
      printWindow.close()
    }, 500)
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

          // Sort visits by creation date (newest first)
          const sortedVisits = [...formattedVisits].sort((a, b) => {
            const dateA = a.created_on ? new Date(a.created_on) : new Date(a.date_of_visit);
            const dateB = b.created_on ? new Date(b.created_on) : new Date(b.date_of_visit);
            return dateB - dateA;
          });

          // Set default visits for comparison (newest and second-newest)
          if (sortedVisits.length >= 2) {
            // First visit is the newest, second visit is the second newest
            setFirstVisitId(sortedVisits[0]._id);
            setSecondVisitId(sortedVisits[1]._id);
            setIsComparisonMode(true);
            // Fetch annotations for both visits
            handleFirstVisitSelect(sortedVisits[0]._id, formattedVisits);
            handleSecondVisitSelect(sortedVisits[1]._id, formattedVisits);
          } else if (sortedVisits.length === 1) {
            setFirstVisitId(sortedVisits[0]._id);
            handleFirstVisitSelect(sortedVisits[0]._id, formattedVisits);
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

  // Fetch annotations for all visits
  const fetchAllVisitsAnnotations = async () => {
    if (Object.keys(allVisitsAnnotations).length > 0 && !isLoadingConsolidated) {
      generateConsolidatedView()
      return
    }

    // If we have consolidated annotations already, no need to regenerate them
    if (consolidatedAnnotations.length > 0 && !isLoadingConsolidated) {
      return
    }

    setIsLoadingConsolidated(true)
    try {
      const visitAnnotations = {}
      // Track which teeth we've already found
      const foundTeeth = new Set()
      // Track which teeth still need to be found (teeth 1-32)
      const remainingTeeth = new Set(Array.from({ length: 32 }, (_, i) => i + 1))

      // Process visits in order (newest to oldest)
      for (let i = 0; i < patientVisits.length; i++) {
        // If we've found all teeth, stop fetching more visits
        if (remainingTeeth.size === 0) {
          break
        }

        const visitId = patientVisits[i]._id

        try {
          // Use visitid-annotations API for all visits
          const response = await axios.get(`${apiUrl}/visitid-annotations?visitID=${visitId}`, {
            headers: {
              Authorization: sessionStorage.getItem("token"),
            },
          })

          if (response.status === 200) {
            sessionStorage.setItem("token", response.headers["new-token"])
            const imagesData = response.data.images

            // Process visit annotations
            let visitAnnots = []

            // Skip this visit if there are no images
            if (!imagesData || imagesData.length === 0) {
              console.log(`No images found for visit ${visitId}, skipping...`)
              continue
            }

            imagesData.forEach((image, index) => {
              if (image.annotations && image.annotations.annotations && image.annotations.annotations.annotations) {
                // Add image ID to each annotation
                const annotationsWithImageId = image.annotations.annotations.annotations.map((annotation) => ({
                  ...annotation,
                  imageId: image._id,
                  imageNumber: image.imageNumber || index + 1,
                  imageName: image.name,
                  visitId: visitId,
                }))
                visitAnnots = [...visitAnnots, ...annotationsWithImageId]
              }
            })

            // Skip this visit if there are no annotations
            if (visitAnnots.length === 0) {
              continue
            }

            // Store the visit annotations
            visitAnnotations[visitId] = visitAnnots

            // Check which teeth were found in this visit
            visitAnnots.forEach(anno => {
              if (!isNaN(Number.parseInt(anno.label))) {
                const toothNumber = Number.parseInt(anno.label)
                if (toothNumber >= 1 && toothNumber <= 32 && !foundTeeth.has(toothNumber)) {
                  foundTeeth.add(toothNumber)
                  remainingTeeth.delete(toothNumber)
                }
              }
            })
          }
        } catch (error) {
          console.error(`Error fetching annotations for visit ${visitId}:`, error)
          // Continue to the next visit if there's an error with this one
          continue
        }
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
  const calculateBoneLossRanges = (annotations) => {
  if (!annotations || annotations.length === 0) return []

  // First, filter out only the tooth annotations (numeric labels)
  const toothAnnots = annotations.filter((anno) => !isNaN(Number.parseInt(anno.label)))

  // Find all bone loss annotations
  const boneLossAnnotations = annotations.filter(
    (anno) => anno.label && anno.label.toLowerCase().includes("bone loss") && anno.segmentation,
  )

  // Process each bone loss annotation to find affected teeth
  const boneLossRanges = []

  boneLossAnnotations.forEach((boneLossAnno) => {
    const overlappingTeeth = []

    // Find all teeth that overlap with this bone loss annotation
    toothAnnots.forEach((toothAnno) => {
      const toothNumber = Number.parseInt(toothAnno.label)
      if (!isNaN(toothNumber) && toothNumber >= 1 && toothNumber <= 32 && toothAnno.segmentation) {
        try {
          const overlap = calculateOverlap(boneLossAnno.segmentation, toothAnno.segmentation)
          if (overlap > 0) {
            overlappingTeeth.push(toothNumber)
          }
        } catch (error) {
          console.error("Error calculating overlap:", error)
        }
      }
    })

    // Sort teeth by number
    overlappingTeeth.sort((a, b) => a - b)

    if (overlappingTeeth.length > 0) {
      // Find continuous ranges
      const ranges = []
      let currentRange = [overlappingTeeth[0]]

      for (let i = 1; i < overlappingTeeth.length; i++) {
        const prevTooth = overlappingTeeth[i - 1]
        const currentTooth = overlappingTeeth[i]

        // If teeth are consecutive or within 1 tooth apart, add to current range
        if (currentTooth - prevTooth <= 2) {
          currentRange.push(currentTooth)
        } else {
          // Start a new range
          ranges.push([...currentRange])
          currentRange = [currentTooth]
        }
      }

      // Add the last range
      ranges.push(currentRange)

      // Format each range and add to results
      ranges.forEach((range) => {
        const rangeText = range.length > 1 ? `${range[0]}-${range[range.length - 1]}` : `${range[0]}`

        boneLossRanges.push({
          teethRange: rangeText,
          affectedTeeth: range,
          annotation: boneLossAnno,
        })
      })
    }
  })

  return boneLossRanges
}
  // Generate consolidated view from all visits' annotations
  const generateConsolidatedView = (visitAnnots = null) => {
    const annotations = visitAnnots || allVisitsAnnotations
    if (!annotations || Object.keys(annotations).length === 0) return

    // Track which teeth we've already processed
    const processedTeeth = new Set()
    const consolidatedTeeth = {}
    // Track which teeth still need to be found
    const remainingTeeth = new Set(Array.from({ length: 32 }, (_, i) => i + 1))

    // Process visits in order (newest to oldest)
    for (let i = 0; i < patientVisits.length; i++) {
      const visitId = patientVisits[i]._id
      const visitAnnotations = annotations[visitId] || []

      // Get tooth annotations for this visit
      const toothAnnots = visitAnnotations.filter((anno) => !isNaN(Number.parseInt(anno.label)))

      // If we've found all teeth, we can stop processing visits
      if (remainingTeeth.size === 0) {
        break
      }

      // For each tooth in this visit
      toothAnnots.forEach((toothAnno) => {
        const toothNumber = Number.parseInt(toothAnno.label)

        // If we've already processed this tooth in a more recent visit, skip it
        if (processedTeeth.has(toothNumber)) {
          return
        }

        // Mark this tooth as processed
        processedTeeth.add(toothNumber)
        remainingTeeth.delete(toothNumber)

        // Find all anomalies that are associated with this tooth
        const anomalies = []

        visitAnnotations.forEach((anno) => {
          // Skip tooth annotations
          if (!isNaN(Number.parseInt(anno.label))) {
            return
          }

          // First check if the annotation has an associatedTooth field
          if (anno.associatedTooth !== undefined && anno.associatedTooth !== null) {
            // If the associatedTooth matches this tooth, add it to anomalies
            if (Number.parseInt(anno.associatedTooth) === toothNumber) {
              anomalies.push({
                name: anno.label,
                category: classCategories[anno.label.toLowerCase()] || "Unknown",
                confidence: anno.confidence,
                overlapPercentage: 100, // We're using associatedTooth, so it's a perfect match
                visitDate: patientVisits[i].formattedDate,
                visitIndex: i,
                visitId: patientVisits[i]._id,
                imageNumber: anno.imageNumber,
                imageName: anno.imageName,
                // Add original annotation data for reference
                originalAnnotation: anno
              })
            }
          }
          // If no associatedTooth field or it's null, fall back to overlap calculation
          else if (anno.segmentation && toothAnno.segmentation) {
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
                  imageName: anno.imageName,
                  // Add original annotation data for reference
                  originalAnnotation: anno
                })
              }
            } catch (error) {
              console.error("Error calculating overlap:", error)
            }
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
          // Add the original tooth annotation for reference
          originalAnnotation: toothAnno
        }
      })
    }

    // Process unassigned annotations
    const unassignedAnomalies = []

    // Go through all visits to find unassigned annotations
    for (let i = 0; i < patientVisits.length; i++) {
      const visitId = patientVisits[i]._id
      const visitAnnotations = annotations[visitId] || []

      // Skip tooth annotations and look for unassigned anomalies
      visitAnnotations.forEach((anno) => {
        // Skip tooth annotations
        if (!isNaN(Number.parseInt(anno.label))) {
          return
        }

        // Check if this annotation has an associatedTooth field that's null or "Unassigned"
        if (anno.associatedTooth === null || anno.associatedTooth === "Unassigned") {
          unassignedAnomalies.push({
            name: anno.label,
            category: classCategories[anno.label.toLowerCase()] || "Unknown",
            confidence: anno.confidence,
            visitDate: patientVisits[i].formattedDate,
            visitIndex: i,
            visitId: patientVisits[i]._id,
            imageNumber: anno.imageNumber,
            imageName: anno.imageName,
            // Add original annotation data for reference
            originalAnnotation: anno
          })
        }
      })

      // If we've found unassigned anomalies, we can stop looking in older visits
      if (unassignedAnomalies.length > 0) {
        break
      }
    }

    // Add unassigned anomalies if any were found
    if (unassignedAnomalies.length > 0) {
      consolidatedTeeth["unassigned"] = {
        toothNumber: "Unassigned",
        anomalies: unassignedAnomalies,
        isUnassigned: true,
        visitDate: unassignedAnomalies[0].visitDate,
        visitIndex: unassignedAnomalies[0].visitIndex,
      }
    }

    // Make sure all teeth are represented in the consolidated view
    // This ensures the dental chart shows all teeth, even if they don't have annotations
    for (let i = 1; i <= 32; i++) {
      if (!consolidatedTeeth[i]) {
        consolidatedTeeth[i] = {
          toothNumber: i,
          anomalies: [
            {
              name: "Not detected",
              category: "Info",
            },
          ],
          hasAnnotations: false,
        }
      }
    }

    // Convert to array and sort by tooth number, with "Unassigned" at the end
    const consolidatedArray = Object.values(consolidatedTeeth).sort((a, b) => {
      // Always put "Unassigned" at the end
      if (a.toothNumber === "Unassigned" || a.isUnassigned) return 1
      if (b.toothNumber === "Unassigned" || b.isUnassigned) return -1
      // Otherwise sort by tooth number
      return a.toothNumber - b.toothNumber
    })

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
  const handleFirstVisitSelect = async (visitId, patientVisits) => {
    setFirstVisitId(visitId)
    setIsFirstLoading(true)
    // Find the selected visit
    const selectedVisit = patientVisits.find((v) => v._id === visitId)
    if (!selectedVisit) {
      setIsFirstLoading(false);
      return;
    }

    try {
      // Fetch annotations for ONLY the selected visit
      const response = await axios.get(`${apiUrl}/visitid-annotations?visitID=${visitId}`,
        {
          headers: {
            Authorization: sessionStorage.getItem("token"),
          },
        },
      );

      if (response.status === 200) {
        sessionStorage.setItem("token", response.headers["new-token"]);
        const imagesData = response.data.images;
        let visitAnnotations = [];

        // Process visit annotations
        if (imagesData && imagesData.length > 0) {
          imagesData.forEach((image, index) => {
            if (image.annotations && image.annotations.annotations && image.annotations.annotations.annotations) {
              const annotationsWithImageId = image.annotations.annotations.annotations.map((annotation) => ({
                ...annotation,
                imageId: image._id,
                imageNumber: image.imageNumber || index + 1,
                imageName: image.name,
                visitId: visitId, // Add visit ID to trace back which visit this annotation came from
              }));
              visitAnnotations = [...visitAnnotations, ...annotationsWithImageId];
            }
          });
        }

        setLastVisitAnnotations(visitAnnotations);
        if (visitAnnotations.length === 0) {
          setMessage("No annotations found for the selected visit.");
        }
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
  // Handle second visit selection
  const handleSecondVisitSelect = async (visitId, patientVisits) => {
    setSecondVisitId(visitId);
    setIsSecondLoading(true);
    // Find the selected visit
    const selectedVisit = patientVisits.find((v) => v._id === visitId);
    if (!selectedVisit) {
      setIsSecondLoading(false);
      return;
    }

    try {
      // Fetch annotations for ONLY the selected visit
      const response = await axios.get(
        `${apiUrl}/visitid-annotations?visitID=${visitId}`,
        {
          headers: {
            Authorization: sessionStorage.getItem("token"),
          },
        },
      );

      if (response.status === 200) {
        sessionStorage.setItem("token", response.headers["new-token"]);
        const imagesData = response.data.images;
        let visitAnnotations = [];

        // Process visit annotations
        if (imagesData && imagesData.length > 0) {
          imagesData.forEach((image, index) => {
            if (image.annotations && image.annotations.annotations && image.annotations.annotations.annotations) {
              const annotationsWithImageId = image.annotations.annotations.annotations.map((annotation) => ({
                ...annotation,
                imageId: image._id,
                imageNumber: image.imageNumber || index + 1,
                imageName: image.name,
                visitId: visitId, // Add visit ID to trace back which visit this annotation came from
              }));
              visitAnnotations = [...visitAnnotations, ...annotationsWithImageId];
            }
          });
        }

        setSelectedVisitAnnotations(visitAnnotations);
        if (visitAnnotations.length === 0) {
          setMessage("No annotations found for the selected visit.");
        }
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
          <Col md={12} className="d-flex justify-content-between align-items-center mb-3">
            <div className="d-flex align-items-center">
              <Button color="primary" onClick={() => setRedirectToPatientVisitPage(true)} className="mr-3">
                Patient Visits
              </Button>
              <FormGroup check className="ml-3 mb-0">
                <Label check>
                  <Input type="checkbox" checked={isConsolidatedView} onChange={toggleConsolidatedView} /> Consolidated
                  View
                </Label>
              </FormGroup>
            </div>
            <div>
              <Button color="success" onClick={handlePrint}>
                <i className="fa fa-print mr-1"></i> Print
              </Button>
            </div>
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
                onRangeChange={() => {
                  // This is just for preview, no action needed
                }}
                onApplySelection={(firstVisitObj, secondVisitObj) => {
                  // Make sure the newer visit is always the first visit (right side)
                  // and the older visit is always the second visit (left side)
                  const firstCreationDate = firstVisitObj.visitObj.created_on
                    ? new Date(firstVisitObj.visitObj.created_on)
                    : new Date(firstVisitObj.visitObj.date_of_visit);

                  const secondCreationDate = secondVisitObj.visitObj.created_on
                    ? new Date(secondVisitObj.visitObj.created_on)
                    : new Date(secondVisitObj.visitObj.date_of_visit);

                  // If the second visit is more recent than the first visit, swap them
                  if (secondCreationDate > firstCreationDate) {
                    // Swap the visit objects
                    const tempVisitObj = firstVisitObj;
                    firstVisitObj = secondVisitObj;
                    secondVisitObj = tempVisitObj;
                  }

                  // Get the first visit ID (newer visit)
                  if (firstVisitObj && firstVisitObj.id) {
                    handleFirstVisitSelect(firstVisitObj.id, patientVisits);
                  }

                  // Get the second visit ID (older visit)
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
                    <span className="mr-2">Left Visit:</span>
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

                  <div>
                    <span className="mr-2">Right Visit:</span>
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
          <div ref={printRef}>
            {isConsolidatedView ? (
              // Consolidated view
              <Row>
                <Col md={12}>
                  <Card>
                    <CardBody>
                      <h4 className="mb-4">Consolidated View - Latest Data Across All Visits</h4>
                      <DentalChart
                        annotations={consolidatedAnnotations}
                        classCategories={classCategories}
                        confidenceLevels={confidenceLevels}
                        setHiddenAnnotations={setHiddenAnnotations}
                        onToothSelect={setSelectedTooth}
                        externalSelectedTooth={selectedTooth}
                        isConsolidatedView={true}
                      />
                      <ConsolidatedToothTable
                        consolidatedAnnotations={consolidatedAnnotations}
                        classCategories={classCategories}
                        patientVisits={patientVisits}
                        selectedTooth={selectedTooth}
                        confidenceLevels={confidenceLevels}
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
                          onToothSelect={setSelectedTooth}
                          externalSelectedTooth={selectedTooth}
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
                          externalSelectedTooth={selectedTooth}
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
                          patientVisits={patientVisits}
                          confidenceLevels={confidenceLevels}
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
                          selectedTooth={selectedTooth}
                          otherSideAnnotations={selectedVisitAnnotations}
                          visitId={firstVisitId}
                          patientVisits={patientVisits}
                          confidenceLevels={confidenceLevels}
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
                        <h5 className="mb-3">Dental Chart</h5>
                        <DentalChart
                          annotations={lastVisitAnnotations}
                          classCategories={classCategories}
                          confidenceLevels={confidenceLevels}
                          setHiddenAnnotations={setHiddenAnnotations}
                          onToothSelect={setSelectedTooth}
                          externalSelectedTooth={selectedTooth}
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
                          patientVisits={patientVisits}
                          confidenceLevels={confidenceLevels}
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