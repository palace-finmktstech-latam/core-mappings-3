import React, { useState, useEffect } from 'react';
import { 
  Card, Button, Form, Row, Col, ListGroup, 
  Modal, Alert, Tabs, Tab 
} from 'react-bootstrap';
import { getSystemModels, createSystemModel, updateSystemModel, deleteSystemModel } from '../services/systemModels';

const AdminPage = () => {
  // State for system models
  const [systemModels, setSystemModels] = useState([]);
  const [selectedModel, setSelectedModel] = useState(null);
  const [showModelModal, setShowModelModal] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // 'create' or 'edit'
  const [alert, setAlert] = useState(null);
  
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
    constraints: {}
  });
  
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
    if (modelForm.fields.some(field => field.name === fieldForm.name)) {
      showAlertMessage('Field name must be unique', 'danger');
      return;
    }
    
    // Add field to model form
    setModelForm({
      ...modelForm,
      fields: [...modelForm.fields, { ...fieldForm }]
    });
    
    // Reset field form
    setFieldForm({
      name: '',
      data_type: 'string',
      description: '',
      required: false,
      constraints: {}
    });
  };
  
  const handleRemoveField = (index) => {
    const updatedFields = [...modelForm.fields];
    updatedFields.splice(index, 1);
    setModelForm({
      ...modelForm,
      fields: updatedFields
    });
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
      <Modal show={showModelModal} onHide={() => setShowModelModal(false)} size="lg">
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
          
          <Tabs defaultActiveKey="basic">
            <Tab eventKey="basic" title="Basic Information">
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
                <h6 className="mb-3">Add New Field</h6>
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
                  
                  <Button variant="primary" onClick={handleAddField}>
                    Add Field
                  </Button>
                </Form>
                
                <hr />
                
                <h6 className="mb-3">Current Fields</h6>
                {modelForm.fields.length === 0 ? (
                  <p className="text-muted">No fields added yet. Add fields using the form above.</p>
                ) : (
                  <ListGroup>
                    {modelForm.fields.map((field, index) => (
                      <ListGroup.Item key={index} className="d-flex justify-content-between align-items-center">
                        <div>
                          <strong>{field.name}</strong> <span className="text-muted">({field.data_type})</span>
                          {field.required && <span className="badge bg-danger ms-2">Required</span>}
                          <div className="small text-muted">{field.description || 'No description'}</div>
                        </div>
                        <Button variant="outline-danger" size="sm" onClick={() => handleRemoveField(index)}>
                          Remove
                        </Button>
                      </ListGroup.Item>
                    ))}
                  </ListGroup>
                )}
              </div>
            </Tab>
          </Tabs>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModelModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSaveModel}>
            Save
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default AdminPage;