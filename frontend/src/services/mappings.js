// src/services/mappings.js
import apiClient from './api';

export const getMappings = async () => {
  const response = await apiClient.get('/mappings/');
  return response.data;
};

export const getMapping = async (id) => {
  const response = await apiClient.get(`/mappings/${id}`);
  return response.data;
};

export const createMapping = async (mappingData) => {
  const response = await apiClient.post('/mappings/', mappingData);
  return response.data;
};

export const updateMapping = async (id, mappingData) => {
  const response = await apiClient.put(`/mappings/${id}`, mappingData);
  return response.data;
};

export const deleteMapping = async (id) => {
  const response = await apiClient.delete(`/mappings/${id}`);
  return response.data;
};

export const testMapping = async (id, testData) => {
  const response = await apiClient.post(`/mappings/${id}/test`, testData);
  return response.data;
};

export const uploadSampleFile = async (file) => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await apiClient.post('/mappings/upload-sample', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  
  return response.data;
};