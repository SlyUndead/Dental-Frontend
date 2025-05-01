"use client"

import React, { useState, useEffect } from "react"
import { Table, Dropdown, DropdownToggle, DropdownMenu, DropdownItem, FormGroup, Label, Input } from "reactstrap"
import { useNavigate } from "react-router-dom"

const ConsolidatedToothTable = ({ consolidatedAnnotations, classCategories, patientVisits }) => {
  const [filteredAnnotations, setFilteredAnnotations] = useState([])
  const [selectedCategories, setSelectedCategories] = useState(["Procedure", "Anomaly"])
  const [availableCategories, setAvailableCategories] = useState([])
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const navigate = useNavigate()

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

  // Handle annotation click to navigate to AnnotationPage
  const handleAnnotationClick = (anomaly) => {
    if (anomaly.visitIndex !== undefined) {
        sessionStorage.setItem("selectedImageIndex", anomaly.visitIndex.toString())
        if (anomaly.visitId) {
          sessionStorage.setItem("visitId", anomaly.visitId)
        } 
        else if (patientVisits && patientVisits.length > anomaly.visitIndex) {
          const visitId = patientVisits[anomaly.visitIndex]._id
          sessionStorage.setItem("visitId", visitId)
        }
        
        // Navigate to AnnotationPage
        navigate("/annotationPage")
      }
  }

  // Extract available categories from annotations
  useEffect(() => {
    if (!consolidatedAnnotations || consolidatedAnnotations.length === 0) {
      setAvailableCategories([])
      return
    }

    // Collect all unique categories from annotations
    const categories = new Set()
    consolidatedAnnotations.forEach((tooth) => {
      tooth.anomalies.forEach((anomaly) => {
        if (anomaly.category && anomaly.category !== "Info") {
          categories.add(anomaly.category)
        }
      })
    })
    setAvailableCategories(Array.from(categories).sort())
  }, [consolidatedAnnotations])

  // Filter annotations based on selected categories
  useEffect(() => {
    if (!consolidatedAnnotations || consolidatedAnnotations.length === 0) {
      setFilteredAnnotations([])
      return
    }

    // Create a deep copy of annotations and filter anomalies by category
    const filtered = consolidatedAnnotations.map((tooth) => {
      // Filter anomalies based on selected categories
      const filteredAnomalies = tooth.anomalies.filter(
        (anomaly) =>
          // Always include "No anomalies detected" entries
          anomaly.name === "No anomalies detected" ||
          anomaly.name === "Not detected" ||
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

    setFilteredAnnotations(filtered)
  }, [consolidatedAnnotations, selectedCategories])

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
            <th style={{ width: "15%" }}>Tooth Number</th>
            <th style={{ width: "40%" }}>Anomaly/Procedure</th>
            <th style={{ width: "15%" }}>Confidence</th>
            <th style={{ width: "30%" }}>Source Visit</th>
          </tr>
        </thead>
        <tbody>
          {filteredAnnotations.map((tooth, index) => (
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
                      {anomaly.category !== "Info" && <span className="badge bg-info ml-2">{anomaly.category}</span>}
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
