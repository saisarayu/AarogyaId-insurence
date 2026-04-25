import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000',
  headers: {
    'Content-Type': 'application/json',
  },
});

export const recommend = (userProfile) => api.post('/recommend', userProfile).then((response) => response.data);

export const chat = (payload) => api.post('/chat', payload).then((response) => response.data);

export const uploadPolicy = (file) => {
  const formData = new FormData();
  formData.append('file', file);
  return api.post('/upload-policy', formData).then((response) => response.data);
};

export const getPolicies = () => api.get('/policies').then((response) => response.data.policies ?? response.data);

export const deletePolicy = (file_name) =>
  api.delete('/delete-policy', { params: { file_name } }).then((response) => response.data);
