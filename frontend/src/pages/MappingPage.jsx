// src/pages/MappingPage.jsx
import React, { useState, useEffect } from 'react';
import {
  Card, Button, Form, Row, Col, ListGroup, Table,
  Modal, Alert, Tabs, Tab, Spinner, Dropdown
} from 'react-bootstrap';
import { 
  getMappings, createMapping, updateMapping, deleteMapping, 
  testMapping, uploadSampleFile 
} from '../services/mappings';
import { getSystemModels } from '../services/systemModels';

const MappingPage = () => {
  // State
  const [mappings, setMappings] = useState([]);
  const [systemModels, setSystemModels] = useState([]);
  const [selectedMapping, setSelectedMapping] = useState(null);
  const [showMappingModal, setShowMappingModal] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // 'create' or 'edit'
  const [alert, setAlert] = useState(null);
  const [loading, setLoading] = useState(false);
  const [testResults, setTestResults] = useState(null);
  const [showTestModal, setShowTestModal] = useState(false);
  const [selectedSourceField, setSelectedSourceField] = useState(null);
  const [selectedTargetField, setSelectedTargetField] = useState(null);
  const [highlightedSourceIndex, setHighlightedSourceIndex] = useState(null);
  const [highlightedTargetIndex, setHighlightedTargetIndex] = useState(null);
  
  // Form state
  const [mappingForm, setMappingForm] = useState({
    name: '',
    description: '',
    bank_id: '',
    system_model_id: '',
    source_fields: [],
    mappings: []
  });
  
  // File upload state
  const [selectedFile, setSelectedFile] = useState(null);
  
  // Test data state
  const [testData, setTestData] = useState('{}');
  
  // Add this new state for editing fields
  const [editingFieldIndex, setEditingFieldIndex] = useState(null);
  
  // Add this new state for editing field form
  const [fieldForm, setFieldForm] = useState({
    name: '',
    data_type: 'string',
    description: '',
    required: false,
    constraints: {}
  });
  
  // Fetch data on component mount
  useEffect(() => {
    loadData();
  }, []);
  
  const loadData = async () => {
    setLoading(true);
    try {
      const [mappingsData, modelsData] = await Promise.all([
        getMappings(),
        getSystemModels()
      ]);
      
      setMappings(mappingsData);
      setSystemModels(modelsData);
      
      if (mappingsData.length > 0 && !selectedMapping) {
        setSelectedMapping(mappingsData[0]);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      showAlertMessage('Error loading data', 'danger');
    } finally {
      setLoading(false);
    }
  };
  
  const showAlertMessage = (message, type = 'info') => {
    setAlert({ message, type });
    setTimeout(() => setAlert(null), 5000);
  };
  
  const handleMappingSelect = (mapping) => {
    setSelectedMapping(mapping);
    setTestResults(null);
  };
  
  const handleCreateMapping = () => {
    setModalMode('create');
    setMappingForm({
      name: '',
      description: '',
      bank_id: '',
      system_model_id: systemModels.length > 0 ? systemModels[0].id : '',
      source_fields: [],
      mappings: []
    });
    setSelectedFile(null);
    setShowMappingModal(true);
  };
  
  const handleEditMapping = () => {
    if (!selectedMapping) return;
    
    setModalMode('edit');
    setMappingForm({
      id: selectedMapping.id,
      name: selectedMapping.name,
      description: selectedMapping.description || '',
      bank_id: selectedMapping.bank_id,
      system_model_id: selectedMapping.system_model_id,
      source_fields: [...selectedMapping.source_fields],
      mappings: [...selectedMapping.mappings]
    });
    setShowMappingModal(true);
  };
  
  const handleDeleteMapping = async () => {
    if (!selectedMapping || !window.confirm('Are you sure you want to delete this mapping?')) return;
    
    try {
      await deleteMapping(selectedMapping.id);
      showAlertMessage(`Mapping "${selectedMapping.name}" deleted`, 'success');
      loadData();
      setSelectedMapping(null);
    } catch (error) {
      console.error('Error deleting mapping:', error);
      showAlertMessage('Error deleting mapping', 'danger');
    }
  };
  
  const handleMappingFormChange = (e) => {
    const { name, value } = e.target;
    setMappingForm({
      ...mappingForm,
      [name]: value
    });
  };
  
  const handleFileChange = (e) => {
    setSelectedFile(e.target.files[0]);
  };
  
  const handleUploadFile = async () => {
    if (!selectedFile) {
      showAlertMessage('Please select a file first', 'warning');
      return;
    }
    
    setLoading(true);
    try {
      const result = await uploadSampleFile(selectedFile);
      
      if (result.fields && result.fields.length > 0) {
        setMappingForm({
          ...mappingForm,
          source_fields: result.fields
        });
        
        showAlertMessage(`Successfully extracted ${result.fields.length} fields from the file`, 'success');
      } else {
        showAlertMessage('No fields found in the file', 'warning');
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      showAlertMessage('Error processing file', 'danger');
    } finally {
      setLoading(false);
    }
  };
  
  const handleAddMapping = (sourceField, targetField) => {
    // Check if mapping already exists
    const existingIndex = mappingForm.mappings.findIndex(
      m => m.source_field === sourceField.name && m.target_field === targetField.name
    );
    
    if (existingIndex >= 0) {
      showAlertMessage('This mapping already exists', 'warning');
      return;
    }
    
    // Add the mapping
    setMappingForm({
      ...mappingForm,
      mappings: [
        ...mappingForm.mappings,
        {
          source_field: sourceField.name,
          target_field: targetField.name
        }
      ]
    });
  };
  
  const handleRemoveMapping = (index) => {
    const updatedMappings = [...mappingForm.mappings];
    updatedMappings.splice(index, 1);
    
    setMappingForm({
      ...mappingForm,
      mappings: updatedMappings
    });
  };
  
  const handleAddTransformation = (index, transformationType) => {
    const updatedMappings = [...mappingForm.mappings];
    
    updatedMappings[index] = {
      ...updatedMappings[index],
      transformation: {
        type: transformationType,
        params: transformationType === 'enum_map' ? { mapping: {} } : {}
      }
    };
    
    setMappingForm({
      ...mappingForm,
      mappings: updatedMappings
    });
  };
  
  const handleRemoveTransformation = (index) => {
    const updatedMappings = [...mappingForm.mappings];
    
    delete updatedMappings[index].transformation;
    
    setMappingForm({
      ...mappingForm,
      mappings: updatedMappings
    });
  };
  
  const handleUpdateTransformationParams = (mappingIndex, params) => {
    const updatedMappings = [...mappingForm.mappings];
    
    if (updatedMappings[mappingIndex].transformation) {
      updatedMappings[mappingIndex].transformation.params = {
        ...updatedMappings[mappingIndex].transformation.params,
        ...params
      };
      
      setMappingForm({
        ...mappingForm,
        mappings: updatedMappings
      });
    }
  };
  
  const handleSaveMapping = async () => {
    // Validate mapping form
    if (!mappingForm.name.trim()) {
      showAlertMessage('Mapping name is required', 'danger');
      return;
    }
    
    if (!mappingForm.bank_id.trim()) {
      showAlertMessage('Bank ID is required', 'danger');
      return;
    }
    
    if (!mappingForm.system_model_id) {
      showAlertMessage('System model is required', 'danger');
      return;
    }
    
    if (mappingForm.source_fields.length === 0) {
      showAlertMessage('Source fields are required. Please upload a sample file.', 'danger');
      return;
    }
    
    if (mappingForm.mappings.length === 0) {
      showAlertMessage('At least one field mapping is required', 'danger');
      return;
    }
    
    try {
      let savedMapping;
      
      if (modalMode === 'create') {
        savedMapping = await createMapping(mappingForm);
        showAlertMessage(`Mapping "${savedMapping.name}" created`, 'success');
      } else {
        console.log('Updating mapping:', mappingForm);
        savedMapping = await updateMapping(mappingForm.id, mappingForm);
        showAlertMessage(`Mapping "${savedMapping.name}" updated`, 'success');
      }
      
      loadData();
      setSelectedMapping(savedMapping);
      setShowMappingModal(false);
    } catch (error) {
      console.error('Error saving mapping:', error);
      showAlertMessage('Error saving mapping: ' + error, 'danger');
    }
  };
  
  const handleShowTestModal = () => {
    if (!selectedMapping) return;
    
    setTestData('{\n  "SAMPLE_FIELD": "sample value"\n}');
    setTestResults(null);
    setShowTestModal(true);
  };
  
  const handleRunTest = async () => {
    if (!selectedMapping) return;
    
    try {
      let parsedData;
      try {
        parsedData = JSON.parse(testData);
      } catch (e) {
        showAlertMessage('Invalid JSON in test data', 'danger');
        return;
      }
      
      setLoading(true);
      const results = await testMapping(selectedMapping.id, parsedData);
      setTestResults(results);
    } catch (error) {
      console.error('Error running test:', error);
      showAlertMessage('Error running test', 'danger');
    } finally {
      setLoading(false);
    }
  };
  
  // Find a system model by ID
  const getSystemModelById = (id) => {
    return systemModels.find(model => model.id === id) || null;
  };
  
  // Get target fields for the selected system model
  const getTargetFields = () => {
    const model = mappingForm.system_model_id 
      ? getSystemModelById(mappingForm.system_model_id)
      : null;
    
    return model ? model.fields : [];
  };
  
  // Render transformation parameters form based on type
  const renderTransformationForm = (mapping, index) => {
    if (!mapping.transformation) return null;
    
    const { type, params = {} } = mapping.transformation;
    
    switch (type) {
      case 'format_date':
        return (
          <div className="mt-2">
            <Row>
              <Col>
                <Form.Group>
                  <Form.Label>Source Format</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="e.g., dd/MM/yyyy"
                    value={params.source_format || ''}
                    onChange={(e) => handleUpdateTransformationParams(index, { source_format: e.target.value })}
                  />
                  <Form.Text className="text-muted">
                    Format of the date in the source data
                  </Form.Text>
                </Form.Group>
              </Col>
              <Col>
                <Form.Group>
                  <Form.Label>Target Format</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="e.g., yyyy-MM-dd"
                    value={params.target_format || ''}
                    onChange={(e) => handleUpdateTransformationParams(index, { target_format: e.target.value })}
                  />
                  <Form.Text className="text-muted">
                    Format of the date in the target data
                  </Form.Text>
                </Form.Group>
              </Col>
            </Row>
          </div>
        );
        
      case 'enum_map':
        return (
          <div className="mt-2">
            <Form.Label>Value Mappings</Form.Label>
            {Object.entries(params.mapping || {}).map(([sourceValue, targetValue], i) => (
              <Row key={i} className="mb-2">
                <Col>
                  <Form.Control
                    type="text"
                    placeholder="Source value"
                    value={sourceValue}
                    onChange={(e) => {
                      const newMapping = { ...params.mapping };
                      const oldValue = targetValue;
                      delete newMapping[sourceValue];
                      newMapping[e.target.value] = oldValue;
                      handleUpdateTransformationParams(index, { mapping: newMapping });
                    }}
                  />
                </Col>
                <Col xs="auto">
                  <div className="pt-2">→</div>
                </Col>
                <Col>
                  <Form.Control
                    type="text"
                    placeholder="Target value"
                    value={targetValue}
                    onChange={(e) => {
                      const newMapping = { ...params.mapping };
                      newMapping[sourceValue] = e.target.value;
                      handleUpdateTransformationParams(index, { mapping: newMapping });
                    }}
                  />
                </Col>
                <Col xs="auto">
                  <Button 
                    variant="outline-danger"
                    size="sm"
                    onClick={() => {
                      const newMapping = { ...params.mapping };
                      delete newMapping[sourceValue];
                      handleUpdateTransformationParams(index, { mapping: newMapping });
                    }}
                  >
                    Remove
                  </Button>
                </Col>
              </Row>
            ))}
            <Button
              variant="outline-primary"
              size="sm"
              onClick={() => {
                const newMapping = { ...params.mapping, '': '' };
                handleUpdateTransformationParams(index, { mapping: newMapping });
              }}
            >
              Add Value Mapping
            </Button>
          </div>
        );
        
      case 'split':
        return (
          <div className="mt-2">
            <Row>
              <Col>
                <Form.Group>
                  <Form.Label>Delimiter</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="e.g., ,"
                    value={params.delimiter || ''}
                    onChange={(e) => handleUpdateTransformationParams(index, { delimiter: e.target.value })}
                  />
                </Form.Group>
              </Col>
              <Col>
                <Form.Group>
                  <Form.Label>Index (0-based)</Form.Label>
                  <Form.Control
                    type="number"
                    placeholder="e.g., 0"
                    value={params.index || 0}
                    onChange={(e) => handleUpdateTransformationParams(index, { index: parseInt(e.target.value, 10) })}
                  />
                </Form.Group>
              </Col>
            </Row>
          </div>
        );
        
      default:
        return <div className="mt-2 text-muted small">No parameters needed for this transformation type.</div>;
    }
  };
  
  const handleEditField = (index) => {
    // Set the field form with the values from the field being edited
    setFieldForm({
      ...mappingForm.source_fields[index]
    });
    setEditingFieldIndex(index);
  };
  
  const handleUpdateField = () => {
    // Validate field form
    if (!fieldForm.name.trim()) {
      showAlertMessage('Field name is required', 'danger');
      return;
    }
    
    // Check for duplicate field names (excluding the current field)
    if (mappingForm.source_fields.some((field, idx) => 
        idx !== editingFieldIndex && field.name === fieldForm.name)) {
      showAlertMessage('Field name must be unique', 'danger');
      return;
    }
    
    // Update the field in the mapping form
    const updatedFields = [...mappingForm.source_fields];
    updatedFields[editingFieldIndex] = { ...fieldForm };
    
    // Update any mappings that use this field
    const oldFieldName = mappingForm.source_fields[editingFieldIndex].name;
    const newFieldName = fieldForm.name;
    
    let updatedMappings = [...mappingForm.mappings];
    if (oldFieldName !== newFieldName) {
      updatedMappings = mappingForm.mappings.map(mapping => {
        if (mapping.source_field === oldFieldName) {
          return { ...mapping, source_field: newFieldName };
        }
        return mapping;
      });
    }
    
    setMappingForm({
      ...mappingForm,
      source_fields: updatedFields,
      mappings: updatedMappings
    });
    
    // Reset field form and editing state
    setFieldForm({
      name: '',
      data_type: 'string',
      description: '',
      required: false,
      constraints: {}
    });
    setEditingFieldIndex(null);
    
    showAlertMessage('Field updated successfully', 'success');
  };
  
  const handleCancelFieldEdit = () => {
    setFieldForm({
      name: '',
      data_type: 'string',
      description: '',
      required: false,
      constraints: {}
    });
    setEditingFieldIndex(null);
  };
  
  const handleFieldFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFieldForm({
      ...fieldForm,
      [name]: type === 'checkbox' ? checked : value
    });
  };
  
  const handleAddField = () => {
    // Validate field form
    if (!fieldForm.name.trim()) {
      showAlertMessage('Field name is required', 'danger');
      return;
    }
    
    // Check for duplicate field names
    if (mappingForm.source_fields.some(field => field.name === fieldForm.name)) {
      showAlertMessage('Field name must be unique', 'danger');
      return;
    }
    
    // Add field to mapping form
    setMappingForm({
      ...mappingForm,
      source_fields: [...mappingForm.source_fields, { ...fieldForm }]
    });
    
    // Reset field form
    setFieldForm({
      name: '',
      data_type: 'string',
      description: '',
      required: false,
      constraints: {}
    });
    
    showAlertMessage('Field added successfully', 'success');
  };
  
  const handleRemoveField = (index) => {
    // Check if this field is used in any mappings
    const fieldName = mappingForm.source_fields[index].name;
    const isUsedInMapping = mappingForm.mappings.some(mapping => 
      mapping.source_field === fieldName
    );
    
    if (isUsedInMapping) {
      showAlertMessage(
        'This field is used in one or more mappings. Remove those mappings first.',
        'danger'
      );
      return;
    }
    
    // Remove the field
    const updatedFields = [...mappingForm.source_fields];
    updatedFields.splice(index, 1);
    
    setMappingForm({
      ...mappingForm,
      source_fields: updatedFields
    });
    
    showAlertMessage('Field removed successfully', 'success');
  };
  
  return (
    <div className="mapping-page">
      <h5 className="mb-4 text-end fw-bold">Data Mapping</h5>
      
      {alert && !showMappingModal && !showTestModal && (
        <Alert variant={alert.type} onClose={() => setAlert(null)} dismissible>
          {alert.message}
        </Alert>
      )}
      
      {loading && (
        <div className="text-center my-4">
          <Spinner animation="border" role="status">
            <span className="visually-hidden">Loading...</span>
          </Spinner>
        </div>
      )}
      
      <Row>
        <Col md={4}>
          <Card className="mb-4">
            <Card.Header className="d-flex justify-content-between align-items-center">
              <h5 className="mb-0">Mapping Configurations</h5>
              <Button variant="primary" size="sm" onClick={handleCreateMapping}>
                Create New
              </Button>
            </Card.Header>
            <Card.Body>
              {mappings.length === 0 ? (
                <p className="text-muted">No mappings found. Create one to get started.</p>
              ) : (
                <ListGroup>
                  {mappings.map(mapping => (
                    <ListGroup.Item 
                      key={mapping.id}
                      action
                      active={selectedMapping && selectedMapping.id === mapping.id}
                      onClick={() => handleMappingSelect(mapping)}
                    >
                      <div className="d-flex justify-content-between align-items-center">
                        <div>
                          <strong>{mapping.name}</strong>
                          <div className="small text-muted">Entity: {mapping.bank_id}</div>
                          <div className="small text-muted">System Model: {getSystemModelById(mapping.system_model_id)?.name + " v" + getSystemModelById(mapping.system_model_id)?.version || 'Unknown'}</div>
                          
                        </div>
                        <span className="badge bg-primary rounded-pill">
                          {mapping.mappings.length} mappings
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
          {selectedMapping ? (
            <Card>
              <Card.Header className="d-flex justify-content-between align-items-center">
                <h5 className="mb-0">{selectedMapping.name}</h5>
                <div>
                  <Button variant="outline-primary" className="me-2" onClick={handleShowTestModal}>
                    Test
                  </Button>
                  <Button variant="outline-primary" className="me-2" onClick={handleEditMapping}>
                    Edit
                  </Button>
                  <Button variant="outline-danger" onClick={handleDeleteMapping}>
                    Delete
                  </Button>
                </div>
              </Card.Header>
              <Card.Body>
                <div className="mb-3">
                  <strong>Description:</strong> {selectedMapping.description || 'No description'}
                </div>
                <div className="mb-3">
                  <strong>Entity ID:</strong> {selectedMapping.bank_id}
                </div>
                <div className="mb-3">
                  <strong>System Model:</strong> {
                    getSystemModelById(selectedMapping.system_model_id)?.name + " v" + getSystemModelById(selectedMapping.system_model_id)?.version || 'Unknown'
                  }
                </div>
                <div className="mb-3">
                <strong>Last Updated:</strong>
                  {new Date(selectedMapping.updated_at).toLocaleDateString('en-GB', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric'
                  })} {new Date(selectedMapping.updated_at).toLocaleTimeString()}
                </div>
                
                <h6 className="mt-4 mb-3">Field Mappings:</h6>
                <Table striped bordered dark className='small' size='sm'>
                  <thead>
                    <tr>
                      <th>Source Field</th>
                      <th>Target Field</th>
                      <th>Transformation</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedMapping.mappings.map((mapping, index) => (
                      <tr key={index}>
                        <td>{mapping.source_field}</td>
                        <td>{mapping.target_field}</td>
                        <td>
                          {mapping.transformation ? (
                            <div>
                              <span className="badge bg-info">{mapping.transformation.type}</span>
                              {mapping.transformation.type === 'enum_map' && (
                                <div className="small mt-1">
                                  {Object.entries(mapping.transformation.params?.mapping || {}).map(([s, t], i) => (
                                    <div key={i}>{s} → {t}</div>
                                  ))}
                                </div>
                              )}
                              {mapping.transformation.type === 'format_date' && (
                                <div className="small mt-1">
                                  {mapping.transformation.params?.source_format || 'dd/MM/yyyy'} → {mapping.transformation.params?.target_format || 'yyyy-MM-dd'}
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-muted">Direct mapping</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
                
                {testResults && (
                  <div className="mt-4">
                    <h6 className="mb-3">Test Results:</h6>
                    <Row>
                      <Col md={6}>
                        <h6>Input:</h6>
                        <pre className="border p-2 bg-light text-dark">
                          {JSON.stringify(testResults.input, null, 2)}
                        </pre>
                      </Col>
                      <Col md={6}>
                        <h6>Output:</h6>
                        <pre className="border p-2 bg-light text-dark">
                          {JSON.stringify(testResults.output, null, 2)}
                        </pre>
                      </Col>
                    </Row>
                  </div>
                )}
              </Card.Body>
            </Card>
          ) : (
            <Card className="text-center p-5">
              <Card.Body>
                <p className="text-muted">Select a mapping from the list or create a new one.</p>
                <Button variant="primary" onClick={handleCreateMapping}>
                  Create New Mapping
                </Button>
              </Card.Body>
            </Card>
          )}
        </Col>
      </Row>
      
      {/* Mapping Edit/Create Modal */}
      <Modal show={showMappingModal} onHide={() => setShowMappingModal(false)} size="xl">
        <Modal.Header closeButton>
          <Modal.Title>
            {modalMode === 'create' ? 'Create New Mapping' : `Edit ${mappingForm.name}`}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {alert && (
            <Alert variant={alert.type} onClose={() => setAlert(null)} dismissible className="mb-3">
              {alert.message}
            </Alert>
          )}
          
          <Tabs defaultActiveKey="basic">
            <Tab eventKey="basic" title="Basic Information">
              <Form className="mt-3">
                <Form.Group className="mb-3">
                  <Form.Label>Name</Form.Label>
                  <Form.Control
                    type="text"
                    name="name"
                    value={mappingForm.name}
                    onChange={handleMappingFormChange}
                    placeholder="e.g., Bank A FX Forward Mapping"
                  />
                </Form.Group>
                
                <Form.Group className="mb-3">
                  <Form.Label>Description</Form.Label>
                  <Form.Control
                    as="textarea"
                    name="description"
                    value={mappingForm.description}
                    onChange={handleMappingFormChange}
                    placeholder="Describe the purpose of this mapping"
                    rows={3}
                  />
                </Form.Group>
                
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Bank ID</Form.Label>
                      <Form.Control
                        type="text"
                        name="bank_id"
                        value={mappingForm.bank_id}
                        onChange={handleMappingFormChange}
                        placeholder="e.g., BankA"
                      />
                    </Form.Group>
                  </Col>
                  
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>System Model</Form.Label>
                      <Form.Select
                        name="system_model_id"
                        value={mappingForm.system_model_id}
                        onChange={handleMappingFormChange}
                      >
                        <option value="">Select a system model</option>
                        {systemModels.map(model => (
                          <option key={model.id} value={model.id}>
                            {model.name} (v{model.version})
                          </option>
                        ))}
                      </Form.Select>
                    </Form.Group>
                  </Col>
                </Row>
              </Form>
            </Tab>
            
            <Tab eventKey="fields" title="Source Fields">
              <div className="mt-3">
                <Form.Group className="mb-4">
                  <Form.Label>Upload Sample File</Form.Label>
                  <div className="d-flex">
                    <Form.Control
                      type="file"
                      onChange={handleFileChange}
                    />
                    <Button 
                      variant="primary" 
                      className="ms-2"
                      size="sm"
                      onClick={handleUploadFile}
                      disabled={!selectedFile || loading}
                    >
                      {loading ? 'Uploading...' : 'Upload'}
                    </Button>
                  </div>
                  <Form.Text className="small text-muted">
                    Upload a sample CSV file to extract field names, or add fields manually below. 
                    <br></br><strong>Note: Uploading a sample file will overwrite any existing fields.</strong>
                  </Form.Text>
                </Form.Group>

                <hr className="mb-4" />
                
                <Row>
                  {/* Left column - Current Fields */}
                  <Col md={6}>
                    <h6 className="mb-3">Current Fields</h6>
                    {mappingForm.source_fields.length === 0 ? (
                      <p className="text-muted small">No fields added yet. Upload a sample file or add fields manually.</p>
                    ) : (
                      <ListGroup className="custom-scrollbar" style={{maxHeight: '500px', overflowY: 'auto'}}>
                        {mappingForm.source_fields.map((field, index) => (
                          <ListGroup.Item 
                            key={index} 
                            action 
                            active={editingFieldIndex === index}
                            onClick={() => handleEditField(index)}
                            className="d-flex justify-content-between align-items-center"
                          >
                            <div>
                              <strong className="text-muted small">{field.name}</strong> <span className="text-muted small">({field.data_type})</span>
                              {field.required && <span className="badge bg-danger ms-2">Required</span>}
                              <div className="small text-muted">{field.description || 'No description'}</div>
                            </div>
                          </ListGroup.Item>
                        ))}
                      </ListGroup>
                    )}
                  </Col>

                  {/* Right column - Add/Edit Field Form */}
                  <Col md={6}>
                    <div className="d-flex justify-content-end align-items-center mb-3">
                      {editingFieldIndex !== null && (
                        <Button 
                          variant="outline-secondary" 
                          size="sm" 
                          onClick={handleCancelFieldEdit}
                        >
                          New Field
                        </Button>
                      )}
                    </div>

                    <h6 className="mb-3">{editingFieldIndex !== null ? 'Edit Field' : 'Add New Field'}</h6>
                      

                    <Form>
                      <Row>
                        <Col md={4}>
                          <Form.Group className="mb-3 small">
                            <Form.Label>Name</Form.Label>
                            <Form.Control
                              type="text"
                              name="name"
                              value={fieldForm.name}
                              onChange={handleFieldFormChange}
                              placeholder="e.g., trade_id"
                            />
                          </Form.Group>
                        </Col>
                        
                        <Col md={4}>
                          <Form.Group className="mb-3 small">
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
                          <Form.Group className="mb-3 mt-4 small">
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
                      
                      <Form.Group className="mb-3 small">
                        <Form.Label>Description</Form.Label>
                        <Form.Control
                          type="text"
                          name="description"
                          value={fieldForm.description || ''}
                          onChange={handleFieldFormChange}
                          placeholder="Describe this field"
                        />
                      </Form.Group>
                      
                      <div className="d-flex justify-content-end">
                        {editingFieldIndex !== null ? (
                          <>
                            <Button variant="primary" size="sm" onClick={handleUpdateField} className="me-2">
                              Update Field
                            </Button>
                            <Button 
                              variant="outline-danger" 
                              size="sm" 
                              onClick={() => {
                                handleRemoveField(editingFieldIndex);
                                handleCancelFieldEdit();
                              }}
                              className="me-2"
                            >
                              Remove Field
                            </Button>                            
                          </>
                        ) : (
                          <Button variant="primary" size="sm" onClick={handleAddField}>
                            Add Field
                          </Button>
                        )}
                      </div>
                    </Form>
                  </Col>
                </Row>
              </div>
            </Tab>
            
            <Tab eventKey="mapping" title="Field Mappings">
            <div className="mt-3">
                {(mappingForm.source_fields.length === 0 || !mappingForm.system_model_id) ? (
                <Alert variant="warning">
                    Please define source fields and select a system model before creating mappings.
                </Alert>
                ) : (
                <div className="mapping-interface">
                    <h6 className="mb-3">Create Field Mappings:</h6>
                    <p className="text-muted mb-4 small">
                    To create a mapping, drag a source field from the left column and drop it onto a target field in the right column.
                    You can also click on a source field and then click on the corresponding target field to create a mapping.
                    </p>
                    
                    <Row>
                    <Col md={5}>
                        <Card>
                        <Card.Header>
                            <h6 className="mb-0 small">Source Fields</h6>
                        </Card.Header>
                        <Card.Body style={{ maxHeight: '400px', overflow: 'auto' }}>
                            <ListGroup>
                            {mappingForm.source_fields.map((field, index) => (
                                <ListGroup.Item 
                                key={index} 
                                action
                                onClick={() => {
                                    // Set this as the selected source field for mapping
                                    setSelectedSourceField(field);
                                    // Visual indication
                                    setHighlightedSourceIndex(index);
                                }}
                                className={highlightedSourceIndex === index ? "border-primary" : ""}
                                >
                                <div className="d-flex justify-content-between align-items-center">
                                    <span className="text-muted small">{field.name}</span>
                                    <span className="badge bg-secondary small">{field.data_type}</span>
                                </div>
                                </ListGroup.Item>
                            ))}
                            </ListGroup>
                        </Card.Body>
                        </Card>
                    </Col>
                    
                    <Col md={2} className="d-flex align-items-center justify-content-center">
                        <div className="mapping-arrows">
                        {selectedSourceField && !selectedTargetField ? (
                            <div className="text-center mb-2">
                            <div className="arrow-right"></div>
                            <small className="text-muted">Select a target field</small>
                            </div>
                        ) : selectedTargetField && !selectedSourceField ? (
                            <div className="text-center mb-2">
                            <div className="arrow-left"></div>
                            <small className="text-muted">Select a source field</small>
                            </div>
                        ) : selectedSourceField && selectedTargetField ? (
                            <Button 
                            variant="primary" 
                            onClick={() => {
                                handleAddMapping(selectedSourceField, selectedTargetField);
                                setSelectedSourceField(null);
                                setSelectedTargetField(null);
                                setHighlightedSourceIndex(null);
                                setHighlightedTargetIndex(null);
                            }}
                            >
                            Create Mapping
                            </Button>
                        ) : (
                            <div className="text-center text-muted">
                            <i className="bi bi-arrow-left-right fs-4"></i>
                            <div className="mt-3 small">Select fields to map</div>
                            </div>
                        )}
                        </div>
                    </Col>
                    
                    <Col md={5}>
                        <Card>
                        <Card.Header>
                            <h6 className="mb-0 small">Target Fields</h6>
                        </Card.Header>
                        <Card.Body style={{ maxHeight: '400px', overflow: 'auto' }}>
                            <ListGroup>
                            {getTargetFields().map((field, index) => (
                                <ListGroup.Item 
                                key={index} 
                                action
                                onClick={() => {
                                    // Set this as the selected target field for mapping
                                    setSelectedTargetField(field);
                                    // Visual indication
                                    setHighlightedTargetIndex(index);
                                    
                                    // If we already have a source field selected, create the mapping automatically
                                    if (selectedSourceField) {
                                    handleAddMapping(selectedSourceField, field);
                                    setSelectedSourceField(null);
                                    setSelectedTargetField(null);
                                    setHighlightedSourceIndex(null);
                                    setHighlightedTargetIndex(null);
                                    }
                                }}
                                className={highlightedTargetIndex === index ? "border-primary" : ""}
                                >
                                <div className="d-flex justify-content-between align-items-center">
                                    <span className="text-muted small">{field.name}</span>
                                    <span className="badge bg-secondary small">{field.data_type}</span>
                                </div>
                                </ListGroup.Item>
                            ))}
                            </ListGroup>
                        </Card.Body>
                        </Card>
                    </Col>
                    </Row>
                    
                    <hr className="my-4" />
                    
                    <h6 className="mb-3">Current Mappings:</h6>
                    {mappingForm.mappings.length === 0 ? (
                    <p className="text-muted">No mappings defined yet. Create mappings using the interface above.</p>
                    ) : (
                    <div className="mappings-container">
                        {mappingForm.mappings.map((mapping, index) => (
                        <Card key={index} className="mb-3 mapping-card">
                            <Card.Header className="d-flex justify-content-between align-items-center">
                            <div>
                                <span className="source-field">{mapping.source_field}</span>
                                <i className="bi bi-arrow-right mx-2"></i>
                                <span className="target-field">{mapping.target_field}</span>
                            </div>
                            <Button 
                                variant="outline-danger" 
                                size="sm"
                                onClick={() => handleRemoveMapping(index)}
                            >
                                Remove
                            </Button>
                            </Card.Header>
                            <Card.Body>
                            <div className="mb-3">
                                <Form.Group>
                                <Form.Label>Transformation Type</Form.Label>
                                <Form.Select
                                    value={mapping.transformation ? mapping.transformation.type : 'direct'}
                                    onChange={(e) => {
                                    if (e.target.value === 'none') {
                                        handleRemoveTransformation(index);
                                    } else {
                                        handleAddTransformation(index, e.target.value);
                                    }
                                    }}
                                >
                                    <option value="direct">Direct Mapping (No Transformation)</option>
                                    <option value="format_date">Date Format Conversion</option>
                                    <option value="enum_map">Enum Value Mapping</option>
                                    <option value="split">Split String</option>
                                    <option value="none">Remove Transformation</option>
                                </Form.Select>
                                </Form.Group>
                            </div>
                            
                            {mapping.transformation && renderTransformationForm(mapping, index)}
                            </Card.Body>
                        </Card>
                        ))}
                    </div>
                    )}
                </div>
                )}
            </div>
            </Tab>            
          </Tabs>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowMappingModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSaveMapping}>
            Save
          </Button>
        </Modal.Footer>
      </Modal>
      
      {/* Test Modal */}
      <Modal show={showTestModal} onHide={() => setShowTestModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Test Mapping: {selectedMapping?.name}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {alert && (
            <Alert variant={alert.type} onClose={() => setAlert(null)} dismissible className="mb-3">
              {alert.message}
            </Alert>
          )}
          
          <Form.Group className="mb-3">
            <Form.Label>Input Data (JSON format)</Form.Label>
            <Form.Control
              as="textarea"
              rows={8}
              value={testData}
              onChange={(e) => setTestData(e.target.value)}
            />
            <Form.Text className="text-muted">
              Enter sample data in JSON format to test the mapping.
            </Form.Text>
          </Form.Group>
          
          <Button 
            variant="primary" 
            onClick={handleRunTest}
            disabled={loading}
          >
            {loading ? 'Running...' : 'Run Test'}
          </Button>
          
          {testResults && (
            <div className="mt-4">
              <h6>Results:</h6>
              <Row>
                <Col md={6}>
                  <h6>Input:</h6>
                  <pre className="border p-2 bg-light text-dark">
                    {JSON.stringify(testResults.input, null, 2)}
                  </pre>
                </Col>
                <Col md={6}>
                  <h6>Output:</h6>
                  <pre className="border p-2 bg-light text-dark">
                    {JSON.stringify(testResults.output, null, 2)}
                  </pre>
                </Col>
              </Row>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowTestModal(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default MappingPage;