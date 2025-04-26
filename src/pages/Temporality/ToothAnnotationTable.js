import React, { useState, useEffect } from "react";
import { Table } from "reactstrap";
import { calculateOverlap, polygonArea } from "../AnnotationTools/path-utils";

const ToothAnnotationTable = ({ annotations, classCategories, selectedTooth }) => {
  const [toothAnnotations, setToothAnnotations] = useState([]);

  // Process annotations when they change or when a tooth is selected
  useEffect(() => {
    if (!annotations || annotations.length === 0) {
      setToothAnnotations([]);
      return;
    }

    // First, filter out only the tooth annotations (numeric labels)
    const toothAnnots = annotations.filter(anno => !isNaN(Number.parseInt(anno.label)));
    
    // If a specific tooth is selected, only show annotations for that tooth
    if (selectedTooth) {
      const selectedToothAnnotation = toothAnnots.find(
        anno => Number.parseInt(anno.label) === selectedTooth
      );
      
      if (selectedToothAnnotation) {
        // Find all anomalies that overlap with this tooth by at least 80%
        const anomalies = [];
        
        annotations.forEach(anno => {
          // Skip tooth annotations and annotations without segmentation
          if (!isNaN(Number.parseInt(anno.label)) || !anno.segmentation || !selectedToothAnnotation.segmentation) {
            return;
          }
          
          try {
            // Calculate overlap
            const overlap = calculateOverlap(anno.segmentation, selectedToothAnnotation.segmentation);
            const annoArea = polygonArea(anno.segmentation.map(point => [point.x, point.y]));
            const overlapPercentage = annoArea > 0 ? overlap / annoArea : 0;
            
            // Only include if overlap is at least 80%
            if (overlapPercentage >= 0.8) {
              anomalies.push({
                toothNumber: selectedTooth,
                name: anno.label,
                category: classCategories[anno.label.toLowerCase()] || 'Unknown',
                confidence: anno.confidence,
                overlapPercentage: Math.round(overlapPercentage * 100)
              });
            }
          } catch (error) {
            console.error('Error calculating overlap:', error);
          }
        });
        
        // Create a single entry for the selected tooth
        setToothAnnotations([{
          toothNumber: selectedTooth,
          anomalies: anomalies.length > 0 ? anomalies : [{ name: 'No anomalies detected', category: 'Info' }]
        }]);
      } else {
        setToothAnnotations([]);
      }
    } else {
      // Show all teeth with their anomalies
      const teethData = {};
      
      // Initialize entries for each tooth
      toothAnnots.forEach(toothAnno => {
        const toothNumber = Number.parseInt(toothAnno.label);
        teethData[toothNumber] = {
          toothNumber,
          anomalies: []
        };
      });
      
      // For each tooth, find anomalies with at least 80% overlap
      Object.keys(teethData).forEach(toothNumber => {
        const toothAnnotation = toothAnnots.find(
          anno => Number.parseInt(anno.label) === Number.parseInt(toothNumber)
        );
        
        if (toothAnnotation) {
          // Find all anomalies that overlap with this tooth by at least 80%
          annotations.forEach(anno => {
            // Skip tooth annotations and annotations without segmentation
            if (!isNaN(Number.parseInt(anno.label)) || !anno.segmentation || !toothAnnotation.segmentation) {
              return;
            }
            
            try {
              // Calculate overlap
              const overlap = calculateOverlap(anno.segmentation, toothAnnotation.segmentation);
              const annoArea = polygonArea(anno.segmentation.map(point => [point.x, point.y]));
              const overlapPercentage = annoArea > 0 ? overlap / annoArea : 0;
              
              // Only include if overlap is at least 80%
              if (overlapPercentage >= 0.8) {
                teethData[toothNumber].anomalies.push({
                  name: anno.label,
                  category: classCategories[anno.label.toLowerCase()] || 'Unknown',
                  confidence: anno.confidence,
                  overlapPercentage: Math.round(overlapPercentage * 100)
                });
              }
            } catch (error) {
              console.error('Error calculating overlap:', error);
            }
          });
          
          // If no anomalies found, add a placeholder
          if (teethData[toothNumber].anomalies.length === 0) {
            teethData[toothNumber].anomalies = [{ name: 'No anomalies detected', category: 'Info' }];
          }
        }
      });
      
      // Convert to array and sort by tooth number
      const result = Object.values(teethData).sort((a, b) => a.toothNumber - b.toothNumber);
      setToothAnnotations(result);
    }
  }, [annotations, classCategories, selectedTooth]);

  if (!toothAnnotations || toothAnnotations.length === 0) {
    return (
      <div className="text-center mt-3">
        <p>No tooth annotations available</p>
      </div>
    );
  }

  return (
    <div>
      <Table striped bordered hover responsive className="mt-3">
        <thead className="bg-primary text-white">
          <tr>
            <th style={{ width: '20%' }}>Tooth Number</th>
            <th style={{ width: '50%' }}>Anomaly/Procedure</th>
            <th style={{ width: '15%' }}>Confidence</th>
          </tr>
        </thead>
        <tbody>
          {toothAnnotations.map((tooth, index) => (
            <React.Fragment key={index}>
              {tooth.anomalies.map((anomaly, idx) => (
                <tr key={`${index}-${idx}`}>
                  {idx === 0 ? (
                    <td
                      className="text-center font-weight-bold"
                      rowSpan={tooth.anomalies.length}
                    >
                      {tooth.toothNumber}
                    </td>
                  ) : null}
                  <td>
                    <div className="d-flex justify-content-between align-items-center">
                      <span>{anomaly.name}</span>
                      {anomaly.category !== 'Info' && (
                        <span className="badge bg-info ml-2">{anomaly.category}</span>
                      )}
                    </div>
                  </td>
                  <td className="text-center">
                    {anomaly.confidence ? (
                      <span>{anomaly.confidence.toFixed(2).toString().slice(1)}</span>
                    ) : (
                      anomaly.category === 'Info' ? '-' : '0.80'
                    )}
                  </td>
                </tr>
              ))}
            </React.Fragment>
          ))}
        </tbody>
      </Table>
    </div>
  );
};

export default ToothAnnotationTable;
