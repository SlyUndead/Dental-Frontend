"use client"

import { useState, useEffect, useMemo } from "react"
import { calculateOverlap, polygonArea } from "./path-utils"
import { Button } from "reactstrap"
import Tooth01 from "../../assets/SVG-1-to-32/1-32/01.svg"
import Tooth02 from "../../assets/SVG-1-to-32/1-32/02.svg"
import Tooth03 from "../../assets/SVG-1-to-32/1-32/03.svg"
import Tooth04 from "../../assets/SVG-1-to-32/1-32/04.svg"
import Tooth05 from "../../assets/SVG-1-to-32/1-32/05.svg"
import Tooth06 from "../../assets/SVG-1-to-32/1-32/06.svg"
import Tooth07 from "../../assets/SVG-1-to-32/1-32/07.svg"
import Tooth08 from "../../assets/SVG-1-to-32/1-32/08.svg"
import Tooth09 from "../../assets/SVG-1-to-32/1-32/09.svg"
import Tooth10 from "../../assets/SVG-1-to-32/1-32/10.svg"
import Tooth11 from "../../assets/SVG-1-to-32/1-32/11.svg"
import Tooth12 from "../../assets/SVG-1-to-32/1-32/12.svg"
import Tooth13 from "../../assets/SVG-1-to-32/1-32/13.svg"
import Tooth14 from "../../assets/SVG-1-to-32/1-32/14.svg"
import Tooth15 from "../../assets/SVG-1-to-32/1-32/15.svg"
import Tooth16 from "../../assets/SVG-1-to-32/1-32/16.svg"
import Tooth17 from "../../assets/SVG-1-to-32/1-32/17.svg"
import Tooth18 from "../../assets/SVG-1-to-32/1-32/18.svg"
import Tooth19 from "../../assets/SVG-1-to-32/1-32/19.svg"
import Tooth20 from "../../assets/SVG-1-to-32/1-32/20.svg"
import Tooth21 from "../../assets/SVG-1-to-32/1-32/21.svg"
import Tooth22 from "../../assets/SVG-1-to-32/1-32/22.svg"
import Tooth23 from "../../assets/SVG-1-to-32/1-32/23.svg"
import Tooth24 from "../../assets/SVG-1-to-32/1-32/24.svg"
import Tooth25 from "../../assets/SVG-1-to-32/1-32/25.svg"
import Tooth26 from "../../assets/SVG-1-to-32/1-32/26.svg"
import Tooth27 from "../../assets/SVG-1-to-32/1-32/27.svg"
import Tooth28 from "../../assets/SVG-1-to-32/1-32/28.svg"
import Tooth29 from "../../assets/SVG-1-to-32/1-32/29.svg"
import Tooth30 from "../../assets/SVG-1-to-32/1-32/30.svg"
import Tooth31 from "../../assets/SVG-1-to-32/1-32/31.svg"
import Tooth32 from "../../assets/SVG-1-to-32/1-32/32.svg"

const DentalChart = ({
  annotations,
  classCategories,
  confidenceLevels,
  setHiddenAnnotations,
  onToothSelect,
  externalSelectedTooth,
  isConsolidatedView = false,
}) => {
  // State to track which tooth is selected
  // If externalSelectedTooth is provided, use it as the initial value
  const [selectedTooth, setSelectedTooth] = useState(externalSelectedTooth || null)
  // State to track viewport width
  const [windowWidth, setWindowWidth] = useState(typeof window !== "undefined" ? window.innerWidth : 1200)

  // Update internal state when externalSelectedTooth changes
  useEffect(() => {
    if (externalSelectedTooth !== undefined) {
      setSelectedTooth(externalSelectedTooth)
    }
  }, [externalSelectedTooth])

  // Add window resize listener for responsive behavior
  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth)
    }

    if (typeof window !== "undefined") {
      window.addEventListener("resize", handleResize)
      return () => window.removeEventListener("resize", handleResize)
    }
  }, [])

  // Calculate columns based on screen width
  const getGridColumns = () => {
    if (windowWidth < 576) return 8 // Extra small devices - show 8 teeth per row
    if (windowWidth < 768) return 16 // Small devices - show all teeth in one row
    return 16 // Medium and larger devices - show all teeth in one row
  }

  // Create a mapping of tooth numbers to their imported SVG files
  const toothImages = {
    1: Tooth01,
    2: Tooth02,
    3: Tooth03,
    4: Tooth04,
    5: Tooth05,
    6: Tooth06,
    7: Tooth07,
    8: Tooth08,
    9: Tooth09,
    10: Tooth10,
    11: Tooth11,
    12: Tooth12,
    13: Tooth13,
    14: Tooth14,
    15: Tooth15,
    16: Tooth16,
    17: Tooth17,
    18: Tooth18,
    19: Tooth19,
    20: Tooth20,
    21: Tooth21,
    22: Tooth22,
    23: Tooth23,
    24: Tooth24,
    25: Tooth25,
    26: Tooth26,
    27: Tooth27,
    28: Tooth28,
    29: Tooth29,
    30: Tooth30,
    31: Tooth31,
    32: Tooth32,
  }

  // Initialize teeth data (1-32)
  const teeth = useMemo(() => {
    const teethData = Array.from({ length: 32 }, (_, i) => ({
      number: i + 1,
      hasAnomaly: false,
      hasProcedure: false,
      hasAnnotations: false, // Track if tooth has any annotations
    }))

    // Handle consolidated view differently
    if (isConsolidatedView && annotations) {
      // In consolidated view, annotations is an array of tooth objects with anomalies
      annotations.forEach((toothData) => {
        // Skip unassigned teeth
        if (toothData.toothNumber === "Unassigned" || toothData.isUnassigned) {
          return
        }

        const toothNumber = Number.parseInt(toothData.toothNumber)
        if (!isNaN(toothNumber) && toothNumber >= 1 && toothNumber <= 32) {
          const toothIndex = toothNumber - 1
          teethData[toothIndex].hasAnnotations = true

          // Check anomalies for this tooth
          if (toothData.anomalies && toothData.anomalies.length > 0) {
            toothData.anomalies.forEach((anomaly) => {
              // Skip "No anomalies detected" entries
              if (anomaly.name === "No anomalies detected" || anomaly.name === "Not detected") {
                return
              }

              const category = anomaly.category || classCategories[anomaly.name.toLowerCase()]
              if (category === "Anomaly") {
                teethData[toothIndex].hasAnomaly = true
              } else if (category === "Procedure") {
                teethData[toothIndex].hasProcedure = true
              }
            })
          }
        }
      })
    } else {
      // Standard view processing
      // First, identify all tooth annotations
      const toothAnnotations = annotations.filter((anno) => {
        const toothNumber = Number.parseInt(anno.label)
        return !isNaN(toothNumber) && toothNumber >= 1 && toothNumber <= 32
      })

      // Mark teeth that have their own annotation (tooth number)
      toothAnnotations.forEach((anno) => {
        const toothNumber = Number.parseInt(anno.label)
        if (toothNumber >= 1 && toothNumber <= 32) {
          teethData[toothNumber - 1].hasAnnotations = true
        }
      })

      // Then, process non-tooth annotations to determine tooth status
      annotations.forEach((anno) => {
        // Skip annotations that don't meet confidence threshold
        if (anno.label && anno.label.slice(0, 10) === "Bone Loss") {
          anno.label = "Bone Loss"
        }

        // Get the image group from the annotation's image
        const imageGroup = anno.image?.annotations?.annotations?.group || "pano"
        const confidenceField = `${imageGroup}_confidence`
        const confidenceThreshold = confidenceLevels[anno.label.toLowerCase()]
          ? confidenceLevels[anno.label.toLowerCase()][confidenceField] || 0.001
          : 0.001

        if (!anno.label || !anno.confidence || anno.confidence < confidenceThreshold) {
          return
        }

        // Skip tooth annotations (we only want to process anomalies and procedures)
        const annoNumber = Number.parseInt(anno.label)
        if (!isNaN(annoNumber) && annoNumber >= 1 && annoNumber <= 32) {
          return
        }

        // This is a non-tooth annotation (potential anomaly or procedure)
        // Use the associatedTooth field if available, otherwise find which tooth it overlaps with
        let associatedToothIndex = -1

        // Check if the annotation has an associatedTooth field
        if (anno.associatedTooth !== undefined && anno.associatedTooth !== null) {
          const toothNumber = Number.parseInt(anno.associatedTooth)
          if (!isNaN(toothNumber) && toothNumber >= 1 && toothNumber <= 32) {
            associatedToothIndex = toothNumber - 1
          }
        }
        // If no associatedTooth field or it's null, use "Unassigned"
        else {
          // Keep the old calculation logic as fallback
          let maxOverlap = 0

          toothAnnotations.forEach((toothAnno) => {
            const toothNumber = Number.parseInt(toothAnno.label)
            if (!isNaN(toothNumber) && toothNumber >= 1 && toothNumber <= 32) {
              const overlap = calculateOverlap(anno.segmentation, toothAnno.segmentation)

              // We need to calculate the total area of the annotation to determine the percentage
              const annoArea = polygonArea(anno.segmentation.map((point) => [point.x, point.y]))
              const overlapPercentage = annoArea > 0 ? overlap / annoArea : 0

              if (overlapPercentage > 0.8 && overlap > maxOverlap) {
                maxOverlap = overlap
                associatedToothIndex = toothNumber - 1
              }
            }
          })
        }

        // If we found an associated tooth, update its status
        if (associatedToothIndex >= 0) {
          const category = classCategories[anno.label.toLowerCase()]
          if (category === "Anomaly") {
            teethData[associatedToothIndex].hasAnomaly = true
          } else if (category === "Procedure") {
            teethData[associatedToothIndex].hasProcedure = true
          }
          teethData[associatedToothIndex].hasAnnotations = true
        }
      })
    }

    return teethData
  }, [annotations, classCategories, confidenceLevels, isConsolidatedView])

  // Get color based on tooth status
  const getToothColor = (tooth) => {
    if (!tooth.hasAnnotations) return "grey" // Grey if no annotations
    if (tooth.hasAnomaly) return "red" // Anomaly takes highest priority
    if (tooth.hasProcedure) return "green" // Procedure takes second priority
    return "blue" // Default color
  }

  // Function to handle tooth click
  const handleToothClick = (toothNumber) => {
    // If already selected, clear selection
    if (selectedTooth === toothNumber) {
      setSelectedTooth(null)
      // Show all annotations
      setHiddenAnnotations([])
      // Notify parent component
      if (onToothSelect) {
        onToothSelect(null)
      }
      return
    }

    // Set the selected tooth
    setSelectedTooth(toothNumber)

    // Notify parent component
    if (onToothSelect) {
      onToothSelect(toothNumber)
    }

    // For consolidated view, we don't need to update hidden annotations
    // as the filtering is handled by the ConsolidatedToothTable component
    if (isConsolidatedView) {
      return
    }

    // Standard view processing
    // Find the annotation indices to keep visible (associated with this tooth)
    const visibleAnnotations = []
    const hiddenAnnotations = []

    // Get tooth annotation first
    const toothAnnotationIndex = annotations.findIndex(
      (anno) => !isNaN(Number.parseInt(anno.label)) && Number.parseInt(anno.label) === toothNumber,
    )

    if (toothAnnotationIndex !== -1) {
      visibleAnnotations.push(toothAnnotationIndex)
    }

    // Get tooth annotation object
    const toothAnnotation = annotations.find(
      (anno) => !isNaN(Number.parseInt(anno.label)) && Number.parseInt(anno.label) === toothNumber,
    )

    // Process all annotations to determine which ones are related to this tooth
    annotations.forEach((anno, index) => {
      // Skip if it's the tooth annotation itself (already handled)
      if (!isNaN(Number.parseInt(anno.label)) && Number.parseInt(anno.label) === toothNumber) {
        return
      }

      // For anomalies and other annotations, check if they are associated with the tooth
      // First check the associatedTooth field if available
      if (anno.associatedTooth !== undefined && anno.associatedTooth !== null) {
        const associatedToothNumber = Number.parseInt(anno.associatedTooth)
        if (associatedToothNumber === toothNumber) {
          visibleAnnotations.push(index)
        } else {
          hiddenAnnotations.push(index)
        }
      }
      // If no associatedTooth field or it's null, fall back to overlap calculation
      else if (toothAnnotation) {
        const overlap = calculateOverlap(anno.segmentation, toothAnnotation.segmentation)
        const annoArea = polygonArea(anno.segmentation.map((point) => [point.x, point.y]))
        const overlapPercentage = annoArea > 0 ? overlap / annoArea : 0

        if (overlapPercentage > 0.8) {
          visibleAnnotations.push(index)
        } else {
          hiddenAnnotations.push(index)
        }
      } else {
        // If we don't have a tooth annotation, hide all annotations
        hiddenAnnotations.push(index)
      }
    })

    // Update the hidden annotations list
    setHiddenAnnotations(hiddenAnnotations)
  }

  // Calculate the number of columns for the grid
  const numColumns = getGridColumns()

  // Calculate the size of tooth images based on screen width
  const getToothSize = () => {
    if (windowWidth < 576) return { width: "20px", height: "40px" }
    if (windowWidth < 768) return { width: "22px", height: "44px" }
    return { width: "24px", height: "50px" }
  }

  const toothSize = getToothSize()

  // Function to split array into chunks for responsive grid
  const chunkArray = (array, chunkSize) => {
    const result = []
    for (let i = 0; i < array.length; i += chunkSize) {
      result.push(array.slice(i, i + chunkSize))
    }
    return result
  }

  // Create tooth rows based on responsive grid
  const upperTeethRows = chunkArray(
    teeth.filter((tooth) => tooth.number >= 1 && tooth.number <= 16).sort((a, b) => a.number - b.number),
    numColumns,
  )

  const lowerTeethRows = chunkArray(
    teeth.filter((tooth) => tooth.number >= 17 && tooth.number <= 32).sort((a, b) => b.number - a.number),
    numColumns,
  )

  return (
    <div className="dental-chart-container" style={{ marginBottom: "20px", maxWidth: "100%", overflowX: "hidden" }}>
      <h5>Dental Chart {selectedTooth ? `(Tooth ${selectedTooth} Selected)` : ""}</h5>
      <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
        {/* Upper teeth (1-16) in sequential order */}
        {upperTeethRows.map((row, rowIndex) => (
          <div
            key={`upper-row-${rowIndex}`}
            style={{
              display: "grid",
              gridTemplateColumns: `repeat(${row.length}, 1fr)`,
              gap: "2px",
              margin: "0 auto",
              width: "100%",
            }}
          >
            {row.map((tooth) => (
              <div
                key={tooth.number}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  cursor: "pointer",
                  padding: "2px",
                  backgroundColor: selectedTooth === tooth.number ? "rgba(59, 130, 246, 0.1)" : "transparent",
                  borderRadius: "4px",
                }}
                onClick={() => handleToothClick(tooth.number)}
              >
                <div
                  style={{
                    fontSize: windowWidth < 576 ? "8px" : "10px",
                    fontWeight: selectedTooth === tooth.number ? "700" : "500",
                    marginBottom: "2px",
                  }}
                >
                  {tooth.number}
                </div>
                <img
                  src={toothImages[tooth.number] || "/placeholder.svg"}
                  alt={`Tooth ${tooth.number}`}
                  viewBox="0 0 60 40"
                  style={{
                    width: toothSize.width,
                    height: toothSize.height,
                    filter:
                      getToothColor(tooth) === "grey"
                        ? "invert(84%) sepia(9%) saturate(188%) hue-rotate(185deg) brightness(92%) contrast(85%)"
                        : getToothColor(tooth) === "red"
                          ? "invert(27%) sepia(90%) saturate(7500%) hue-rotate(0deg) brightness(105%) contrast(115%)"
                          : getToothColor(tooth) === "green"
                            ? "invert(85%) sepia(27%) saturate(1115%) hue-rotate(86deg) brightness(92%) contrast(87%)"
                            : "invert(69%) sepia(45%) saturate(1129%) hue-rotate(191deg) brightness(103%) contrast(98%)",
                  }}
                />
              </div>
            ))}
          </div>
        ))}

        {/* Lower teeth (32-17) in descending order */}
        {lowerTeethRows.map((row, rowIndex) => (
          <div
            key={`lower-row-${rowIndex}`}
            style={{
              display: "grid",
              gridTemplateColumns: `repeat(${row.length}, 1fr)`,
              gap: "2px",
              margin: "0 auto",
              width: "100%",
            }}
          >
            {row.map((tooth) => (
              <div
                key={tooth.number}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  cursor: "pointer",
                  padding: "2px",
                  backgroundColor: selectedTooth === tooth.number ? "rgba(59, 130, 246, 0.1)" : "transparent",
                  borderRadius: "4px",
                }}
                onClick={() => handleToothClick(tooth.number)}
              >
                <img
                  src={toothImages[tooth.number] || "/placeholder.svg"}
                  alt={`Tooth ${tooth.number}`}
                  viewBox="0 0 60 40"
                  style={{
                    width: toothSize.width,
                    height: toothSize.height,
                    filter:
                      getToothColor(tooth) === "grey"
                        ? "invert(84%) sepia(9%) saturate(188%) hue-rotate(185deg) brightness(92%) contrast(85%)"
                        : getToothColor(tooth) === "red"
                          ? "invert(27%) sepia(90%) saturate(7500%) hue-rotate(0deg) brightness(105%) contrast(115%)"
                          : getToothColor(tooth) === "green"
                            ? "invert(85%) sepia(27%) saturate(1115%) hue-rotate(86deg) brightness(92%) contrast(87%)"
                            : "invert(69%) sepia(45%) saturate(1129%) hue-rotate(191deg) brightness(103%) contrast(98%)",
                  }}
                />
                <div
                  style={{
                    fontSize: windowWidth < 576 ? "8px" : "10px",
                    fontWeight: selectedTooth === tooth.number ? "700" : "500",
                    marginTop: "2px",
                  }}
                >
                  {tooth.number}
                </div>
              </div>
            ))}
          </div>
        ))}

        {/* Legend - Adjusted for smaller screens */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            justifyContent: "center",
            gap: windowWidth < 576 ? "8px" : "15px",
            marginTop: "10px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
            <div style={{ width: "12px", height: "12px", backgroundColor: "#f87171", borderRadius: "2px" }}></div>
            <span style={{ fontSize: windowWidth < 576 ? "10px" : "12px" }}>Anomaly</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
            <div style={{ width: "12px", height: "12px", backgroundColor: "#4ade80", borderRadius: "2px" }}></div>
            <span style={{ fontSize: windowWidth < 576 ? "10px" : "12px" }}>Procedure</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
            <div style={{ width: "12px", height: "12px", backgroundColor: "#93c5fd", borderRadius: "2px" }}></div>
            <span style={{ fontSize: windowWidth < 576 ? "10px" : "12px" }}>Normal</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
            <div style={{ width: "12px", height: "12px", backgroundColor: "#d1d5db", borderRadius: "2px" }}></div>
            <span style={{ fontSize: windowWidth < 576 ? "10px" : "12px" }}>Not Detected</span>
          </div>
        </div>

        {/* Reset filter button (only when a tooth is selected) */}
        {selectedTooth && (
          <div style={{ display: "flex", justifyContent: "center", marginTop: "5px" }}>
            <Button
              color="primary"
              size={windowWidth < 576 ? "sm" : "md"}
              onClick={() => {
                setSelectedTooth(null)
                setHiddenAnnotations([])
                if (onToothSelect) {
                  onToothSelect(null)
                }
              }}
            >
              Clear Selection
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

export default DentalChart