import { useState, useEffect } from "react";
import { Button } from "reactstrap";

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
  const [hoveredDate, setHoveredDate] = useState(null);
  const [uniqueDates, setUniqueDates] = useState([]);

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

  const handleMouseUp = () => {
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
      } else {
        onRangeChange(uniqueDates[rightValue], uniqueDates[index]);
      }
    } else {
      // Allow right knob to move anywhere, even past the left knob
      setRightValue(index);

      // Pass dates in the correct order (older date first, newer date second)
      if (leftValue <= index) {
        onRangeChange(uniqueDates[leftValue], uniqueDates[index]);
      } else {
        onRangeChange(uniqueDates[index], uniqueDates[leftValue]);
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

    // Move the closest knob to the clicked position, regardless of whether it crosses the other knob
    if (leftDist <= rightDist) {
      setLeftValue(index);

      // Pass dates in the correct order (older date first, newer date second)
      if (index <= rightValue) {
        onRangeChange(uniqueDates[index], uniqueDates[rightValue]);
      } else {
        onRangeChange(uniqueDates[rightValue], uniqueDates[index]);
      }
    } else {
      setRightValue(index);

      // Pass dates in the correct order (older date first, newer date second)
      if (leftValue <= index) {
        onRangeChange(uniqueDates[leftValue], uniqueDates[index]);
      } else {
        onRangeChange(uniqueDates[index], uniqueDates[leftValue]);
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
    // Return the date and time string
    return `${visitObj.date} ${visitObj.time}`;
  };

  const handleDateHover = (index) => {
    setHoveredDate(index);
  };

  const handleDateLeave = () => {
    setHoveredDate(null);
  };

  const handleApply = () => {
    // Call the onApplySelection prop with the selected visit objects
    // If knobs have crossed, pass them in the correct order (older visit first, newer visit second)
    if (leftValue <= rightValue) {
      onApplySelection(uniqueDates[leftValue], uniqueDates[rightValue]);
    } else {
      onApplySelection(uniqueDates[rightValue], uniqueDates[leftValue]);
    }
  };

  return (
    <div className="date-slider-container mb-4">
      <div className="slider-dates d-flex justify-content-between mb-2">
        {uniqueDates.map((date, index) => (
          <div
            key={index}
            className="date-marker"
            style={{
              left: `${(index / Math.max(uniqueDates.length - 1, 1)) * 100}%`,
              transform: 'translateX(-50%)',
              position: 'absolute'
            }}
            onMouseEnter={() => handleDateHover(index)}
            onMouseLeave={handleDateLeave}
          >
            {hoveredDate === index && (
              <div className="date-tooltip bg-dark text-white p-1 rounded"
                   style={{ position: 'absolute', bottom: '100%', transform: 'translateX(-50%)', zIndex: 100, whiteSpace: 'nowrap' }}>
                {formatDate(date)}
              </div>
            )}
          </div>
        ))}
      </div>

      <div
        className="slider-track position-relative"
        style={{
          height: '8px',
          backgroundColor: '#e0e0e0',
          borderRadius: '4px',
          cursor: 'pointer'
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

        {/* Tick marks */}
        {uniqueDates.map((_, index) => (
          <div
            key={index}
            className="tick-mark"
            style={{
              position: 'absolute',
              left: `${(index / Math.max(uniqueDates.length - 1, 1)) * 100}%`,
              height: '12px',
              width: '2px',
              backgroundColor: '#757575',
              transform: 'translateX(-50%)',
              top: '-2px',
              pointerEvents: 'none'
            }}
          />
        ))}

        {/* Left knob */}
        <div
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
          title={leftValue === rightValue ? "Both knobs are at the same position" : "Drag to select older date"}
        />

        {/* Right knob */}
        <div
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
          title={leftValue === rightValue ? "Both knobs are at the same position" : "Drag to select newer date"}
        />
      </div>

      <div className="mt-3 d-flex justify-content-between align-items-center">
        <div className="position-relative">
          <Button
            color="primary"
            onClick={handleApply}
            disabled={leftValue === rightValue}
            title={leftValue === rightValue ? "Please select different dates to compare" : "Apply the selected date range"}
          >
            Apply Selection
          </Button>
          {leftValue === rightValue && (
            <div className="text-danger small mt-1">
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