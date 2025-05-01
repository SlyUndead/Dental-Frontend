"use client"

import React, { useState, useEffect } from "react"
import { Table, Dropdown, DropdownToggle, DropdownMenu, DropdownItem, FormGroup, Label, Input } from "reactstrap"
import { calculateOverlap, polygonArea } from "../AnnotationTools/path-utils"

const ToothAnnotationTable = ({ annotations, classCategories, selectedTooth, otherSideAnnotations }) => {
  const [toothAnnotations, setToothAnnotations] = useState([])
  const [filteredToothAnnotations, setFilteredToothAnnotations] = useState([])
  const [selectedCategories, setSelectedCategories] = useState(["Procedure", "Anomaly"])
  const [availableCategories, setAvailableCategories] = useState([])
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [balancedAnnotations, setBalancedAnnotations] = useState([])

  // Toggle dropdown
  const toggleDropdown = () => setDropdownOpen((prevState) => !prevState)

  // Handle category selection
  const handleCategoryToggle = (category) => {
    if (selectedCategories.includes(category)) {
      // Remove category if it's already selected
      setSelectedCategories(selectedCategories.filter((cat) => cat !== category))
    } else {
      // Add category if it's not selected
      setSelectedCategories([...selectedCategories, category])
    }
  }

  // Process annotations when they change or when a tooth is selected
  useEffect(() => {
    if (!annotations || annotations.length === 0) {
      setToothAnnotations([])
      setAvailableCategories([])
      return
    }

    // Collect all unique categories from annotations
    const categories = new Set()
    annotations.forEach((anno) => {
      if (isNaN(Number.parseInt(anno.label))) {
        // Skip tooth annotations
        const category = classCategories[anno.label.toLowerCase()]
        if (category && category !== "Dental Chart") {
          categories.add(category)
        }
      }
    })
    setAvailableCategories(Array.from(categories).sort())

    // First, filter out only the tooth annotations (numeric labels)
    const toothAnnots = annotations.filter((anno) => !isNaN(Number.parseInt(anno.label)))

    // If a specific tooth is selected, only show annotations for that tooth
    if (selectedTooth) {
      const selectedToothAnnotation = toothAnnots.find((anno) => Number.parseInt(anno.label) === selectedTooth)

      if (selectedToothAnnotation) {
        // Find all anomalies that overlap with this tooth by at least 80%
        const anomalies = []

        annotations.forEach((anno) => {
          // Skip tooth annotations and annotations without segmentation
          if (!isNaN(Number.parseInt(anno.label)) || !anno.segmentation || !selectedToothAnnotation.segmentation) {
            return
          }

          try {
            // Calculate overlap
            const overlap = calculateOverlap(anno.segmentation, selectedToothAnnotation.segmentation)
            const annoArea = polygonArea(anno.segmentation.map((point) => [point.x, point.y]))
            const overlapPercentage = annoArea > 0 ? overlap / annoArea : 0

            // Only include if overlap is at least 80%
            if (overlapPercentage >= 0.8) {
              anomalies.push({
                toothNumber: selectedTooth,
                name: anno.label,
                category: classCategories[anno.label.toLowerCase()] || "Unknown",
                confidence: anno.confidence,
                overlapPercentage: Math.round(overlapPercentage * 100),
              })
            }
          } catch (error) {
            console.error("Error calculating overlap:", error)
          }
        })

        // Create a single entry for the selected tooth
        setToothAnnotations([
          {
            toothNumber: selectedTooth,
            anomalies: anomalies.length > 0 ? anomalies : [{ name: "No anomalies detected", category: "Info" }],
          },
        ])
      } else {
        setToothAnnotations([])
      }
    } else {
      // Show all teeth with their anomalies
      const teethData = {}

      // Initialize entries for each tooth
      toothAnnots.forEach((toothAnno) => {
        const toothNumber = Number.parseInt(toothAnno.label)
        teethData[toothNumber] = {
          toothNumber,
          anomalies: [],
        }
      })

      // For each tooth, find anomalies with at least 80% overlap
      Object.keys(teethData).forEach((toothNumber) => {
        const toothAnnotation = toothAnnots.find((anno) => Number.parseInt(anno.label) === Number.parseInt(toothNumber))

        if (toothAnnotation) {
          // Find all anomalies that overlap with this tooth by at least 80%
          annotations.forEach((anno) => {
            // Skip tooth annotations and annotations without segmentation
            if (!isNaN(Number.parseInt(anno.label)) || !anno.segmentation || !toothAnnotation.segmentation) {
              return
            }

            try {
              // Calculate overlap
              const overlap = calculateOverlap(anno.segmentation, toothAnnotation.segmentation)
              const annoArea = polygonArea(anno.segmentation.map((point) => [point.x, point.y]))
              const overlapPercentage = annoArea > 0 ? overlap / annoArea : 0

              // Only include if overlap is at least 80%
              if (overlapPercentage >= 0.8) {
                teethData[toothNumber].anomalies.push({
                  name: anno.label,
                  category: classCategories[anno.label.toLowerCase()] || "Unknown",
                  confidence: anno.confidence,
                  overlapPercentage: Math.round(overlapPercentage * 100),
                })
              }
            } catch (error) {
              console.error("Error calculating overlap:", error)
            }
          })

          // If no anomalies found, add a placeholder
          if (teethData[toothNumber].anomalies.length === 0) {
            teethData[toothNumber].anomalies = [{ name: "No anomalies detected", category: "Info" }]
          }
        }
      })

      // Convert to array and sort by tooth number
      const result = Object.values(teethData).sort((a, b) => a.toothNumber - b.toothNumber)
      setToothAnnotations(result)
    }
  }, [annotations, classCategories, selectedTooth])

  // Filter tooth annotations based on selected categories
  useEffect(() => {
    if (!toothAnnotations || toothAnnotations.length === 0) {
      setFilteredToothAnnotations([])
      return
    }

    // Create a deep copy of tooth annotations and filter anomalies by category
    const filtered = toothAnnotations.map((tooth) => {
      // Filter anomalies based on selected categories
      const filteredAnomalies = tooth.anomalies.filter(
        (anomaly) =>
          // Always include "No anomalies detected" entries
          anomaly.name === "No anomalies detected" ||
          // Include anomalies with selected categories
          selectedCategories.includes(anomaly.category),
      )

      // Return tooth with filtered anomalies
      return {
        ...tooth,
        anomalies:
          filteredAnomalies.length > 0 ? filteredAnomalies : [{ name: "No anomalies detected", category: "Info" }],
      }
    })

    setFilteredToothAnnotations(filtered)
  }, [toothAnnotations, selectedCategories])

  // Balance annotations with the other side when in comparison mode
  useEffect(() => {
    if (!otherSideAnnotations || !filteredToothAnnotations.length) {
      setBalancedAnnotations(filteredToothAnnotations)
      return
    }

    // Create a map of tooth numbers to anomaly counts from the other side
    const otherSideToothCounts = {}
    const otherSideTeethNumbers = new Set()

    // Process the other side annotations to get counts
    if (otherSideAnnotations && otherSideAnnotations.length > 0) {
      const toothAnnots = otherSideAnnotations.filter((anno) => !isNaN(Number.parseInt(anno.label)))

      // Create a mapping of tooth numbers to their anomalies
      const otherSideTeethData = {}

      // Initialize entries for each tooth
      toothAnnots.forEach((toothAnno) => {
        const toothNumber = Number.parseInt(toothAnno.label)
        otherSideTeethData[toothNumber] = {
          toothNumber,
          anomalies: [],
        }
        otherSideTeethNumbers.add(toothNumber)
      })

      // For each tooth, find anomalies with at least 80% overlap
      Object.keys(otherSideTeethData).forEach((toothNumber) => {
        const toothAnnotation = toothAnnots.find((anno) => Number.parseInt(anno.label) === Number.parseInt(toothNumber))

        if (toothAnnotation) {
          // Find all anomalies that overlap with this tooth by at least 80%
          otherSideAnnotations.forEach((anno) => {
            // Skip tooth annotations and annotations without segmentation
            if (!isNaN(Number.parseInt(anno.label)) || !anno.segmentation || !toothAnnotation.segmentation) {
              return
            }

            try {
              // Calculate overlap
              const overlap = calculateOverlap(anno.segmentation, toothAnnotation.segmentation)
              const annoArea = polygonArea(anno.segmentation.map((point) => [point.x, point.y]))
              const overlapPercentage = annoArea > 0 ? overlap / annoArea : 0

              // Only include if overlap is at least 80%
              if (overlapPercentage >= 0.8) {
                otherSideTeethData[toothNumber].anomalies.push({
                  name: anno.label,
                  category: classCategories[anno.label.toLowerCase()] || "Unknown",
                  confidence: anno.confidence,
                  overlapPercentage: Math.round(overlapPercentage * 100),
                })
              }
            } catch (error) {
              console.error("Error calculating overlap:", error)
            }
          })

          // Filter anomalies based on selected categories
          const filteredAnomalies = otherSideTeethData[toothNumber].anomalies.filter((anomaly) =>
            selectedCategories.includes(anomaly.category),
          )

          // Store the count of anomalies for this tooth
          otherSideToothCounts[toothNumber] = filteredAnomalies.length > 0 ? filteredAnomalies.length : 1 // At least one row for "No anomalies detected"
        }
      })
    }

    // Get current teeth numbers
    const currentTeethNumbers = new Set(filteredToothAnnotations.map((tooth) => tooth.toothNumber))

    // Balance the current side's annotations based on the other side's counts
    let balanced = [...filteredToothAnnotations]

    // First, add missing teeth that exist in the other side but not in the current side
    otherSideTeethNumbers.forEach((toothNumber) => {
      if (!currentTeethNumbers.has(toothNumber)) {
        // Create an entry for this missing tooth
        const missingToothEntry = {
          toothNumber: toothNumber,
          anomalies: [{ name: "Not detected", category: "Info", confidence: null }],
        }

        // Add blank rows if needed to match the other side's count
        const otherSideCount = otherSideToothCounts[toothNumber] || 0
        if (otherSideCount > 1) {
          const blankRowsNeeded = otherSideCount - 1 // -1 because we already have the "Not detected" entry
          const blankRows = Array(blankRowsNeeded)
            .fill()
            .map(() => ({
              name: "", // Empty name as requested
              category: "Blank",
              confidence: null,
            }))
          missingToothEntry.anomalies = [...missingToothEntry.anomalies, ...blankRows]
        }

        balanced.push(missingToothEntry)
      }
    })

    // Then, balance existing teeth by adding blank rows where needed
    balanced = balanced.map((tooth) => {
      const otherSideCount = otherSideToothCounts[tooth.toothNumber] || 0
      const currentCount = tooth.anomalies.length

      // If this side has fewer anomalies than the other side, add blank rows
      if (currentCount < otherSideCount) {
        const blankRowsNeeded = otherSideCount - currentCount
        const blankRows = Array(blankRowsNeeded)
          .fill()
          .map(() => ({
            name: "", // Empty name as requested
            category: "Blank",
            confidence: null,
          }))

        return {
          ...tooth,
          anomalies: [...tooth.anomalies, ...blankRows],
        }
      }

      return tooth
    })

    // Sort by tooth number for consistent display
    balanced.sort((a, b) => a.toothNumber - b.toothNumber)

    setBalancedAnnotations(balanced)
  }, [filteredToothAnnotations, otherSideAnnotations, selectedCategories, classCategories])

  if (!toothAnnotations || toothAnnotations.length === 0) {
    return (
      <div className="text-center mt-3">
        <p>No tooth annotations available</p>
      </div>
    )
  }

  // Use balanced annotations for rendering if available, otherwise use filtered
  const displayAnnotations = otherSideAnnotations ? balancedAnnotations : filteredToothAnnotations

  return (
    <div>
      {/* Filter UI */}
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div className="d-flex align-items-center">
          <Dropdown isOpen={dropdownOpen} toggle={toggleDropdown} direction="down">
            <DropdownToggle color="light" className="d-flex align-items-center">
              <i className="fa fa-filter mr-1"></i>
              <span>Filter</span>
            </DropdownToggle>
            <DropdownMenu>
              <DropdownItem header>Filter by Type</DropdownItem>
              <DropdownItem divider />
              {availableCategories.map((category) => (
                <DropdownItem key={category} toggle={false} onClick={(e) => e.stopPropagation()}>
                  <FormGroup check className="mb-0 align-items-center flex justify-content-center">
                    <Label check>
                      <Input
                        type="checkbox"
                        checked={selectedCategories.includes(category)}
                        onChange={() => handleCategoryToggle(category)}
                        style={{ marginRight: "5px", justifyContent: "center", alignItems: "center", display: "flex" }}
                      />
                      {category}
                    </Label>
                  </FormGroup>
                </DropdownItem>
              ))}
              <DropdownItem divider />
              <DropdownItem onClick={() => setSelectedCategories(["Procedure", "Anomaly"])}>
                Reset to Default
              </DropdownItem>
            </DropdownMenu>
          </Dropdown>
          <div className="ml-3">
            <small className="text-muted">
              Showing: {selectedCategories.length === 0 ? "None" : selectedCategories.join(", ")}
            </small>
          </div>
        </div>
      </div>

      <Table striped bordered hover responsive className="mt-3">
        <thead className="bg-primary text-white">
          <tr>
            <th style={{ width: "20%" }}>Tooth Number</th>
            <th style={{ width: "50%" }}>Anomaly/Procedure</th>
            <th style={{ width: "15%" }}>Confidence</th>
          </tr>
        </thead>
        <tbody>
          {displayAnnotations.map((tooth, index) => (
            <React.Fragment key={index}>
              {tooth.anomalies.map((anomaly, idx) => (
                <tr key={`${index}-${idx}`}>
                  {idx === 0 ? (
                    <td className="text-center font-weight-bold" rowSpan={tooth.anomalies.length}>
                      {tooth.toothNumber}
                    </td>
                  ) : null}
                  <td>
                    {anomaly.category !== "Blank" ? (
                      <div className="d-flex justify-content-between align-items-center">
                        <span>{anomaly.name}</span>
                        {anomaly.category !== "Info" && <span className="badge bg-info ml-2">{anomaly.category}</span>}
                      </div>
                    ) : (
                      <div className="text-muted">-</div>
                    )}
                  </td>
                  <td className="text-center">
                    {anomaly.confidence ? (
                      <span>{anomaly.confidence.toFixed(2).toString().slice(1)}</span>
                    ) : anomaly.category === "Info" || anomaly.category === "Blank" ? (
                      "-"
                    ) : (
                      "0.80"
                    )}
                  </td>
                </tr>
              ))}
            </React.Fragment>
          ))}
        </tbody>
      </Table>
    </div>
  )
}

export default ToothAnnotationTable;
