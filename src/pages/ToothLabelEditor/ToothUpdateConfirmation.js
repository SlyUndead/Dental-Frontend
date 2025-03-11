import React, { useState, useEffect } from 'react';
import { 
  Modal, 
  ModalHeader, 
  ModalBody, 
  ModalFooter, 
  Button,
  Alert
} from 'reactstrap';

/**
 * Confirmation popup for updating tooth numbers
 * 
 * @param {Object} props
 * @param {boolean} props.isOpen - Controls modal visibility
 * @param {Function} props.toggle - Function to toggle modal visibility
 * @param {string} props.oldToothNumber - Original tooth number before change
 * @param {string} props.newToothNumber - New tooth number selected by user
 * @param {Function} props.onConfirm - Callback function when user confirms update
 * @param {Function} props.onCancel - Callback function when user cancels update
 * @param {Array} props.annotations - Current annotations from parent component
 * @returns {React.Component}
 */
const ToothUpdateConfirmation = ({
  isOpen,
  toggle,
  oldToothNumber,
  newToothNumber,
  onConfirm,
  onCancel,
  annotations
}) => {
  const [affectedTeeth, setAffectedTeeth] = useState([]);
  const [jawType, setJawType] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (oldToothNumber && newToothNumber) {
      const oldNum = parseInt(oldToothNumber);
      const newNum = parseInt(newToothNumber);
      
      // Check if we're moving between upper and lower jaw
      const oldJaw = oldNum <= 16 ? 'upper' : 'lower';
      const newJaw = newNum <= 16 ? 'upper' : 'lower';
      
      if (oldJaw !== newJaw) {
        // We're changing jaws, find all teeth in the old jaw
        const jawRange = oldJaw === 'upper' ? [1, 16] : [17, 32];
        
        // Get all tooth annotations in the current jaw
        const teethInJaw = annotations
          .filter(anno => {
            const numLabel = parseInt(anno.label);
            return !isNaN(numLabel) && 
                   numLabel >= jawRange[0] && 
                   numLabel <= jawRange[1];
          })
          .map(anno => anno.label);
        
        setAffectedTeeth(teethInJaw);
        setJawType(oldJaw);
        setError('');
      } else {
        // Not changing jaws, so no need to show confirmation
        setError('No jaw change detected. Only show this confirmation when changing between upper and lower jaw.');
      }
    }
  }, [oldToothNumber, newToothNumber, annotations]);

  const handleConfirm = () => {
    // Calculate the offset between old and new tooth numbers
    const oldNum = parseInt(oldToothNumber);
    const newNum = parseInt(newToothNumber);
    const isMovingUp = oldNum > 16 && newNum <= 16;
    const isMovingDown = oldNum <= 16 && newNum > 16;
    
    // Calculate the adjustment needed
    let adjustment;
    if (isMovingUp) {
      // Moving from lower to upper jaw
      adjustment = newNum - oldNum;
    } else if (isMovingDown) {
      // Moving from upper to lower jaw
      adjustment = newNum - oldNum;
    }

    onConfirm(affectedTeeth, adjustment);
  };

  return (
    <Modal isOpen={isOpen} toggle={toggle} backdrop="static">
      <ModalHeader toggle={toggle}>Update Tooth Numbers</ModalHeader>
      <ModalBody>
        {error ? (
          <Alert color="warning">{error}</Alert>
        ) : (
          <>
            <p>
              You're changing tooth #{oldToothNumber} to #{newToothNumber}, which moves it from 
              the {jawType === 'upper' ? 'upper' : 'lower'} jaw to the {jawType === 'upper' ? 'lower' : 'upper'} jaw.
            </p>
            <p>
              Would you like to update all teeth in the {jawType} jaw to maintain the relative positions?
            </p>
            <p>This will affect the following teeth:</p>
            <ul>
              {affectedTeeth.map(tooth => (
                <li key={tooth}>Tooth #{tooth}</li>
              ))}
            </ul>
          </>
        )}
      </ModalBody>
      <ModalFooter>
        {!error && (
          <>
            <Button color="primary" onClick={handleConfirm}>
              Yes, Update All Teeth
            </Button>{' '}
            <Button color="secondary" onClick={onCancel}>
              No, Only Update Selected Tooth
            </Button>
          </>
        )}
        {error && (
          <Button color="primary" onClick={toggle}>
            Close
          </Button>
        )}
      </ModalFooter>
    </Modal>
  );
};

export default ToothUpdateConfirmation;