"use client"

import { useEffect, useState, useRef } from "react"
import {
  Card,
  CardBody,
  Button,
  ListGroup,
  ListGroupItem,
  Row,
  Col,
  UncontrolledTooltip,
  Input,
  InputGroup,
} from "reactstrap"
import axios from "axios"
import { changeMode } from "../../store/actions"
import { Navigate } from "react-router-dom"
import { useDispatch } from "react-redux"
import "bootstrap/dist/css/bootstrap.min.css"
import "../../assets/scss/custom/components/_popover.scss"
import { logErrorToServer } from "utils/logError"
import { desiredOrder } from "./constants"

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
}) => {
  // Check if setHoveredAnnotation is a function, if not, use a no-op function
  const apiUrl = process.env.REACT_APP_NODEAPIURL
  const [hideAllAnnotations, setHideAllAnnotations] = useState(false)
  const [redirectToLogin, setRedirectToLogin] = useState(false)
  const popoverRef = useRef(null)
  const handleHover = typeof setHoveredAnnotation === "function" ? setHoveredAnnotation : () => {}
  const [popoverData, setPopoverData] = useState({})
  const [popoverOpen, setPopoverOpen] = useState(null) // Track which annotation's popover is open
  const [groupedAnnotations, setGroupedAnnotations] = useState({})
  const [hideGroup, setHideGroup] = useState({})
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
  const [globalCheckedAnnotations, setGlobalCheckedAnnotations] = useState(() => {
    // Initialize from localStorage or an empty object
    const saved = localStorage.getItem("globalCheckedAnnotations")
    return saved ? JSON.parse(saved) : {}
  })
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
    const response = await fetch(`${apiUrl}/get-treatment-plan?patientId=${sessionStorage.getItem("patientId")}`, {
      method: "GET",
      headers: {
        Authorization: sessionStorage.getItem("token"),
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
            Authorization: sessionStorage.getItem("token"),
          },
        })
        // console.log(response.data)
        setPopoverData(response.data)
        sessionStorage.setItem("token", response.headers["new-token"])
        setPopoverOpen(index)
        if (response.data === null) {
          setPopoverData({ description: "Please contact admin", className: "Data Missing" })
          setPopoverOpen(index)
        }
      } catch (err) {
        if (err.status === 403 || err.status === 401) {
          sessionStorage.removeItem("token")
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
  const calculateOverlap = (segA, segB) => {
    const [ax1, ay1, ax2, ay2] = [segA[0].x, segA[0].y, segA[2].x, segA[2].y]
    const [bx1, by1, bx2, by2] = [segB[0].x, segB[0].y, segB[2].x, segB[2].y]

    const x_overlap = Math.max(0, Math.min(ax2, bx2) - Math.max(ax1, bx1))
    const y_overlap = Math.max(0, Math.min(ay2, by2) - Math.max(ay1, by1))

    return x_overlap * y_overlap
  }
  // Find which tooth each anomaly is associated with
  const findToothForAnomaly = (annotationsList, anomalyCacheData = anomalyCache) => {
    const toothAnnotations = annotationsList.filter((a) => !isNaN(Number.parseInt(a.label)))
    const anomalyAnnotations = annotationsList.filter((a) => anomalyCacheData[a.label])
    // console.log(toothAnnotations, anomalyAnnotations, annotationsList)
    const anomalyToToothMap = {}

    anomalyAnnotations.forEach((anomaly) => {
      const teethWithOverlap = []

      toothAnnotations.forEach((tooth) => {
        const overlapArea = calculateOverlap(anomaly.segmentation, tooth.segmentation)
        if (overlapArea > 0) {
          teethWithOverlap.push({ tooth: tooth.label, overlap: overlapArea })
        }
      })

      if (teethWithOverlap.length > 0) {
        teethWithOverlap.sort((a, b) => b.overlap - a.overlap)
        anomalyToToothMap[anomaly.label] = teethWithOverlap.map((t) => t.tooth)
      }
    })
    return anomalyToToothMap
  }

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
            Authorization: sessionStorage.getItem("token"),
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
          promptTemplate: "You are an expert in dentistry",
        }),
      })

      const ragText = await response.json()
      return parseCdtCodes(ragText.answer, convertedCdtCode, anomaly)
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
    for (const [index, annotation] of Object.entries(annotationsList)) {
      // console.log(annotation, annotationsList)
      const cdtCodes = await fetchCdtCodesFromRAG(annotation.label, convertedCdtCode)
      if (cdtCodes.length > 0) {
        finalResult = [
          ...finalResult,
          ...handleAutoFillTreatments([annotation.associatedTooth], cdtCodes, annotation.label),
        ]
      }
    }
    return finalResult
  }

  // Handle auto-filling treatments
  const handleAutoFillTreatments = (toothNumberArray, cdtData, anomalyType) => {
    const newTreatments = []
    // console.log(newTreatments, toothNumberArray, cdtData, anomalyType)
    cdtData.forEach((code) => {
      // Handle different unit types
      if (code.unit && code.unit.toLowerCase() === "full mouth") {
        // For full mouth, create only one treatment with a special tooth number
        newTreatments.push({
          id: Date.now() + Math.random(),
          toothNumber: "fullmouth", // Special identifier for full mouth
          anomalyType: anomalyType,
          ...code,
        })
      } else if (code.unit && code.unit.toLowerCase() === "visit") {
        // For per visit, create only one treatment with a special tooth number
        newTreatments.push({
          id: Date.now() + Math.random(),
          toothNumber: "visit", // Special identifier for per visit
          anomalyType: anomalyType,
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
            ...code,
          })
        })
      } else {
        // For individual teeth (default case)
        toothNumberArray.forEach((toothNumber) => {
          newTreatments.push({
            id: Date.now() + Math.random(),
            toothNumber: toothNumber.toString(),
            anomalyType: anomalyType,
            ...code,
          })
        })
      }
    })

    if (newTreatments.length > 0) {
      const updatedTreatments = newTreatments
      // console.log(newTreatments, updatedTreatments)
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
          Authorization: sessionStorage.getItem("token"),
        },
        body: JSON.stringify({
          patientId: sessionStorage.getItem("patientId"),
          treatments: updatedTreatments,
          created_by: "test",
        }),
      })

      const data = await response.json()
      if (data.success) {
        setGlobalCheckedAnnotations({})
        await loadExistingTreatmentPlan()
        setTreatmentPlanSaved(true)
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
            Authorization: sessionStorage.getItem("token"),
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

      // Prepare tooth annotations to pass along with anomalies
      const toothAnnotations = checkedAnomalyAnnotations
        .map((anno) => ({
          label: anno.associatedTooth,
          segmentation: null, // We don't need segmentation for tooth annotations
        }))
        .filter((tooth) => tooth.label !== null)

      // Combine them for processing
      const selectedAnnos = [...checkedAnomalyAnnotations]
      console.log(selectedAnnos)
      const updatedTreatments = await autofillTreatments(selectedAnnos, convertedCodes)

      // Lock the newly added anomalies
      const newLockedAnnotationKeys = Object.keys(globalCheckedAnnotations).filter((key) => {
        const anno = globalCheckedAnnotations[key]
        return isNaN(Number.parseInt(anno.label)) && anomalyCache[anno.label]
      })

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

  // Function to handle checkbox changes
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

    // Get tooth annotations from current image
    const toothAnnotations = annotations.filter((a) => !isNaN(Number.parseInt(a.label)))

    // Find the associated tooth for this anomaly
    const associatedTooth = findToothForStoredAnomaly(anno, toothAnnotations)

    // Create a copy of the global checked annotations
    const updatedGlobalChecked = { ...globalCheckedAnnotations }
    const uniqueKey = getAnnotationUniqueKey(anno)
    // Toggle the checked state
    if (updatedGlobalChecked[uniqueKey]) {
      delete updatedGlobalChecked[uniqueKey]
    } else {
      updatedGlobalChecked[uniqueKey] = {
        label: anno.label,
        segmentation: anno.segmentation,
        associatedTooth: associatedTooth, // Add the associated tooth number
      }
    }

    // Update the state
    setGlobalCheckedAnnotations(updatedGlobalChecked)
    setCheckedAnnotations((prev) => {
      if (prev.includes(index)) {
        return prev.filter((i) => i !== index)
      } else {
        return [...prev, index]
      }
    })
  }
  useEffect(() => {
    // Reset checked annotations based on current annotations and persistent state
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
  const findToothForStoredAnomaly = (anomaly, toothAnnotations) => {
    let maxOverlap = 0
    let associatedTooth = null

    toothAnnotations.forEach((tooth) => {
      const overlapArea = calculateOverlap(anomaly.segmentation, tooth.segmentation)
      if (overlapArea > maxOverlap) {
        maxOverlap = overlapArea
        associatedTooth = tooth.label
      }
    })

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
  }

  const unhideCategory = (category) => {
    const annotationsToUnhide = groupedAnnotations[category].map((anno) => annotations.findIndex((a) => a === anno))
    setHiddenAnnotations((prev) => prev.filter((index) => !annotationsToUnhide.includes(index)))
  }

  const unhideAllBoxes = () => {
    setHiddenAnnotations([])
  }

  const hideAllBoxes = () => {
    const allIndices = annotations.map((_, index) => index)
    setHiddenAnnotations(allIndices)
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
    const updatedGroupedAnnotations = {}
    const updatedHideGroups = {}
    const hiddenAnnotationsList = [...hiddenAnnotations]

    annotations.forEach((anno, index) => {
      const category = classCategories[anno.label.toLowerCase()]
      if (category) {
        if (updatedGroupedAnnotations[category] === undefined) {
          updatedGroupedAnnotations[category] = []

          // Hide Dental Chart by default and add its annotations to hiddenAnnotations
          if (category === "Dental Chart" || category === "Landmark") {
            updatedHideGroups[category] = true
            hiddenAnnotationsList.push(index)
          } else {
            updatedHideGroups[category] = false
          }
        }
        updatedGroupedAnnotations[category].push(anno)
        if (category === "Dental Chart" || category === "Landmark") {
          hiddenAnnotationsList.push(index)
        }
      } else {
        if (updatedGroupedAnnotations["Others"] === undefined) {
          updatedGroupedAnnotations["Others"] = []
          updatedHideGroups["Others"] = false
        }
        updatedGroupedAnnotations["Others"].push(anno)
      }
    })
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
    setGroupedAnnotations(updatedGroupedAnnotations)
    setHideGroup(updatedHideGroups)
    setHiddenAnnotations([...new Set(hiddenAnnotationsList)])
  }, [classCategories, annotations])

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
        borderRight: "1px solid #ccc",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Header section with title and hide/show all button */}
      <CardBody style={{ paddingBottom: "0" }}>
        <Row>
          <Col md={8}>
            <h5>Annotations ({annotations.length})</h5>
          </Col>
          <Col md={4} style={{ justifyContent: "right", alignItems: "right", textAlign: "right" }}>
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
                            e.stopPropagation()
                            if (hideGroup[category]) {
                              unhideCategory(category)
                              setHideGroup((prev) => ({ ...prev, [category]: false }))
                            } else {
                              hideCategory(category)
                              setHideGroup((prev) => ({ ...prev, [category]: true }))
                            }
                          }}
                        >
                          <i className={`ion ${hideGroup[category] ? "ion-md-eye-off" : "ion-md-eye"}`}></i>
                        </button>
                      </h5>

                      <ListGroup flush>
                        {/* Loop over each annotation in the current category */}
                        {groupedAnnotations[category].map((anno, index) => {
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
                                {/* Checkbox */}
                                <div className="pl-2 pr-2 d-flex align-items-center" style={{ marginRight: "5px" }}>
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
                                    }}
                                  />
                                  {lockedAnnotations.includes(globalIndex) && (
                                    <>
                                      <span
                                        className="ml-1 text-muted"
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
                                </div>

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
                                            {num}
                                          </option>
                                        ))}
                                      </Input>
                                    </InputGroup>
                                  </div>
                                ) : (
                                  <span style={{ flexGrow: 1 }}>
                                    {anno.label}
                                    {anno.created_by ? (anno.created_by.startsWith("Model v") ? "" : " (M)") : ""}
                                  </span>
                                )}

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
                                      className={`mdi ${
                                        selectedAnnotation === anno ? "mdi-lead-pencil" : "mdi-pencil-box-outline"
                                      }`}
                                    ></i>
                                  </button>
                                </div>
                              </ListGroupItem>
                            )
                          }
                        })}
                      </ListGroup>
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
        <Row>
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
        </Row>

        {/* Show saved confirmation if applicable */}
        {treatmentPlanSaved && (
          <Row className="mt-2">
            <Col md={12}>
              <div className="alert alert-success">Treatment plan saved successfully!</div>
            </Col>
          </Row>
        )}
      </CardBody>
    </Card>
  )
}

export default AnnotationList