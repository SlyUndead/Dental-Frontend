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
    // Extract and deduplicate dates from visits
    if (visits.length > 0) {
      // Get unique dates
      const dateMap = new Map();
      visits.forEach(visit => {
        const dateKey = visit.formattedDate || visit.date_of_visit;
        if (!dateMap.has(dateKey)) {
          dateMap.set(dateKey, {
            date: dateKey,
            visitIds: [visit._id]
          });
        } else {
          dateMap.get(dateKey).visitIds.push(visit._id);
        }
      });
      
      // Convert to array and sort by date (newest first)
      const sortedDates = Array.from(dateMap.values()).sort((a, b) => {
        // Assuming formattedDate is like "May 06, 2023" or ISO string
        return new Date(b.date) - new Date(a.date);
      });
      
      setUniqueDates(sortedDates);
      
      // Initialize with the first two dates if available
      if (sortedDates.length >= 2) {
        setLeftValue(0);
        setRightValue(1);
        onRangeChange(sortedDates[0], sortedDates[1]);
      } else if (sortedDates.length === 1) {
        setLeftValue(0);
        setRightValue(0);
        onRangeChange(sortedDates[0], sortedDates[0]);
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
      const dateObj = uniqueDates[i];
      
      if (selectedFirstVisitId && dateObj.visitIds.includes(selectedFirstVisitId)) {
        firstIndex = i;
      }
      
      if (selectedSecondVisitId && dateObj.visitIds.includes(selectedSecondVisitId)) {
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
      onRangeChange(uniqueDates[firstIndex], uniqueDates[secondIndex]);
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
      if (index < rightValue) {
        setLeftValue(index);
        onRangeChange(uniqueDates[index], uniqueDates[rightValue]);
      }
    } else {
      if (index > leftValue) {
        setRightValue(index);
        onRangeChange(uniqueDates[leftValue], uniqueDates[index]);
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
    
    if (leftDist <= rightDist && index < rightValue) {
      setLeftValue(index);
      onRangeChange(uniqueDates[index], uniqueDates[rightValue]);
    } else if (index > leftValue) {
      setRightValue(index);
      onRangeChange(uniqueDates[leftValue], uniqueDates[index]);
    }
  };

  const getLeftKnobPosition = () => {
    return (leftValue / Math.max(uniqueDates.length - 1, 1)) * 100;
  };

  const getRightKnobPosition = () => {
    return (rightValue / Math.max(uniqueDates.length - 1, 1)) * 100;
  };

  const formatDate = (dateObj) => {
    // Return the date string directly
    return dateObj.date;
  };

  const handleDateHover = (index) => {
    setHoveredDate(index);
  };

  const handleDateLeave = () => {
    setHoveredDate(null);
  };

  const handleApply = () => {
    // Call the onApplySelection prop with the selected date objects
    onApplySelection(uniqueDates[leftValue], uniqueDates[rightValue]);
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
                   style={{ position: 'absolute', bottom: '100%', transform: 'translateX(-50%)', zIndex: 100 }}>
                {formatDate(date)}
                {date.visitIds && date.visitIds.length > 1 && (
                  <span className="ml-1 badge badge-light">{date.visitIds.length} visits</span>
                )}
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
            left: `${getLeftKnobPosition()}%`,
            right: `${100 - getRightKnobPosition()}%`,
            height: '100%',
            background: 'linear-gradient(90deg, #ff5722, #ff9800, #ffc107)',
            borderRadius: '4px',
            pointerEvents: 'none'
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
            backgroundColor: '#212121',
            cursor: 'pointer',
            border: '2px solid #fff',
            boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
            zIndex: 2
          }}
          onMouseDown={handleMouseDown('left')}
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
            backgroundColor: '#212121',
            cursor: 'pointer',
            border: '2px solid #fff',
            boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
            zIndex: 2
          }}
          onMouseDown={handleMouseDown('right')}
        />
      </div>
      
      <div className="mt-3 d-flex justify-content-between align-items-center">
        <div className="selected-dates">
          {uniqueDates.length > 0 && (
            <div className="text-muted">
              Selected range: {formatDate(uniqueDates[leftValue])} - {formatDate(uniqueDates[rightValue])}
              {uniqueDates[leftValue].visitIds && uniqueDates[leftValue].visitIds.length > 1 && (
                <span className="ml-1 badge badge-light">{uniqueDates[leftValue].visitIds.length} visits</span>
              )}
              {uniqueDates[rightValue].visitIds && uniqueDates[rightValue].visitIds.length > 1 && (
                <span className="ml-1 badge badge-light">{uniqueDates[rightValue].visitIds.length} visits</span>
              )}
            </div>
          )}
        </div>
        <Button color="primary" onClick={handleApply}>
          Apply Selection
        </Button>
      </div>
    </div>
  );
};

export default DateSlider;