"use client"

import { useEffect, useState, useRef } from "react"
import {
  Card,
  CardBody,
  ListGroup,
  ListGroupItem,
  Row,
  Col,
  UncontrolledTooltip,
  Input,
  InputGroup,
  Collapse,
  Toast, ToastBody, ToastHeader
} from "reactstrap"
import axios from "axios"
import { changeMode } from "../../store/actions"
import { Navigate } from "react-router-dom"
import { useDispatch } from "react-redux"
import "bootstrap/dist/css/bootstrap.min.css"
import "../../assets/scss/custom/components/_popover.scss"
import { logErrorToServer } from "utils/logError"
import { desiredOrder, groupNames } from "./constants"
import { calculateOverlap, polygonArea } from "./path-utils"
import DentalChart from "./DentalChart"
import sessionManager from "utils/sessionManager"
import AnnotationPrerequisitesModal from "./AnnotationPrerequisitesModal"
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
  setAnnotations,
  saveAnnotations,
  smallCanvasData,
  setSmallCanvasData,
  mainImageIndex,
  confidenceLevels,
  showConfidence,
  patientDetails,
}) => {
  // Check if setHoveredAnnotation is a function, if not, use a no-op function
  const apiUrl = process.env.REACT_APP_NODEAPIURL
  const [hideAllAnnotations, setHideAllAnnotations] = useState(false)
  const [redirectToLogin, setRedirectToLogin] = useState(false)
  const popoverRef = useRef(null)
  const handleHover = typeof setHoveredAnnotation === "function" ? setHoveredAnnotation : () => { }
  const [popoverData, setPopoverData] = useState({})
  const [popoverOpen, setPopoverOpen] = useState(null) // Track which annotation's popover is open
  const [groupedAnnotations, setGroupedAnnotations] = useState({})
  const [hideGroup, setHideGroup] = useState({})
  const [groupByTooth, setGroupByTooth] = useState(false)
  // New state to track checked annotations
  const [checkedAnnotations, setCheckedAnnotations] = useState([])
  // Treatment plan related states
  const [treatments, setTreatments] = useState([])
  const [selectedTeeth, setSelectedTeeth] = useState([])
  const [dctCodes, setDctCodes] = useState([])
  const [filteredCodes, setFilteredCodes] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [generatingPlan, setGeneratingPlan] = useState(false)
  const [savingPlan, setSavingPlan] = useState(false)
  const [treatmentPlanSaved, setTreatmentPlanSaved] = useState(false)
  const [anomalyCache, setAnomalyCache] = useState({})
  const [newLabel, setNewLabel] = useState("")
  const [lockedAnnotations, setLockedAnnotations] = useState([])
  const [prerequisitesModalOpen, setPrerequisitesModalOpen] = useState(false)
  const [selectedAnnotationForPrerequisites, setSelectedAnnotationForPrerequisites] = useState(null)
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [persistentHiddenCategories, setPersistentHiddenCategories] = useState(() => {
    // Initialize from localStorage or default to hide 'Dental Chart' and 'Landmark'
    const saved = localStorage.getItem("persistentHiddenCategories")
    return saved
      ? JSON.parse(saved)
      : {
        "Dental Chart": true,
        Landmark: true,
      }
  })
  const [expandedGroups, setExpandedGroups] = useState(() => {
    // Initially collapse all groups
    const initialState = {}
    desiredOrder.forEach((category) => {
      initialState[category] = false
    })
    return initialState
  })
  const [globalCheckedAnnotations, setGlobalCheckedAnnotations] = useState(() => {
    // Initialize from localStorage or an empty object
    const saved = localStorage.getItem("globalCheckedAnnotations")
    return saved ? JSON.parse(saved) : {}
  })
  useEffect(() => {
    localStorage.setItem("persistentHiddenCategories", JSON.stringify(persistentHiddenCategories))
  }, [persistentHiddenCategories])
  useEffect(() => {
    localStorage.setItem("globalCheckedAnnotations", JSON.stringify(globalCheckedAnnotations))
  }, [globalCheckedAnnotations])
  const isAnnotationChecked = (anno) => {
    // For tooth annotations (numeric labels)
    if (!isNaN(Number.parseInt(anno.label))) {
      return false // Always start unchecked for teeth
    }

    // Get unique key for the annotation
    const uniqueKey = getAnnotationUniqueKey(anno)
    return !!globalCheckedAnnotations[uniqueKey]
  }
  const getAnnotationUniqueKey = (anno) => {
    // For tooth annotations (numeric labels), return null
    if (!isNaN(Number.parseInt(anno.label))) {
      return null
    }

    // For anomaly annotations, use a combination of label and segmentation coordinates
    const segmentation = anno.segmentation
    const coordString = segmentation.map((point) => `${point.x.toFixed(2)},${point.y.toFixed(2)}`).join("|")
    return `${anno.label}__${coordString}`
  }
  // Add this useEffect to fetch existing treatment plan on component mount
  const loadExistingTreatmentPlan = async () => {
    // Fetch the existing treatment plan
    const response = await fetch(`${apiUrl}/get-treatment-plan?patientId=${sessionManager.getItem("patientId")}`, {
      method: "GET",
      headers: {
        Authorization: sessionManager.getItem("token"),
      },
    })

    const data = await response.json()
    // console.log(data)
    if (data.success && data.treatmentPlan) {
      setTreatments(data.treatmentPlan.treatments || [])

      // Quadrant mapping
      const quadrantMapping = {
        "1st Quadrant": [1, 2, 3, 4, 5, 6, 7, 8],
        "2nd Quadrant": [9, 10, 11, 12, 13, 14, 15, 16],
        "3rd Quadrant": [17, 18, 19, 20, 21, 22, 23, 24],
        "4th Quadrant": [25, 26, 27, 28, 29, 30, 31, 32],
      }

      // Get unique anomaly types and their corresponding tooth numbers/quadrants from the treatments
      const anomalyToTeethMap = data.treatmentPlan.treatments.reduce((acc, treatment) => {
        if (treatment.anomalyType) {
          if (!acc[treatment.anomalyType]) {
            acc[treatment.anomalyType] = []
          }

          // If full mouth, add a special flag
          if (treatment.toothNumber === "fullmouth") {
            acc[treatment.anomalyType] = "fullmouth"
          }
          // If quadrant, add the corresponding teeth
          else if (quadrantMapping[treatment.toothNumber]) {
            acc[treatment.anomalyType] = quadrantMapping[treatment.toothNumber]
          }
          // For specific teeth, add them to the array
          else if (!isNaN(Number.parseInt(treatment.toothNumber))) {
            acc[treatment.anomalyType].push(Number.parseInt(treatment.toothNumber))
          }
        }
        return acc
      }, {})

      // Find the annotation indices for specific anomaly types
      const lockedAnomalies = []

      annotations.forEach((anno, index) => {
        // Check if the annotation's label matches an anomaly type in the map
        const teethForAnomaly = anomalyToTeethMap[anno.label]

        // Locking conditions
        const shouldLock =
          // Full mouth condition
          teethForAnomaly === "fullmouth" ||
          // Quadrant condition (when associatedTooth is a quadrant)
          (Array.isArray(teethForAnomaly) &&
            // Either associatedTooth is in the teeth array
            // OR associatedTooth is a specific tooth in the quadrant
            (teethForAnomaly.includes(Number.parseInt(anno.associatedTooth)) ||
              teethForAnomaly.includes(
                Number.parseInt(
                  findToothForStoredAnomaly(
                    anno,
                    annotations.filter((a) => !isNaN(Number.parseInt(a.label))),
                  ),
                ),
              )))

        if (shouldLock) {
          lockedAnomalies.push(index)
        }
      })

      // Lock these specific anomalies and check them
      setLockedAnnotations(lockedAnomalies)
      setCheckedAnnotations((prev) => [...new Set([...prev, ...lockedAnomalies])])

      // Update selectedTeeth based on treatments
      const teethFromTreatments = data.treatmentPlan.treatments
        .filter((t) => !isNaN(Number.parseInt(t.toothNumber)))
        .map((t) => Number.parseInt(t.toothNumber))

      setSelectedTeeth([...new Set(teethFromTreatments)])
    }
  }

  useEffect(() => {
    if (annotations.length > 0) {
      loadExistingTreatmentPlan()
    }
  }, [annotations])

  // Update this effect to keep locked annotations checked
  useEffect(() => {
    // Ensure all locked annotations remain checked
    setCheckedAnnotations((prev) => {
      const newChecked = [...prev]
      lockedAnnotations.forEach((index) => {
        if (!newChecked.includes(index)) {
          newChecked.push(index)
        }
      })
      return newChecked
    })
  }, [lockedAnnotations])
  // Group annotations by their category
  const handleAnnotationClick = async (anno, index) => {
    if (index !== popoverOpen) {
      try {
        // Fetch data from the API
        const response = await axios.get(`${apiUrl}/get-className?className=` + anno.label, {
          headers: {
            Authorization: sessionManager.getItem("token"),
          },
        })
        // console.log(response.data)
        setPopoverData(response.data)
        sessionManager.setItem("token", response.headers["new-token"])
        setPopoverOpen(index)
        if (response.data === null) {
          setPopoverData({ description: "Please contact admin", className: "Data Missing" })
          setPopoverOpen(index)
        }
      } catch (err) {
        if (err.status === 403 || err.status === 401) {
          sessionManager.removeItem("token")
          setRedirectToLogin(true)
        } else {
          logErrorToServer(err, "handleAnnotationClick")
          setPopoverData({ description: "unable to fetch data", className: "error" })
          setPopoverOpen(index)
          console.log("Error fetching className:", err)
        }
      }
    } else {
      setPopoverOpen(null)
    }
  }
  const groupAnnotationsByTooth = () => {
    const byTooth = {}

    annotations.forEach((anno, index) => {
      // Look for associated tooth for anomalies
      let toothNumber = null

      if (!isNaN(Number.parseInt(anno.label))) {
        // This is a tooth annotation itself
        toothNumber = anno.label
      } else {
        // For anomalies, check the associatedTooth field first
        if (anno.associatedTooth !== undefined && anno.associatedTooth !== null) {
          toothNumber = anno.associatedTooth
        } else {
          // Fall back to calculating the associated tooth
          const toothAnnotations = annotations.filter((a) => !isNaN(Number.parseInt(a.label)))
          toothNumber = findToothForStoredAnomaly(anno, toothAnnotations) || "Unassigned"
        }
      }

      if (!byTooth[toothNumber]) {
        byTooth[toothNumber] = []
      }

      byTooth[toothNumber].push(anno)
    })

    return byTooth
  }
  const toggleGroupExpansion = (category) => {
    setExpandedGroups((prev) => ({
      ...prev,
      [category]: !prev[category],
    }))
  }

  // Function to convert CDT code response
  const convertCdtCode = (cdtCodes) => {
    return cdtCodes.map((code) => ({
      code: code["Procedure Code"],
      description: code["Description of Service"],
      price: code["Average Fee"] || 0,
      unit: code["Unit"] || "tooth",
    }))
  }

  // Calculate overlap between two segmentations
  // const calculateOverlap = (segA, segB) => {
  //   const [ax1, ay1, ax2, ay2] = [segA[0].x, segA[0].y, segA[2].x, segA[2].y]
  //   const [bx1, by1, bx2, by2] = [segB[0].x, segB[0].y, segB[2].x, segB[2].y]

  //   const x_overlap = Math.max(0, Math.min(ax2, bx2) - Math.max(ax1, bx1))
  //   const y_overlap = Math.max(0, Math.min(ay2, by2) - Math.max(ay1, by1))

  //   return x_overlap * y_overlap
  // }

  // Get which quadrant a tooth belongs to
  const getQuadrantForTooth = (toothNumber) => {
    const num = Number.parseInt(toothNumber)
    if (num >= 1 && num <= 8) return "1st Quadrant" // Upper Right
    if (num >= 9 && num <= 16) return "2nd Quadrant" // Upper Left
    if (num >= 17 && num <= 24) return "3rd Quadrant" // Lower Left
    if (num >= 25 && num <= 32) return "4th Quadrant" // Lower Right
    return "unknown"
  }

  // Check anomalies with server to populate cache
  const checkAnomaliesWithServer = async (annotations) => {
    const uniqueLabels = [
      ...new Set(
        annotations
          .filter((a) => isNaN(Number.parseInt(a.label))) // Non-numeric labels
          .map((a) => a.label),
      ),
    ]

    const uncheckedLabels = uniqueLabels.filter((label) => !(label in anomalyCache))

    if (uncheckedLabels.length > 0) {
      try {
        const response = await fetch(`${apiUrl}/checkAnomalies`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: sessionManager.getItem("token"),
          },
          body: JSON.stringify({ labels: uncheckedLabels }),
        })

        const data = await response.json()

        Object.assign(anomalyCache, data)
      } catch (error) {
        console.error("Error checking anomalies:", error)
      }
    }
    // console.log(anomalyCache)
    return anomalyCache
  }
  const structureAnnotationsForRAG = (selectedAnomaly, selectedAnomalyMetadata = {}, selectedAnomalySegmentation = null) => {
    const teethData = {}

    // Process all annotations to group by tooth
    annotations.forEach((anno) => {
      let toothNumber = null

      // Determine the tooth number
      if (!isNaN(Number.parseInt(anno.label))) {
        // This is a tooth annotation itself - skip for now as we're focusing on anomalies/procedures/foreign objects
        return
      } else {
        // For non-tooth annotations, find the associated tooth
        if (anno.associatedTooth !== undefined && anno.associatedTooth !== null) {
          toothNumber = anno.associatedTooth
        } else {
          const toothAnnotations = annotations.filter((a) => !isNaN(Number.parseInt(a.label)))
          toothNumber = findToothForStoredAnomaly(anno, toothAnnotations)
        }
      }

      // Skip if no associated tooth found
      if (!toothNumber) return

      // Handle tooth ranges (e.g., "11-14" for bone loss)
      let toothNumbers = []
      if (typeof toothNumber === 'string' && toothNumber.includes('-')) {
        const [start, end] = toothNumber.split('-').map(num => parseInt(num))
        for (let i = start; i <= end; i++) {
          toothNumbers.push(i)
        }
      } else {
        toothNumbers = [parseInt(toothNumber)]
      }

      // Process each tooth number
      toothNumbers.forEach((tNum, index) => {
        if (!teethData[tNum]) {
          teethData[tNum] = {
            number: tNum,
            anomalies: [],
            procedures: [],
            foreign_objects: []
          }
        }

        // Determine the category using classCategories
        const category = classCategories[anno.label.toLowerCase()]

        // Get metadata - use selectedAnomalyMetadata only if this is the EXACT selected anomaly instance
        let metadata = {}

        // Check if this is the specific selected anomaly instance by comparing:
        // 1. Label matches
        // 2. Segmentation coordinates match (for exact instance identification)
        const isSelectedInstance = anno.label === selectedAnomaly &&
          selectedAnomalySegmentation &&
          anno.segmentation &&
          arraysEqual(anno.segmentation, selectedAnomalySegmentation)

        if (isSelectedInstance) {
          if (anno.label.toLowerCase().includes("bone loss")) {
            // Only add metadata to the first tooth in the range (index 0)
            metadata = index === 0 ? selectedAnomalyMetadata : {}
          } else {
            // For non-bone loss anomalies, add metadata normally
            metadata = selectedAnomalyMetadata
          }
        }

        const annotationData = {
          description: anno.label,
          metadata: metadata
        }

        // Categorize based on the category from classCategories
        if (category === 'Anomaly') {
          teethData[tNum].anomalies.push(annotationData)
        } else if (category === 'Procedure') {
          teethData[tNum].procedures.push(annotationData)
        } else if (category === 'Foreign Object') {
          teethData[tNum].foreign_objects.push(annotationData)
        } else {
          // Default to anomalies if category is unclear
          teethData[tNum].anomalies.push(annotationData)
        }
      })
    })

    // Convert to array format and clean up empty categories
    const teethArray = Object.values(teethData).map(tooth => {
      const cleanTooth = { number: tooth.number }

      if (tooth.anomalies.length > 0) {
        cleanTooth.anomalies = tooth.anomalies
      }
      if (tooth.procedures.length > 0) {
        cleanTooth.procedures = tooth.procedures
      }
      if (tooth.foreign_objects.length > 0) {
        cleanTooth.foreign_objects = tooth.foreign_objects
      }

      return cleanTooth
    }).filter(tooth => tooth.anomalies || tooth.procedures || tooth.foreign_objects) // Only include teeth with data

    return {
      teeth: { "teeth": teethArray }
    }
  }

  // Helper function to compare segmentation arrays for exact match
  const arraysEqual = (arr1, arr2) => {
    if (!arr1 || !arr2 || arr1.length !== arr2.length) return false

    return arr1.every((point1, index) => {
      const point2 = arr2[index]
      return Math.abs(point1.x - point2.x) < 0.001 && Math.abs(point1.y - point2.y) < 0.001
    })
  }
  const startRagJob = async (structuredData, query = 'create a treatment plan') => {
    const response = await axios.post(`${apiUrl}/start-chat-job`, {
      query: query,
      json: structuredData.teeth,
    }, {
      headers: {
        Authorization: sessionManager.getItem("token")
      }
    });
    return response.data.jobId;
  };

  const pollRagJob = async (jobId, maxRetries = 120, interval = 10000) => {
    for (let i = 0; i < maxRetries; i++) {
      const response = await axios.get(`${apiUrl}/chat-job-status/${jobId}`, {
        headers: {
          Authorization: sessionManager.getItem("token")
        }
      });

      const { status, result, error } = response.data;
      if (status === 'completed') return result;
      if (status === 'failed') throw new Error(error);

      await new Promise(resolve => setTimeout(resolve, interval));
    }

    throw new Error("Job timeout");
  };
  // Fetch CDT codes from RAG system
  const fetchCdtCodesFromRAG = async (selectedAnomaly, convertedCdtCode, selectedAnomalyMetadata = {}, selectedAnomalySegmentation = null) => {
    try {
      // Structure all annotations into the required format
      const structuredData = structureAnnotationsForRAG(selectedAnomaly, selectedAnomalyMetadata, selectedAnomalySegmentation)

      // const response = await axios.post(`${apiUrl}/chat-with-rag`, {
      //     query: `create a treatment plan`,
      //     json: structuredData.teeth, // Send the structured teeth data
      //   },
      //   {
      //   timeout: 600000,
      //   headers: {
      //     "Content-Type": "application/json",
      //     Authorization: sessionManager.getItem("token"),
      //   },
      // })
      const jobId = await startRagJob(structuredData);
      const ragText = await pollRagJob(jobId);
      console.log(ragText)
      return parseCdtCodes(ragText.answer, convertedCdtCode, selectedAnomaly)
    } catch (error) {
      console.error("Error fetching CDT codes:", error)
      return []
    }
  }

  // Parse CDT codes from RAG response
  const parseCdtCodes = (ragResponse, convertedCdtCode, anomalyType) => {
    const cdtCodes = []
    const lines = ragResponse.split("\n")
    const codeList = []

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim()
      if (!line) continue

      // Match D followed by 4 or 5 digits, with optional colon
      const codeMatches = line.match(/D\d{4,5}/g)
      if (codeMatches) {
        for (const code of codeMatches) {
          // Find the complete details from the dctCodes array and add only if it does not already exist
          const codeDetails = convertedCdtCode.find((c) => c.code === code)
          // console.log(codeDetails, code)
          if (codeDetails && !codeList.find((c) => c.code === code)) {
            // console.log(codeDetails)
            cdtCodes.push({
              code: code,
              description: codeDetails.description,
              price: codeDetails.price,
              unit: codeDetails.unit || "tooth", // Include unit information
              anomalyType: anomalyType, // Store the anomaly type with the treatment
            })
            codeList.push({
              code: code,
              description: codeDetails.description,
              price: codeDetails.price,
              unit: codeDetails.unit || "tooth",
              anomalyType: anomalyType,
            })
          }
        }
      }
    }
    // console.log(cdtCodes, ragResponse, convertedCdtCode, anomalyType)
    return cdtCodes
  }

  // Autofill treatments based on annotations
  const autofillTreatments = async (annotationsList, convertedCdtCode) => {
    await checkAnomaliesWithServer(annotationsList)
    let finalResult = treatments

    for (const [_, annotationData] of Object.entries(annotationsList)) {
      // Pass the metadata from the annotation's prerequisites AND the segmentation for exact matching
      const metadata = annotationData.prerequisites || {}
      const segmentation = annotationData.segmentation || null

      const cdtCodes = await fetchCdtCodesFromRAG(
        annotationData.label,
        convertedCdtCode,
        metadata,
        segmentation  // Pass segmentation for exact instance matching
      )

      if (cdtCodes.length > 0) {
        let toothNumbers = []

        // Handle tooth range for bone loss or single tooth
        if (typeof annotationData.associatedTooth === 'string' && annotationData.associatedTooth.includes('-')) {
          const [start, end] = annotationData.associatedTooth.split('-').map(num => parseInt(num))
          for (let i = start; i <= end; i++) {
            toothNumbers.push(i)
          }
        } else if (annotationData.associatedTooth) {
          toothNumbers = [parseInt(annotationData.associatedTooth)]
        }

        if (toothNumbers.length > 0) {
          const treatmentsWithPrerequisites = handleAutoFillTreatments(
            toothNumbers,
            cdtCodes,
            annotationData.label,
            metadata, // Pass prerequisites
          )
          finalResult = [...finalResult, ...treatmentsWithPrerequisites]
        }
      }
    }
    return finalResult
  }

  // Handle auto-filling treatments
  const handleAutoFillTreatments = (toothNumberArray, cdtData, anomalyType, prerequisites = {}) => {
    const newTreatments = []

    cdtData.forEach((code) => {
      // Handle different unit types
      if (code.unit && code.unit.toLowerCase() === "full mouth") {
        // For full mouth, create only one treatment with a special tooth number
        newTreatments.push({
          id: Date.now() + Math.random(),
          toothNumber: "fullmouth", // Special identifier for full mouth
          anomalyType: anomalyType,
          prerequisites: prerequisites, // Add prerequisites data
          ...code,
        })
      } else if (code.unit && code.unit.toLowerCase() === "visit") {
        // For per visit, create only one treatment with a special tooth number
        newTreatments.push({
          id: Date.now() + Math.random(),
          toothNumber: "visit", // Special identifier for per visit
          anomalyType: anomalyType,
          prerequisites: prerequisites,
          ...code,
        })
      } else if (code.unit && code.unit.toLowerCase() === "quadrant") {
        // For quadrant, group teeth by quadrant
        const quadrants = {}

        toothNumberArray.forEach((tooth) => {
          const quadrant = getQuadrantForTooth(tooth)
          if (!quadrants[quadrant]) {
            quadrants[quadrant] = []
          }
          quadrants[quadrant].push(tooth)
        })

        // Create one treatment per quadrant
        Object.keys(quadrants).forEach((quadrant) => {
          newTreatments.push({
            id: Date.now() + Math.random(),
            toothNumber: quadrant, // Use quadrant as the identifier
            affectedTeeth: quadrants[quadrant], // Store affected teeth
            anomalyType: anomalyType,
            prerequisites: prerequisites,
            ...code,
          })
        })
      } else {
        // For individual teeth (default case)
        toothNumberArray.forEach((toothNumber, index) => {
          // For bone loss, only add prerequisites to the first tooth in the range
          let treatmentPrerequisites = prerequisites
          if (anomalyType.toLowerCase().includes("bone loss") && index > 0) {
            treatmentPrerequisites = {} // Empty prerequisites for subsequent teeth
          }

          newTreatments.push({
            id: Date.now() + Math.random(),
            toothNumber: toothNumber.toString(),
            anomalyType: anomalyType,
            prerequisites: treatmentPrerequisites,
            ...code,
          })
        })
      }
    })

    if (newTreatments.length > 0) {
      const updatedTreatments = newTreatments
      // Ensure all new tooth numbers are added to selectedTeeth (avoid duplicates)
      const toothNumsToAdd = toothNumberArray.filter((t) => !isNaN(Number.parseInt(t)))
      setSelectedTeeth((prev) => [...new Set([...prev, ...toothNumsToAdd])])
      return updatedTreatments
    }
  }

  // Save treatment plan
  const saveTreatmentPlan = async (updatedTreatments) => {
    setSavingPlan(true)
    try {
      const response = await fetch(`${apiUrl}/save-treatment-plan`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: sessionManager.getItem("token"),
        },
        body: JSON.stringify({
          patientId: sessionManager.getItem("patientId"),
          treatments: updatedTreatments,
          created_by: "test",
        }),
      })

      const data = await response.json()
      if (data.success) {
        // setGlobalCheckedAnnotations({})
        // await loadExistingTreatmentPlan()
        // setTreatmentPlanSaved(true)
        setGlobalCheckedAnnotations({});
        await loadExistingTreatmentPlan();
        setTreatmentPlanSaved(true);
        setShowSuccessToast(true);

        // Auto-dismiss after 5 seconds
        setTimeout(() => setShowSuccessToast(false), 5000);
      }
    } catch (error) {
      console.error("Error saving treatment plan:", error)
      alert("Error saving treatment plan")
    } finally {
      setSavingPlan(false)
    }
  }

  const generateTreatmentPlan = async () => {
    setIsLoading(true)
    setGeneratingPlan(true)

    try {
      // First fetch the DCT codes if they're not already loaded
      let convertedCodes = dctCodes
      if (dctCodes.length === 0) {
        const response = await fetch(`${apiUrl}/getCDTCodes`, {
          headers: {
            Authorization: sessionManager.getItem("token"),
          },
        })
        const data = await response.json()
        convertedCodes = convertCdtCode(data.cdtCodes)
        setDctCodes(convertedCodes)
        setFilteredCodes(convertedCodes)
      }

      // Gather all checked anomaly annotations from global state
      const checkedAnomalyAnnotations = Object.values(globalCheckedAnnotations).filter((anno) =>
        isNaN(Number.parseInt(anno.label)),
      ) // Exclude tooth annotations
      // Combine them for processing
      const selectedAnnos = [...checkedAnomalyAnnotations]
      const updatedTreatments = await autofillTreatments(selectedAnnos, convertedCodes)

      // Save the treatment plan
      await saveTreatmentPlan(updatedTreatments)
    } catch (error) {
      console.error("Error generating treatment plan:", error)
      alert("Error generating treatment plan")
    } finally {
      setGeneratingPlan(false)
      setIsLoading(false)
    }
  }

  const handleCheckboxChange = (index) => {
    const anno = annotations[index]
    // If it's a tooth annotation, do nothing
    if (!isNaN(Number.parseInt(anno.label))) {
      return
    }

    // If the annotation is locked, don't allow unchecking
    if (lockedAnnotations.includes(index)) {
      return
    }

    const uniqueKey = getAnnotationUniqueKey(anno)
    const isCurrentlyChecked = !!globalCheckedAnnotations[uniqueKey]

    if (isCurrentlyChecked) {
      // Unchecking - remove from global state
      const updatedGlobalChecked = { ...globalCheckedAnnotations }
      delete updatedGlobalChecked[uniqueKey]
      setGlobalCheckedAnnotations(updatedGlobalChecked)

      setCheckedAnnotations((prev) => prev.filter((i) => i !== index))
    } else {
      // Checking - open prerequisites modal first
      let associatedTooth

      // Special handling for bone loss annotations - use the tooth range
      if (anno.label.toLowerCase().includes("bone loss")) {
        const toothAnnotations = annotations.filter((a) => !isNaN(Number.parseInt(a.label)))
        associatedTooth = findToothRangeForBoneLoss(anno, toothAnnotations)
      }

      // If not bone loss or no range found, use the standard method
      if (!associatedTooth) {
        associatedTooth =
          anno.associatedTooth !== undefined && anno.associatedTooth !== null
            ? anno.associatedTooth
            : findToothForStoredAnomaly(
              anno,
              annotations.filter((a) => !isNaN(Number.parseInt(a.label))),
            )
      }

      setSelectedAnnotationForPrerequisites({
        annotation: anno,
        index: index,
        associatedTooth: associatedTooth,
      })
      setPrerequisitesModalOpen(true)
    }
  }

  const handlePrerequisitesSave = async (annotation, formData, prerequisites) => {
    // Find the annotation index
    const index = annotations.findIndex((a) => a === annotation)
    if (index === -1) return

    // Use the associatedTooth field if available, otherwise calculate it using overlap method
    let associatedTooth = null

    // Special handling for bone loss annotations - use the tooth range
    if (annotation.label.toLowerCase().includes("bone loss")) {
      const toothAnnotations = annotations.filter((a) => !isNaN(Number.parseInt(a.label)))
      associatedTooth = findToothRangeForBoneLoss(annotation, toothAnnotations)
    }

    // If not bone loss or no range found, use standard methods
    if (!associatedTooth) {
      if (annotation.associatedTooth !== undefined && annotation.associatedTooth !== null) {
        associatedTooth = annotation.associatedTooth
      } else {
        // Get tooth annotations from current image
        const toothAnnotations = annotations.filter((a) => !isNaN(Number.parseInt(a.label)))
        // Find the associated tooth for this anomaly using overlap calculation
        associatedTooth = findToothForStoredAnomaly(annotation, toothAnnotations)
      }
    }

    const uniqueKey = getAnnotationUniqueKey(annotation)
    const updatedGlobalChecked = { ...globalCheckedAnnotations }

    // Add to global checked annotations with prerequisites data
    updatedGlobalChecked[uniqueKey] = {
      label: annotation.label,
      segmentation: annotation.segmentation,
      associatedTooth: associatedTooth,
      prerequisites: formData, // Store the form data
    }

    setGlobalCheckedAnnotations(updatedGlobalChecked)
    setCheckedAnnotations((prev) => [...prev, index])

    // Auto-generate treatment plan after saving prerequisites
    try {
      setIsLoading(true)
      setGeneratingPlan(true)

      // First fetch the DCT codes if they're not already loaded
      let convertedCodes = dctCodes
      if (dctCodes.length === 0) {
        const response = await fetch(`${apiUrl}/getCDTCodes`, {
          headers: {
            Authorization: sessionManager.getItem("token"),
          },
        })
        const data = await response.json()
        convertedCodes = convertCdtCode(data.cdtCodes)
        setDctCodes(convertedCodes)
        setFilteredCodes(convertedCodes)
      }

      // Use the updated global state (including the newly added annotation)
      const checkedAnomalyAnnotations = Object.values(updatedGlobalChecked).filter((anno) =>
        isNaN(Number.parseInt(anno.label)),
      ) // Exclude tooth annotations

      const updatedTreatments = await autofillTreatments(checkedAnomalyAnnotations, convertedCodes)

      // Save the treatment plan
      await saveTreatmentPlan(updatedTreatments)

      // Close the modal after successful generation
      handlePrerequisitesModalClose()
    } catch (error) {
      console.error("Error generating treatment plan:", error)
      alert("Error generating treatment plan")
    } finally {
      setGeneratingPlan(false)
      setIsLoading(false)
    }
  }

  // Add this function to handle modal close
  const handlePrerequisitesModalClose = () => {
    setPrerequisitesModalOpen(false)
    setSelectedAnnotationForPrerequisites(null)
  }
  const sendInitialContextToLLM = async() =>{
    try {
      // Structure all annotations into the required format
      const structuredData = structureAnnotationsForRAG(null)

      // const response = await axios.post(`${apiUrl}/chat-with-rag`, {
      //     query: `create a treatment plan`,
      //     json: structuredData.teeth, // Send the structured teeth data
      //   },
      //   {
      //   timeout: 600000,
      //   headers: {
      //     "Content-Type": "application/json",
      //     Authorization: sessionManager.getItem("token"),
      //   },
      // })
      const jobId = await startRagJob(structuredData, "");
      const ragText = await pollRagJob(jobId);
      console.log(ragText)
    } catch (error) {
      console.error("Error fetching CDT codes:", error)
      return []
    }

  }
  useEffect(() => {
    // Reset checked annotations based on current annotations and persistent state
    sendInitialContextToLLM()
    const newCheckedAnnotations = annotations.reduce((acc, anno, index) => {
      // Check if the annotation should be checked
      if (isAnnotationChecked(anno)) {
        acc.push(index)
      }
      return acc
    }, [])

    setCheckedAnnotations(newCheckedAnnotations)
  }, [annotations])
  // Function to handle "Add to Treatment Plan" button click
  const handleAddToTreatmentPlan = () => {
    if (checkedAnnotations.length - lockedAnnotations.length === 0) {
      alert("Please select at least one annotation")
      return
    }

    generateTreatmentPlan()
  }
  const findToothRangeForBoneLoss = (anomaly, toothAnnotations) => {
    // For bone loss, find all teeth that overlap with the annotation
    const overlappingTeeth = []

    toothAnnotations.forEach((toothAnno) => {
      const toothNumber = Number.parseInt(toothAnno.label)
      if (
        !isNaN(toothNumber) &&
        toothNumber >= 1 &&
        toothNumber <= 32 &&
        anomaly.segmentation &&
        toothAnno.segmentation
      ) {
        try {
          const overlap = calculateOverlap(anomaly.segmentation, toothAnno.segmentation)
          const annoArea = polygonArea(anomaly.segmentation.map((point) => [point.x, point.y]))
          const overlapPercentage = annoArea > 0 ? overlap / annoArea : 0

          // For bone loss, include any tooth with even minimal overlap
          if (overlapPercentage > 0.02) {
            overlappingTeeth.push(toothNumber)
          }
        } catch (error) {
          console.error("Error calculating overlap:", error)
        }
      }
    })

    // Sort teeth by number to create a range
    overlappingTeeth.sort((a, b) => a - b)

    if (overlappingTeeth.length > 0) {
      // Format the range as "X-Y" if it's a range, or just "X" if it's a single tooth
      return overlappingTeeth.length > 1
        ? `${overlappingTeeth[0]}-${overlappingTeeth[overlappingTeeth.length - 1]}`
        : `${overlappingTeeth[0]}`
    }

    return null
  }

  const findToothForStoredAnomaly = (anomaly, toothAnnotations) => {
    // First check if the annotation has an associatedTooth field
    if (anomaly.associatedTooth && anomaly.associatedTooth !== undefined && anomaly.associatedTooth !== null) {
      return anomaly.associatedTooth
    }
    // If no associatedTooth field or it's null, fall back to overlap calculation
    let maxOverlap = 0
    let associatedTooth = null

    // Only proceed with overlap calculation if we have valid segmentation data
    if (anomaly.segmentation && toothAnnotations.length > 0) {
      toothAnnotations.forEach((tooth) => {
        if (tooth.segmentation) {
          const overlapArea = calculateOverlap(anomaly.segmentation, tooth.segmentation)
          if (overlapArea > maxOverlap) {
            maxOverlap = overlapArea
            associatedTooth = tooth.label
          }
        }
      })
    }

    return associatedTooth
  }
  const dispatch = useDispatch()

  const getYouTubeId = (url) => {
    if (!url) return null // Return null if the URL is undefined or null
    const match = url.match(/(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([^&?\n]+)/)
    return match ? match[1] : null
  }

  const isCategoryHidden = (category) => {
    const categoryAnnotations = groupedAnnotations[category].map((anno) => annotations.findIndex((a) => a === anno))
    return categoryAnnotations.every((index) => hiddenAnnotations.includes(index))
  }

  const hideBox = (id) => {
    setHiddenAnnotations([...hiddenAnnotations, id])
  }

  const unhideBox = (id) => {
    setHiddenAnnotations(hiddenAnnotations.filter((hid) => hid !== id))
  }

  const hideCategory = (category) => {
    const annotationsToHide = groupedAnnotations[category].map((anno) => annotations.findIndex((a) => a === anno))
    setHiddenAnnotations((prev) => [...prev, ...annotationsToHide])
    setPersistentHiddenCategories((prev) => ({ ...prev, [category]: true }))
  }

  const unhideCategory = (category) => {
    const annotationsToUnhide = groupedAnnotations[category].map((anno) => annotations.findIndex((a) => a === anno))
    setHiddenAnnotations((prev) => prev.filter((index) => !annotationsToUnhide.includes(index)))
    setPersistentHiddenCategories((prev) => ({ ...prev, [category]: false }))
  }

  const hideAllBoxes = () => {
    const allIndices = annotations.map((_, index) => index)
    setHiddenAnnotations(allIndices)

    // Update persistent state for all categories
    const allCategoriesHidden = {}
    Object.keys(groupedAnnotations).forEach((category) => {
      allCategoriesHidden[category] = true
    })
    setPersistentHiddenCategories(allCategoriesHidden)
  }

  const unhideAllBoxes = () => {
    setHiddenAnnotations([])

    // Update persistent state for all categories
    const allCategoriesVisible = {}
    Object.keys(groupedAnnotations).forEach((category) => {
      allCategoriesVisible[category] = false
    })
    setPersistentHiddenCategories(allCategoriesVisible)
  }

  const handleCategoryVisibilityToggle = (category) => {
    if (hideGroup[category]) {
      unhideCategory(category)
      setHideGroup((prev) => ({ ...prev, [category]: false }))
    } else {
      hideCategory(category)
      setHideGroup((prev) => ({ ...prev, [category]: true }))
    }
  }

  useEffect(() => {
    dispatch(changeMode("dark"))
  }, [])

  const handleClickOutside = (event) => {
    if (popoverRef.current && !popoverRef.current.contains(event.target)) {
      setPopoverOpen(null)
    }
  }
  const handleSelectAnnotation = () => {
    setSelectedAnnotation(null)
    setIsEraserActive(false)
  }

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  useEffect(() => {
    if (groupByTooth) {
      // Group by tooth number
      const byTooth = groupAnnotationsByTooth()
      setGroupedAnnotations(byTooth)

      // Initialize hide states for tooth groups
      const toothHideGroups = {}
      // Initialize expanded states for tooth groups
      const toothExpandedGroups = { ...expandedGroups }

      Object.keys(byTooth).forEach((tooth) => {
        toothHideGroups[tooth] = false
        // All tooth groups should be collapsed by default
        toothExpandedGroups[tooth] = false
      })

      setHideGroup(toothHideGroups)
      setExpandedGroups(toothExpandedGroups)
    } else {
      // Original grouping by category
      const updatedGroupedAnnotations = {}
      const updatedHideGroups = {}
      const hiddenAnnotationsList = [...hiddenAnnotations]

      annotations.forEach((anno, index) => {
        const category = classCategories[anno.label.toLowerCase()]
        console.log(category, anno.label.toLowerCase())
        // Get the image group from the annotation's image
        const imageGroup = smallCanvasData[mainImageIndex]?.annotations?.annotations?.group || "pano"
        const confidenceField = `${imageGroup}_confidence`
        const confidenceThreshold = confidenceLevels[anno.label.toLowerCase()]
          ? confidenceLevels[anno.label.toLowerCase()][confidenceField] || 0.001
          : 0.001

        if (category && anno.confidence >= confidenceThreshold) {
          if (updatedGroupedAnnotations[category] === undefined) {
            updatedGroupedAnnotations[category] = []

            // Use the persistent state for category visibility
            updatedHideGroups[category] = persistentHiddenCategories[category] || false

            // If category is hidden according to persistent state, hide its annotations
            if (persistentHiddenCategories[category]) {
              hiddenAnnotationsList.push(index)
            }
          }

          updatedGroupedAnnotations[category].push(anno)

          // If category is hidden according to persistent state, hide this annotation
          if (persistentHiddenCategories[category]) {
            hiddenAnnotationsList.push(index)
          }
        } else if(anno.confidence >= confidenceThreshold){
          if (updatedGroupedAnnotations["Others"] === undefined) {
            updatedGroupedAnnotations["Others"] = []
            updatedHideGroups["Others"] = persistentHiddenCategories["Others"] || false
          }
          updatedGroupedAnnotations["Others"].push(anno)

          // If "Others" category is hidden, hide this annotation
          if (persistentHiddenCategories["Others"]) {
            hiddenAnnotationsList.push(index)
          }
        }
      })

      // Sort annotations within each category
      Object.keys(updatedGroupedAnnotations).forEach((category) => {
        updatedGroupedAnnotations[category].sort((a, b) => {
          // Try to sort numerically if both are numbers
          const numA = Number.parseInt(a.label, 10)
          const numB = Number.parseInt(b.label, 10)

          // If both can be parsed as numbers, sort numerically
          if (!isNaN(numA) && !isNaN(numB)) {
            return numA - numB
          }
          // Otherwise sort alphabetically
          return a.label.localeCompare(b.label)
        })
      })
      console.log(updatedGroupedAnnotations)
      setGroupedAnnotations(updatedGroupedAnnotations)
      setHideGroup(updatedHideGroups)
      setHiddenAnnotations([...new Set(hiddenAnnotationsList)])
    }
  }, [classCategories, annotations, persistentHiddenCategories, confidenceLevels, groupByTooth])

  useEffect(() => {
    hiddenAnnotations.length !== annotations.length ? setHideAllAnnotations(false) : setHideAllAnnotations(true)
    const updatedHideGroup = { ...hideGroup }
    Object.keys(groupedAnnotations).forEach((category) => {
      updatedHideGroup[category] = isCategoryHidden(category)
    })
    setHideGroup(updatedHideGroup)
  }, [hiddenAnnotations, annotations, groupedAnnotations])

  if (redirectToLogin) {
    return <Navigate to="/login" />
  }

  return (
    <Card
      style={{
        maxHeight: "90vh",
        maxWidth: "100%",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <CardBody
        style={{ paddingTop: "0", paddingBottom: "0", paddingLeft: "0px", marginLeft: "0px", marginTop: "15px" }}
      >
        <DentalChart
          annotations={annotations}
          classCategories={classCategories}
          confidenceLevels={confidenceLevels}
          setHiddenAnnotations={setHiddenAnnotations}
        />
        <div
          style={{
            position: 'fixed',
            top: '1rem',
            right: '1rem',
            zIndex: 1050,
            minWidth: '250px'
          }}
        >
          <Toast isOpen={showSuccessToast} className="bg-success text-white">
            <ToastHeader icon="success" toggle={() => setShowSuccessToast(false)}>
              Success
            </ToastHeader>
            <ToastBody>
              ✅ Added to Treatment Plan
            </ToastBody>
          </Toast>
        </div>
      </CardBody>
      {/* Header section with title and hide/show all button */}
      <CardBody style={{ paddingBottom: "0" }}>
        <Row>
          <Col md={5}>
            <h5>Findings ({annotations.length})</h5>
          </Col>
          <Col md={5} style={{ paddingRight: 0 }}>
            <div className="d-flex align-items-center">
              <Input
                type="checkbox"
                id="groupByToothToggle"
                checked={groupByTooth}
                onChange={() => setGroupByTooth(!groupByTooth)}
                style={{
                  transform: "scale(1.3)",
                  marginRight: "10px",
                  cursor: "pointer",
                }}
              />
              <label htmlFor="groupByToothToggle" style={{ marginBottom: "0", cursor: "pointer" }}>
                Sort By Tooth
              </label>
            </div>
          </Col>
          <Col md={2} style={{ justifyContent: "right", alignItems: "right", textAlign: "right" }}>
            <button
              id="btnHideShowAll"
              type="button"
              style={{
                cssText: "padding: 2px !important",
              }}
              className="btn noti-icon"
              onClick={(e) => {
                e.stopPropagation()
                if (hideAllAnnotations) {
                  unhideAllBoxes()
                  setHideAllAnnotations(false)
                } else {
                  hideAllBoxes()
                  setHideAllAnnotations(true)
                }
              }}
            >
              <i className={`ion ${hideAllAnnotations ? "ion-md-eye-off" : "ion-md-eye"}`}></i>
            </button>
            <UncontrolledTooltip placement="bottom" target="btnHideShowAll">
              {`${hideAllAnnotations ? "Show All" : "Hide All"}`}
            </UncontrolledTooltip>
          </Col>
        </Row>
      </CardBody>

      {/* Scrollable section for annotations */}
      <div style={{ overflowY: "auto", flexGrow: 1, padding: "0 1.25rem" }}>
        <Row>
          <Col md={12}>
            <div>
              {/* Loop over each category or tooth according to desiredOrder */}
              {Object.keys(groupedAnnotations)
                .sort((a, b) => {
                  // First check if both are numeric (teeth)
                  const numA = Number.parseInt(a)
                  const numB = Number.parseInt(b)

                  // If both are numbers (teeth), sort numerically
                  if (!isNaN(numA) && !isNaN(numB)) {
                    return numA - numB
                  }

                  // If either or both are non-numeric (categories)
                  // Check if they are in the desiredOrder array
                  const indexA = desiredOrder.indexOf(a)
                  const indexB = desiredOrder.indexOf(b)

                  // If both are in desiredOrder, sort by their position in desiredOrder
                  if (indexA !== -1 && indexB !== -1) {
                    return indexA - indexB
                  }

                  // If only one is in desiredOrder, prioritize the one in desiredOrder
                  if (indexA !== -1) return -1
                  if (indexB !== -1) return 1

                  // If neither is in desiredOrder, sort alphabetically
                  return a.localeCompare(b)
                })
                .map((group) => {
                  if (groupedAnnotations[group]) {
                    return (
                      <div key={group}>
                        {/* Always show header for all groups */}
                        {
                          <h5>
                            {groupNames[group]} ({groupedAnnotations[group].length}){/* Group Expansion Toggle */}
                            <button
                              id={`btnToggleGroup${group}`}
                              type="button"
                              className="btn noti-icon mr-2"
                              onClick={(e) => {
                                e.stopPropagation()
                                toggleGroupExpansion(group)
                              }}
                            >
                              <i
                                className={`ion ${expandedGroups[group] ? "ion-md-arrow-dropdown" : "ion-md-arrow-dropright"}`}
                              ></i>
                            </button>
                            {/* Existing Hide/Show Button */}
                            <button
                              id={`btnHide${group}`}
                              type="button"
                              className="btn noti-icon"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleCategoryVisibilityToggle(group)
                              }}
                            >
                              <i className={`ion ${hideGroup[group] ? "ion-md-eye-off" : "ion-md-eye"}`}></i>
                            </button>
                          </h5>
                        }

                        {/* Collapsible Group Content */}
                        <Collapse isOpen={expandedGroups[group]}>
                          <ListGroup flush>
                            {/* Existing annotation rendering logic */}
                            {groupedAnnotations[group].map((anno) => {
                              const globalIndex = annotations.findIndex((a) => a === anno)
                              if (globalIndex !== -1) {
                                return (
                                  <ListGroupItem
                                    key={globalIndex}
                                    id={`annotation-${globalIndex}`}
                                    className="d-flex align-items-center justify-content-between list-group-item-hover"
                                    style={{
                                      cursor: "pointer",
                                      paddingRight: "0",
                                      paddingLeft: "0",
                                      paddingTop: "0",
                                      paddingBottom: "0",
                                    }}
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      handleAnnotationClick(anno, globalIndex)
                                    }}
                                    onMouseEnter={() => handleHover(globalIndex)}
                                    onMouseLeave={() => handleHover(null)}
                                  >
                                    {/* Combined checkbox and label */}
                                    <div className="pl-2 pr-2 d-flex align-items-center" style={{ flexGrow: 1 }}>
                                      {/* Checkbox */}
                                      <Input
                                        type="checkbox"
                                        checked={checkedAnnotations.includes(globalIndex)}
                                        onChange={(e) => {
                                          e.stopPropagation()
                                          handleCheckboxChange(globalIndex)
                                        }}
                                        onClick={(e) => e.stopPropagation()}
                                        disabled={lockedAnnotations.includes(globalIndex)}
                                        style={{
                                          cursor: lockedAnnotations.includes(globalIndex) ? "not-allowed" : "pointer",
                                          marginRight: "10px",
                                        }}
                                      />

                                      {/* Lock icon if needed */}
                                      {lockedAnnotations.includes(globalIndex) && (
                                        <>
                                          <span
                                            className="mr-2 text-muted"
                                            style={{ fontSize: "12px" }}
                                            id={`locked-${globalIndex}`}
                                          >
                                            <i className="mdi mdi-lock-outline"></i>
                                          </span>

                                          <UncontrolledTooltip placement="top" target={`locked-${globalIndex}`}>
                                            This anomaly is included in the treatment plan and cannot be unchecked
                                          </UncontrolledTooltip>
                                        </>
                                      )}

                                      {/* Show dropdown if this annotation is selected and has a numeric label */}
                                      {selectedAnnotation === anno && !isNaN(Number.parseInt(anno.label)) ? (
                                        <div style={{ flexGrow: 1 }} onClick={(e) => e.stopPropagation()}>
                                          <InputGroup size="sm">
                                            <Input
                                              type="select"
                                              value={newLabel || anno.label}
                                              onChange={(e) => {
                                                setNewLabel(e.target.value)
                                                handleLabelChange(e.target.value)
                                              }}
                                            >
                                              {Array.from({ length: 32 }, (_, i) => i + 1).map((num) => (
                                                <option key={num} value={num.toString()}>
                                                  Tooth [{num}]
                                                </option>
                                              ))}
                                            </Input>
                                          </InputGroup>
                                        </div>
                                      ) : (
                                        <span>
                                          {/* For tooth annotations, display as "Tooth [number]" */}
                                          {!isNaN(Number.parseInt(anno.label))
                                            ? `Tooth [${anno.label}]`
                                            : /* For non-tooth annotations, display label and associated tooth */
                                            (() => {
                                              // Get associated tooth for display
                                              let displayToothInfo = ""

                                              // Special handling for bone loss annotations
                                              if (anno.label.toLowerCase().includes("bone loss")) {
                                                const toothRange = findToothRangeForBoneLoss(
                                                  anno,
                                                  annotations.filter((a) => !isNaN(Number.parseInt(a.label))),
                                                )
                                                displayToothInfo = toothRange
                                                  ? ` [${toothRange}]`
                                                  : anno.associatedTooth
                                                    ? ` [${anno.associatedTooth}]`
                                                    : ""
                                              }
                                              // For all other non-tooth annotations
                                              else {
                                                // First try to use the associatedTooth field
                                                if (
                                                  anno.associatedTooth !== undefined &&
                                                  anno.associatedTooth !== null
                                                ) {
                                                  displayToothInfo = ` [${anno.associatedTooth}]`
                                                }
                                                // If no associatedTooth, try to find it using overlap
                                                else {
                                                  const toothAnnotations = annotations.filter(
                                                    (a) => !isNaN(Number.parseInt(a.label)),
                                                  )
                                                  const associatedTooth = findToothForStoredAnomaly(
                                                    anno,
                                                    toothAnnotations,
                                                  )
                                                  if (associatedTooth) {
                                                    displayToothInfo = ` [${associatedTooth}]`
                                                  }
                                                }
                                              }

                                              return (
                                                <>
                                                  {anno.label}
                                                  {displayToothInfo}
                                                </>
                                              )
                                            })()}
                                          {/* Display annotation source indicator */}
                                          {anno.created_by
                                            ? anno.created_by.startsWith("Model v")
                                              ? ""
                                              : anno.created_by.startsWith("Auto Update Labelling")
                                                ? "(A)"
                                                : " (M)"
                                            : ""}
                                          {/* Display confidence if enabled */}
                                          {showConfidence && anno.confidence ? ` (${anno.confidence.toFixed(2).toString().slice(1)})`: showConfidence && "NA"}
                                        </span>
                                      )}
                                    </div>

                                    <div className="d-flex">
                                      {/* Delete Button */}
                                      <button
                                        id="btnRemove"
                                        type="button"
                                        style={{ cssText: "padding: 2px !important", fontSize: "20px" }}
                                        className="btn"
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          deleteBox(globalIndex)
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
                                          e.stopPropagation()
                                          hiddenAnnotations.includes(globalIndex)
                                            ? unhideBox(globalIndex)
                                            : hideBox(globalIndex)
                                        }}
                                      >
                                        <i
                                          className={`ion ${hiddenAnnotations.includes(globalIndex) ? "ion-md-eye-off" : "ion-md-eye"}`}
                                        ></i>
                                      </button>

                                      {/* Edit Button */}
                                      <button
                                        id="btnEdit"
                                        type="button"
                                        style={{ cssText: "padding: 2px !important", fontSize: "20px" }}
                                        className="btn"
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          if (selectedAnnotation === anno) {
                                            handleSelectAnnotation()
                                          } else {
                                            setSelectedAnnotation(anno)
                                            if (!isNaN(Number.parseInt(anno.label))) {
                                              setNewLabel(anno.label)
                                            }
                                          }
                                        }}
                                      >
                                        <i
                                          className={`mdi ${selectedAnnotation === anno ? "mdi-lead-pencil" : "mdi-pencil-box-outline"
                                            }`}
                                        ></i>
                                      </button>
                                    </div>
                                  </ListGroupItem>
                                )
                              }
                            })}
                          </ListGroup>
                        </Collapse>
                      </div>
                    )
                  }
                })}
            </div>
          </Col>
        </Row>
      </div>

      {/* Fixed footer section with the button */}
      <CardBody
        style={{
          paddingTop: "0.75rem",
          borderTop: "1px solid rgba(0,0,0,0.125)",
          position: "sticky",
          bottom: "0",
        }}
      >
        {/* Add to Treatment Plan button */}
        {/* <Row>
          <Col md={12}>
            <Button
              color="primary"
              block
              disabled={Object.keys(globalCheckedAnnotations).length === 0 || isLoading || generatingPlan}
              onClick={generateTreatmentPlan}
            >
              {isLoading || generatingPlan
                ? "Processing..."
                : `Add to Treatment Plan (${Object.keys(globalCheckedAnnotations).length} selected)`}
            </Button>
          </Col>
        </Row> */}

        {/* Show saved confirmation if applicable */}
        {/* {treatmentPlanSaved && (
          <Row className="mt-2">
            <Col md={12}>
              <div className="alert alert-success">Treatment plan saved successfully!</div>
            </Col>
          </Row>
        )} */}
        <AnnotationPrerequisitesModal
          isOpen={prerequisitesModalOpen}
          toggle={handlePrerequisitesModalClose}
          annotation={selectedAnnotationForPrerequisites?.annotation}
          apiUrl={apiUrl}
          sessionManager={sessionManager}
          onSave={handlePrerequisitesSave}
          isGeneratingPlan={generatingPlan} // Pass the loading state
          associatedTooth={selectedAnnotationForPrerequisites?.associatedTooth}
          patientData={patientDetails}
        />
      </CardBody>
    </Card>
  )
}

export default AnnotationList
