"use client"

import React, { useState, useEffect, useMemo, useCallback } from "react"
import { Table, Dropdown, DropdownToggle, DropdownMenu, DropdownItem, FormGroup, Label, Input } from "reactstrap"
import { calculateOverlap, polygonArea } from "../AnnotationTools/path-utils"
import { useNavigate } from "react-router-dom"

// Add a style tag for the pink badge if it doesn't exist in your CSS
const styleElement = document.createElement("style")
styleElement.textContent = `
  .bg-pink {
    background-color: #ff69b4 !important;
    color: white !important;
  }
`
document.head.appendChild(styleElement)

const ToothAnnotationTable = ({ annotations, classCategories, selectedTooth, otherSideAnnotations, visitId, patientVisits, confidenceLevels = {},}) => {
  const [toothAnnotations, setToothAnnotations] = useState([])
  const [filteredToothAnnotations, setFilteredToothAnnotations] = useState([])
  const [selectedCategories, setSelectedCategories] = useState(["Procedure", "Anomaly"])
  const [availableCategories, setAvailableCategories] = useState([])
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [balancedAnnotations, setBalancedAnnotations] = useState([])
  const navigate = useNavigate()

  // Toggle dropdown - optimized with useCallback
  const toggleDropdown = useCallback(() => {
    setDropdownOpen((prevState) => !prevState);
  }, []);

  // Handle category selection - optimized with useCallback
  const handleCategoryToggle = useCallback((category) => {
    setSelectedCategories(prevCategories => {
      if (prevCategories.includes(category)) {
        return prevCategories.filter((cat) => cat !== category);
      } else {
        return [...prevCategories, category];
      }
    });
  }, []);

  // Handle annotation click to open AnnotationPage in a new tab - optimized with useCallback
  const handleAnnotationClick = useCallback((anomaly) => {
    console.time('handleAnnotationClick'); // Performance measurement

    // Create a new window/tab
    const newWindow = window.open("", "_blank");

    // Batch sessionStorage operations
    const sessionData = {};

    // Set first/last flags
    sessionData.last = anomaly.visitIndex === 0;
    sessionData.first = anomaly.visitIndex === patientVisits.length - 1;

    // Set image information
    if (anomaly.imageName) {
      sessionData.selectedImageName = anomaly.imageName;
    } else if (anomaly.imageNumber) {
      sessionData.selectedImageIndex = (anomaly.imageNumber - 1).toString();
    }

    // Set visit ID
    const effectiveVisitId = anomaly.visitId || visitId;
    if (effectiveVisitId) {
      sessionData.visitId = effectiveVisitId;

      // Find the visit in patientVisits and set the date_of_xray
      if (patientVisits && patientVisits.length > 0) {
        const visit = patientVisits.find((v) => v._id === effectiveVisitId);
        if (visit && visit.date_of_xray) {
          sessionData.xrayDate = visit.date_of_xray;
        }
      }
    }

    // Apply all sessionStorage updates at once
    Object.entries(sessionData).forEach(([key, value]) => {
      sessionStorage.setItem(key, value.toString());
    });

    // Set the URL for the new tab and navigate
    if (newWindow) {
      newWindow.location.href = `${window.location.origin}/annotationPage`;
    } else {
      // Fallback to regular navigation if popup is blocked
      navigate("/annotationPage");
    }

    console.timeEnd('handleAnnotationClick');
  }, [patientVisits, visitId, navigate]);

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
      // Special case for "Unassigned" selection
      if (selectedTooth === "Unassigned") {
        // Find all anomalies that don't have an associatedTooth or have associatedTooth set to null or "Unassigned"
        const unassignedAnomalies = []

        annotations.forEach((anno) => {
          // Skip tooth annotations
          if (!isNaN(Number.parseInt(anno.label))) {
            return
          }

          // Check if this annotation has an associatedTooth field that's null or "Unassigned"
          // Get the image group from the annotation's image
          const imageGroup = anno.image?.annotations?.annotations?.group || 'pano';
          const confidenceField = `${imageGroup}_confidence`;
          const confidenceThreshold = confidenceLevels[anno.label.toLowerCase()] ?
            confidenceLevels[anno.label.toLowerCase()][confidenceField] || 0.001 :
            0.001;

          if (
            (anno.associatedTooth === null || anno.associatedTooth === "Unassigned") &&
            anno.confidence >= confidenceThreshold
          ) {
            unassignedAnomalies.push({
              name: anno.label,
              category: classCategories[anno.label.toLowerCase()] || "Unknown",
              confidence: anno.confidence,
              imageNumber: anno.imageNumber,
              imageName: anno.imageName,
              visitId: anno.visitId,
            })
            return
          }

          // If it has a valid associatedTooth, skip it (it's already assigned)
          if (anno.associatedTooth !== undefined && anno.associatedTooth !== null) {
            return
          }

          // For annotations without associatedTooth field, check if they overlap with any tooth
          let isAssigned = false

          toothAnnots.forEach((toothAnno) => {
            if (!anno.segmentation || !toothAnno.segmentation) {
              return
            }

            try {
              const overlap = calculateOverlap(anno.segmentation, toothAnno.segmentation)
              const annoArea = polygonArea(anno.segmentation.map((point) => [point.x, point.y]))
              const overlapPercentage = annoArea > 0 ? overlap / annoArea : 0

              if (overlapPercentage >= 0.8) {
                isAssigned = true
              }
            } catch (error) {
              console.error("Error calculating overlap:", error)
            }
          })

          // Get the image group from the annotation's image
          const imageGroup2 = anno.image?.annotations?.annotations?.group || 'pano';
          const confidenceField2 = `${imageGroup2}_confidence`;
          const confidenceThreshold2 = confidenceLevels[anno.label.toLowerCase()] ?
            confidenceLevels[anno.label.toLowerCase()][confidenceField2] || 0.001 :
            0.001;

          // If not assigned to any tooth, add to unassigned
          if (!isAssigned && anno.confidence >= confidenceThreshold2) {
            unassignedAnomalies.push({
              name: anno.label,
              category: classCategories[anno.label.toLowerCase()] || "Unknown",
              confidence: anno.confidence,
              imageNumber: anno.imageNumber,
              imageName: anno.imageName,
              visitId: anno.visitId,
            })
          }
        })

        // Create an entry for unassigned anomalies
        setToothAnnotations([
          {
            toothNumber: "Unassigned",
            anomalies:
              unassignedAnomalies.length > 0
                ? unassignedAnomalies
                : [{ name: "No anomalies detected", category: "Info" }],
            isUnassigned: true,
          },
        ])
      } else {
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
              // First check if the annotation has an associatedTooth field
              if (anno.associatedTooth !== undefined && anno.associatedTooth !== null) {
                const associatedToothNumber = Number.parseInt(anno.associatedTooth)
                if (
                  associatedToothNumber === selectedTooth &&
                  (() => {
                    // Get the image group from the annotation's image
                    const imageGroup = anno.image?.annotations?.annotations?.group || 'pano';
                    const confidenceField = `${imageGroup}_confidence`;
                    const confidenceThreshold = confidenceLevels[anno.label.toLowerCase()] ?
                      confidenceLevels[anno.label.toLowerCase()][confidenceField] || 0.001 :
                      0.001;
                    return anno.confidence >= confidenceThreshold;
                  })()
                ) {
                  anomalies.push({
                    toothNumber: selectedTooth,
                    name: anno.label,
                    category: classCategories[anno.label.toLowerCase()] || "Unknown",
                    confidence: anno.confidence,
                    imageNumber: anno.imageNumber,
                    imageName: anno.imageName,
                    visitId: anno.visitId,
                  })
                }
              }
              // If no associatedTooth field or it's null, we'll handle it differently
              else {
                // We'll collect all annotations without associatedTooth and find the one with maximum overlap
                // This is handled in a separate loop below
              }
            } catch (error) {
              console.error("Error calculating overlap:", error)
            }
          })

          // Process annotations without associatedTooth field using maximum overlap approach
          annotations.forEach((anno) => {
            // Skip tooth annotations (numeric labels) and annotations with associatedTooth
            if (
              !isNaN(Number.parseInt(anno.label)) ||
              (anno.associatedTooth !== undefined && anno.associatedTooth !== null) ||
              !anno.segmentation ||
              !selectedToothAnnotation.segmentation
            ) {
              return
            }

            // Special handling for bone loss annotations
            const isBoneLoss = anno.label.toLowerCase().includes("bone loss")

            if (isBoneLoss) {
              // For bone loss, we need to find all teeth that overlap with it
              // But since we're already in the context of a selected tooth,
              // we just need to check if this bone loss annotation overlaps with the selected tooth
              try {
                const overlap = calculateOverlap(anno.segmentation, selectedToothAnnotation.segmentation)
                const annoArea = polygonArea(anno.segmentation.map((point) => [point.x, point.y]))
                const overlapPercentage = annoArea > 0 ? overlap / annoArea : 0

                // For bone loss, include any tooth with even minimal overlap (2% or more)
                if (overlapPercentage > 0.02) {
                  // We need to find all teeth that overlap with this bone loss annotation
                  // to create a proper range
                  const overlappingTeeth = []

                  // First add the selected tooth
                  overlappingTeeth.push(selectedTooth)

                  // Then check other teeth
                  toothAnnots.forEach((toothAnno) => {
                    const toothNumber = Number.parseInt(toothAnno.label)
                    if (
                      toothNumber !== selectedTooth && // Skip the selected tooth (already added)
                      !isNaN(toothNumber) &&
                      toothNumber >= 1 &&
                      toothNumber <= 32 &&
                      toothAnno.segmentation
                    ) {
                      try {
                        const otherOverlap = calculateOverlap(anno.segmentation, toothAnno.segmentation)
                        const otherOverlapPercentage = annoArea > 0 ? otherOverlap / annoArea : 0

                        if (otherOverlapPercentage > 0.0) {
                          overlappingTeeth.push(toothNumber)
                        }
                      } catch (error) {
                        console.error("Error calculating overlap:", error)
                      }
                    }
                  })

                  // Sort teeth by number
                  overlappingTeeth.sort((a, b) => a - b)

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

                  // Find the range that contains the selected tooth
                  const selectedToothRange = ranges.find((range) => range.includes(selectedTooth))

                  if (selectedToothRange) {
                    // Format the range as "X-Y" if it's a range, or just "X" if it's a single tooth
                    const rangeText =
                      selectedToothRange.length > 1
                        ? `${selectedToothRange[0]}-${selectedToothRange[selectedToothRange.length - 1]}`
                        : `${selectedToothRange[0]}`

                    // Get the image group from the annotation's image
                    const imageGroup = anno.image?.annotations?.annotations?.group || 'pano';
                    const confidenceField = `${imageGroup}_confidence`;
                    const confidenceThreshold = confidenceLevels[anno.label.toLowerCase()] ?
                      confidenceLevels[anno.label.toLowerCase()][confidenceField] || 0.001 :
                      0.001;

                    if (anno.confidence >= confidenceThreshold) {
                      anomalies.push({
                        toothNumber: rangeText,
                        name: `${anno.label}`,
                        category: classCategories[anno.label.toLowerCase()] || "Unknown",
                        confidence: anno.confidence,
                        overlapPercentage: Math.round(overlapPercentage * 100),
                        imageNumber: anno.imageNumber,
                        imageName: anno.imageName,
                        visitId: anno.visitId,
                        isRange: true,
                        teethRange: rangeText,
                      })
                    }
                  }
                }
              } catch (error) {
                console.error("Error calculating overlap:", error)
              }
            } else {
              // For non-bone loss annotations, use the regular approach
              try {
                // Calculate overlap with the selected tooth
                const overlap = calculateOverlap(anno.segmentation, selectedToothAnnotation.segmentation)
                const annoArea = polygonArea(anno.segmentation.map((point) => [point.x, point.y]))
                const overlapPercentage = annoArea > 0 ? overlap / annoArea : 0

                // Only include if overlap is at least 80%
                if (overlapPercentage >= 0.8) {
                  // Check if this annotation is already in the anomalies array
                  const isDuplicate = anomalies.some(
                    (a) =>
                      a.name === anno.label && a.confidence === anno.confidence && a.imageNumber === anno.imageNumber,
                  )

                  // Get the image group from the annotation's image
                  const imageGroup = anno.image?.annotations?.annotations?.group || 'pano';
                  const confidenceField = `${imageGroup}_confidence`;
                  const confidenceThreshold = confidenceLevels[anno.label.toLowerCase()] ?
                    confidenceLevels[anno.label.toLowerCase()][confidenceField] || 0.001 :
                    0.001;

                  if (!isDuplicate && anno.confidence >= confidenceThreshold) {
                    anomalies.push({
                      toothNumber: selectedTooth,
                      name: anno.label,
                      category: classCategories[anno.label.toLowerCase()] || "Unknown",
                      confidence: anno.confidence,
                      overlapPercentage: Math.round(overlapPercentage * 100),
                      imageNumber: anno.imageNumber,
                      imageName: anno.imageName,
                      visitId: anno.visitId,
                    })
                  }
                }
              } catch (error) {
                console.error("Error calculating overlap:", error)
              }
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

            // First check if the annotation has an associatedTooth field
            if (anno.associatedTooth !== undefined && anno.associatedTooth !== null) {
              const associatedToothNumber = Number.parseInt(anno.associatedTooth)
              // Get the image group from the annotation's image
              const imageGroup = anno.image?.annotations?.annotations?.group || 'pano';
              const confidenceField = `${imageGroup}_confidence`;
              const confidenceThreshold = confidenceLevels[anno.label.toLowerCase()] ?
                confidenceLevels[anno.label.toLowerCase()][confidenceField] || 0.001 :
                0.001;

              if (
                associatedToothNumber === Number.parseInt(toothNumber) &&
                anno.confidence >= confidenceThreshold
              ) {
                teethData[toothNumber].anomalies.push({
                  name: anno.label,
                  category: classCategories[anno.label.toLowerCase()] || "Unknown",
                  confidence: anno.confidence,
                  imageNumber: anno.imageNumber,
                  imageName: anno.imageName,
                  visitId: anno.visitId,
                })
              }
            }
            // If no associatedTooth field or it's null, we'll handle it later
            // We'll collect all annotations without associatedTooth and process them after
            else {
              // Do nothing here, we'll process these annotations later
            }
          })

          // If no anomalies found, add a placeholder
          if (teethData[toothNumber].anomalies.length === 0) {
            teethData[toothNumber].anomalies = [{ name: "No anomalies detected", category: "Info" }]
          }
        }
      })

      // Process annotations without associatedTooth field using maximum overlap approach
      annotations.forEach((anno) => {
        // Skip tooth annotations (numeric labels) and annotations with associatedTooth
        if (
          !isNaN(Number.parseInt(anno.label)) ||
          (anno.associatedTooth !== undefined && anno.associatedTooth !== null)
        ) {
          return
        }

        // Special handling for bone loss annotations
        const isBoneLoss = anno.label.toLowerCase().includes("bone loss")

        if (isBoneLoss) {
          // For bone loss, find all teeth that overlap with the annotation
          const overlappingTeeth = []

          toothAnnots.forEach((toothAnno) => {
            const toothNumber = Number.parseInt(toothAnno.label)
            if (
              !isNaN(toothNumber) &&
              toothNumber >= 1 &&
              toothNumber <= 32 &&
              anno.segmentation &&
              toothAnno.segmentation
            ) {
              try {
                const overlap = calculateOverlap(anno.segmentation, toothAnno.segmentation)
                const annoArea = polygonArea(anno.segmentation.map((point) => [point.x, point.y]))
                const overlapPercentage = annoArea > 0 ? overlap / annoArea : 0

                // For bone loss, include any tooth with even minimal overlap (2% or more)
                if (overlapPercentage > 0.02) {
                  // Use a consistent threshold for bone loss
                  overlappingTeeth.push({
                    toothNumber,
                    overlap,
                    overlapPercentage,
                  })
                }
              } catch (error) {
                console.error("Error calculating overlap:", error)
              }
            }
          })

          // Sort teeth by number to create a range
          overlappingTeeth.sort((a, b) => a.toothNumber - b.toothNumber)

          if (overlappingTeeth.length > 0) {
            // Find continuous ranges of teeth
            const ranges = []
            let currentRange = [overlappingTeeth[0].toothNumber]

            for (let i = 1; i < overlappingTeeth.length; i++) {
              const prevTooth = overlappingTeeth[i - 1].toothNumber
              const currentTooth = overlappingTeeth[i].toothNumber

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

            // Create a modified name with the tooth range
            ranges.forEach((range) => {
              // Format the range as "X-Y" if it's a range, or just "X" if it's a single tooth
              const rangeText = range.length > 1 ? `${range[0]}-${range[range.length - 1]}` : `${range[0]}`
              if (!teethData[rangeText]) {
                teethData[rangeText] = {
                  toothNumber: rangeText,
                  anomalies: [],
                }
              }
              // Add to the first tooth in the range
              // Get the image group from the annotation's image
              const imageGroup = anno.image?.annotations?.annotations?.group || 'pano';
              const confidenceField = `${imageGroup}_confidence`;
              const confidenceThreshold = confidenceLevels[anno.label.toLowerCase()] ?
                confidenceLevels[anno.label.toLowerCase()][confidenceField] || 0.001 :
                0.001;

              if (anno.confidence >= confidenceThreshold) {
                teethData[rangeText].anomalies.push({
                  name: `${anno.label}`,
                  category: classCategories[anno.label.toLowerCase()] || "Unknown",
                  confidence: anno.confidence,
                  imageNumber: anno.imageNumber,
                  imageName: anno.imageName,
                  visitId: anno.visitId,
                  isRange: true,
                  teethRange: rangeText,
                })
              }
            })
          }
        } else {
          // For non-bone loss annotations, use the maximum overlap approach
          let maxOverlap = 0
          let maxOverlapToothNumber = null
          let maxOverlapPercentage = 0

          // Check overlap with each tooth
          toothAnnots.forEach((toothAnno) => {
            const toothNumber = Number.parseInt(toothAnno.label)
            if (
              !isNaN(toothNumber) &&
              toothNumber >= 1 &&
              toothNumber <= 32 &&
              anno.segmentation &&
              toothAnno.segmentation
            ) {
              try {
                const overlap = calculateOverlap(anno.segmentation, toothAnno.segmentation)
                const annoArea = polygonArea(anno.segmentation.map((point) => [point.x, point.y]))
                const overlapPercentage = annoArea > 0 ? overlap / annoArea : 0

                // If this overlap is greater than our current maximum and meets the threshold
                if (overlapPercentage > 0.8 && overlap > maxOverlap) {
                  maxOverlap = overlap
                  maxOverlapToothNumber = toothNumber
                  maxOverlapPercentage = overlapPercentage
                }
              } catch (error) {
                console.error("Error calculating overlap:", error)
              }
            }
          })

          // If we found a tooth with sufficient overlap, add the annotation to that tooth
          // Get the image group from the annotation's image
          const imageGroup = anno.image?.annotations?.annotations?.group || 'pano';
          const confidenceField = `${imageGroup}_confidence`;
          const confidenceThreshold = confidenceLevels[anno.label.toLowerCase()] ?
            confidenceLevels[anno.label.toLowerCase()][confidenceField] || 0.001 :
            0.001;

          if (
            maxOverlapToothNumber !== null &&
            maxOverlapToothNumber in teethData &&
            anno.confidence >= confidenceThreshold
          ) {
            teethData[maxOverlapToothNumber].anomalies.push({
              name: anno.label,
              category: classCategories[anno.label.toLowerCase()] || "Unknown",
              confidence: anno.confidence,
              overlapPercentage: Math.round(maxOverlapPercentage * 100),
              imageNumber: anno.imageNumber,
              imageName: anno.imageName,
              visitId: anno.visitId,
            })
          }
        }
      })

      // Find unassigned anomalies (those that don't have an associatedTooth or don't overlap with any tooth by at least 80%)
      const unassignedAnomalies = []
      annotations.forEach((anno) => {
        // Skip tooth annotations (numeric labels)
        if (!isNaN(Number.parseInt(anno.label))) {
          return
        }

        // Check if this annotation has an associatedTooth field that's null or "Unassigned"
        if (anno.associatedTooth === null || anno.associatedTooth === "Unassigned") {
          // Only add if it meets the confidence threshold
          // Get the image group from the annotation's image
          const imageGroup = anno.image?.annotations?.annotations?.group || 'pano';
          const confidenceField = `${imageGroup}_confidence`;
          const confidenceThreshold = confidenceLevels[anno.label.toLowerCase()] ?
            confidenceLevels[anno.label.toLowerCase()][confidenceField] || 0.001 :
            0.001;

          if (anno.confidence >= confidenceThreshold) {
            unassignedAnomalies.push({
              name: anno.label,
              category: classCategories[anno.label.toLowerCase()] || "Unknown",
              confidence: anno.confidence,
              imageNumber: anno.imageNumber,
              imageName: anno.imageName,
              visitId: anno.visitId,
            })
          }
          return
        }

        // If it has a valid associatedTooth, skip it (it's already assigned)
        if (anno.associatedTooth !== undefined && anno.associatedTooth !== null) {
          return
        }

        // For annotations without associatedTooth field, check if they've been assigned to any tooth
        let isAssigned = false
        Object.keys(teethData).forEach((toothNumber) => {
          const anomalies = teethData[toothNumber].anomalies
          if (
            anomalies.some(
              (a) => a.name === anno.label && a.confidence === anno.confidence && a.imageNumber === anno.imageNumber,
            )
          ) {
            isAssigned = true
          }
        })

        // Get the image group from the annotation's image
        const imageGroup3 = anno.image?.annotations?.annotations?.group || 'pano';
        const confidenceField3 = `${imageGroup3}_confidence`;
        const confidenceThreshold3 = confidenceLevels[anno.label.toLowerCase()] ?
          confidenceLevels[anno.label.toLowerCase()][confidenceField3] || 0.001 :
          0.001;

        // If not assigned to any tooth, add to unassigned
        if (!isAssigned && anno.confidence >= confidenceThreshold3) {
          unassignedAnomalies.push({
            name: anno.label,
            category: classCategories[anno.label.toLowerCase()] || "Unknown",
            confidence: anno.confidence,
            imageNumber: anno.imageNumber,
            imageName: anno.imageName,
            visitId: anno.visitId,
          })
        }
      })

      // If there are unassigned anomalies, add them as a special "Unassigned" tooth
      if (unassignedAnomalies.length > 0) {
        teethData["unassigned"] = {
          toothNumber: "Unassigned",
          anomalies: unassignedAnomalies,
          isUnassigned: true, // Flag to identify this as the unassigned category
        }
      }

      // Convert to array and sort by tooth number, with "Unassigned" at the end
      const result = Object.values(teethData).sort((a, b) => {
        // Always put "Unassigned" at the end
        if (a.toothNumber === "Unassigned" || a.isUnassigned) return 1
        if (b.toothNumber === "Unassigned" || b.isUnassigned) return -1
        // Otherwise sort by tooth number
        return a.toothNumber - b.toothNumber
      })

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

    // Create map of current side teeth with their anomalies
    const currentSideMap = {}
    filteredToothAnnotations.forEach(tooth => {
      currentSideMap[tooth.toothNumber] = tooth
    })

    // Process other side annotations to get comparable structure
    const otherSideMap = {}

    // First handle tooth annotations (numeric labels)
    const otherSideToothAnnots = otherSideAnnotations.filter(anno => !isNaN(Number.parseInt(anno.label)))

    // Initialize entries for each tooth on the other side
    otherSideToothAnnots.forEach(toothAnno => {
      const toothNumber = Number.parseInt(toothAnno.label)
      otherSideMap[toothNumber] = {
        toothNumber,
        anomalies: [],
        isUnassigned: false
      }
    })

    // Add "Unassigned" category
    otherSideMap["Unassigned"] = {
      toothNumber: "Unassigned",
      anomalies: [],
      isUnassigned: true
    }

    // Process anomalies on the other side
    // First, filter out anomalies that don't meet confidence threshold
    const filteredOtherSideAnnotations = otherSideAnnotations.filter(anno => {
      // Keep tooth annotations
      if (!isNaN(Number.parseInt(anno.label))) {
        return true
      }
      // Filter out anomalies that don't meet confidence threshold
      const imageGroup = anno.image?.annotations?.annotations?.group || 'pano';
      const confidenceField = `${imageGroup}_confidence`;
      const confidenceThreshold = confidenceLevels[anno.label.toLowerCase()] ?
        confidenceLevels[anno.label.toLowerCase()][confidenceField] || 0.001 :
        0.001;
      return anno.confidence >= confidenceThreshold
    })

    // Process anomalies on the other side
    filteredOtherSideAnnotations.forEach(anno => {
      // Skip tooth annotations
      if (!isNaN(Number.parseInt(anno.label))) {
        return
      }

      // Skip categories not selected by user
      const category = classCategories[anno.label.toLowerCase()] || "Unknown"
      if (!selectedCategories.includes(category)) {
        return
      }

      const anomalyData = {
        name: anno.label,
        category,
        confidence: anno.confidence,
        imageNumber: anno.imageNumber,
        imageName: anno.imageName,
        visitId: anno.visitId
      }

      // If it has an associatedTooth, add it there
      if (anno.associatedTooth !== undefined && anno.associatedTooth !== null) {
        if (anno.associatedTooth === "Unassigned") {
          // For unassigned, we've already filtered by confidence threshold earlier
          otherSideMap["Unassigned"].anomalies.push(anomalyData)
        } else {
          const toothNumber = Number.parseInt(anno.associatedTooth)
          if (otherSideMap[toothNumber]) {
            otherSideMap[toothNumber].anomalies.push(anomalyData)
          }
        }
      }
      // For bone loss annotations, handle specially
      else if (anno.label.toLowerCase().includes("bone loss") && anno.segmentation) {
        // For bone loss, find all teeth that overlap with the annotation
        const overlappingTeeth = []

        otherSideToothAnnots.forEach((toothAnno) => {
          const toothNumber = Number.parseInt(toothAnno.label)
          if (
            !isNaN(toothNumber) &&
            toothNumber >= 1 &&
            toothNumber <= 32 &&
            anno.segmentation &&
            toothAnno.segmentation
          ) {
            try {
              const overlap = calculateOverlap(anno.segmentation, toothAnno.segmentation)
              const annoArea = polygonArea(anno.segmentation.map((point) => [point.x, point.y]))
              const overlapPercentage = annoArea > 0 ? overlap / annoArea : 0

              // For bone loss, include any tooth with even minimal overlap (2% or more)
              if (overlapPercentage > 0.02) {
                overlappingTeeth.push({
                  toothNumber,
                  overlap,
                  overlapPercentage,
                })
              }
            } catch (error) {
              console.error("Error calculating overlap:", error)
            }
          }
        })

        // Sort teeth by number to create a range
        overlappingTeeth.sort((a, b) => a.toothNumber - b.toothNumber)

        if (overlappingTeeth.length > 0) {
          // Find continuous ranges of teeth
          const ranges = []
          let currentRange = [overlappingTeeth[0].toothNumber]

          for (let i = 1; i < overlappingTeeth.length; i++) {
            const prevTooth = overlappingTeeth[i - 1].toothNumber
            const currentTooth = overlappingTeeth[i].toothNumber

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

          // Create a modified name with the tooth range
          ranges.forEach((range) => {
            // Format the range as "X-Y" if it's a range, or just "X" if it's a single tooth
            const rangeText = range.length > 1 ? `${range[0]}-${range[range.length - 1]}` : `${range[0]}`
            if (!otherSideMap[rangeText]) {
              otherSideMap[rangeText] = {
                toothNumber: rangeText,
                anomalies: [],
              }
            }

            otherSideMap[rangeText].anomalies.push({
              name: `${anno.label}`,
              category: classCategories[anno.label.toLowerCase()] || "Unknown",
              confidence: anno.confidence,
              imageNumber: anno.imageNumber,
              imageName: anno.imageName,
              visitId: anno.visitId,
              isRange: true,
              teethRange: rangeText,
            })
          })
        }
      }
      // For other annotations, check overlap with teeth
      else if (anno.segmentation) {
        let maxOverlap = 0
        let maxOverlapToothNumber = null
        let maxOverlapPercentage = 0

        // Check overlap with each tooth
        otherSideToothAnnots.forEach((toothAnno) => {
          const toothNumber = Number.parseInt(toothAnno.label)
          if (
            !isNaN(toothNumber) &&
            toothNumber >= 1 &&
            toothNumber <= 32 &&
            anno.segmentation &&
            toothAnno.segmentation
          ) {
            try {
              const overlap = calculateOverlap(anno.segmentation, toothAnno.segmentation)
              const annoArea = polygonArea(anno.segmentation.map((point) => [point.x, point.y]))
              const overlapPercentage = annoArea > 0 ? overlap / annoArea : 0

              // If this overlap is greater than our current maximum and meets the threshold
              if (overlapPercentage > 0.8 && overlap > maxOverlap) {
                maxOverlap = overlap
                maxOverlapToothNumber = toothNumber
                maxOverlapPercentage = overlapPercentage
              }
            } catch (error) {
              console.error("Error calculating overlap:", error)
            }
          }
        })

        // If we found a tooth with sufficient overlap, add the annotation to that tooth
        if (maxOverlapToothNumber !== null && maxOverlapToothNumber in otherSideMap) {
          otherSideMap[maxOverlapToothNumber].anomalies.push({
            name: anno.label,
            category: classCategories[anno.label.toLowerCase()] || "Unknown",
            confidence: anno.confidence,
            overlapPercentage: Math.round(maxOverlapPercentage * 100),
            imageNumber: anno.imageNumber,
            imageName: anno.imageName,
            visitId: anno.visitId,
          })
        } else {
          // If no sufficient overlap found, add to unassigned
          // We've already filtered by confidence threshold earlier
          otherSideMap["Unassigned"].anomalies.push(anomalyData)
        }
      }
      // If no segmentation data, add to unassigned
      // We've already filtered by confidence threshold earlier
      else {
        otherSideMap["Unassigned"].anomalies.push(anomalyData)
      }
    })

    // Add "No anomalies detected" placeholders for teeth with no anomalies
    Object.keys(otherSideMap).forEach(toothKey => {
      if (otherSideMap[toothKey].anomalies.length === 0) {
        otherSideMap[toothKey].anomalies = [
          { name: "No anomalies detected", category: "Info" }
        ]
      }
    })

    // Combine both sides, ensuring that each tooth has the same number of rows
    const allTeethNumbers = new Set([
      ...Object.keys(currentSideMap),
      ...Object.keys(otherSideMap)
    ])

    const balanced = []
    // Remove console.log to avoid cluttering the console
    allTeethNumbers.forEach(toothKey => {
      const currentSideTooth = currentSideMap[toothKey]
      const otherSideTooth = otherSideMap[toothKey]

      // If tooth exists on current side but not other side
      if (currentSideTooth && !otherSideTooth) {
        balanced.push(currentSideTooth)
      }
      // If tooth exists on other side but not current side
      else if (!currentSideTooth && otherSideTooth) {
        // Create an array with "Not detected" as the first row, and blank rows to match the other side's count
        const otherSideAnomalyCount = otherSideTooth.anomalies.length;
        const anomalies = [{ name: "Not detected", category: "Info" }];

        // Add blank rows if needed to match the other side's count
        if (otherSideAnomalyCount > 1) {
          const blankRows = Array(otherSideAnomalyCount - 1).fill().map(() => ({
            name: "",
            category: "Blank",
            confidence: null
          }));
          anomalies.push(...blankRows);
        }

        balanced.push({
          toothNumber: otherSideTooth.toothNumber,
          isUnassigned: otherSideTooth.isUnassigned,
          isRange: otherSideTooth.isRange,
          teethRange: otherSideTooth.teethRange,
          anomalies: anomalies
        })
      }
      // If tooth exists on both sides
      else if (currentSideTooth && otherSideTooth) {
        const currentAnomalyCount = currentSideTooth.anomalies.length
        const otherAnomalyCount = otherSideTooth.anomalies.length

        // Determine max number of rows needed
        const maxCount = Math.max(currentAnomalyCount, otherAnomalyCount)

        // If current side needs padding
        if (currentAnomalyCount < maxCount) {
          const blankRows = Array(maxCount - currentAnomalyCount).fill().map(() => ({
            name: "",
            category: "Blank",
            confidence: null
          }))

          // Check if any anomalies have isRange and teethRange properties
          const hasRangeAnomalies = currentSideTooth.anomalies.some(a => a.isRange && a.teethRange)

          balanced.push({
            ...currentSideTooth,
            // If this is a range, make sure to preserve the range properties
            isRange: currentSideTooth.isRange || hasRangeAnomalies,
            teethRange: currentSideTooth.teethRange ||
                       (hasRangeAnomalies ? currentSideTooth.anomalies.find(a => a.isRange && a.teethRange).teethRange : undefined),
            anomalies: [...currentSideTooth.anomalies, ...blankRows]
          })
        } else {
          balanced.push(currentSideTooth)
        }
      }
    })

    // Sort teeth appropriately
    balanced.sort((a, b) => {
      // Handle special cases
      if (a.toothNumber === "Unassigned" || a.isUnassigned) return 1
      if (b.toothNumber === "Unassigned" || b.isUnassigned) return -1

      // Handle tooth ranges
      const aIsRange = typeof a.toothNumber === "string" && a.toothNumber.includes("-")
      const bIsRange = typeof b.toothNumber === "string" && b.toothNumber.includes("-")

      if (aIsRange && !bIsRange) return 1 // Ranges after individual teeth
      if (!aIsRange && bIsRange) return -1 // Individual teeth before ranges

      if (aIsRange && bIsRange) {
        // Sort ranges by their first number
        const aStart = Number.parseInt(a.toothNumber.split("-")[0])
        const bStart = Number.parseInt(b.toothNumber.split("-")[0])
        return aStart - bStart
      }

      // Regular tooth number sorting
      const aNum = typeof a.toothNumber === "string" ? Number.parseInt(a.toothNumber) : a.toothNumber
      const bNum = typeof b.toothNumber === "string" ? Number.parseInt(b.toothNumber) : b.toothNumber

      return isNaN(aNum) ? 1 : isNaN(bNum) ? -1 : aNum - bNum
    })

    setBalancedAnnotations(balanced)
  }, [filteredToothAnnotations, otherSideAnnotations, selectedCategories, classCategories, confidenceLevels])

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
                <DropdownItem key={category} toggle={false}>
                  <FormGroup check className="mb-0 align-items-center flex justify-content-center">
                    <Label check className="w-100">
                      <Input
                        type="checkbox"
                        checked={selectedCategories.includes(category)}
                        onClick={() => handleCategoryToggle(category)}
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
          {displayAnnotations
            .filter(
              (tooth) =>
                !selectedTooth ||
                tooth.toothNumber === selectedTooth ||
                (selectedTooth === "Unassigned" && (tooth.toothNumber === "Unassigned" || tooth.isUnassigned)),
            )
            .map((tooth, index) => (
              <React.Fragment key={index}>
                {tooth.anomalies.map((anomaly, idx) => (
                  <tr
                    key={`${index}-${idx}`}
                    onClick={() =>
                      anomaly.category !== "Blank" &&
                        anomaly.name !== "No anomalies detected" &&
                        anomaly.name !== "Not detected"
                        ? handleAnnotationClick(anomaly, (anomaly.isRange && anomaly.teethRange) ||
                                                        (tooth.isRange && tooth.teethRange) ?
                                                        (anomaly.teethRange || tooth.teethRange) :
                                                        tooth.toothNumber)
                        : null
                    }
                    style={
                      anomaly.category !== "Blank" &&
                        anomaly.name !== "No anomalies detected" &&
                        anomaly.name !== "Not detected"
                        ? { cursor: "pointer" }
                        : {}
                    }
                    className={
                      anomaly.category !== "Blank" &&
                        anomaly.name !== "No anomalies detected" &&
                        anomaly.name !== "Not detected"
                        ? "clickable-row"
                        : ""
                    }
                  >
                    {idx === 0 ? (
                      <td className="text-center font-weight-bold" rowSpan={tooth.anomalies.length}>
                        {(anomaly.isRange && anomaly.teethRange) || (tooth.isRange && tooth.teethRange) ?
                          (anomaly.teethRange || tooth.teethRange) :
                          tooth.toothNumber}
                      </td>
                    ) : null}
                    <td>
                      {anomaly.category !== "Blank" ? (
                        <div className="d-flex justify-content-between align-items-center">
                          <span>{anomaly.name}</span>
                          {anomaly.category !== "Info" && (
                            <span
                              className={`badge ml-2 ${anomaly.category === "Anomaly"
                                ? "bg-danger"
                                : anomaly.category === "Procedure"
                                  ? "bg-success"
                                  : anomaly.category === "Landmark"
                                    ? "bg-pink"
                                    : anomaly.category === "Foreign Object"
                                      ? "bg-warning"
                                      : "bg-info"
                                }`}
                            >
                              {anomaly.category}
                            </span>
                          )}
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

export default ToothAnnotationTable
