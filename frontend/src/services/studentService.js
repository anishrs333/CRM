import api from './api';
import { storage } from '../utils/storage';

export const studentService = {
  getStudents: async (params = {}) => {
    return await api.get('/students/', { params });
  },

  getStudentById: async (id) => {
    return await api.get(`/students/${id}/`);
  },

  createStudent: async (studentData) => {
    return await api.post('/students/', studentData);
  },

  updateStudent: async (id, studentData) => {
    return await api.put(`/students/${id}/`, studentData);
  },

  deleteStudent: async (id) => {
    return await api.delete(`/students/${id}/`);
  },

  extendCourse: async (studentId, addedDays, reason) => {
    return await api.post(`/students/${studentId}/extend_course/`, {
      added_days: addedDays,
      reason: reason
    });
  },

  getDashboardStats: async () => {
    return await api.get('/students/dashboard_stats/');
  },

  getCourses: async () => {
    return await api.get('/courses/');
  },

  createCourse: async (courseData) => {
    return await api.post('/courses/', courseData);
  },

  getCompanies: async () => {
    return await api.get('/companies/');
  },

  createCompany: async (companyData) => {
    return await api.post('/companies/', companyData);
  },

  createPayment: async (paymentData) => {
    return await api.post('/payments/', paymentData);
  },

  createPlacement: async (placementData) => {
    return await api.post('/placements/', placementData);
  },

  getCertificates: async (params = {}) => {
    return await api.get('/certificates/', { params });
  },

  getCertificateById: async (id) => {
    return await api.get(`/certificates/${id}/`);
  },

  generateCertificate: async (certificateData) => {
    return await api.post('/certificates/', certificateData);
  },

  revokeCertificate: async (id, reason) => {
    return await api.post(`/certificates/${id}/revoke/`, { reason });
  },

  verifyCertificate: async (certificateId) => {
    return await api.get('/certificates/verify/', { params: { certificate_id: certificateId } });
  },

  downloadCertificatePDF: async (certificateId, customFilename) => {
    const token = storage.getAccessToken() || localStorage.getItem('access_token') || localStorage.getItem('apexcrm_access_token');
    const response = await fetch(`http://127.0.0.1:8000/api/certificates/${certificateId}/download_pdf/`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || errorData.error || 'Failed to download certificate PDF.');
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = customFilename || `Certificate_${certificateId}.pdf`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },

  downloadPDF: async (studentId, enrollmentId) => {
    const token = storage.getAccessToken() || localStorage.getItem('access_token') || localStorage.getItem('apexcrm_access_token');
    const response = await fetch(`http://127.0.0.1:8000/api/students/${studentId}/pdf/`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to generate PDF document.');
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Receipt_${enrollmentId || studentId}.pdf`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  }
};

export default studentService;
