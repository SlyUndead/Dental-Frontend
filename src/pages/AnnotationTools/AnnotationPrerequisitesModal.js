import React, { useState, useEffect } from 'react';
import {
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Form,
  FormGroup,
  Label,
  Input,
  Row,
  Col,
  Alert
} from 'reactstrap';

const AnnotationPrerequisitesModal = ({
  isOpen,
  toggle,
  annotation,
  apiUrl,
  sessionManager,
  onSave,
  isGeneratingPlan = false,
  associatedTooth,
  // New props for auto-filling patient data
  patientData = {} // { gender, age, etc. }
}) => {
  const [prerequisites, setPrerequisites] = useState(null);
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  // Fields that should be auto-filled and non-editable
  const autoFillFields = [
    'gender', 'age', 'tooth', 'teeth', 'teeth affected', 'tooth affected',
    'tooth number', 'teeth involved', 'tooth involved', 'root location', 
    'associated tooth'
  ];

  // Fetch prerequisites when modal opens and annotation changes
  useEffect(() => {
    if (isOpen && annotation) {
      fetchPrerequisites();
    }
  }, [isOpen, annotation]);

  const fetchPrerequisites = async () => {
    if (!annotation) return;
    
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${apiUrl}/get-anomaly-prerequisites?name=${encodeURIComponent(annotation.label)}`, {
        method: 'GET',
        headers: {
          'Authorization': sessionManager.getItem('token'),
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setPrerequisites(data.user1.requisites);
      
      // Initialize form data with default values and auto-fill data
      initializeFormData(data.user1.requisites);
    } catch (err) {
      console.error('Error fetching prerequisites:', err);
      setError('Failed to load prerequisites for this anomaly');
    } finally {
      setLoading(false);
    }
  };

  const getAutoFillValue = (fieldName) => {
    const lowerFieldName = fieldName.toLowerCase();
    
    // Handle tooth/teeth related fields - all should use associatedTooth
    if (lowerFieldName.includes('tooth') || 
        lowerFieldName.includes('teeth') || 
        lowerFieldName.includes('location') ||
        lowerFieldName.includes('root')) {
      return associatedTooth || '';
    }
    
    // Handle other patient data fields
    if (lowerFieldName === 'gender') {
      return patientData.gender || '';
    }
    
    if (lowerFieldName === 'age') {
      return patientData.age || '';
    }
    
    // Add more field mappings as needed
    return patientData[lowerFieldName] || patientData[fieldName] || '';
  };

  const isAutoFillField = (fieldName) => {
    const lowerFieldName = fieldName.toLowerCase();
    return autoFillFields.some(autoField => 
      lowerFieldName === autoField.toLowerCase()
    );
  };

  const initializeFormData = (data) => {
    const initialData = {};
    
    Object.keys(data).forEach(key => {
      if (key === 'name') return; // Skip the name field
      
      const value = data[key];
      
      // Check if this field should be auto-filled
      if (isAutoFillField(key)) {
        initialData[key] = getAutoFillValue(key);
      } else {
        // Original logic for other fields
        if (Array.isArray(value)) {
          // For array fields (dropdown options), set empty string as default
          initialData[key] = '';
        } else if (typeof value === 'string' && value === 'boolean') {
          // For boolean fields, set false as default
          initialData[key] = false;
        } else if (typeof value === 'boolean') {
          // Direct boolean values
          initialData[key] = false;
        }
      }
    });
    setFormData(initialData);
  };

  const handleInputChange = (fieldName, value) => {
    // Prevent changes to auto-fill fields
    if (isAutoFillField(fieldName)) {
      return;
    }
    
    setFormData(prev => ({
      ...prev,
      [fieldName]: value
    }));
  };

  const handleSave = async () => {
    if (onSave) {
      setSaving(true);
      try {
        await onSave(annotation, formData, prerequisites);
        // Don't close the modal immediately - let the parent component handle it
        // after the treatment plan is generated
      } catch (error) {
        console.error('Error saving prerequisites:', error);
        setError('Failed to save prerequisites and generate treatment plan');
      } finally {
        setSaving(false);
      }
    }
  };

  const renderFormField = (fieldName, fieldValue) => {
    if (fieldName === 'name') return null;

    const isAutoFill = isAutoFillField(fieldName);

    return (
      <FormGroup key={fieldName}>
        <Label for={fieldName}>
          {fieldName}
        </Label>
        {Array.isArray(fieldValue) ? (
          // Render dropdown for array values
          <Input
            type="select"
            id={fieldName}
            value={formData[fieldName] || ''}
            onChange={(e) => handleInputChange(fieldName, e.target.value)}
            disabled={saving || isGeneratingPlan || isAutoFill}
            style={isAutoFill ? { backgroundColor: '#f8f9fa', cursor: 'not-allowed' } : {}}
          >
            <option value="">Select {fieldName}</option>
            {fieldValue.map((option, index) => (
              <option key={index} value={option}>
                {option}
              </option>
            ))}
          </Input>
        ) : (fieldValue === 'boolean' || typeof fieldValue === 'boolean') ? (
          // Render checkbox for boolean values
          <div>
            <Input
              type="checkbox"
              id={fieldName}
              checked={formData[fieldName] || false}
              onChange={(e) => handleInputChange(fieldName, e.target.checked)}
              style={{marginRight:'5px'}}
              disabled={saving || isGeneratingPlan || isAutoFill}
            />
            <Label for={fieldName} className="ml-2">
              {fieldName}
            </Label>
          </div>
        ) : (
          // Render text input for other types
          <Input
            type="text"
            id={fieldName}
            value={formData[fieldName] || ''}
            onChange={(e) => handleInputChange(fieldName, e.target.value)}
            placeholder={`Enter ${fieldName}`}
            disabled={saving || isGeneratingPlan || isAutoFill}
            style={isAutoFill ? { backgroundColor: '#f8f9fa', cursor: 'not-allowed' } : {}}
          />
        )}
      </FormGroup>
    );
  };

  return (
    <Modal isOpen={isOpen} toggle={!saving && !isGeneratingPlan ? toggle : undefined} size="lg">
      <ModalHeader toggle={!saving && !isGeneratingPlan ? toggle : undefined}>
        Anomaly Prerequisites - {annotation?.label || 'Unknown'}
      </ModalHeader>
      <ModalBody>
        {loading && (
          <div className="text-center">
            <div className="spinner-border" role="status">
              <span className="sr-only">Loading...</span>
            </div>
            <p className="mt-2">Loading prerequisites...</p>
          </div>
        )}

        {(saving || isGeneratingPlan) && (
          <div className="text-center mb-3">
            <div className="spinner-border" role="status">
              <span className="sr-only">Processing...</span>
            </div>
            <p className="mt-2">
              {saving ? "Saving prerequisites..." : "Generating treatment plan..."}
            </p>
          </div>
        )}

        {error && (
          <Alert color="danger">
            {error}
          </Alert>
        )}

        {prerequisites && !loading && (
          <div>
            <Row>
              <Col md={6}>
                <h6 className="mb-3">Anomaly: {prerequisites.name}</h6>
              </Col>
              <Col md={6}>
                <h6 className="mb-3">Associated Tooth: {associatedTooth || 'N/A'}</h6>
              </Col>
            </Row>
            
            <Row>
              {Object.entries(prerequisites).map(([key, value], index) => (
                <Col md={6} key={key}>
                  {renderFormField(key, value)}
                </Col>
              ))}
            </Row>
          </div>
        )}

        {!prerequisites && !loading && !error && (
          <Alert color="info">
            No prerequisites found for this anomaly.
          </Alert>
        )}
      </ModalBody>
      <ModalFooter>
        <Button 
          color="secondary" 
          onClick={toggle}
          disabled={saving || isGeneratingPlan}
        >
          Cancel
        </Button>
        <Button 
          color="primary" 
          onClick={handleSave}
          disabled={loading || error || !prerequisites || saving || isGeneratingPlan}
        >
          {saving || isGeneratingPlan 
            ? "Processing..." 
            : "Save & Add to Treatment Plan"
          }
        </Button>
      </ModalFooter>
    </Modal>
  );
};

export default AnnotationPrerequisitesModal;