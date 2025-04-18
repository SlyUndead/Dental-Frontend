"use client"

import { useState, useMemo } from "react"
import { calculateOverlap, polygonArea } from "./path-utils"
import { Button } from "reactstrap"

const DentalChart = ({ annotations, classCategories, confidenceLevels, setHiddenAnnotations }) => {
  // State to track which tooth is selected
  const [selectedTooth, setSelectedTooth] = useState(null)

  // Initialize teeth data (1-32)
  const teeth = useMemo(() => {
    const teethData = Array.from({ length: 32 }, (_, i) => ({
      number: i + 1,
      hasAnomaly: false,
      hasProcedure: false,
      hasAnnotations: false, // Track if tooth has any annotations
    }))

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
      if (anno.confidence < (confidenceLevels[anno.label.toLowerCase()] || 0.001)) {
        return
      }

      // Skip tooth annotations (we only want to process anomalies and procedures)
      const annoNumber = Number.parseInt(anno.label)
      if (!isNaN(annoNumber) && annoNumber >= 1 && annoNumber <= 32) {
        return
      }

      // This is a non-tooth annotation (potential anomaly or procedure)
      // Find which tooth it overlaps with the most
      let maxOverlap = 0
      let associatedToothIndex = -1

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

    return teethData
  }, [annotations, classCategories, confidenceLevels])

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
      return
    }

    // Set the selected tooth
    setSelectedTooth(toothNumber)

    // Find the annotation indices to keep visible (associated with this tooth)
    const visibleAnnotations = []
    const hiddenAnnotations = []

    // Get tooth annotation first
    const toothAnnotationIndex = annotations.findIndex(
      anno => !isNaN(Number.parseInt(anno.label)) && Number.parseInt(anno.label) === toothNumber
    )

    if (toothAnnotationIndex !== -1) {
      visibleAnnotations.push(toothAnnotationIndex)
    }

    // Get tooth annotation object
    const toothAnnotation = annotations.find(
      anno => !isNaN(Number.parseInt(anno.label)) && Number.parseInt(anno.label) === toothNumber
    )

    // Process all annotations to determine which ones are related to this tooth
    annotations.forEach((anno, index) => {
      // Skip if it's the tooth annotation itself (already handled)
      if (!isNaN(Number.parseInt(anno.label)) && Number.parseInt(anno.label) === toothNumber) {
        return
      }

      // For anomalies and other annotations, check if they overlap with the tooth
      if (toothAnnotation) {
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

  return (
    <div className="dental-chart-container" style={{ marginBottom: "20px" }}>
      <h5>Dental Chart {selectedTooth ? `(Tooth ${selectedTooth} Selected)` : ""}</h5>
      <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
        {/* Upper teeth (1-16) in sequential order */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(16, 1fr)", gap: "2px" }}>
          {teeth
            .filter((tooth) => tooth.number >= 1 && tooth.number <= 16)
            .sort((a, b) => a.number - b.number) // Simple ascending sort (1-16)
            .map((tooth) => (
              <div
                key={tooth.number}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  cursor: "pointer",
                  padding: "2px",
                  backgroundColor: selectedTooth === tooth.number ? "rgba(59, 130, 246, 0.1)" : "transparent",
                  borderRadius: "4px"
                }}
                onClick={() => handleToothClick(tooth.number)}
              >
                <div style={{
                  fontSize: "10px",
                  fontWeight: selectedTooth === tooth.number ? "700" : "500",
                  marginBottom: "2px"
                }}>
                  {tooth.number}
                </div>
                <svg viewBox="0 0 60 40" style={{ width: "18px", height: "30px" }} transform="scale(1 -1)">
                  <path
                    d="M53.065,10.656c-0.818-3.096-3.213-6.05-6.742-8.317c-4.348-2.796-10.496-3.107-16.05-0.813L30.098,1.6 C30,1.643,29.905,1.686,29.802,1.722c-0.465,0.161-0.822,0.3-1.113,0.413c-0.923,0.356-0.922,0.357-2.44-0.09 c-4.335-1.277-9.851-2.553-14.087-1.053c-5.729,2.03-10.809,8.752-9.239,19.19c0.187,1.238,0.368,2.485,0.551,3.739 c1.312,9.014,2.669,18.334,6.154,26.75l0.117,0.284c0.866,2.11,2.315,5.642,4.839,5.642h0.203l0.187-0.079 c2.312-0.979,3.18-3.201,3.812-4.824c0.427-1.096,0.807-2.211,1.175-3.29c0.927-2.723,1.803-5.293,3.381-7.603 c1.198-1.75,4.43-5.559,8.556-3.101c2.756,1.642,3.62,4.953,4.456,8.156c0.238,0.913,0.485,1.857,0.771,2.739 c1.21,3.729,2.782,7.574,5.268,7.829c1.298,0.134,2.517-0.75,3.588-2.631c1.958-3.431,2.799-7.255,3.611-10.953l0.287-1.3 c0.32-1.43,0.676-2.905,1.039-4.413C52.96,28.639,55.277,19.016,53.065,10.656z M48.973,36.66c-0.366,1.519-0.724,3.005-1.046,4.444 l-0.29,1.309c-0.78,3.552-1.587,7.224-3.394,10.391c-0.608,1.066-1.249,1.655-1.647,1.633c-0.458-0.048-1.724-0.771-3.569-6.457 c-0.269-0.826-0.497-1.701-0.738-2.628c-0.895-3.426-1.908-7.308-5.368-9.369c-3.82-2.272-8.121-0.856-11.229,3.69 c-1.733,2.535-2.694,5.357-3.624,8.086c-0.36,1.06-0.733,2.154-1.145,3.209c-0.641,1.642-1.24,2.961-2.512,3.608 c-1.135-0.283-2.346-3.233-2.815-4.379l-0.12-0.291c-3.391-8.186-4.729-17.38-6.022-26.271c-0.184-1.258-0.365-2.509-0.552-3.749 c-1.009-6.71,1.051-14.571,7.929-17.009c1.12-0.396,2.389-0.557,3.717-0.557c3.058,0,6.428,0.849,9.024,1.611 c6.423,3.649,6.423,5.229,6.397,11.756l-0.003,1.317c0,0.553,0.447,1,1,1s1-0.447,1-1l0.003-1.31 c0.022-5.722,0.014-8.417-4.555-11.695l0.001,0c0.273-0.106,0.607-0.236,1.041-0.387c0.148-0.051,0.294-0.113,0.442-0.178 l0.144-0.063c4.953-2.048,10.395-1.798,14.2,0.648c3.108,1.998,5.2,4.536,5.891,7.147C53.214,19.04,50.96,28.401,48.973,36.66z"
                    style={{
                      fill:
                        getToothColor(tooth) === "grey"
                          ? "#d1d5db"
                          : getToothColor(tooth) === "red"
                            ? "#f87171"
                            : getToothColor(tooth) === "green"
                              ? "#4ade80"
                              : "#93c5fd",
                      stroke:
                        getToothColor(tooth) === "grey"
                          ? "#9ca3af"
                          : getToothColor(tooth) === "red"
                            ? "#b91c1c"
                            : getToothColor(tooth) === "green"
                              ? "#15803d"
                              : "#3b82f6",
                      strokeWidth: "2",
                    }}
                  />
                </svg>
              </div>
            ))}
        </div>

        {/* Lower teeth (32-17) in descending order */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(16, 1fr)", gap: "2px" }}>
          {teeth
            .filter((tooth) => tooth.number >= 17 && tooth.number <= 32)
            .sort((a, b) => b.number - a.number) // Simple descending sort (32-17)
            .map((tooth) => (
              <div
                key={tooth.number}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  cursor: "pointer",
                  padding: "2px",
                  backgroundColor: selectedTooth === tooth.number ? "rgba(59, 130, 246, 0.1)" : "transparent",
                  borderRadius: "4px"
                }}
                onClick={() => handleToothClick(tooth.number)}
              >
                <svg viewBox="0 0 60 40" style={{ width: "18px", height: "30px" }}>
                  <path
                    d="M53.065,10.656c-0.818-3.096-3.213-6.05-6.742-8.317c-4.348-2.796-10.496-3.107-16.05-0.813L30.098,1.6 C30,1.643,29.905,1.686,29.802,1.722c-0.465,0.161-0.822,0.3-1.113,0.413c-0.923,0.356-0.922,0.357-2.44-0.09 c-4.335-1.277-9.851-2.553-14.087-1.053c-5.729,2.03-10.809,8.752-9.239,19.19c0.187,1.238,0.368,2.485,0.551,3.739 c1.312,9.014,2.669,18.334,6.154,26.75l0.117,0.284c0.866,2.11,2.315,5.642,4.839,5.642h0.203l0.187-0.079 c2.312-0.979,3.18-3.201,3.812-4.824c0.427-1.096,0.807-2.211,1.175-3.29c0.927-2.723,1.803-5.293,3.381-7.603 c1.198-1.75,4.43-5.559,8.556-3.101c2.756,1.642,3.62,4.953,4.456,8.156c0.238,0.913,0.485,1.857,0.771,2.739 c1.21,3.729,2.782,7.574,5.268,7.829c1.298,0.134,2.517-0.75,3.588-2.631c1.958-3.431,2.799-7.255,3.611-10.953l0.287-1.3 c0.32-1.43,0.676-2.905,1.039-4.413C52.96,28.639,55.277,19.016,53.065,10.656z M48.973,36.66c-0.366,1.519-0.724,3.005-1.046,4.444 l-0.29,1.309c-0.78,3.552-1.587,7.224-3.394,10.391c-0.608,1.066-1.249,1.655-1.647,1.633c-0.458-0.048-1.724-0.771-3.569-6.457 c-0.269-0.826-0.497-1.701-0.738-2.628c-0.895-3.426-1.908-7.308-5.368-9.369c-3.82-2.272-8.121-0.856-11.229,3.69 c-1.733,2.535-2.694,5.357-3.624,8.086c-0.36,1.06-0.733,2.154-1.145,3.209c-0.641,1.642-1.24,2.961-2.512,3.608 c-1.135-0.283-2.346-3.233-2.815-4.379l-0.12-0.291c-3.391-8.186-4.729-17.38-6.022-26.271c-0.184-1.258-0.365-2.509-0.552-3.749 c-1.009-6.71,1.051-14.571,7.929-17.009c1.12-0.396,2.389-0.557,3.717-0.557c3.058,0,6.428,0.849,9.024,1.611 c6.423,3.649,6.423,5.229,6.397,11.756l-0.003,1.317c0,0.553,0.447,1,1,1s1-0.447,1-1l0.003-1.31 c0.022-5.722,0.014-8.417-4.555-11.695l0.001,0c0.273-0.106,0.607-0.236,1.041-0.387c0.148-0.051,0.294-0.113,0.442-0.178 l0.144-0.063c4.953-2.048,10.395-1.798,14.2,0.648c3.108,1.998,5.2,4.536,5.891,7.147C53.214,19.04,50.96,28.401,48.973,36.66z"
                    style={{
                      fill:
                        getToothColor(tooth) === "grey"
                          ? "#d1d5db"
                          : getToothColor(tooth) === "red"
                            ? "#f87171"
                            : getToothColor(tooth) === "green"
                              ? "#4ade80"
                              : "#93c5fd",
                      stroke:
                        getToothColor(tooth) === "grey"
                          ? "#9ca3af"
                          : getToothColor(tooth) === "red"
                            ? "#b91c1c"
                            : getToothColor(tooth) === "green"
                              ? "#15803d"
                              : "#3b82f6",
                      strokeWidth: "2",
                    }}
                  />
                </svg>
                <div style={{
                  fontSize: "10px",
                  fontWeight: selectedTooth === tooth.number ? "700" : "500",
                  marginTop: "2px"
                }}>
                  {tooth.number}
                </div>
              </div>
            ))}
        </div>

        {/* Legend */}
        <div
          style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "15px", marginTop: "10px" }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
            <div style={{ width: "12px", height: "12px", backgroundColor: "#f87171", borderRadius: "2px" }}></div>
            <span style={{ fontSize: "12px" }}>Anomaly</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
            <div style={{ width: "12px", height: "12px", backgroundColor: "#4ade80", borderRadius: "2px" }}></div>
            <span style={{ fontSize: "12px" }}>Procedure</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
            <div style={{ width: "12px", height: "12px", backgroundColor: "#93c5fd", borderRadius: "2px" }}></div>
            <span style={{ fontSize: "12px" }}>Normal</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
            <div style={{ width: "12px", height: "12px", backgroundColor: "#d1d5db", borderRadius: "2px" }}></div>
            <span style={{ fontSize: "12px" }}>No Annotations</span>
          </div>
        </div>

        {/* Reset filter button (only when a tooth is selected) */}
        {selectedTooth && (
          <div style={{ display: "flex", justifyContent: "center", marginTop: "5px" }}>
            <Button
              color="primary"
              onClick={() => {
                setSelectedTooth(null);
                setHiddenAnnotations([]);
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