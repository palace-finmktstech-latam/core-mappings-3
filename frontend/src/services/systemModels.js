// src/services/systemModels.js
import apiClient from './api';

export const getSystemModels = async () => {
  const response = await apiClient.get('/system-models/');
  return response.data;
};

export const getSystemModel = async (id) => {
  const response = await apiClient.get(`/system-models/${id}`);
  return response.data;
};

export const createSystemModel = async (modelData) => {
  const response = await apiClient.post('/system-models/', modelData);
  return response.data;
};

export const updateSystemModel = async (id, modelData) => {
  const response = await apiClient.put(`/system-models/${id}`, modelData);
  return response.data;
};

export const deleteSystemModel = async (id) => {
  const response = await apiClient.delete(`/system-models/${id}`);
  return response.data;
};