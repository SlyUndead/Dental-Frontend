import React, { useState } from 'react';
import { InputGroup, Input } from 'reactstrap';
import ToothUpdateConfirmationModal from './ToothUpdateConfirmation';

const ToothLabelEditor = ({ 
  annotation, 
  currentLabel, 
  onLabelChange, 
  onBulkUpdate, 
  allAnnotations 
}) => {
  const [newLabel, setNewLabel] = useState(currentLabel);
  const [showModal, setShowModal] = useState(false);
  
  // Toggle modal visibility
  const toggleModal = () => {
    setShowModal(!showModal);
  };
  
  // Handle the value change in the dropdown
  const handleValueChange = (e) => {
    const selectedValue = e.target.value;
    setNewLabel(selectedValue);
    
    // If the value has changed, show the confirmation modal
    if (selectedValue !== currentLabel) {
      toggleModal();
    }
  };
  
  // Handle confirmation to update all teeth
  const handleBulkUpdate = (teethUpdates) => {
    // First update the current tooth
    onLabelChange(newLabel);
    
    // Then update all other teeth if there are any
    if (teethUpdates.length > 0) {
      // Find all tooth annotations that need to be updated
      const updateOperations = teethUpdates.map(update => {
        const toothAnnotation = allAnnotations.find(
          a => !isNaN(parseInt(a.label)) && parseInt(a.label) === update.original
        );
        
        return {
          annotation: toothAnnotation,
          newLabel: update.updated.toString()
        };
      }).filter(op => op.annotation); // Filter out any missing annotations
      
      // Send bulk update to parent component
      onBulkUpdate(updateOperations);
    }
  };
  
  // Handle cancellation - just update the current tooth
  const handleSingleUpdate = () => {
    onLabelChange(newLabel);
  };
  
  return (
    <>
      <InputGroup size="sm">
        <Input
          type="select"
          value={newLabel}
          onChange={handleValueChange}
          onClick={e => e.stopPropagation()}
        >
          {Array.from({ length: 32 }, (_, i) => i + 1).map(num => (
            <option key={num} value={num.toString()}>
              {num}
            </option>
          ))}
        </Input>
      </InputGroup>
      
      <ToothUpdateConfirmationModal
        isOpen={showModal}
        toggle={toggleModal}
        oldToothNumber={currentLabel}
        newToothNumber={newLabel}
        onConfirm={handleBulkUpdate}
        onCancel={handleSingleUpdate}
      />
    </>
  );
};

export default ToothLabelEditor;