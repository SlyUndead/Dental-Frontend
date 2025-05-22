"use client"

import { useState, useEffect, useRef, useCallback } from "react"
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
  Input,
  InputGroupText,
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
  // Comparison mode is always true now as there's no single view
  const [isComparisonMode, setIsComparisonMode] = useState(true)
  const [redirectToPatientVisitPage, setRedirectToPatientVisitPage] = useState(false)
  const [isConsolidatedView, setIsConsolidatedView] = useState(false)
  const [consolidatedAnnotations, setConsolidatedAnnotations] = useState([])
  const [allVisitsAnnotations, setAllVisitsAnnotations] = useState({})
  const [isLoadingConsolidated, setIsLoadingConsolidated] = useState(false)
  const [visitAnnotationsCache, setVisitAnnotationsCache] = useState({}) // Cache for visit annotations

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
      if (!isConsolidatedView) {
        // Double-check we're still in non-consolidated mode
        setAllVisitsAnnotations({})
        setConsolidatedAnnotations([])
      }
    }
  }

  // Handle print functionality
  const handlePrint = () => {
    const patientName = sessionStorage.getItem("patientName")
    const printWindow = window.open("", "_blank")

    // Collect all stylesheets
    const styles = Array.from(document.styleSheets)
      .map((styleSheet) => {
        try {
          const rules = Array.from(styleSheet.cssRules)
            .filter((rule) => {
              // Ignore table hover styles
              return !rule.selectorText || !rule.selectorText.includes(":hover")
            })
            .map((rule) => rule.cssText)
            .join("\n")
          return `<style>${rules}</style>`
        } catch (e) {
          // Handle CORS issues if styleSheet is from another domain
          return ""
        }
      })
      .join("\n")

    // Extract dental charts and tables from the DOM
    let leftChartHtml = ""
    let rightChartHtml = ""
    let leftTableHtml = ""
    let rightTableHtml = ""
    let dentalChartHtml = ""

    try {
      if (isConsolidatedView) {
        // Get consolidated view dental chart
        const chartContainer = document.querySelector(".dental-chart-container")
        if (chartContainer) {
          dentalChartHtml = chartContainer.outerHTML
        }
      } else {
        // In comparison mode, get both charts
        const chartContainers = document.querySelectorAll(".dental-chart-container")
        if (chartContainers && chartContainers.length > 0) {
          leftChartHtml = chartContainers[0].outerHTML // First chart (left side)
        }
        if (chartContainers && chartContainers.length > 1) {
          rightChartHtml = chartContainers[1].outerHTML // Second chart (right side)
        }

        // Get both tables
        const tables = document.querySelectorAll(".card-body h4 + div")
        if (tables && tables.length > 0) {
          leftTableHtml = tables[0].outerHTML
        }
        if (tables && tables.length > 1) {
          rightTableHtml = tables[1].outerHTML
        }
      }
    } catch (error) {
      console.error("Error extracting elements for print:", error)
    }

    // Get the content to print
    const contentToPrint = printRef.current.innerHTML

    // Create different HTML templates based on view mode
    let htmlTemplate

    if (isConsolidatedView) {
      // Consolidated view with header and dental chart using the requested table structure
      htmlTemplate = `
    <html>
      <head>
        <title>Temporality View - ${patientName}</title>
        ${styles}
        <style>
          body {
            font-family: Arial, sans-serif;
            padding: 0;
            margin: 0;
          }

          /* Table structure for header and footer */
          table {
            width: 100%;
            border-collapse: collapse;
          }

          /* Header and footer spaces */
          .header-space, .footer-space {
            height: 180px;
          }

          /* Fixed header and footer */
          .header, .footer {
            position: fixed;
            width: 100%;
            left: 0;
            right: 0;
            background-color: white;
            z-index: 1;
          }

          .header {
            top: 0;
            border-bottom: 1px solid #ddd;
          }

          .footer {
            bottom: 0;
            border-top: 1px solid #ddd;
          }

          /* Header content styling */
          .header-title {
            text-align: center;
            font-size: 16px;
            font-weight: bold;
            margin-bottom: 3px;
          }

          /* Content area */
          .content {
            position: relative;
            z-index: 100;
          }

          /* Hide the original dental chart in the content */
          .content .dental-chart-container {
            display: none;
          }

          /* Dental chart in header */
          .header-dental-chart {
            max-width: 100%;
            overflow: auto;
            text-align: center;
          }

          .header-dental-chart .dental-chart-container {
            transform: scale(0.8);
            transform-origin: top center;
            margin: 0 auto;
          }

          @media print {
            @page {
              margin: 0;
              size: portrait;
            }

            button, .no-print {
              display: none !important;
            }

            .card {
              page-break-inside: avoid;
              border: none !important;
              box-shadow: none !important;
            }

            .card-body {
              padding: 0 !important;
            }

            /* Ensure the header and footer appear on every page */
            .header, .footer {
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
              display: block !important;
            }

            /* Hide the dental charts in the content since we're adding them in the header */
            .content .dental-chart-container {
              display: none;
            }
          }
        </style>
      </head>
      <body>
        <!-- Table structure for content with header and footer spaces -->
        <table>
          <thead>
            <tr>
              <td>
                <div class="header-space">&nbsp;</div>
              </td>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                <div class="content">
                  ${contentToPrint}
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        <!-- Fixed header with title and dental chart -->
        <div class="header">
          <div class="header-title">
            Temporality View - ${patientName}
          </div>
          <div class="header-dental-chart">
            ${dentalChartHtml}
          </div>
        </div>

        <!-- Fixed footer (empty for now) -->
        <div class="footer">
          <!-- Footer content can be added here if needed -->
        </div>
      </body>
    </html>
    `
    } else {
      // Side-by-side comparison view with both dental charts as headers
      htmlTemplate = `
<html>
  <head>
    <title>Temporality View - ${patientName}</title>
    ${styles}
    <style>
      body {
        font-family: Arial, sans-serif;
        padding: 0;
        margin: 0;
      }

      /* Table structure for header and footer */
      table {
        width: 100%;
        border-collapse: collapse;
      }

      /* Header and footer spaces */
      .header-space {
        height: 180px;
      }

      .footer-space {
        height: 60px;
      }

      /* Fixed header and footer */
      .header, .footer {
        position: fixed;
        width: 100%;
        left: 0;
        right: 0;
        background-color: white;
        z-index: 1;
      }

      .header {
        top: 0;
        border-bottom: 1px solid #ddd;
      }

      .footer {
        bottom: 0;
        border-top: 1px solid #ddd;
      }

      /* Header content styling */
      .header-title {
        text-align: center;
        font-size: 16px;
        font-weight: bold;
        margin-bottom: 3px;
      }

      /* Content area */
      .content {
        position: relative;
        z-index: 100;
        display: flex;
        flex-direction: row;
        background-color: white;
      }

      .content-column {
        width: 50%;
        padding: 10px;
      }

      /* Hide the original dental charts in the content */
      .content .dental-chart-container {
        display: none;
      }

      /* Dental charts in header */
      .header-dental-charts {
        display: flex;
        width: 100%;
      }

      .header-chart {
        width: 50%;
        text-align: center;
      }

      .header-chart .dental-chart-container {
        transform: scale(0.7);
        transform-origin: top center;
        margin: 0 auto;
      }

      .chart-title {
        font-size: 14px;
        font-weight: bold;
        text-align: center;
        margin-bottom: 5px;
      }

      @media print {
        @page {
          margin: 0;
          size: portrait;
        }

        button, .no-print {
          display: none !important;
        }

        .card {
          page-break-inside: avoid;
          border: none !important;
          box-shadow: none !important;
        }

        .card-body {
          padding: 0 !important;
        }

        /* Ensure the header and footer appear on every page */
        .header, .footer {
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
          display: block !important;
        }

        /* Hide the dental charts in the content since we're adding them in the header */
        .content .dental-chart-container {
          display: none;
        }
      }
    </style>
  </head>
  <body>
    <!-- Table structure for content with header and footer spaces -->
    <table>
      <thead>
        <tr>
          <td>
            <div class="header-space">&nbsp;</div>
          </td>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>
            <div class="content">
              <!-- Left side content -->
              <div class="content-column">
                <h4>
                  ${patientVisits.find((v) => v._id === secondVisitId)?.formattedDateTime || "Second Visit"} -
                  Tooth Anomalies/Procedures
                </h4>
                ${leftTableHtml}
              </div>
              
              <!-- Right side content -->
              <div class="content-column">
                <h4>
                  ${patientVisits.find((v) => v._id === firstVisitId)?.formattedDateTime || "First Visit"} -
                  Tooth Anomalies/Procedures
                </h4>
                ${rightTableHtml}
              </div>
            </div>
          </td>
        </tr>
      </tbody>
      <tfoot>
        <tr>
          <td>
            <div class="footer-space">&nbsp;</div>
          </td>
        </tr>
      </tfoot>
    </table>

    <!-- Fixed header with title and dental charts -->
    <div class="header">
      <div class="header-title">
        Temporality View - ${patientName}
      </div>
      <div class="header-dental-charts">
        <!-- Left dental chart -->
        <div class="header-chart">
          <div class="chart-title">
            ${patientVisits.find((v) => v._id === secondVisitId)?.formattedDateTime || "Second Visit"}
          </div>
          ${leftChartHtml}
        </div>
        
        <!-- Right dental chart -->
        <div class="header-chart">
          <div class="chart-title">
            ${patientVisits.find((v) => v._id === firstVisitId)?.formattedDateTime || "First Visit"}
          </div>
          ${rightChartHtml}
        </div>
      </div>
    </div>

    <!-- Fixed footer (empty for now) -->
    <div class="footer">
      <!-- Footer content can be added here if needed -->
    </div>
  </body>
</html>
`
    }

    // Write to the new window using a more modern approach
    printWindow.document.open()
    printWindow.document.write(htmlTemplate)
    printWindow.document.close()

    // Wait for styles to load then print
    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.print()
        printWindow.close()
      }, 1000) // Increased timeout to ensure everything loads properly
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
          const formattedVisits = visitData.patienVisits.map((visit) => {
            const visitDate = new Date(visit.date_of_visit)
            const creationDate = visit.created_on ? new Date(visit.created_on) : visitDate

            // Format time as HH:MM AM/PM
            const timeString = creationDate.toLocaleTimeString("en-US", {
              hour: "2-digit",
              minute: "2-digit",
              hour12: true,
            })

            return {
              ...visit,
              formattedDate: formatDate(visitDate),
              formattedDateTime: `${formatDate(visitDate)} ${timeString}`,
              creationTime: timeString,
            }
          })

          // Store all visits (ungrouped)
          setPatientVisits(formattedVisits)

          // Sort visits by creation date (newest first)
          const sortedVisits = [...formattedVisits].sort((a, b) => {
            const dateA = a.created_on ? new Date(a.created_on) : new Date(a.date_of_visit)
            const dateB = b.created_on ? new Date(b.created_on) : new Date(b.date_of_visit)
            return dateB - dateA
          })

          // Set default visits for comparison (newest and second-newest)
          if (sortedVisits.length >= 2) {
            // First visit is the newest, second visit is the second newest
            setFirstVisitId(sortedVisits[0]._id)
            setSecondVisitId(sortedVisits[1]._id)
            setIsComparisonMode(true)
            // Fetch annotations for both visits
            handleFirstVisitSelect(sortedVisits[0]._id, formattedVisits)
            handleSecondVisitSelect(sortedVisits[1]._id, formattedVisits)
          } else if (sortedVisits.length === 1) {
            setFirstVisitId(sortedVisits[0]._id)
            handleFirstVisitSelect(sortedVisits[0]._id, formattedVisits)
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

  // Format date function is used above

  // Fetch annotations for all visits - optimized with caching
  const fetchAllVisitsAnnotations = useCallback(async () => {
    // If we already have the data and we're not loading, just regenerate the view
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
        let visitAnnots = []

        // Check if we have this visit's annotations in cache
        if (visitAnnotationsCache[visitId]) {
          visitAnnots = visitAnnotationsCache[visitId]
        } else {
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

              // Skip this visit if there are no images
              if (!imagesData || imagesData.length === 0) {
                console.log(`No images found for visit ${visitId}, skipping...`)
                continue
              }

              // Process visit annotations
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

              // Update cache with this visit's annotations
              setVisitAnnotationsCache((prevCache) => ({
                ...prevCache,
                [visitId]: visitAnnots,
              }))
            }
          } catch (error) {
            console.error(`Error fetching annotations for visit ${visitId}:`, error)
            // Continue to the next visit if there's an error with this one
            continue
          }
        }

        // Skip this visit if there are no annotations
        if (visitAnnots.length === 0) {
          continue
        }

        // Store the visit annotations
        visitAnnotations[visitId] = visitAnnots

        // Check which teeth were found in this visit - use a more efficient approach
        const toothNumbers = new Set()
        visitAnnots.forEach((anno) => {
          if (!isNaN(Number.parseInt(anno.label))) {
            const toothNumber = Number.parseInt(anno.label)
            if (toothNumber >= 1 && toothNumber <= 32 && !foundTeeth.has(toothNumber)) {
              toothNumbers.add(toothNumber)
            }
          }
        })

        // Batch update the sets
        toothNumbers.forEach((toothNumber) => {
          foundTeeth.add(toothNumber)
          remainingTeeth.delete(toothNumber)
        })
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
  }, [
    patientVisits,
    visitAnnotationsCache,
    allVisitsAnnotations,
    isLoadingConsolidated,
    consolidatedAnnotations.length,
    apiUrl,
  ])
  // Generate consolidated view from all visits' annotations - optimized with memoization
  const generateConsolidatedView = useCallback(
    (visitAnnots = null) => {
      console.time("generateConsolidatedView") // Performance measurement
      const seenBoneLossRanges = new Set(); // Place this at the top of generateConsolidatedView
      const annotations = visitAnnots || allVisitsAnnotations
      if (!annotations || Object.keys(annotations).length === 0) {
        console.timeEnd("generateConsolidatedView")
        return
      }

      // Track which teeth we've already processed
      const processedTeeth = new Set()
      const consolidatedTeeth = {}
      // Track which teeth still need to be found
      const remainingTeeth = new Set(Array.from({ length: 32 }, (_, i) => i + 1))

      // Create a map of tooth annotations for faster lookup
      const toothAnnotsMap = {}
      // Create a map of anomalies by tooth for faster lookup
      const anomaliesByTooth = {}

      // Pre-process all visits to build lookup maps
      for (let i = 0; i < patientVisits.length; i++) {
        const visitId = patientVisits[i]._id
        const visitAnnotations = annotations[visitId] || []

        // Skip if no annotations
        if (visitAnnotations.length === 0) continue

        // Process tooth annotations
        visitAnnotations.forEach((anno) => {
          if (!isNaN(Number.parseInt(anno.label))) {
            const toothNumber = Number.parseInt(anno.label)
            if (!toothAnnotsMap[toothNumber]) {
              toothAnnotsMap[toothNumber] = {
                visitIndex: i,
                annotation: anno,
                visitDate: patientVisits[i].formattedDate,
                visitId: patientVisits[i]._id,
              }
            }
          } else {
            // Process anomalies with associatedTooth
            if (anno.associatedTooth !== undefined && anno.associatedTooth !== null) {
              const toothNumber = Number.parseInt(anno.associatedTooth)
              if (!isNaN(toothNumber)) {
                if (!anomaliesByTooth[toothNumber]) {
                  anomaliesByTooth[toothNumber] = []
                }
                anomaliesByTooth[toothNumber].push({
                  visitIndex: i,
                  annotation: anno,
                  visitDate: patientVisits[i].formattedDate,
                  visitId: patientVisits[i]._id,
                  overlapPercentage: 100, // Perfect match for associatedTooth
                })
              }
            }
          }
        })
      }

      // Process visits in order (newest to oldest)
      for (let i = 0; i < patientVisits.length; i++) {
        // If we've found all teeth, we can stop processing visits
        if (remainingTeeth.size === 0) {
          break
        }

        const visitId = patientVisits[i]._id
        const visitAnnotations = annotations[visitId] || []

        // Get tooth annotations for this visit
        const toothAnnots = visitAnnotations.filter((anno) => !isNaN(Number.parseInt(anno.label)))

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

          // First add anomalies with associatedTooth
          if (anomaliesByTooth[toothNumber]) {
            anomaliesByTooth[toothNumber].forEach((item) => {
              if (item.visitIndex === i) {
                // Only include anomalies from current visit
                const anno = item.annotation
                // Get the image group from the annotation's image
                const imageGroup = anno.image?.annotations?.annotations?.group || "pano"
                const confidenceField = `${imageGroup}_confidence`
                const confidenceThreshold = confidenceLevels[anno.label.toLowerCase()]
                  ? confidenceLevels[anno.label.toLowerCase()][confidenceField] || 0.001
                  : 0.001

                if (anno.confidence >= confidenceThreshold) {
                  anomalies.push({
                    name: anno.label,
                    category: classCategories[anno.label.toLowerCase()] || "Unknown",
                    confidence: anno.confidence,
                    overlapPercentage: item.overlapPercentage,
                    visitDate: item.visitDate,
                    visitIndex: item.visitIndex,
                    visitId: item.visitId,
                    imageNumber: anno.imageNumber,
                    imageName: anno.imageName,
                    originalAnnotation: anno,
                  })
                }
              }
            })
          }

          // Then process other anomalies using overlap calculation
          visitAnnotations.forEach((anno) => {
            // Skip tooth annotations and anomalies with associatedTooth
            if (
              !isNaN(Number.parseInt(anno.label)) ||
              (anno.associatedTooth !== undefined && anno.associatedTooth !== null)
            ) {
              return
            }
            // --- Bone Loss Anomaly Handling ---
            if (anno.label?.toLowerCase().includes("bone loss")) {
              const overlappingTeeth = [];

              toothAnnots.forEach((toothAnno) => {
                const toothNumber = Number.parseInt(toothAnno.label);
                if (!isNaN(toothNumber) && anno.segmentation && toothAnno.segmentation) {
                  try {
                    const overlap = calculateOverlap(anno.segmentation, toothAnno.segmentation);
                    const annoArea = polygonArea(anno.segmentation.map(p => [p.x, p.y]));
                    const overlapPercentage = annoArea > 0 ? overlap / annoArea : 0;

                    if (overlapPercentage > 0.02) {
                      overlappingTeeth.push(toothNumber);
                    }
                  } catch (e) {
                    console.error("Error calculating bone loss overlap:", e);
                  }
                }
              });

              overlappingTeeth.sort((a, b) => a - b);
              if (overlappingTeeth.length === 0) return;

              // Group into ranges
              const ranges = [];
              let currentRange = [overlappingTeeth[0]];

              for (let j = 1; j < overlappingTeeth.length; j++) {
                if (overlappingTeeth[j] - overlappingTeeth[j - 1] <= 2) {
                  currentRange.push(overlappingTeeth[j]);
                } else {
                  ranges.push([...currentRange]);
                  currentRange = [overlappingTeeth[j]];
                }
              }
              if (currentRange.length) ranges.push(currentRange);

              // Confidence check
              const imageGroup = anno.image?.annotations?.annotations?.group || "pano";
              const confidenceField = `${imageGroup}_confidence`;
              const confidenceThreshold = confidenceLevels[anno.label.toLowerCase()] ?
                confidenceLevels[anno.label.toLowerCase()][confidenceField] || 0.001 :
                0.001;

              if (anno.confidence < confidenceThreshold) return;

              // Store only the first visit’s instance of the bone loss range
              ranges.forEach((range) => {
                const rangeText = range.length > 1 ? `${range[0]}-${range[range.length - 1]}` : `${range[0]}`;
                if (seenBoneLossRanges.has(rangeText)) return;

                // Mark range as processed so future visits skip it
                seenBoneLossRanges.add(rangeText);

                if (!consolidatedTeeth[rangeText]) {
                  consolidatedTeeth[rangeText] = {
                    toothNumber: rangeText,
                    anomalies: [],
                    visitDate: patientVisits[i].formattedDate,
                    visitIndex: i,
                    originalAnnotation: null,
                  };
                }

                consolidatedTeeth[rangeText].anomalies.push({
                  name: anno.label,
                  category: classCategories[anno.label.toLowerCase()] || "Unknown",
                  confidence: anno.confidence,
                  visitDate: patientVisits[i].formattedDate,
                  visitIndex: i,
                  visitId: patientVisits[i]._id,
                  imageNumber: anno.imageNumber,
                  imageName: anno.imageName,
                  originalAnnotation: anno,
                  isRange: true,
                  teethRange: rangeText,
                });
              });

              return; // Skip normal processing for bone loss
            }

            // Calculate overlap for remaining anomalies
            if (anno.segmentation && toothAnno.segmentation) {
              try {
                // Calculate overlap
                const overlap = calculateOverlap(anno.segmentation, toothAnno.segmentation)
                const annoArea = polygonArea(anno.segmentation.map((point) => [point.x, point.y]))
                const overlapPercentage = annoArea > 0 ? overlap / annoArea : 0

                // Only include if overlap is at least 80%
                // Get the image group from the annotation's image
                const imageGroup = anno.image?.annotations?.annotations?.group || "pano"
                const confidenceField = `${imageGroup}_confidence`
                const confidenceThreshold = confidenceLevels[anno.label.toLowerCase()]
                  ? confidenceLevels[anno.label.toLowerCase()][confidenceField] || 0.001
                  : 0.001

                if (overlapPercentage >= 0.8 && anno.confidence >= confidenceThreshold) {
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
                    originalAnnotation: anno,
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
            originalAnnotation: toothAnno,
          }
        })
      }

      // Process unassigned annotations more efficiently
      const unassignedAnomalies = []
      let unassignedVisitIndex = -1
      let unassignedVisitDate = ""

      // Find the newest visit with unassigned annotations
      for (let i = 0; i < patientVisits.length; i++) {
        const visitId = patientVisits[i]._id
        const visitAnnotations = annotations[visitId] || []

        // Check for unassigned annotations
        const hasUnassigned = visitAnnotations.some(
          (anno) =>
            !isNaN(Number.parseInt(anno.label)) &&
            (anno.associatedTooth === null || anno.associatedTooth === "Unassigned"),
        )

        if (hasUnassigned) {
          unassignedVisitIndex = i
          unassignedVisitDate = patientVisits[i].formattedDate
          break
        }
      }

      // If we found a visit with unassigned annotations, process them
      if (unassignedVisitIndex !== -1) {
        const visitId = patientVisits[unassignedVisitIndex]._id
        const visitAnnotations = annotations[visitId] || []

        // Filter unassigned annotations
        visitAnnotations.forEach((anno) => {
          if (!isNaN(Number.parseInt(anno.label))) return

          if (anno.associatedTooth === null || anno.associatedTooth === "Unassigned") {
            // Get the image group from the annotation's image
            const imageGroup = anno.image?.annotations?.annotations?.group || "pano"
            const confidenceField = `${imageGroup}_confidence`
            const confidenceThreshold = confidenceLevels[anno.label.toLowerCase()]
              ? confidenceLevels[anno.label.toLowerCase()][confidenceField] || 0.001
              : 0.001

            if (anno.confidence >= confidenceThreshold) {
              unassignedAnomalies.push({
                name: anno.label,
                category: classCategories[anno.label.toLowerCase()] || "Unknown",
                confidence: anno.confidence,
                visitDate: unassignedVisitDate,
                visitIndex: unassignedVisitIndex,
                visitId: patientVisits[unassignedVisitIndex]._id,
                imageNumber: anno.imageNumber,
                imageName: anno.imageName,
                originalAnnotation: anno,
              })
            }
          }
        })
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
      for (let i = 1; i <= 32; i++) {
        if (!consolidatedTeeth[i]) {
          consolidatedTeeth[i] = {
            toothNumber: i,
            anomalies: [{ name: "Not detected", category: "Info" }],
            hasAnnotations: false,
          }
        }
      }

      // Convert to array and sort by tooth number, with "Unassigned" at the end
      const consolidatedArray = Object.values(consolidatedTeeth).sort((a, b) => {
        if (a.toothNumber === "Unassigned" || a.isUnassigned) return 1
        if (b.toothNumber === "Unassigned" || b.isUnassigned) return -1
        return a.toothNumber - b.toothNumber
      })

      setConsolidatedAnnotations(consolidatedArray)
      console.timeEnd("generateConsolidatedView") // Performance measurement
    },
    [allVisitsAnnotations, patientVisits, classCategories, confidenceLevels],
  )
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
          // Create an object with all group-specific confidence levels
          updatedConfidenceLevels[element.className.toLowerCase()] = {
            pano_confidence: element.pano_confidence || 0.01,
            bitewing_confidence: element.bitewing_confidence || 0.01,
            pariapical_confidence: element.pariapical_confidence || 0.01,
            ceph_confidence: element.ceph_confidence || 0.01,
            intraoral_confidence: element.intraoral_confidence || 0.01,
          }
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

  // Handle first visit selection - optimized with caching
  const handleFirstVisitSelect = useCallback(
    async (visitId, patientVisits) => {
      console.time("handleFirstVisitSelect") // Performance measurement
      setFirstVisitId(visitId)
      setIsFirstLoading(true)

      // Find the selected visit
      const selectedVisit = patientVisits.find((v) => v._id === visitId)
      if (!selectedVisit) {
        setIsFirstLoading(false)
        console.timeEnd("handleFirstVisitSelect")
        return
      }

      try {
        // Check if we have this visit's annotations in cache
        if (visitAnnotationsCache[visitId]) {
          setLastVisitAnnotations(visitAnnotationsCache[visitId])
          setIsFirstLoading(false)
          console.timeEnd("handleFirstVisitSelect")
          return
        }

        // Fetch annotations for the selected visit
        const response = await axios.get(`${apiUrl}/visitid-annotations?visitID=${visitId}`, {
          headers: {
            Authorization: sessionStorage.getItem("token"),
          },
        })

        if (response.status === 200) {
          sessionStorage.setItem("token", response.headers["new-token"])
          const imagesData = response.data.images
          let visitAnnotations = []

          // Process visit annotations
          if (imagesData && imagesData.length > 0) {
            // Use a more efficient approach to process annotations
            const processedAnnotations = []

            imagesData.forEach((image, index) => {
              if (image.annotations && image.annotations.annotations && image.annotations.annotations.annotations) {
                image.annotations.annotations.annotations.forEach((annotation) => {
                  processedAnnotations.push({
                    ...annotation,
                    imageId: image._id,
                    imageNumber: image.imageNumber || index + 1,
                    imageName: image.name,
                    visitId: visitId,
                  })
                })
              }
            })

            visitAnnotations = processedAnnotations
          }

          // Update cache with this visit's annotations
          setVisitAnnotationsCache((prevCache) => ({
            ...prevCache,
            [visitId]: visitAnnotations,
          }))

          setLastVisitAnnotations(visitAnnotations)
          if (visitAnnotations.length === 0) {
            setMessage("No annotations found for the selected visit.")
          }
        }
      } catch (error) {
        logErrorToServer(error, "handleFirstVisitSelect")
        setMessage("Error fetching annotations for the first visit")
        console.error("Error fetching annotations:", error)
        setLastVisitAnnotations([])
      } finally {
        setIsFirstLoading(false)
        console.timeEnd("handleFirstVisitSelect")
      }
    },
    [apiUrl, visitAnnotationsCache],
  )
  // Handle second visit selection - optimized with caching
  const handleSecondVisitSelect = useCallback(
    async (visitId, patientVisits) => {
      console.time("handleSecondVisitSelect") // Performance measurement
      setSecondVisitId(visitId)
      setIsSecondLoading(true)

      // Find the selected visit
      const selectedVisit = patientVisits.find((v) => v._id === visitId)
      if (!selectedVisit) {
        setIsSecondLoading(false)
        console.timeEnd("handleSecondVisitSelect")
        return
      }

      try {
        // Check if we have this visit's annotations in cache
        if (visitAnnotationsCache[visitId]) {
          setSelectedVisitAnnotations(visitAnnotationsCache[visitId])
          setIsSecondLoading(false)
          console.timeEnd("handleSecondVisitSelect")
          return
        }

        // Fetch annotations for the selected visit
        const response = await axios.get(`${apiUrl}/visitid-annotations?visitID=${visitId}`, {
          headers: {
            Authorization: sessionStorage.getItem("token"),
          },
        })

        if (response.status === 200) {
          sessionStorage.setItem("token", response.headers["new-token"])
          const imagesData = response.data.images
          let visitAnnotations = []

          // Process visit annotations
          if (imagesData && imagesData.length > 0) {
            // Use a more efficient approach to process annotations
            const processedAnnotations = []

            imagesData.forEach((image, index) => {
              if (image.annotations && image.annotations.annotations && image.annotations.annotations.annotations) {
                image.annotations.annotations.annotations.forEach((annotation) => {
                  processedAnnotations.push({
                    ...annotation,
                    imageId: image._id,
                    imageNumber: image.imageNumber || index + 1,
                    imageName: image.name,
                    visitId: visitId,
                  })
                })
              }
            })

            visitAnnotations = processedAnnotations
          }

          // Update cache with this visit's annotations
          setVisitAnnotationsCache((prevCache) => ({
            ...prevCache,
            [visitId]: visitAnnotations,
          }))

          setSelectedVisitAnnotations(visitAnnotations)
          if (visitAnnotations.length === 0) {
            setMessage("No annotations found for the selected visit.")
          }
        }
      } catch (error) {
        logErrorToServer(error, "handleSecondVisitSelect")
        setMessage("Error fetching annotations for the second visit")
        console.error("Error fetching annotations:", error)
        setSelectedVisitAnnotations([])
      } finally {
        setIsSecondLoading(false)
        console.timeEnd("handleSecondVisitSelect")
      }
    },
    [apiUrl, visitAnnotationsCache],
  )

  // Initialize on component mount - optimized
  useEffect(() => {
    console.time("initialLoad") // Performance measurement
    props.setBreadcrumbItems("Temporality View", breadcrumbItems)

    const initializeData = async () => {
      try {
        // Load class categories and patient visits in parallel
        await Promise.all([fetchClassCategories(), fetchPatientVisits()])
        console.timeEnd("initialLoad")
      } catch (error) {
        logErrorToServer(error, "temporalityPageInit")
        console.error("Error initializing TemporalityPage:", error)
        setMessage("Unable to load annotations. Please contact admin.")
        console.timeEnd("initialLoad")
      }
    }

    initializeData()
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
          <Col md={12} className="d-flex justify-content-between align-items-center mb-3 inline-flex">
            <div className="d-flex align-items-center">
              <Button color="primary" onClick={() => setRedirectToPatientVisitPage(true)} className="mr-3">
                Patient Visits
              </Button>
              <Input
                type="checkbox"
                checked={isConsolidatedView}
                onChange={toggleConsolidatedView}
                style={{ height: "33.7px", marginTop: "0px", width: "20px", marginLeft: "5px", borderWidth: "1px" }}
              />
              <InputGroupText>Consolidated View</InputGroupText>
            </div>
            <div>
              <Button color="success" onClick={handlePrint}>
                <i className="fa fa-print mr-1"></i> Print
              </Button>
            </div>
          </Col>
        </Row>

        {!isConsolidatedView && (
          <>
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
                      : new Date(firstVisitObj.visitObj.date_of_visit)

                    const secondCreationDate = secondVisitObj.visitObj.created_on
                      ? new Date(secondVisitObj.visitObj.created_on)
                      : new Date(secondVisitObj.visitObj.date_of_visit)

                    // If the second visit is more recent than the first visit, swap them
                    if (secondCreationDate > firstCreationDate) {
                      // Swap the visit objects
                      const tempVisitObj = firstVisitObj
                      firstVisitObj = secondVisitObj
                      secondVisitObj = tempVisitObj
                    }

                    // Get the first visit ID (newer visit)
                    if (firstVisitObj && firstVisitObj.id) {
                      handleFirstVisitSelect(firstVisitObj.id, patientVisits)
                    }

                    // Get the second visit ID (older visit)
                    if (secondVisitObj && secondVisitObj.id) {
                      handleSecondVisitSelect(secondVisitObj.id, patientVisits)
                    }

                    // Update comparison mode flag if needed
                    setIsComparisonMode(firstVisitObj.id !== secondVisitObj.id)
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
                          {patientVisits
                            .sort((a, b) => {
                              // Sort by creation date (newest first)
                              const dateA = a.created_on ? new Date(a.created_on) : new Date(a.date_of_visit)
                              const dateB = b.created_on ? new Date(b.created_on) : new Date(b.date_of_visit)
                              return dateB - dateA
                            })
                            .map((visit, index) => (
                              <DropdownItem
                                key={visit._id}
                                onClick={() => {
                                  // Check if we need to swap visits based on creation dates
                                  const firstVisitObj = patientVisits.find((v) => v._id === firstVisitId)

                                  if (visit && firstVisitObj) {
                                    const selectedCreationDate = visit.created_on
                                      ? new Date(visit.created_on)
                                      : new Date(visit.date_of_visit)

                                    const firstCreationDate = firstVisitObj.created_on
                                      ? new Date(firstVisitObj.created_on)
                                      : new Date(firstVisitObj.date_of_visit)

                                    // If the selected visit is more recent than the first visit, swap them
                                    if (selectedCreationDate > firstCreationDate) {
                                      handleFirstVisitSelect(visit._id, patientVisits)
                                      handleSecondVisitSelect(firstVisitId, patientVisits)
                                      return
                                    }
                                  }

                                  // Normal case - no swap needed
                                  handleSecondVisitSelect(visit._id, patientVisits)
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
                          {patientVisits
                            .sort((a, b) => {
                              // Sort by creation date (newest first)
                              const dateA = a.created_on ? new Date(a.created_on) : new Date(a.date_of_visit)
                              const dateB = b.created_on ? new Date(b.created_on) : new Date(b.date_of_visit)
                              return dateB - dateA
                            })
                            .map((visit, index) => (
                              <DropdownItem
                                key={visit._id}
                                onClick={() => {
                                  // Check if we need to swap visits based on creation dates
                                  const secondVisitObj = patientVisits.find((v) => v._id === secondVisitId)

                                  if (visit && secondVisitObj) {
                                    const selectedCreationDate = visit.created_on
                                      ? new Date(visit.created_on)
                                      : new Date(visit.date_of_visit)

                                    const secondCreationDate = secondVisitObj.created_on
                                      ? new Date(secondVisitObj.created_on)
                                      : new Date(secondVisitObj.date_of_visit)

                                    // If the selected visit is older than the second visit, swap them
                                    if (selectedCreationDate < secondCreationDate) {
                                      handleSecondVisitSelect(visit._id, patientVisits)
                                      handleFirstVisitSelect(secondVisitId, patientVisits)
                                      return
                                    }
                                  }

                                  // Normal case - no swap needed
                                  handleFirstVisitSelect(visit._id, patientVisits)
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
              {isConsolidatedView ? "Loading consolidated dental chart..." : "Loading dental charts..."}
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
            ) : (
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
                          {patientVisits.find((v) => v._id === secondVisitId)?.formattedDateTime || "Second Visit"} -
                          Tooth Anomalies/Procedures
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
                          {patientVisits.find((v) => v._id === firstVisitId)?.formattedDateTime || "First Visit"} -
                          Tooth Anomalies/Procedures
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
            )}
          </div>
        )}
      </CardBody>
    </Card>
  )
}

export default connect(null, { setBreadcrumbItems })(TemporalityPage)