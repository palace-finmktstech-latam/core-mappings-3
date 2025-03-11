import React, { useState, useEffect } from 'react';
import { 
  Card, Button, Form, Row, Col, ListGroup, 
  Modal, Alert, Tabs, Tab, Spinner 
} from 'react-bootstrap';
import { getSystemModels, createSystemModel, updateSystemModel, deleteSystemModel } from '../services/systemModels';

const AdminPage = () => {
  // State for system models
  const [systemModels, setSystemModels] = useState([]);
  const [selectedModel, setSelectedModel] = useState(null);
  const [showModelModal, setShowModelModal] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // 'create' or 'edit'
  const [alert, setAlert] = useState(null);
  const [selectedFieldIndex, setSelectedFieldIndex] = useState(null);
  
  // Form state
  const [modelForm, setModelForm] = useState({
    name: '',
    description: '',
    version: '1.0.0',
    fields: []
  });
  
  // Field form state
  const [fieldForm, setFieldForm] = useState({
    name: '',
    data_type: 'string',
    description: '',
    required: false,
    constraints: {
      min_length: '',
      max_length: '',
      format: '',
      min_value: '',
      max_value: '',
      date_format: 'DD-MM-YYYY',
      values: []
    }
  });

  const [expandedSections, setExpandedSections] = useState({
    string: false,
    numeric: false,
    enum: false,
    date: false
  });
  
  // Add this new state for editing fields
  const [editingFieldIndex, setEditingFieldIndex] = useState(null);
  
  // Add state for new enum value input
  const [newEnumValue, setNewEnumValue] = useState('');
  
  // Add state for date format preview
  const [dateFormatPreview, setDateFormatPreview] = useState(
    new Date().toLocaleDateString('en-GB')  // Default preview in DD-MM-YYYY
  );
  
  // Add this state variable to track the active tab
  const [activeTab, setActiveTab] = useState('general');
  
  // Fetch system models on component mount
  useEffect(() => {
    loadSystemModels();
  }, []);
  
  const loadSystemModels = async () => {
    try {
      const models = await getSystemModels();
      setSystemModels(models);
      if (models.length > 0 && !selectedModel) {
        setSelectedModel(models[0]);
      }
    } catch (error) {
      console.error('Error loading system models:', error);
      showAlertMessage('Error loading system models', 'danger');
    }
  };
  
  const showAlertMessage = (message, type = 'info') => {
    setAlert({ message, type });
    setTimeout(() => setAlert(null), 5000);
  };
  
  const toggleSection = (section) => {
    setExpandedSections({
      ...expandedSections,
      [section]: !expandedSections[section]
    });
  };

  const handleModelSelect = (model) => {
    setSelectedModel(model);
  };
  
  const handleCreateModel = () => {
    setModalMode('create');
    setModelForm({
      name: '',
      description: '',
      version: '1.0.0',
      fields: []
    });
    setShowModelModal(true);
  };
  
  const handleEditModel = () => {
    if (!selectedModel) return;
    
    setModalMode('edit');
    setModelForm({
      id: selectedModel.id,
      name: selectedModel.name,
      description: selectedModel.description || '',
      version: selectedModel.version,
      fields: [...selectedModel.fields]
    });
    setShowModelModal(true);
  };
  
  const handleDeleteModel = async () => {
    if (!selectedModel || !window.confirm('Are you sure you want to delete this model?')) return;
    
    try {
      await deleteSystemModel(selectedModel.id);
      showAlertMessage(`System model "${selectedModel.name}" deleted`, 'success');
      loadSystemModels();
      setSelectedModel(null);
    } catch (error) {
      console.error('Error deleting system model:', error);
      showAlertMessage('Error deleting system model', 'danger');
    }
  };
  
  const handleModelFormChange = (e) => {
    const { name, value } = e.target;
    setModelForm({
      ...modelForm,
      [name]: value
    });
  };
  
  const handleFieldFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name.startsWith('constraints.')) {
      // Handle constraints fields
      const constraintName = name.split('.')[1];
      
      // Update the field form
      setFieldForm({
        ...fieldForm,
        constraints: {
          ...fieldForm.constraints,
          [constraintName]: value
        }
      });
      
      // Update date format preview if date_format changed
      if (constraintName === 'date_format') {
        updateDateFormatPreview(value);
      }
    } else {
      // Handle regular fields
      setFieldForm({
        ...fieldForm,
        [name]: type === 'checkbox' ? checked : value
      });
      
      // Reset constraints when data type changes
      if (name === 'data_type') {
        let newConstraints = {};
        
        // Set appropriate default constraints based on data type
        if (value === 'string') {
          newConstraints = { min_length: '', max_length: '', format: '' };
        } else if (value === 'integer' || value === 'decimal') {
          newConstraints = { min_value: '', max_value: '' };
        } else if (value === 'enum') {
          newConstraints = { values: [] };
        } else if (value === 'date') {
          newConstraints = { date_format: 'DD-MM-YYYY' };
          // Update date preview for default format
          updateDateFormatPreview('DD-MM-YYYY');
        }
        
        setFieldForm(prev => ({
          ...prev,
          constraints: newConstraints
        }));
      }
    }
  };
  
  const handleFieldSelect = (index) => {
    setSelectedFieldIndex(index);
    handleEditField(index); // Reuse existing function to populate form
  };

  // Function to update date format preview
  const updateDateFormatPreview = (format) => {
    const now = new Date();
    let preview = '';
    
    try {
      // Convert our format strings to formats that JavaScript Date can understand
      switch (format) {
        case 'DD-MM-YYYY':
          preview = now.toLocaleDateString('en-GB'); // 31-12-2023
          break;
        case 'MM-DD-YYYY':
          preview = now.toLocaleDateString('en-US').replace(/\//g, '-'); // 12-31-2023
          break;
        case 'YYYY-MM-DD':
          preview = now.toISOString().split('T')[0]; // 2023-12-31
          break;
        case 'DD/MM/YYYY':
          preview = now.toLocaleDateString('en-GB').replace(/-/g, '/'); // 31/12/2023
          break;
        case 'MM/DD/YYYY':
          preview = now.toLocaleDateString('en-US'); // 12/31/2023
          break;
        default:
          preview = now.toLocaleDateString('en-GB'); // Default to DD-MM-YYYY
      }
    } catch (e) {
      preview = 'Invalid format';
    }
    
    setDateFormatPreview(preview);
  };
  
  // Add function to handle adding enum values
  const handleAddEnumValue = () => {
    if (!newEnumValue.trim()) {
      showAlertMessage('Enum value cannot be empty', 'danger');
      return;
    }
    
    // Check for duplicate enum values
    if (fieldForm.constraints.values.includes(newEnumValue.trim())) {
      showAlertMessage('Enum value already exists', 'danger');
      return;
    }
    
    // Add the new enum value
    setFieldForm({
      ...fieldForm,
      constraints: {
        ...fieldForm.constraints,
        values: [...fieldForm.constraints.values, newEnumValue.trim()]
      }
    });
    
    // Clear the input
    setNewEnumValue('');
  };
  
  // Add function to handle removing enum values
  const handleRemoveEnumValue = (index) => {
    const updatedValues = [...fieldForm.constraints.values];
    updatedValues.splice(index, 1);
    
    setFieldForm({
      ...fieldForm,
      constraints: {
        ...fieldForm.constraints,
        values: updatedValues
      }
    });
  };
  
  const validateFieldForm = () => {
    // Basic validation
    if (!fieldForm.name.trim()) {
      showAlertMessage('Field name is required', 'danger');
      return false;
    }
    
    // Validate constraints based on data type
    if (fieldForm.data_type === 'string') {
      const { min_length, max_length, format } = fieldForm.constraints;
      
      // Convert to numbers for comparison (empty string becomes NaN)
      const minLen = parseInt(min_length, 10);
      const maxLen = parseInt(max_length, 10);
      
      if (!isNaN(minLen) && !isNaN(maxLen) && minLen > maxLen) {
        showAlertMessage('Minimum length cannot be greater than maximum length', 'danger');
        return false;
      }
      
      if (!isNaN(minLen) && minLen < 0) {
        showAlertMessage('Minimum length cannot be negative', 'danger');
        return false;
      }
      
      // Validate format if provided
      if (format && format.trim()) {
        try {
          // Test if the format is a valid regex pattern
          new RegExp(format);
        } catch (e) {
          showAlertMessage('Invalid format pattern', 'danger');
          return false;
        }
      }
    } else if (fieldForm.data_type === 'integer' || fieldForm.data_type === 'decimal') {
      const { min_value, max_value } = fieldForm.constraints;
      
      // Convert to numbers for comparison
      const minVal = fieldForm.data_type === 'integer' 
        ? parseInt(min_value, 10) 
        : parseFloat(min_value);
      
      const maxVal = fieldForm.data_type === 'integer'
        ? parseInt(max_value, 10)
        : parseFloat(max_value);
      
      if (!isNaN(minVal) && !isNaN(maxVal) && minVal > maxVal) {
        showAlertMessage('Minimum value cannot be greater than maximum value', 'danger');
        return false;
      }
    } else if (fieldForm.data_type === 'enum') {
      // Validate enum values
      if (fieldForm.constraints.values.length === 0) {
        showAlertMessage('Enum must have at least one value', 'danger');
        return false;
      }
    }
    // Date format is selected from a dropdown, so no validation needed
    
    return true;
  };
  
  const handleAddField = () => {
    // Validate field form
    if (!validateFieldForm()) {
      return;
    }
    
    // Check for duplicate field names
    if (modelForm.fields.some(field => field.name === fieldForm.name)) {
      showAlertMessage('Field name must be unique', 'danger');
      return;
    }
    
    // Clean up constraints (remove empty values)
    const cleanedConstraints = {};
    Object.entries(fieldForm.constraints).forEach(([key, value]) => {
      if (key === 'values') {
        if (value.length > 0) {
          cleanedConstraints[key] = value;
        }
      } else if (value !== '' && value !== null) {
        // Convert string numbers to actual numbers
        if (['min_length', 'max_length', 'min_value', 'max_value'].includes(key)) {
          cleanedConstraints[key] = parseInt(value, 10);
        } else {
          cleanedConstraints[key] = value;
        }
      }
    });
    
    // Add field to model form
    setModelForm({
      ...modelForm,
      fields: [...modelForm.fields, { 
        ...fieldForm,
        constraints: Object.keys(cleanedConstraints).length > 0 ? cleanedConstraints : {}
      }]
    });
    
    // Reset field form
    setFieldForm({
      name: '',
      data_type: 'string',
      description: '',
      required: false,
      constraints: {
        min_length: '',
        max_length: '',
        format: '',
        min_value: '',
        max_value: '',
        date_format: 'DD-MM-YYYY',
        values: []
      }
    });
    
    showAlertMessage('Field added successfully', 'success');
  };
  
  const handleRemoveField = (index) => {
    const updatedFields = [...modelForm.fields];
    updatedFields.splice(index, 1);
    setModelForm({
      ...modelForm,
      fields: updatedFields
    });
  };
  
  const handleEditField = (index) => {
    const fieldToEdit = modelForm.fields[index];
    
    // Create default constraints based on data type
    let defaultConstraints = {};
    
    switch(fieldToEdit.data_type) {
      case 'string':
        defaultConstraints = { min_length: '', max_length: '', format: '' };
        break;
      case 'integer':
      case 'decimal':
        defaultConstraints = { min_value: '', max_value: '' };
        break;
      case 'enum':
        defaultConstraints = { values: [] };
        break;
      case 'date':
        defaultConstraints = { date_format: 'DD-MM-YYYY' };
        break;
      default:
        defaultConstraints = {};
    }
    
    // Merge existing constraints with default constraints
    const mergedConstraints = { 
      ...defaultConstraints, 
      ...(fieldToEdit.constraints || {}) 
    };
    
    // Set the field form with the values from the field being edited
    setFieldForm({
      ...fieldToEdit,
      constraints: mergedConstraints
    });
    
    // Update date format preview if it's a date field
    if (fieldToEdit.data_type === 'date' && mergedConstraints.date_format) {
      updateDateFormatPreview(mergedConstraints.date_format);
    }
    
    setEditingFieldIndex(index);
  };
  
  const handleUpdateField = () => {
    // Validate field form
    if (!validateFieldForm()) {
      return;
    }
    
    // Check for duplicate field names (excluding the current field)
    if (modelForm.fields.some((field, idx) => 
        idx !== editingFieldIndex && field.name === fieldForm.name)) {
      showAlertMessage('Field name must be unique', 'danger');
      return;
    }
    
    // Clean up constraints (remove empty values)
    const cleanedConstraints = {};
    Object.entries(fieldForm.constraints).forEach(([key, value]) => {
      if (key === 'values') {
        if (value.length > 0) {
          cleanedConstraints[key] = value;
        }
      } else if (value !== '' && value !== null) {
        // Convert string numbers to actual numbers
        if (['min_length', 'max_length', 'min_value', 'max_value'].includes(key)) {
          cleanedConstraints[key] = parseInt(value, 10);
        } else {
          cleanedConstraints[key] = value;
        }
      }
    });
    
    // Update the field in the model form
    const updatedFields = [...modelForm.fields];
    updatedFields[editingFieldIndex] = { 
      ...fieldForm,
      constraints: Object.keys(cleanedConstraints).length > 0 ? cleanedConstraints : {}
    };
    
    setModelForm({
      ...modelForm,
      fields: updatedFields
    });
    
    // Reset field form and editing state
    setFieldForm({
      name: '',
      data_type: 'string',
      description: '',
      required: false,
      constraints: {
        min_length: '',
        max_length: '',
        format: '',
        min_value: '',
        max_value: '',
        date_format: 'DD-MM-YYYY',
        values: []
      }
    });
    setEditingFieldIndex(null);
    
    // Reset enum value input
    setNewEnumValue('');
    
    showAlertMessage('Field updated successfully', 'success');
  };
  
  const handleCancelFieldEdit = () => {
    setFieldForm({
      name: '',
      data_type: 'string',
      description: '',
      required: false,
      constraints: {
        min_length: '',
        max_length: '',
        format: '',
        min_value: '',
        max_value: '',
        date_format: 'DD-MM-YYYY',
        values: []
      }
    });
    setEditingFieldIndex(null);
  };
  
  const handleSaveModel = async () => {
    // Validate model form
    if (!modelForm.name.trim()) {
      showAlertMessage('Model name is required', 'danger');
      return;
    }
    
    if (modelForm.fields.length === 0) {
      showAlertMessage('At least one field is required', 'danger');
      return;
    }
    
    try {
      let savedModel;
      
      if (modalMode === 'create') {
        savedModel = await createSystemModel(modelForm);
        showAlertMessage(`System model "${savedModel.name}" created`, 'success');
      } else {
        savedModel = await updateSystemModel(modelForm.id, modelForm);
        showAlertMessage(`System model "${savedModel.name}" updated`, 'success');
      }
      
      loadSystemModels();
      setSelectedModel(savedModel);
      setShowModelModal(false);
    } catch (error) {
      console.error('Error saving system model:', error);
      showAlertMessage('Error saving system model', 'danger');
    }
  };
  
  // Add these functions to handle tab navigation
  const handleNextTab = () => {
    if (activeTab === 'general') {
      setActiveTab('fields');
    }
    // No more tabs after 'fields'
  };

  const handlePrevTab = () => {
    if (activeTab === 'fields') {
      setActiveTab('general');
    }
    // No tabs before 'general'
  };
  
  return (
    <div className="admin-page">
      <h5 className="mb-4 text-end fw-bold">Admin</h5>
      
      {alert && !showModelModal && (
        <Alert variant={alert.type} onClose={() => setAlert(null)} dismissible>
          {alert.message}
        </Alert>
      )}
      
      <Row>
        <Col md={4}>
          <Card className="mb-4">
            <Card.Header className="d-flex justify-content-between align-items-center">
              <h5 className="mb-0">System Models</h5>
              <Button variant="primary" size="sm" onClick={handleCreateModel}>
                Create New
              </Button>
            </Card.Header>
            <Card.Body>
              {systemModels.length === 0 ? (
                <p className="text-muted">No system models found. Create one to get started.</p>
              ) : (
                <ListGroup>
                  {systemModels.map(model => (
                    <ListGroup.Item 
                      key={model.id}
                      action
                      active={selectedModel && selectedModel.id === model.id}
                      onClick={() => handleModelSelect(model)}
                    >
                      <div className="d-flex justify-content-between align-items-center">
                        <div>
                          <strong>{model.name}</strong>
                          <div className="small text-muted">v{model.version}</div>
                        </div>
                        <span className="badge bg-primary rounded-pill">
                          {model.fields.length} fields
                        </span>
                      </div>
                    </ListGroup.Item>
                  ))}
                </ListGroup>
              )}
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={8}>
          {selectedModel ? (
            <Card>
              <Card.Header className="d-flex justify-content-between align-items-center">
                <h5 className="mb-0">{selectedModel.name}</h5>
                <div>
                  <Button variant="outline-primary" className="me-2" onClick={handleEditModel}>
                    Edit
                  </Button>
                  <Button variant="outline-danger" onClick={handleDeleteModel}>
                    Delete
                  </Button>
                </div>
              </Card.Header>
              <Card.Body>
                <div className="mb-3">
                  <strong>Description:</strong> {selectedModel.description || 'No description'}
                </div>
                <div className="mb-3">
                  <strong>Version:</strong> {selectedModel.version}
                </div>
                <div className="mb-3">
                  <strong>Last Updated:</strong> {new Date(selectedModel.updated_at).toLocaleString()}
                </div>
                
                <h6 className="mt-4 mb-3">Fields:</h6>
                <ListGroup>
                  {selectedModel.fields.map((field, index) => (
                    <ListGroup.Item key={index}>
                      <div className="d-flex justify-content-between align-items-center">
                        <div>
                          <strong>{field.name}</strong> <span className="text-muted">({field.data_type})</span>
                          {field.required && <span className="badge bg-danger ms-2">Required</span>}
                        </div>
                        <div className="text-muted small">
                          {field.description || 'No description'}
                        </div>
                      </div>
                    </ListGroup.Item>
                  ))}
                </ListGroup>
              </Card.Body>
            </Card>
          ) : (
            <Card className="text-center p-5">
              <Card.Body>
                <p className="text-muted">Select a system model from the list or create a new one.</p>
                <Button variant="primary" onClick={handleCreateModel}>
                  Create New Model
                </Button>
              </Card.Body>
            </Card>
          )}
        </Col>
      </Row>
      
      {/* Model Edit/Create Modal */}
      <Modal show={showModelModal} onHide={() => setShowModelModal(false)} size="xl">
        <Modal.Header closeButton>
          <Modal.Title>
            {modalMode === 'create' ? 'Create New System Model' : `Edit ${modelForm.name}`}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {alert && (
            <Alert variant={alert.type} onClose={() => setAlert(null)} dismissible className="mb-3">
              {alert.message}
            </Alert>
          )}
          
          <Tabs 
            activeKey={activeTab} 
            onSelect={(k) => setActiveTab(k)}
            id="admin-tabs"
          >
            <Tab eventKey="general" title="General Information">
              <Form className="mt-3">
                <Form.Group className="mb-3">
                  <Form.Label>Name</Form.Label>
                  <Form.Control
                    type="text"
                    name="name"
                    value={modelForm.name}
                    onChange={handleModelFormChange}
                    placeholder="e.g., FX Forward"
                  />
                </Form.Group>
                
                <Form.Group className="mb-3">
                  <Form.Label>Description</Form.Label>
                  <Form.Control
                    as="textarea"
                    name="description"
                    value={modelForm.description}
                    onChange={handleModelFormChange}
                    placeholder="Describe the purpose of this model"
                    rows={3}
                  />
                </Form.Group>
                
                <Form.Group className="mb-3">
                  <Form.Label>Version</Form.Label>
                  <Form.Control
                    type="text"
                    name="version"
                    value={modelForm.version}
                    onChange={handleModelFormChange}
                    placeholder="e.g., 1.0.0"
                  />
                </Form.Group>
              </Form>
            </Tab>
            
            <Tab eventKey="fields" title="Fields">
              <div className="mt-3">
                <Row>
                  {/* Left column - Current Fields */}
                  <Col md={6}>
                    <h6 className="mb-3">Current Fields</h6>
                      {modelForm.fields.length === 0 ? (
                        <p className="text-muted">No fields added yet.</p>
                      ) : (
                        <ListGroup className="custom-scrollbar" style={{height: '500px', overflowY: 'auto'}}>
                          {modelForm.fields.map((field, index) => (
                            <ListGroup.Item key={index} action active={selectedFieldIndex === index} onClick={() => handleFieldSelect(index)} className="d-flex justify-content-between align-items-center">
                              <div>
                                <strong>{field.name}</strong> <span className="text-muted">({field.data_type})</span>
                                {field.required && <span className="badge bg-danger ms-2">Required</span>}
                                <div className="small text-muted">{field.description || 'No description'}</div>
                                {field.constraints && field.data_type === 'string' && (
                                  <div className="small text-muted">
                                    {field.constraints.min_length && `Min length: ${field.constraints.min_length}`}
                                    {field.constraints.min_length && field.constraints.max_length && ' | '}
                                    {field.constraints.max_length && `Max length: ${field.constraints.max_length}`}
                                    {(field.constraints.min_length || field.constraints.max_length) && field.constraints.format && ' | '}
                                    {field.constraints.format && `Format: ${field.constraints.format}`}
                                  </div>
                                )}
                                {field.constraints && (field.data_type === 'integer' || field.data_type === 'decimal') && (
                                  <div className="small text-muted">
                                    {field.constraints.min_value !== undefined && `Min value: ${field.constraints.min_value}`}
                                    {field.constraints.min_value !== undefined && field.constraints.max_value !== undefined && ' | '}
                                    {field.constraints.max_value !== undefined && `Max value: ${field.constraints.max_value}`}
                                  </div>
                                )}
                                {field.constraints && field.data_type === 'date' && field.constraints.date_format && (
                                  <div className="small text-muted">
                                    Format: {field.constraints.date_format}
                                  </div>
                                )}
                                {field.constraints && field.data_type === 'enum' && field.constraints.values && (
                                  <div className="small text-muted">
                                    Values: {field.constraints.values.join(', ')}
                                  </div>
                                )}
                              </div>
                            </ListGroup.Item>
                          ))}
                        </ListGroup>
                      )}
                    </Col>

                    {/* Right column - Add/Edit Form */}
                    <Col md={6}>
                    <div className="d-flex justify-content-end mb-3">
                      {selectedFieldIndex !== null && (
                        <>
                          <Button 
                            variant="outline-secondary" 
                            size="sm" 
                            onClick={() => {
                              setSelectedFieldIndex(null);
                              handleCancelFieldEdit();
                            }}
                          >
                            New Field
                          </Button>
                        </>
                      )}
                    </div>
                    <h6 className="mb-3">{editingFieldIndex !== null ? 'Edit Field' : 'Add New Field'}</h6>
                    <Form>
                      <Row>
                        <Col md={4}>
                          <Form.Group className="mb-3">
                            <Form.Label>Name</Form.Label>
                            <Form.Control
                              type="text"
                              name="name"
                              value={fieldForm.name}
                              onChange={handleFieldFormChange}
                              placeholder="e.g., tradeId"
                            />
                          </Form.Group>
                        </Col>
                        
                        <Col md={4}>
                          <Form.Group className="mb-3">
                            <Form.Label>Data Type</Form.Label>
                            <Form.Select
                              name="data_type"
                              value={fieldForm.data_type}
                              onChange={handleFieldFormChange}
                            >
                              <option value="string">String</option>
                              <option value="decimal">Decimal</option>
                              <option value="integer">Integer</option>
                              <option value="date">Date</option>
                              <option value="boolean">Boolean</option>
                              <option value="enum">Enum</option>
                            </Form.Select>
                          </Form.Group>
                        </Col>
                        
                        <Col md={4}>
                          <Form.Group className="mb-3 mt-4">
                            <Form.Check
                              type="checkbox"
                              label="Required"
                              name="required"
                              checked={fieldForm.required}
                              onChange={handleFieldFormChange}
                            />
                          </Form.Group>
                        </Col>
                      </Row>
                      
                      <Form.Group className="mb-3">
                        <Form.Label>Description</Form.Label>
                        <Form.Control
                          type="text"
                          name="description"
                          value={fieldForm.description}
                          onChange={handleFieldFormChange}
                          placeholder="Describe this field"
                        />
                      </Form.Group>
                      
                      {/* Show constraints section only if the Name field is populated */}
                      {fieldForm.name && (
                        <>
                          {/* Add constraints section based on data type */}
                          {fieldForm.data_type === 'string' && (
                            <Card className="mb-3">
                              <Card.Header className="d-flex justify-content-between align-items-center" onClick={() => toggleSection('string')} style={{ cursor: 'pointer' }}>
                                <span>String Constraints</span>
                                <span>{expandedSections.string ? '−' : '+'}</span>
                              </Card.Header>
                              {expandedSections.string && (
                                <Card.Body>
                                  <Row>
                                    <Col md={6}>
                                      <Form.Group className="mb-3">
                                        <Form.Label>Minimum Length</Form.Label>
                                        <Form.Control
                                          type="number"
                                          name="constraints.min_length"
                                          value={fieldForm.constraints.min_length}
                                          onChange={handleFieldFormChange}
                                          placeholder="Optional"
                                          min="0"
                                        />
                                      </Form.Group>
                                    </Col>
                                    <Col md={6}>
                                      <Form.Group className="mb-3">
                                        <Form.Label>Maximum Length</Form.Label>
                                        <Form.Control
                                          type="number"
                                          name="constraints.max_length"
                                          value={fieldForm.constraints.max_length}
                                          onChange={handleFieldFormChange}
                                          placeholder="Optional"
                                          min="0"
                                        />
                                      </Form.Group>
                                    </Col>
                                  </Row>
                                  
                                  <Form.Group className="mb-3">
                                    <Form.Label>Format Pattern</Form.Label>
                                    <Form.Control
                                      type="text"
                                      name="constraints.format"
                                      value={fieldForm.constraints.format}
                                      onChange={handleFieldFormChange}
                                      placeholder="e.g., ^[A-Z]{3}/[A-Z]{3}$ for XXX/XXX format"
                                    />
                                    <Form.Text className="text-muted">
                                      Use regular expression patterns. For example, ^[A-Z]{3}/[A-Z]{3}$ will match three uppercase letters, a slash, and three more uppercase letters (like "USD/EUR").
                                    </Form.Text>
                                  </Form.Group>
                                </Card.Body>
                              )}
                            </Card>
                          )}
                          
                          {fieldForm.data_type === 'enum' && (
                            <Card className="mb-3">
                              <Card.Header className="d-flex justify-content-between align-items-center" onClick={() => toggleSection('string')} style={{ cursor: 'pointer' }}>
                                <span>Enum Values</span>
                                <span>{expandedSections.string ? '−' : '+'}</span>
                              </Card.Header>
                              {expandedSections.string && (
                                <Card.Body>
                                  <Row className="mb-3">
                                    <Col md={8}>
                                      <Form.Control
                                        type="text"
                                        value={newEnumValue}
                                        onChange={(e) => setNewEnumValue(e.target.value)}
                                        placeholder="Enter enum value"
                                        onKeyPress={(e) => {
                                          if (e.key === 'Enter') {
                                            e.preventDefault();
                                            handleAddEnumValue();
                                          }
                                        }}
                                      />
                                    </Col>
                                    <Col md={4}>
                                      <Button 
                                        variant="outline-primary" 
                                        onClick={handleAddEnumValue}
                                        className="w-100"
                                      >
                                        Add Value
                                      </Button>
                                    </Col>
                                  </Row>
                                  
                                  {fieldForm.constraints.values.length === 0 ? (
                                    <p className="text-muted">No enum values added yet.</p>
                                  ) : (
                                    <ListGroup>
                                      {fieldForm.constraints.values.map((value, idx) => (
                                        <ListGroup.Item key={idx} className="d-flex justify-content-between align-items-center">
                                          <span>{value}</span>
                                          <Button 
                                            variant="outline-danger" 
                                            size="sm" 
                                            onClick={() => handleRemoveEnumValue(idx)}
                                          >
                                            Remove
                                          </Button>
                                        </ListGroup.Item>
                                      ))}
                                    </ListGroup>
                                  )}
                                </Card.Body>
                              )}
                            </Card>
                          )}
                          
                          {fieldForm.data_type === 'date' && (
                            <Card className="mb-3">
                              <Card.Header className="d-flex justify-content-between align-items-center" onClick={() => toggleSection('string')} style={{ cursor: 'pointer' }}>
                                <span>Date Format</span>
                                <span>{expandedSections.string ? '−' : '+'}</span>
                              </Card.Header>
                              {expandedSections.string && (
                                <Card.Body>
                                  <Form.Group className="mb-3">
                                    <Form.Label>Date Format</Form.Label>
                                    <Form.Select
                                      name="constraints.date_format"
                                      value={fieldForm.constraints.date_format || 'DD-MM-YYYY'}
                                      onChange={handleFieldFormChange}
                                    >
                                      <option value="DD-MM-YYYY">DD-MM-YYYY</option>
                                      <option value="MM-DD-YYYY">MM-DD-YYYY</option>
                                      <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                                      <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                                      <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                                    </Form.Select>
                                    <Form.Text className="text-muted">
                                      Preview: {dateFormatPreview}
                                    </Form.Text>
                                  </Form.Group>
                                </Card.Body>
                              )}
                            </Card>
                          )}
                          
                          {(fieldForm.data_type === 'integer' || fieldForm.data_type === 'decimal') && (
                            <Card className="mb-3">
                              <Card.Header className="d-flex justify-content-between align-items-center" onClick={() => toggleSection('string')} style={{ cursor: 'pointer' }}>
                                <span>Numeric Constraints</span>
                                <span>{expandedSections.string ? '−' : '+'}</span>
                              </Card.Header>
                              {expandedSections.string && (
                                <Card.Body>
                                  <Row>
                                    <Col md={6}>
                                      <Form.Group className="mb-3">
                                        <Form.Label>Minimum Value</Form.Label>
                                        <Form.Control
                                          type={fieldForm.data_type === 'integer' ? 'number' : 'text'}
                                          name="constraints.min_value"
                                          value={fieldForm.constraints.min_value}
                                          onChange={handleFieldFormChange}
                                          placeholder="Optional"
                                          step={fieldForm.data_type === 'decimal' ? '0.01' : '1'}
                                        />
                                      </Form.Group>
                                    </Col>
                                    <Col md={6}>
                                      <Form.Group className="mb-3">
                                        <Form.Label>Maximum Value</Form.Label>
                                        <Form.Control
                                          type={fieldForm.data_type === 'integer' ? 'number' : 'text'}
                                          name="constraints.max_value"
                                          value={fieldForm.constraints.max_value}
                                          onChange={handleFieldFormChange}
                                          placeholder="Optional"
                                          step={fieldForm.data_type === 'decimal' ? '0.01' : '1'}
                                        />
                                      </Form.Group>
                                    </Col>
                                  </Row>
                                </Card.Body>
                              )}
                            </Card>
                          )}
                        </>
                      )}
                      
                      {selectedFieldIndex !== null ? (
                        <div className="d-flex justify-content-end">
                          <Button variant="primary" size="sm" onClick={handleUpdateField} className="me-2">
                            Update Field
                          </Button>
                          <Button 
                            variant="outline-danger" 
                            size="sm" 
                            onClick={() => {
                              handleRemoveField(selectedFieldIndex);
                              setSelectedFieldIndex(null);
                              handleCancelFieldEdit();
                            }}
                            className="me-2"
                          >
                            Remove Field
                          </Button>
                        </div>
                      ) : (
                        <div className="d-flex justify-content-end">
                          <Button variant="primary" size="sm" onClick={handleAddField}>
                            Add Field
                          </Button>
                        </div>
                      )}
                    </Form>
                  </Col>
                </Row>
              </div>
            </Tab>
          </Tabs>
          
          {/* Tab Navigation Buttons */}
          <div className="d-flex justify-content-end mt-4">
            <Button 
              variant="outline-secondary" 
              onClick={() => setShowModelModal(false)}
              className="me-2"
            >
              Cancel
            </Button>
            <Button 
              variant="outline-secondary" 
              onClick={handlePrevTab}
              disabled={activeTab === 'general'}
              className="me-2"
            >
              <i className="bi bi-arrow-left me-1"></i> Back
            </Button>
            <Button 
              variant="outline-secondary" 
              onClick={handleNextTab}
              disabled={activeTab === 'fields'}
              className="me-2"
            >
              <i className="bi bi-arrow-right me-1"></i> Next
            </Button>
            <Button 
              variant="primary" 
              onClick={handleSaveModel}
            >
              Save System Model
            </Button>
          </div>
        </Modal.Body>
      </Modal>
    </div>
  );
};

export default AdminPage;