import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

const api = axios.create({ baseURL: BASE_URL });

export const getDownloadUrl = (fileName) => `${BASE_URL}/policies/download/${encodeURIComponent(fileName)}`;

export const recommend = (userProfile) => {
  // Support both legacy payload and new RecommendationQuery
  const diseases = userProfile.diseases || (userProfile.health_condition ? [userProfile.health_condition] : []);
  
  let incomeVal = 500000;
  if (typeof userProfile.annual_income === 'number') {
    incomeVal = userProfile.annual_income;
  } else if (typeof userProfile.annual_income === 'string') {
    const parsed = parseFloat(userProfile.annual_income.replace(/[^0-9.]/g, ''));
    if (!isNaN(parsed) && parsed > 0) {
      incomeVal = parsed < 100 ? parsed * 100000 : parsed;
    }
  }

  const payload = {
    diseases: diseases,
    annual_income: incomeVal,
    age: parseInt(userProfile.age || 30, 10),
    day_of_week: userProfile.day_of_week || null,
    scheme_type: userProfile.scheme_type || 'All',
    min_coverage: userProfile.min_coverage || 0,
  };

  return api.post('/policies/recommend', payload).then(r => r.data);
};

export const chat = (payload) =>
  api.post('/chat', payload).then(r => r.data);

// Admin Policy APIs
export const getAdminPolicies = () =>
  api.get('/admin/policies').then(r => r.data.policies || []);

export const getAdminStats = () =>
  api.get('/admin/stats').then(r => r.data);

export const createPolicyAdmin = (formData) =>
  api.post('/admin/policies', formData).then(r => r.data);

export const updatePolicyAdmin = (policyId, updates) =>
  api.put(`/admin/policies/${policyId}`, updates).then(r => r.data);

export const deletePolicyAdmin = (identifier) =>
  api.delete(`/admin/policies/${encodeURIComponent(identifier)}`).then(r => r.data);

export const deleteAdminPolicy = deletePolicyAdmin;
export const deletePolicy = deletePolicyAdmin;
export const uploadPolicy = createPolicyAdmin;
export const getPolicies = getAdminPolicies;

// User Discovery APIs
export const getActivePolicies = (day) =>
  api.get('/policies/active', { params: { day } }).then(r => r.data);

export const getPoliciesByDisease = (disease) =>
  api.get('/policies/by-disease', { params: { disease } }).then(r => r.data);

export const getPoliciesByDiseases = (diseases) =>
  api.get('/policies/by-diseases', { params: { diseases: diseases.join(',') } }).then(r => r.data);

export const getPoliciesByIncome = (income) =>
  api.get('/policies/by-income', { params: { income } }).then(r => r.data);

export const refreshVectorDB = () =>
  api.post('/refresh-vector-db').then(r => r.data);
