"use client"

import React, { useState, useEffect, useMemo, useCallback } from "react"
import { Table, Dropdown, DropdownToggle, DropdownMenu, DropdownItem, FormGroup, Label, Input } from "reactstrap"
import { useNavigate } from "react-router-dom"

// Add this at the top of your file, after the imports
// Add a style tag for the pink badge if it doesn't exist in your CSS
const styleElement = document.createElement("style")
styleElement.textContent = `
  .bg-pink {
    background-color: #ff69b4 !important;
    color: white !important;
  }
`
document.head.appendChild(styleElement)

const ConsolidatedToothTable = ({ consolidatedAnnotations, classCategories, patientVisits, selectedTooth, confidenceLevels = {} }) => {
    const [filteredAnnotations, setFilteredAnnotations] = useState([])
    const [selectedCategories, setSelectedCategories] = useState(["Procedure", "Anomaly"])
    const [availableCategories, setAvailableCategories] = useState([])
    const [dropdownOpen, setDropdownOpen] = useState(false)
    const navigate = useNavigate()

    // Toggle dropdown - optimized with useCallback
    const toggleDropdown = useCallback(() => {
        setDropdownOpen((prevState) => !prevState);
    }, []);

    // Handle category selection - optimized with useCallback
    const handleCategoryToggle = useCallback((e, category) => {
        e.preventDefault();
        e.stopPropagation();
        setSelectedCategories(prevCategories => {
            if (prevCategories.includes(category)) {
                // Remove category if it's already selected
                return prevCategories.filter((cat) => cat !== category);
            } else {
                // Add category if it's not selected
                return [...prevCategories, category];
            }
        });
    }, []);

    // Handle annotation click to open AnnotationPage in a new tab - optimized with useCallback
    const handleAnnotationClick = useCallback((anomaly) => {
        if (anomaly.visitIndex === undefined) return;

        // Batch sessionStorage operations
        const sessionData = {
            "selectedImageIndex": (anomaly.imageNumber - 1).toString(),
            "xrayDate": anomaly.visitDate,
            "last": anomaly.visitIndex === 0,
            "first": anomaly.visitIndex === patientVisits.length - 1
        };

        // Set visitId
        if (anomaly.visitId) {
            sessionData.visitId = anomaly.visitId;
        } else if (patientVisits && patientVisits.length > anomaly.visitIndex) {
            sessionData.visitId = patientVisits[anomaly.visitIndex]._id;
        }

        // Apply all sessionStorage updates at once
        Object.entries(sessionData).forEach(([key, value]) => {
            sessionStorage.setItem(key, value.toString());
        });

        // Open new window
        const newWindow = window.open('', '_blank');

        // Set the URL for the new tab and navigate
        if (newWindow) {
            newWindow.location.href = `${window.location.origin}/annotationPage`;
        } else {
            // Fallback to regular navigation if popup is blocked
            navigate("/annotationPage");
        }
    }, [patientVisits, navigate]);

    // Extract available categories from annotations - optimized with useMemo
    const availableCategoriesMemo = useMemo(() => {
        console.time('availableCategories'); // Performance measurement
        if (!consolidatedAnnotations || consolidatedAnnotations.length === 0) {
            console.timeEnd('availableCategories');
            return [];
        }

        // Collect all unique categories from annotations
        const categories = new Set();

        // Use a more efficient loop
        for (const tooth of consolidatedAnnotations) {
            for (const anomaly of tooth.anomalies) {
                if (anomaly.category && anomaly.category !== "Info") {
                    categories.add(anomaly.category);
                }
            }
        }

        const result = Array.from(categories).sort();
        console.timeEnd('availableCategories');
        return result;
    }, [consolidatedAnnotations]);

    // Update availableCategories state when the memo changes
    useEffect(() => {
        setAvailableCategories(availableCategoriesMemo);
    }, [availableCategoriesMemo]);

    // Filter annotations based on selected categories and selected tooth - optimized with useMemo
    const filteredAnnotationsMemo = useMemo(() => {
        console.time('filterAnnotations'); // Performance measurement
        if (!consolidatedAnnotations || consolidatedAnnotations.length === 0) {
            console.timeEnd('filterAnnotations');
            return [];
        }

        // First, filter by selected tooth if one is selected
        let teethToShow = consolidatedAnnotations;
        if (selectedTooth) {
            // If "Unassigned" is selected, only show unassigned teeth
            if (selectedTooth === "Unassigned") {
                teethToShow = consolidatedAnnotations.filter(tooth =>
                    tooth.toothNumber === "Unassigned" || tooth.isUnassigned
                );
            } else {
                // Otherwise, only show the selected tooth
                teethToShow = consolidatedAnnotations.filter(tooth =>
                    tooth.toothNumber === selectedTooth
                );
            }
        }

        // Then, create a filtered version of teeth and filter anomalies by category
        const filtered = teethToShow.map((tooth) => {
            // Filter anomalies based on selected categories and confidence threshold
            const filteredAnomalies = tooth.anomalies.filter(
                (anomaly) =>
                    // Always include "No anomalies detected" entries
                    anomaly.name === "No anomalies detected" ||
                    anomaly.name === "Not detected" ||
                    // Include anomalies with selected categories and meeting confidence threshold
                    (selectedCategories.includes(anomaly.category) &&
                     anomaly.confidence >= (confidenceLevels[anomaly.name.toLowerCase()] || 0.001)),
            );

            // Return tooth with filtered anomalies
            return {
                ...tooth,
                anomalies:
                    filteredAnomalies.length > 0 ? filteredAnomalies : [{ name: "No anomalies detected", category: "Info" }],
            };
        });

        console.timeEnd('filterAnnotations');
        return filtered;
    }, [consolidatedAnnotations, selectedCategories, selectedTooth, confidenceLevels]);

    // Update filteredAnnotations state when the memo changes
    useEffect(() => {
        setFilteredAnnotations(filteredAnnotationsMemo);
    }, [filteredAnnotationsMemo]);

    if (!consolidatedAnnotations || consolidatedAnnotations.length === 0) {
        return (
            <div className="text-center mt-3">
                <p>No tooth annotations available</p>
            </div>
        )
    }

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
                                                onClick={(e) => handleCategoryToggle(e, category)}
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
                        <th style={{ width: "15%" }}>Tooth Number</th>
                        <th style={{ width: "40%" }}>Anomaly/Procedure</th>
                        <th style={{ width: "15%" }}>Confidence</th>
                        <th style={{ width: "30%" }}>Source Visit</th>
                    </tr>
                </thead>
                <tbody>
                    {filteredAnnotations
                        .filter(tooth => !selectedTooth || tooth.toothNumber === selectedTooth ||
                               (selectedTooth === "Unassigned" && (tooth.toothNumber === "Unassigned" || tooth.isUnassigned)))
                        .map((tooth, index) => (
                            <React.Fragment key={index}>
                                {tooth.anomalies.map((anomaly, idx) => (
                                    <tr
                                        key={`${index}-${idx}`}
                                        onClick={() =>
                                            anomaly.name !== "No anomalies detected" && anomaly.name !== "Not detected"
                                                ? handleAnnotationClick(anomaly)
                                                : null
                                        }
                                        style={
                                            anomaly.name !== "No anomalies detected" && anomaly.name !== "Not detected"
                                                ? { cursor: "pointer" }
                                                : {}
                                        }
                                        className={
                                            anomaly.name !== "No anomalies detected" && anomaly.name !== "Not detected" ? "clickable-row" : ""
                                        }
                                    >
                                        {idx === 0 ? (
                                            <td className="text-center font-weight-bold" rowSpan={tooth.anomalies.length}>
                                                {tooth.toothNumber}
                                            </td>
                                        ) : null}
                                        <td>
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
                                        </td>
                                        <td className="text-center">
                                            {anomaly.confidence ? (
                                                <span>{anomaly.confidence.toFixed(2).toString().slice(1)}</span>
                                            ) : anomaly.category === "Info" ? (
                                                "-"
                                            ) : (
                                                "0.80"
                                            )}
                                        </td>
                                        <td>
                                            {anomaly.visitDate ? (
                                                <span className="badge bg-secondary">{anomaly.visitDate}</span>
                                            ) : (
                                                <span>-</span>
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

export default ConsolidatedToothTable
