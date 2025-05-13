import { useState, useEffect, useRef } from "react";
import { UncontrolledTooltip } from "reactstrap";

const DateSlider = ({
  visits = [],
  onRangeChange = () => {},
  onApplySelection = () => {},
  selectedFirstVisitId = null,  // Add these props to control slider externally
  selectedSecondVisitId = null
}) => {
  const [leftValue, setLeftValue] = useState(0);
  const [rightValue, setRightValue] = useState(1);
  const [dragging, setDragging] = useState(null);
  const [uniqueDates, setUniqueDates] = useState([]);
  const debounceTimerRef = useRef(null); // For debouncing the apply selection

  useEffect(() => {
    // Process individual visits instead of grouping by date
    if (visits.length > 0) {
      // Format each visit with date and time information
      const formattedVisits = visits.map(visit => {
        // Format the date and time for display
        const visitDate = new Date(visit.date_of_visit);
        const creationDate = visit.created_on ? new Date(visit.created_on) : visitDate;

        // Format time as HH:MM AM/PM
        const timeString = creationDate.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: true
        });

        return {
          id: visit._id,
          date: visit.formattedDate || new Intl.DateTimeFormat("en-US", {
            month: "short",
            day: "2-digit",
            year: "numeric",
          }).format(visitDate),
          time: timeString,
          fullDateTime: `${visit.formattedDate} ${timeString}`,
          visitObj: visit
        };
      });

      // Sort visits by creation date (oldest first, newest last)
      const sortedVisits = formattedVisits.sort((a, b) => {
        const dateA = a.visitObj.created_on ? new Date(a.visitObj.created_on) : new Date(a.visitObj.date_of_visit);
        const dateB = b.visitObj.created_on ? new Date(b.visitObj.created_on) : new Date(b.visitObj.date_of_visit);
        return dateA - dateB;
      });

      setUniqueDates(sortedVisits);

      // Initialize with the last two visits if available (newest visits)
      if (sortedVisits.length >= 2) {
        // Set to the two newest visits (last two in the array)
        const lastIndex = sortedVisits.length - 1;
        const secondLastIndex = sortedVisits.length - 2;

        setLeftValue(secondLastIndex);
        setRightValue(lastIndex);
        // Visits are sorted oldest to newest, so the last one is the newest
        onRangeChange(sortedVisits[secondLastIndex], sortedVisits[lastIndex]);
      } else if (sortedVisits.length === 1) {
        setLeftValue(0);
        setRightValue(0);
        onRangeChange(sortedVisits[0], sortedVisits[0]);
      }
    }
  }, [visits]);

  // New effect to sync slider with external dropdowns
  useEffect(() => {
    if (uniqueDates.length === 0 || (!selectedFirstVisitId && !selectedSecondVisitId)) return;

    // Find indices of selected visits in uniqueDates
    let firstIndex = -1;
    let secondIndex = -1;

    for (let i = 0; i < uniqueDates.length; i++) {
      const visitObj = uniqueDates[i];

      if (selectedFirstVisitId && visitObj.id === selectedFirstVisitId) {
        firstIndex = i;
      }

      if (selectedSecondVisitId && visitObj.id === selectedSecondVisitId) {
        secondIndex = i;
      }
    }

    // Update slider positions if valid indices were found
    if (firstIndex !== -1) {
      setLeftValue(firstIndex);
    }

    if (secondIndex !== -1) {
      setRightValue(secondIndex);
    }

    // Notify parent of range change if both values were found
    if (firstIndex !== -1 && secondIndex !== -1) {
      // Pass visits in the correct order (older visit first, newer visit second)
      if (firstIndex <= secondIndex) {
        onRangeChange(uniqueDates[firstIndex], uniqueDates[secondIndex]);
      } else {
        onRangeChange(uniqueDates[secondIndex], uniqueDates[firstIndex]);
      }
    }
  }, [selectedFirstVisitId, selectedSecondVisitId, uniqueDates]);

  // No dates available
  if (uniqueDates.length === 0) {
    return <div className="text-center p-4">No visit dates available</div>;
  }

  const handleMouseDown = (knob) => (e) => {
    e.preventDefault();
    setDragging(knob);
  };

  // Function to apply selection with debouncing
  const debouncedApplySelection = (leftIdx, rightIdx) => {
    // Clear any existing timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Only apply if knobs are at different positions
    if (leftIdx !== rightIdx && uniqueDates.length > 0) {
      // Set a new timer
      debounceTimerRef.current = setTimeout(() => {
        // Apply selection in the correct order (older visit first, newer visit second)
        if (leftIdx <= rightIdx) {
          onApplySelection(uniqueDates[leftIdx], uniqueDates[rightIdx]);
        } else {
          onApplySelection(uniqueDates[rightIdx], uniqueDates[leftIdx]);
        }
      }, 300); // 300ms debounce time - adjust as needed
    }
  };

  const handleMouseUp = () => {
    // When mouse is released, apply the selection immediately
    if (dragging && leftValue !== rightValue) {
      // Clear any existing timer
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      // Apply selection immediately
      if (leftValue <= rightValue) {
        onApplySelection(uniqueDates[leftValue], uniqueDates[rightValue]);
      } else {
        onApplySelection(uniqueDates[rightValue], uniqueDates[leftValue]);
      }
    }

    setDragging(null);
  };

  const handleMouseMove = (e) => {
    if (!dragging) return;

    const sliderRect = e.currentTarget.getBoundingClientRect();
    const position = (e.clientX - sliderRect.left) / sliderRect.width;
    const index = Math.min(
      Math.max(Math.round(position * (uniqueDates.length - 1)), 0),
      uniqueDates.length - 1
    );

    if (dragging === "left") {
      // Allow left knob to move anywhere, even past the right knob
      setLeftValue(index);

      // Pass dates in the correct order (older date first, newer date second)
      if (index <= rightValue) {
        onRangeChange(uniqueDates[index], uniqueDates[rightValue]);
        // Debounce the apply selection while dragging
        debouncedApplySelection(index, rightValue);
      } else {
        onRangeChange(uniqueDates[rightValue], uniqueDates[index]);
        // Debounce the apply selection while dragging
        debouncedApplySelection(rightValue, index);
      }
    } else {
      // Allow right knob to move anywhere, even past the left knob
      setRightValue(index);

      // Pass dates in the correct order (older date first, newer date second)
      if (leftValue <= index) {
        onRangeChange(uniqueDates[leftValue], uniqueDates[index]);
        // Debounce the apply selection while dragging
        debouncedApplySelection(leftValue, index);
      } else {
        onRangeChange(uniqueDates[index], uniqueDates[leftValue]);
        // Debounce the apply selection while dragging
        debouncedApplySelection(index, leftValue);
      }
    }
  };

  const handleTrackClick = (e) => {
    const sliderRect = e.currentTarget.getBoundingClientRect();
    const position = (e.clientX - sliderRect.left) / sliderRect.width;
    const index = Math.min(
      Math.max(Math.round(position * (uniqueDates.length - 1)), 0),
      uniqueDates.length - 1
    );

    // Determine which knob to move based on proximity
    const leftDist = Math.abs(index - leftValue);
    const rightDist = Math.abs(index - rightValue);

    // Move the closest knob to the clicked position
    if (leftDist <= rightDist) {
      setLeftValue(index);

      // Pass dates in the correct order (older date first, newer date second)
      if (index <= rightValue) {
        onRangeChange(uniqueDates[index], uniqueDates[rightValue]);
        // Apply selection immediately on click
        if (index !== rightValue) {
          onApplySelection(uniqueDates[index], uniqueDates[rightValue]);
        }
      } else {
        onRangeChange(uniqueDates[rightValue], uniqueDates[index]);
        // Apply selection immediately on click
        if (index !== rightValue) {
          onApplySelection(uniqueDates[rightValue], uniqueDates[index]);
        }
      }
    } else {
      setRightValue(index);

      // Pass dates in the correct order (older date first, newer date second)
      if (leftValue <= index) {
        onRangeChange(uniqueDates[leftValue], uniqueDates[index]);
        // Apply selection immediately on click
        if (leftValue !== index) {
          onApplySelection(uniqueDates[leftValue], uniqueDates[index]);
        }
      } else {
        onRangeChange(uniqueDates[index], uniqueDates[leftValue]);
        // Apply selection immediately on click
        if (leftValue !== index) {
          onApplySelection(uniqueDates[index], uniqueDates[leftValue]);
        }
      }
    }
  };

  const getLeftKnobPosition = () => {
    return (leftValue / Math.max(uniqueDates.length - 1, 1)) * 100;
  };

  const getRightKnobPosition = () => {
    return (rightValue / Math.max(uniqueDates.length - 1, 1)) * 100;
  };

  const formatDate = (visitObj) => {
    // Return the date and time string with a more detailed format
    return `${visitObj.date} at ${visitObj.time}`;
  };

  return (
    <div className="date-slider-container mb-4">
      {/* We're removing the slider-dates div since we now have tooltips on the tick marks */}

      <div
        className="slider-track position-relative"
        style={{
          height: '8px',
          backgroundColor: '#e0e0e0',
          borderRadius: '4px',
          cursor: 'pointer',
          marginTop: '30px', // Add margin to ensure space for tooltips
          marginBottom: '30px' // Add margin to ensure space for tooltips
        }}
        onClick={handleTrackClick}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {/* Colored track between knobs */}
        <div
          className="slider-filled"
          style={{
            position: 'absolute',
            left: `${Math.min(getLeftKnobPosition(), getRightKnobPosition())}%`,
            right: `${100 - Math.max(getLeftKnobPosition(), getRightKnobPosition())}%`,
            height: '100%',
            background: leftValue === rightValue
              ? '#dc3545' // Red color when both knobs are at the same position
              : 'linear-gradient(90deg, #ff5722, #ff9800, #ffc107)',
            borderRadius: '4px',
            pointerEvents: 'none',
            transition: 'background 0.3s ease'
          }}
        />

        {/* Tick marks with month labels */}
        {(() => {
          // Track information about the previous tick mark
          let prevTickHadLabel = false;
          let prevLabelPlacedAbove = false;

          return uniqueDates.map((date, index) => {
            // Check if this is the first date of a new month
            const isNewMonth = index === 0 ||
              (index > 0 &&
                new Date(date.visitObj.date_of_visit).getMonth() !==
                new Date(uniqueDates[index - 1].visitObj.date_of_visit).getMonth());

            // Format month and year for display (e.g., "Apr '25")
            const monthYearLabel = isNewMonth ?
              new Date(date.visitObj.date_of_visit).toLocaleDateString('en-US', {
                month: 'short',
                year: '2-digit'
              }) : null;

            // Determine if this label should be placed above
            let placeAbove = false;

            // If the previous tick mark had a label and it was not placed above,
            // then place this label above
            if (isNewMonth && prevTickHadLabel && !prevLabelPlacedAbove) {
              placeAbove = true;
            }

            // Store current label placement for next iteration
            const currentTickHasLabel = isNewMonth;
            const currentLabelPlacedAbove = isNewMonth ? placeAbove : false;

            // After rendering, update tracking variables for next iteration
            const result = (
              <div key={index}>
                <div
                  id={`tick-${index}`}
                  className="tick-mark"
                  style={{
                    position: 'absolute',
                    left: `${(index / Math.max(uniqueDates.length - 1, 1)) * 100}%`,
                    height: '12px',
                    width: isNewMonth ? '6px' : '4px', // Make month start ticks slightly wider
                    backgroundColor: isNewMonth ? '#333' : '#757575', // Make month start ticks darker
                    transform: 'translateX(-50%)',
                    top: '-2px',
                    pointerEvents: 'auto', // Enable hover events
                    cursor: 'pointer'
                  }}
                />
                <UncontrolledTooltip
                  placement={placeAbove ? "bottom" : "top"}
                  target={`tick-${index}`}
                >
                  {formatDate(date)}
                </UncontrolledTooltip>
                {/* Month label - positioned above or below based on our logic */}
                {isNewMonth && (
                  <div
                    style={{
                      position: 'absolute',
                      left: `${(index / Math.max(uniqueDates.length - 1, 1)) * 100}%`,
                      transform: 'translateX(-50%)',
                      top: placeAbove ? '-25px' : '20px', // Position above or below the tick mark
                      fontSize: '11px',
                      fontWeight: 'bold',
                      color: '#333',
                      whiteSpace: 'nowrap',
                      backgroundColor: 'rgba(255, 255, 255, 0.8)', // Semi-transparent background
                      padding: '2px 4px',
                      borderRadius: '3px',
                      zIndex: 5 // Ensure it appears above other elements
                    }}
                  >
                    {monthYearLabel}
                  </div>
                )}
              </div>
            );

            // Update tracking variables for next iteration
            prevTickHadLabel = currentTickHasLabel;
            prevLabelPlacedAbove = currentLabelPlacedAbove;

            return result;
          });
        })()}

        {/* Left knob */}
        <div
          id="left-knob"
          className="knob left-knob"
          style={{
            position: 'absolute',
            left: `${getLeftKnobPosition()}%`,
            top: '50%',
            transform: 'translate(-50%, -50%)',
            width: '20px',
            height: '20px',
            borderRadius: '50%',
            backgroundColor: leftValue === rightValue ? '#dc3545' : '#212121',
            cursor: 'pointer',
            border: '2px solid #fff',
            boxShadow: leftValue === rightValue
              ? '0 0 0 2px rgba(220, 53, 69, 0.5), 0 2px 4px rgba(0,0,0,0.2)'
              : '0 2px 4px rgba(0,0,0,0.2)',
            zIndex: leftValue === rightValue ? 3 : 2,
            transition: 'background-color 0.3s ease, box-shadow 0.3s ease'
          }}
          onMouseDown={handleMouseDown('left')}
        />
        <UncontrolledTooltip
          placement="top"
          target="left-knob"
          delay={{ show: 200, hide: 100 }}
          className="date-tooltip"
        >
          {uniqueDates.length > 0 ? formatDate(uniqueDates[leftValue]) : ""}
        </UncontrolledTooltip>

        {/* Right knob */}
        <div
          id="right-knob"
          className="knob right-knob"
          style={{
            position: 'absolute',
            left: `${getRightKnobPosition()}%`,
            top: '50%',
            transform: 'translate(-50%, -50%)',
            width: '20px',
            height: '20px',
            borderRadius: '50%',
            backgroundColor: leftValue === rightValue ? '#dc3545' : '#212121',
            cursor: 'pointer',
            border: '2px solid #fff',
            boxShadow: leftValue === rightValue
              ? '0 0 0 2px rgba(220, 53, 69, 0.5), 0 2px 4px rgba(0,0,0,0.2)'
              : '0 2px 4px rgba(0,0,0,0.2)',
            zIndex: leftValue === rightValue ? 3 : 2,
            transition: 'background-color 0.3s ease, box-shadow 0.3s ease'
          }}
          onMouseDown={handleMouseDown('right')}
        />
        <UncontrolledTooltip
          placement="top"
          target="right-knob"
          className="date-tooltip"
        >
          {uniqueDates.length > 0 ? formatDate(uniqueDates[rightValue]) : ""}
        </UncontrolledTooltip>
      </div>

      <div className="mt-5 d-flex justify-content-between align-items-center">
        <div className="position-relative">
          {leftValue === rightValue && (
            <div className="text-danger small">
              Please select different dates to compare
            </div>
          )}
        </div>
        <div className="selected-dates">
          {uniqueDates.length > 0 && (
            <div className="text-muted">
              {leftValue === rightValue
                ? `Selected visit: ${formatDate(uniqueDates[leftValue])}`
                : `Selected visits: ${
                    leftValue <= rightValue
                      ? `${formatDate(uniqueDates[leftValue])} - ${formatDate(uniqueDates[rightValue])}`
                      : `${formatDate(uniqueDates[rightValue])} - ${formatDate(uniqueDates[leftValue])}`
                  }`
              }
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DateSlider;