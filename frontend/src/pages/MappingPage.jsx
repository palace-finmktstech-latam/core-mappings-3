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
  const [selectedMappingField, setSelectedMappingField] = useState(null);
  const [selectedFieldType, setSelectedFieldType] = useState(null); // 'source' or 'target'
  const [visibleTransformationForm, setVisibleTransformationForm] = useState(null);
  
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
  
  // Add these state variables near your other state declarations
  const [mappingSearch, setMappingSearch] = useState('');
  const [sourceFieldSearch, setSourceFieldSearch] = useState('');
  const [targetFieldSearch, setTargetFieldSearch] = useState('');
  
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
    
      console.log("updatedMappings: ",updatedMappings);

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
  
  const handleFieldSelection = (field, type) => {
    setSelectedMappingField(field.name);
    setSelectedFieldType(type);
    
    // Clear existing selection states if needed
    setSelectedSourceField(null);
    setSelectedTargetField(null);
    setHighlightedSourceIndex(null);
    setHighlightedTargetIndex(null);
  };

  const handleShowTestModal = () => {
    if (!selectedMapping) return;
    
    // Generate sample JSON based on source fields
    const sampleData = {};
    
    selectedMapping.source_fields.forEach(field => {
      // Generate appropriate sample values based on data type
      switch (field.data_type) {
        case 'string':
          sampleData[field.name] = `Sample ${field.name}`;
          break;
        case 'integer':
          sampleData[field.name] = 123;
          break;
        case 'decimal':
          sampleData[field.name] = 123.45;
          break;
        case 'boolean':
          sampleData[field.name] = true;
          break;
        case 'date':
          // Find date mapping for this field if it exists
          const dateMapping = selectedMapping.mappings.find(m => 
            m.source_field === field.name && 
            m.transformation?.type === 'format_date'
          );
          const dateFormat = dateMapping?.transformation?.params?.source_format || 'MM/DD/YYYY';
          
          // Generate sample date in the expected format
          if (dateFormat.includes('DD/MM/YYYY')) {
            sampleData[field.name] = '15/01/2024';
          } else if (dateFormat.includes('MM/DD/YYYY')) {
            sampleData[field.name] = '01/15/2024';
          } else if (dateFormat.includes('YYYY/MM/DD')) {
            sampleData[field.name] = '2024/01/15';
          } else if (dateFormat.includes('YYYY-MM-DD')) {
            sampleData[field.name] = '2024-01-15';
          } else {
            sampleData[field.name] = '01/15/2024';
          }
          break;
        case 'enum':
          // Find enum mapping for this field if it exists
          const enumMapping = selectedMapping.mappings.find(m => 
            m.source_field === field.name && 
            m.transformation?.type === 'enum_map'
          );
          
          // Use first enum value from mapping or a default
          if (enumMapping?.transformation?.params?.mapping) {
            const sourceValues = Object.keys(enumMapping.transformation.params.mapping);
            sampleData[field.name] = sourceValues.length > 0 ? sourceValues[0] : 'Sample enum value';
          } else {
            sampleData[field.name] = 'Sample enum value';
          }
          break;
        default:
          sampleData[field.name] = `Sample ${field.name}`;
      }
    });
    
    // Format the sample data as pretty JSON
    const formattedJson = JSON.stringify(sampleData, null, 2);
    
    setTestData(formattedJson);
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

  const getTargetFieldByName = (fieldName) => {
    return getTargetFields().find(field => field.name === fieldName) || null;
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
          <div className="mt-0">
            <Row>
              <Col>
                <Form.Group>
                  <Form.Label className="text-light small">Source Format</Form.Label>
                  <Form.Select
                    value={params.source_format || ''}
                    onChange={(e) => handleUpdateTransformationParams(index, { source_format: e.target.value }, {target_format: getTargetDateFormat(mapping.target_field)})}
                    style={{ fontSize: '0.75rem' }}
                  >
                    <option value="">Select a format</option>
                    <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                    <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                    <option value="YYYY/MM/DD">YYYY/MM/DD</option>
                    <option value="DD-MM-YYYY">DD-MM-YYYY</option>
                    <option value="MM-DD-YYYY">MM-DD-YYYY</option>
                    <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                  </Form.Select>
                  <Form.Text className="text-light small">
                    <i>Format of the date in the source data</i>
                  </Form.Text>
                </Form.Group>
              </Col>
              <Col>
                <Form.Group>
                  <Form.Label className="text-light small">Target Format</Form.Label>
                  <br></br>                 
                  <Form.Text className="text-light small">
                    <strong>{getTargetDateFormat(mapping.target_field)}</strong>
                  </Form.Text>
                </Form.Group>
              </Col>
              <div className="d-flex justify-content-end align-items-center">
                <Button
                  variant="success"
                  size="sm"
                  style={{ fontSize: '0.75rem' }}
                  onClick={() => {
                    // Here we'll save the date mappings
                    handleUpdateTransformationParams(index, { source_format: params.source_format })
                    handleUpdateTransformationParams(index, {target_format: getTargetDateFormat(mapping.target_field)})
                    
                    // You could add a visual confirmation
                    showAlertMessage('Date transformation applied but not saved. Press Save to save all changes.', 'success');

                    // Hide the transformation form
                    // We need to add state to track which transformation forms are visible
                    setVisibleTransformationForm(null);
                    
                    // If you need to perform additional actions when saving, add them here
                  }}
                >
                  OK
                </Button>
              </div>
            </Row>
          </div>
        );
        
      case 'enum_map':
        return (
          <div className="mt-0 bg-dark">
            <Form.Label className="text-light small"><i>Value Mappings</i></Form.Label>
            {Object.entries(params.mapping || {}).map(([sourceValue, targetValue], i) => {
              // Get target field to find available enum values
              const targetField = getTargetFields().find(field => field.name === mapping.target_field);
              const enumValues = targetField?.constraints?.values || [];
              
              return (
                <Row key={i} className="mb-2">
                  <Col>
                    <Form.Control
                      type="text"
                      placeholder="Source value"
                      value={sourceValue}
                      style={{ color: 'white', fontSize: '0.75rem' }}
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
                    {/* Dropdown for target values instead of free text */}
                    <Form.Select
                      value={targetValue}
                      onChange={(e) => {
                        const newMapping = { ...params.mapping };
                        newMapping[sourceValue] = e.target.value;
                        handleUpdateTransformationParams(index, { mapping: newMapping });
                      }}
                      style={{ color: 'white', fontSize: '0.75rem' }}
                    >
                      <option value="">Select target value</option>
                      {enumValues.map((enumValue, j) => (
                        <option key={j} value={enumValue}>
                          {enumValue}
                        </option>
                      ))}
                    </Form.Select>
                  </Col>
                  <Col xs="auto">
                    <Button 
                      variant="outline-danger" 
                      size="sm"
                      className="btn-sm py-0 px-1"
                      onClick={() => {
                        const newMapping = { ...params.mapping };
                        delete newMapping[sourceValue];
                        handleUpdateTransformationParams(index, { mapping: newMapping });
                      }}
                    >
                      ×
                    </Button>
                  </Col>
                </Row>
              );
            })}
            <div className="d-flex justify-content-between align-items-center">
              <Button
                variant="outline-primary"
                size="sm"
                style={{ fontSize: '0.75rem' }}
                onClick={() => {
                  const newMapping = { ...params.mapping, '': '' };
                  handleUpdateTransformationParams(index, { mapping: newMapping });
                }}
              >
                Add Value Mapping
              </Button>
              <Button
                variant="success"
                size="sm"
                style={{ fontSize: '0.75rem' }}
                onClick={() => {
                  // Here we'll save the value mappings
                  // This can just close the current edit mode or perform additional validation
                  // For now it's essentially confirming the current state of the mappings
                  
                  // You could add a visual confirmation
                  showAlertMessage('Value mappings transformation applied but not saved. Press Save to save all changes.', 'success');
                  
                  // Hide the transformation form
                  // We need to add state to track which transformation forms are visible
                  setVisibleTransformationForm(null);
                  // If you need to perform additional actions when saving, add them here
                }}
              >
                OK
              </Button>
            </div>
          </div>
        );
        
      case 'split':
        return (
          <div className="mt-0">
            <Row>
              <Col>
                <Form.Group>
                  <Form.Label className="text-light small">Delimiter</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="e.g., ,"
                    value={params.delimiter || ''}
                    onChange={(e) => handleUpdateTransformationParams(index, { delimiter: e.target.value })}
                    style={{ color: 'white', fontSize: '0.75rem' }}
                  />
                </Form.Group>
              </Col>
              <Col>
                <Form.Group>
                  <Form.Label className="text-light small">Index (0-based)</Form.Label>
                  <Form.Control
                    type="number"
                    placeholder="e.g., 0"
                    value={params.index || 0}
                    onChange={(e) => handleUpdateTransformationParams(index, { index: parseInt(e.target.value, 10) })}
                    style={{ color: 'white', fontSize: '0.75rem' }}
                  />
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <div className="d-flex justify-content-end align-items-center" style={{ paddingTop: '10px' }}>
                <br></br>
                <Button
                  variant="success"
                  size="sm"
                  style={{ fontSize: '0.75rem' }}
                  onClick={() => {
                    
                    handleUpdateTransformationParams(index, { delimiter: params.delimiter })
                    handleUpdateTransformationParams(index, { index: params.index })

                    // You could add a visual confirmation
                    showAlertMessage('Split String transformation applied but not saved. Press Save to save all changes.', 'success');

                    // Hide the transformation form
                    // We need to add state to track which transformation forms are visible
                    setVisibleTransformationForm(null);
                    
                    // If you need to perform additional actions when saving, add them here
                  }}
                >
                  OK
                </Button>
              </div>
            </Row>
          </div>
        );
      
        case 'left':
          return (
            <div className="mt-0">
              <Form.Group>
                <Form.Label className="text-light small">Number of Characters</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="e.g., 5"
                  value={params.count || ''}
                  onChange={(e) => {
                    // Allow empty string or digits
                    if (e.target.value === '' || /^\d+$/.test(e.target.value)) {
                      // Check minimum value when converting to number
                      const numValue = e.target.value === '' ? '' : parseInt(e.target.value, 10);
                      if (numValue === '' || numValue >= 0) { // Apply minimum value check here
                        handleUpdateTransformationParams(index, { count: numValue });
                      }
                    }
                  }}
                  style={{ fontSize: '0.75rem' }}
                  required
                />
                <Form.Text className="text-muted">
                  <i>Extracts the specified number of characters from the beginning of the text</i>
                </Form.Text>
                <div className="d-flex justify-content-end align-items-center">
                  <Button
                    variant="success"
                    size="sm"
                    style={{ fontSize: '0.75rem' }}
                    onClick={() => {
                      
                      handleUpdateTransformationParams(index, { count: params.count })

                      // You could add a visual confirmation
                      showAlertMessage('Left string transformation applied but not saved. Press Save to save all changes.', 'success');

                      // Hide the transformation form
                      // We need to add state to track which transformation forms are visible
                      setVisibleTransformationForm(null);
                      
                      // If you need to perform additional actions when saving, add them here
                    }}
                  >
                    OK
                  </Button>
                </div>
              </Form.Group>
            </div>
          );
        
        case 'right':
          return (
            <div className="mt-0">
              <Form.Group>
                <Form.Label className="text-light small">Number of Characters</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="e.g., 5"
                  value={params.count || ''}
                  onChange={(e) => {
                    // Allow empty string or digits
                    if (e.target.value === '' || /^\d+$/.test(e.target.value)) {
                      // Check minimum value when converting to number
                      const numValue = e.target.value === '' ? '' : parseInt(e.target.value, 10);
                      if (numValue === '' || numValue >= 0) { // Apply minimum value check here
                        handleUpdateTransformationParams(index, { count: numValue });
                      }
                    }
                  }}
                  style={{ fontSize: '0.75rem' }}
                  required
                />
                <Form.Text className="text-muted">
                  <i>Extracts the specified number of characters from the end of the text</i>
                </Form.Text>
                <div className="d-flex justify-content-end align-items-center">
                  <Button
                    variant="success"
                    size="sm"
                    style={{ fontSize: '0.75rem' }}
                    onClick={() => {
                      
                      handleUpdateTransformationParams(index, { count: params.count })
                      // You could add a visual confirmation
                      showAlertMessage('Right string transformation applied but not saved. Press Save to save all changes.', 'success');

                      // Hide the transformation form
                      // We need to add state to track which transformation forms are visible
                      setVisibleTransformationForm(null);
                      
                      // If you need to perform additional actions when saving, add them here
                    }}
                  >
                    OK
                  </Button>
                </div>
              </Form.Group>
            </div>
          );
        
        case 'substring':
          return (
            <div className="mt-0">
              <Row>
                <Col>
                  <Form.Group>
                    <Form.Label className="text-light small">Start Position</Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="e.g., 5"
                      value={params.startPosition || ''}
                      onChange={(e) => {
                        // Allow empty string or digits
                        if (e.target.value === '' || /^\d+$/.test(e.target.value)) {
                          // Check minimum value when converting to number
                          const numValue = e.target.value === '' ? '' : parseInt(e.target.value, 10);
                          if (numValue === '' || numValue >= 0) { // Apply minimum value check here
                            handleUpdateTransformationParams(index, { startPosition: numValue });
                          }
                        }
                      }}
                      style={{ fontSize: '0.75rem' }}
                      required
                    />
                  </Form.Group>
                </Col>
                <Col>
                  <Form.Group>
                    <Form.Label className="text-light small">Length</Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="e.g., 5"
                      value={params.length || ''}
                      onChange={(e) => {
                        // Allow empty string or digits
                        if (e.target.value === '' || /^\d+$/.test(e.target.value)) {
                          // Check minimum value when converting to number
                          const numValue = e.target.value === '' ? '' : parseInt(e.target.value, 10);
                          if (numValue === '' || numValue >= 0) { // Apply minimum value check here
                            handleUpdateTransformationParams(index, { length: numValue });
                          }
                        }
                      }}
                      style={{ fontSize: '0.75rem' }}
                      required
                    />
                  </Form.Group>
                </Col>
              </Row>
              <div className="d-flex justify-content-end align-items-center">
              <Form.Text className="text-muted">
                <i>Extracts text from the specified position. The first character is at position 0.</i>
              </Form.Text>
              
                <Button
                  variant="success"
                  size="sm"
                  style={{ fontSize: '0.75rem' }}
                  onClick={() => {
                    
                    handleUpdateTransformationParams(index, { startPosition: params.startPosition })
                    handleUpdateTransformationParams(index, { length: params.length })

                    // You could add a visual confirmation
                    showAlertMessage('Substring transformation applied but not saved. Press Save to save all changes.', 'success');

                    // Hide the transformation form
                    // We need to add state to track which transformation forms are visible
                    setVisibleTransformationForm(null);
                    
                    // If you need to perform additional actions when saving, add them here
                  }}
                >
                  OK
                </Button>
              </div>
            </div>
          );
        
        case 'replace':
          return (
            <div className="mt-0">
              <Row>
                <Col>
                  <Form.Group>
                    <Form.Label className="text-light small">Find</Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="Text to find"
                      value={params.find || ''}
                      onChange={(e) => handleUpdateTransformationParams(index, { find: e.target.value })}
                      style={{ fontSize: '0.75rem' }}
                    />
                  </Form.Group>
                </Col>
                <Col>
                  <Form.Group>
                    <Form.Label className="text-light small">Replace With</Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="Replace with"
                      value={params.replace || ''}
                      onChange={(e) => handleUpdateTransformationParams(index, { replace: e.target.value })}
                      style={{ fontSize: '0.75rem' }}
                    />
                  </Form.Group>
                </Col>
              </Row>
              <Form.Group className="mt-2">
                <div className="d-flex justify-content-end align-items-center">
                  <Button
                    variant="success"
                    size="sm"
                    style={{ fontSize: '0.75rem' }}
                    onClick={() => {
                    
                      handleUpdateTransformationParams(index, { find: params.find })
                      handleUpdateTransformationParams(index, { replace: params.replace })

                      // You could add a visual confirmation
                      showAlertMessage('Replace string transformation applied but not saved. Press Save to save all changes.', 'success');

                      // Hide the transformation form
                      // We need to add state to track which transformation forms are visible
                      setVisibleTransformationForm(null);
                      
                      // If you need to perform additional actions when saving, add them here
                      handleUpdateTransformationParams(index, { replaceAll: true }); // Ensure replaceAll is set to true
                    }}
                  >
                    OK
                  </Button>
                </div>
              </Form.Group>
            </div>
          );
        
        case 'regex':
          return (
            <div className="mt-0">
              <Form.Group>
                <Form.Label className="text-light small">Pattern</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="e.g., \d{3}-\d{2}-\d{4}"
                  value={params.pattern || ''}
                  onChange={(e) => handleUpdateTransformationParams(index, { pattern: e.target.value })}
                  style={{ fontSize: '0.75rem' }}
                />
                <Form.Text className="text-muted">
                  <i>Regular expression pattern to match</i>
                </Form.Text>
              </Form.Group>
              <Form.Group className="mt-2">
                <Form.Label className="text-light small">Group Index</Form.Label>
                <Form.Control
                  type="number"
                  min="0"
                  placeholder="e.g., 1"
                  value={params.group || 0}
                  onChange={(e) => handleUpdateTransformationParams(index, { group: parseInt(e.target.value, 10) })}
                  style={{ fontSize: '0.75rem' }}
                />
                <Form.Text className="text-muted">
                  <i>Capture group to extract (0 for entire match, 1 for first group, etc.)</i>
                </Form.Text>
                <div className="d-flex justify-content-end align-items-center">
                  <Button
                    variant="success"
                    size="sm"
                    style={{ fontSize: '0.75rem' }}
                    onClick={() => {
                      handleUpdateTransformationParams(index, { pattern: params.pattern })
                      handleUpdateTransformationParams(index, { group: params.group })

                      // You could add a visual confirmation
                      showAlertMessage('Regex string transformation applied but not saved. Press Save to save all changes.', 'success');

                      // Hide the transformation form
                      // We need to add state to track which transformation forms are visible
                      setVisibleTransformationForm(null);
                      
                      // If you need to perform additional actions when saving, add them here
                    }}
                  >
                    OK
                  </Button>
                </div>
              </Form.Group>
            </div>
          );
        
        case 'case':
          return (
            <div className="mt-0">
              <Form.Group>
                <Form.Label className="text-light small">Case Transformation</Form.Label>
                <Form.Select
                  value={params.caseType || 'upper'}
                  onChange={(e) => handleUpdateTransformationParams(index, { caseType: e.target.value })}
                  style={{ fontSize: '0.75rem' }}
                >
                  <option value="upper">TO ALL UPPERCASE</option>
                  <option value="lower">to all lowercase</option>
                  <option value="title">To Title Case</option>
                  <option value="sentence">To sentence case</option>
                </Form.Select>
                <br></br>
                <div className="d-flex justify-content-end align-items-center">
                  <Button
                    variant="success"
                    size="sm"
                    style={{ fontSize: '0.75rem' }}
                    onClick={() => {
                      
                      handleUpdateTransformationParams(index, { caseType: params.caseType || 'upper' });

                      // You could add a visual confirmation
                      showAlertMessage('Regex string transformation applied but not saved. Press Save to save all changes.', 'success');

                      // Hide the transformation form
                      // We need to add state to track which transformation forms are visible
                      setVisibleTransformationForm(null);
                      
                      // If you need to perform additional actions when saving, add them here
                    }}
                  >
                    OK
                  </Button>
                </div>
              </Form.Group>
            </div>
          );

      default:
        return <div className="mt-0 text-light small">No parameters needed for this transformation type.</div>;
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
  
  const getTargetDateFormat = (fieldName) => {
    const targetField = getTargetFields().find(field => field.name === fieldName);
    
    return targetField?.constraints.date_format || 'System default format';
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
                <ListGroup className="custom-scrollbar">
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
                <Table striped bordered variant='dark' className='small' size='sm'>
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
                              {mapping.transformation.type === 'split' && (
                                <div className="small mt-1">
                                  Takes part {mapping.transformation.params?.index + 1 || '1'} from a string separated by {mapping.transformation.params?.delimiter || ''}.
                                </div>
                              )}
                              {mapping.transformation.type === 'left' && (
                                <div className="small mt-1">
                                  Takes the first {mapping.transformation.params?.count || ''} characters from a string.
                                </div>
                              )}
                              {mapping.transformation.type === 'right' && (
                                <div className="small mt-1">
                                  Takes the last {mapping.transformation.params?.count || ''} characters from a string.
                                </div>
                              )}
                              {mapping.transformation.type === 'substring' && (
                                <div className="small mt-1">
                                  Takes a substring of a string, starting at position {mapping.transformation.params?.startPosition || ''} and taking the next {mapping.transformation.params?.length || ''} characters.
                                </div>
                              )}
                              {mapping.transformation.type === 'replace' && (
                                <div className="small mt-1">
                                  Replaces all occurrences of {mapping.transformation.params?.find || ''} with {mapping.transformation.params?.replace || ''}.
                                </div>
                              )}
                              {mapping.transformation.type === 'regex' && (
                                <div className="small mt-1">
                                  Applies a regular expression ({mapping.transformation.params?.pattern || ''}) to the string.
                                </div>
                              )}
                              {mapping.transformation.type === 'case' && (
                                <div className="small mt-1">
                                  Converts the string to {mapping.transformation.params?.caseType || ''} case.
                                </div>
                              )}
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
        <Modal.Header closeButton className="d-flex justify-content-between align-items-center">
          <div className="d-flex align-items-center">
            <Modal.Title className="me-2">
              {modalMode === 'create' ? 'Create New Mapping' : `Edit ${mappingForm.name}`}
            </Modal.Title>
            {alert && (
              <Alert variant={alert.type} className="mb-0 small p-2" style={{ marginLeft: '10px' }}>
                {alert.message}
              </Alert>
            )}
          </div>
        </Modal.Header>
        <Modal.Body>
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
                {loading ? (
                  <div className="text-center p-5">
                    <Spinner animation="border" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </Spinner>
                  </div>
                ) : (
                  <Row>
                    {/* Column 1: Current Mappings */}
                    <Col md={4}>
                      <Card className="h-100">
                        <Card.Header className="bg-dark text-white d-flex justify-content-between align-items-center">
                          <h6 className="mb-0 small">Current Mappings</h6>
                          <Form.Control 
                            type="text" 
                            placeholder="Search mappings..." 
                            size="sm"
                            className="form-control form-control-sm w-50"
                            value={mappingSearch}
                            onChange={(e) => setMappingSearch(e.target.value)}
                          />
                        </Card.Header>
                        <Card.Body className="custom-scrollbar" style={{ maxHeight: '600px', overflow: 'auto' }}>
                          {mappingForm.mappings.length === 0 ? (
                            <div className="text-center text-muted p-4">
                              <i className="bi bi-arrow-left-right fs-3"></i>
                              <p className="mt-3 small">No mappings defined yet. Select source and target fields to create mappings.</p>
                            </div>
                          ) : (
                            <div className="mappings-container">
                              {mappingForm.mappings
                                .filter(mapping => {
                                  if (!mappingSearch) return true;
                                  const searchTerm = mappingSearch.toLowerCase();
                                  return mapping.source_field.toLowerCase().includes(searchTerm) || 
                                         mapping.target_field.toLowerCase().includes(searchTerm);
                                })
                                .map((mapping, index) => (
                                  <Card key={index} className="mb-3 mapping-card border-light">
                                    <Card.Header className="d-flex justify-content-between align-items-center py-2">
                                      <div className="small">
                                        <span className="source-field fw-bold">{mapping.source_field}</span>
                                        <span className="bi bi-arrow-right mx-2">-></span>
                                        <span className="target-field fw-bold">{mapping.target_field}</span>
                                      </div>
                                      <Button 
                                        variant="outline-danger" 
                                        size="sm"
                                        className="btn-sm py-0 px-1"
                                        onClick={() => handleRemoveMapping(index)}
                                      >
                                        x
                                      </Button>
                                    </Card.Header>
                                    <Card.Body className="py-2">
                                      <Form.Group className="mb-2">
                                        <Form.Label className="small mb-1">Transformation</Form.Label>
                                        <div className="d-flex">
                                          <Form.Select
                                            size="sm"
                                            value={mapping.transformation ? mapping.transformation.type : 'direct'}
                                            onChange={(e) => {
                                              if (e.target.value === 'none') {
                                                handleRemoveTransformation(index);
                                                setVisibleTransformationForm(null); // Hide the form
                                              } else {
                                                handleAddTransformation(index, e.target.value);                                      
                                              }
                                            }}
                                          >
                                            <option value="direct">Direct Mapping</option>
                                            {/* Only show date option if target field is a date */}
                                            {(() => {
                                              const targetField = getTargetFields().find(field => field.name === mapping.target_field);
                                              return targetField?.data_type === 'date' ? (
                                                <option value="format_date">Date Format</option>
                                              ) : null;
                                            })()}
                                            {/* Only show enum_map option if target field is an enum */}
                                            {(() => {
                                              const targetField = getTargetFields().find(field => field.name === mapping.target_field);
                                              return targetField?.data_type === 'enum' ? (
                                                <option value="enum_map">Enum Mapping</option>
                                              ) : null;
                                            })()}
                                            {/* Only show split string option if target field is a string */}
                                            {(() => {
                                              const targetField = getTargetFields().find(field => field.name === mapping.target_field);
                                              return targetField?.data_type === 'string' ? (
                                                <option value="split">Split String</option>
                                              ) : null;
                                            })()}
                                            {/* Only show left option if target field is a string */}
                                            {(() => {
                                              const targetField = getTargetFields().find(field => field.name === mapping.target_field);
                                              return targetField?.data_type === 'string' ? (
                                                <option value="left">Left (First N Characters)</option>
                                              ) : null;
                                            })()}
                                            {/* Only show right option if target field is a string */}
                                            {(() => {
                                              const targetField = getTargetFields().find(field => field.name === mapping.target_field);
                                              return targetField?.data_type === 'string' ? (
                                                <option value="right">Right (Last N Characters)</option>
                                              ) : null;
                                            })()}
                                            {/* Only show substring option if target field is a string */}
                                            {(() => {
                                              const targetField = getTargetFields().find(field => field.name === mapping.target_field);
                                              return targetField?.data_type === 'string' ? (
                                                <option value="substring">Substring (From/To)</option>
                                              ) : null;
                                            })()}
                                            {/* Only show replace option if target field is a string */}
                                            {(() => {
                                              const targetField = getTargetFields().find(field => field.name === mapping.target_field);
                                              return targetField?.data_type === 'string' ? (
                                                <option value="replace">Replace Text</option>
                                              ) : null;
                                            })()}
                                            {/* Only show regex option if target field is a string */}
                                            {(() => {
                                              const targetField = getTargetFields().find(field => field.name === mapping.target_field);
                                              return targetField?.data_type === 'string' ? (
                                                <option value="regex">Regex Extract</option>
                                              ) : null;
                                            })()}
                                            {/* Only show change case option if target field is a string */}
                                            {(() => {
                                              const targetField = getTargetFields().find(field => field.name === mapping.target_field);
                                              return targetField?.data_type === 'string' ? (
                                                <option value="case">Change Case</option>
                                              ) : null;
                                            })()}
                                          </Form.Select>
                                          {mapping.transformation && (
                                            <Button
                                              variant="outline-secondary"
                                              size="sm"
                                              onClick={() => {
                                                // Toggle the form visibility
                                                setVisibleTransformationForm(visibleTransformationForm === index ? null : index);
                                              }}
                                            >
                                              {visibleTransformationForm === index ? (
                                                <span>&#9650;</span>
                                              ) : (
                                                <span>&#9998;</span>
                                              )}
                                            </Button>
                                          )}
                                        </div>
                                      </Form.Group>
                                      
                                      {mapping.transformation && visibleTransformationForm === index && (
                                        <div className="bg-dark p-1 rounded small">
                                          {renderTransformationForm(mapping, index)}
                                        </div>
                                      )}
                                    </Card.Body>
                                  </Card>
                                ))}
                            </div>
                          )}
                        </Card.Body>
                      </Card>
                    </Col>
                    
                    {/* Column 2: Source Fields */}
                    <Col md={4}>
                      <Card className="h-100">
                        <Card.Header className="bg-dark text-white d-flex justify-content-between align-items-center">
                        <h6 className="mb-0 small">Source Fields</h6>
                          <Form.Control 
                            type="text" 
                            placeholder="Search fields..." 
                            size="sm"
                            className="form-control form-control-sm w-50"
                            value={sourceFieldSearch}
                            onChange={(e) => setSourceFieldSearch(e.target.value)}
                          />
                        </Card.Header>
                        <Card.Body className="custom-scrollbar" style={{ maxHeight: '600px', overflow: 'auto' }}>
                          {(() => {
                            const mappedSourceFields = mappingForm.mappings.map(m => m.source_field);
                            const unmappedSourceFields = mappingForm.source_fields.filter(
                              field => !mappedSourceFields.includes(field.name)
                            );
                            
                            // Filter by search term
                            const filteredSourceFields = unmappedSourceFields.filter(field => {
                              if (!sourceFieldSearch) return true;
                              return field.name.toLowerCase().includes(sourceFieldSearch.toLowerCase());
                            });
                            
                            if (unmappedSourceFields.length === 0) {
                              return (
                                <div className="text-center text-muted p-4">
                                  <i className="bi bi-check-circle fs-3"></i>
                                  <p className="mt-3 small">All source fields have been mapped.</p>
                                </div>
                              );
                            }
                            
                            if (filteredSourceFields.length === 0) {
                              return (
                                <div className="text-center text-muted p-4">
                                  <p>No fields match your search.</p>
                                </div>
                              );
                            }
                            
                            return (
                              <ListGroup>
                                {filteredSourceFields.map((field, index) => (
                                  <ListGroup.Item 
                                    key={index} 
                                    action
                                    onClick={() => {
                                      setSelectedSourceField(field);
                                      setHighlightedSourceIndex(index);
                                      
                                      if (selectedTargetField) {
                                        handleAddMapping(field, selectedTargetField);
                                        setSelectedSourceField(null);
                                        setSelectedTargetField(null);
                                        setHighlightedSourceIndex(null);
                                        setHighlightedTargetIndex(null);
                                      }
                                    }}
                                    className={`py-2 ${highlightedSourceIndex === index ? "border-primary" : ""}`}
                                  >
                                    <div className="d-flex justify-content-between align-items-center">
                                      <div>
                                        <div className="fw-bold small">{field.name}</div>
                                        <div className="text-muted small">{field.data_type}</div>
                                      </div>
                                      {highlightedSourceIndex === index && (
                                        <i className="bi bi-check-circle-fill text-primary"></i>
                                      )}
                                    </div>
                                  </ListGroup.Item>
                                ))}
                              </ListGroup>
                            );
                          })()}
                        </Card.Body>
                      </Card>
                    </Col>
                    
                    {/* Column 3: Target Fields */}
                    <Col md={4}>
                      <Card className="h-100">
                        <Card.Header className="bg-dark text-white d-flex justify-content-between align-items-center">
                          <h6 className="mb-0 small">Target Fields</h6>
                          <Form.Control 
                            type="text" 
                            placeholder="Search fields..." 
                            size="sm"
                            className="form-control form-control-sm w-50"
                            value={targetFieldSearch}
                            onChange={(e) => setTargetFieldSearch(e.target.value)}
                          />
                        </Card.Header>
                        <Card.Body className="custom-scrollbar" style={{ maxHeight: '600px', overflow: 'auto' }}>
                          {(() => {
                            const mappedTargetFields = mappingForm.mappings.map(m => m.target_field);
                            const targetFields = getTargetFields();
                            const unmappedTargetFields = targetFields.filter(
                              field => !mappedTargetFields.includes(field.name)
                            );
                            
                            // Filter by search term
                            const filteredTargetFields = unmappedTargetFields.filter(field => {
                              if (!targetFieldSearch) return true;
                              return field.name.toLowerCase().includes(targetFieldSearch.toLowerCase());
                            });
                            
                            if (unmappedTargetFields.length === 0) {
                              return (
                                <div className="text-center text-muted p-4">
                                  <i className="bi bi-check-circle fs-3"></i>
                                  <p className="mt-3 small">All target fields have been mapped.</p>
                                </div>
                              );
                            }
                            
                            if (filteredTargetFields.length === 0) {
                              return (
                                <div className="text-center text-muted p-4">
                                  <p>No fields match your search.</p>
                                </div>
                              );
                            }
                            
                            return (
                              <ListGroup>
                                {filteredTargetFields.map((field, index) => (
                                  <ListGroup.Item 
                                    key={index} 
                                    action
                                    onClick={() => {
                                      setSelectedTargetField(field);
                                      setHighlightedTargetIndex(index);
                                      
                                      if (selectedSourceField) {
                                        handleAddMapping(selectedSourceField, field);
                                        setSelectedSourceField(null);
                                        setSelectedTargetField(null);
                                        setHighlightedSourceIndex(null);
                                        setHighlightedTargetIndex(null);
                                      }
                                    }}
                                    className={`py-2 ${highlightedTargetIndex === index ? "border-primary" : ""}`}
                                  >
                                    <div className="d-flex justify-content-between align-items-center">
                                      <div>
                                        <div className="fw-bold small">{field.name}</div>
                                        <div className="text-muted small">{field.data_type}</div>
                                      </div>
                                      {highlightedTargetIndex === index && (
                                        <i className="bi bi-check-circle-fill text-primary"></i>
                                      )}
                                    </div>
                                  </ListGroup.Item>
                                ))}
                              </ListGroup>
                            );
                          })()}
                        </Card.Body>
                      </Card>
                    </Col>
                  </Row>
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