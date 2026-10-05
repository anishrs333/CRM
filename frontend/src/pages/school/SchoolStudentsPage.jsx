import React, { useState, useEffect, useCallback } from 'react';
import { GraduationCap, Plus, Search, User, Calendar, BookOpen, Layers, Loader2, X, Eye } from 'lucide-react';
import api from '../../services/api';
import { useToast } from '../../hooks/useToast';
import './SchoolPages.css';

export const SchoolStudentsPage = () => {
  const { showToast } = useToast();
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);

  // Form State
  const [admissionNumber, setAdmissionNumber] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [gender, setGender] = useState('male');
  const [dateOfBirth, setDateOfBirth] = useState('2012-01-01');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchStudents = useCallback(async () => {
    setIsLoading(true);
    try {
      const [sRes, cRes] = await Promise.all([
        api.get('/school/students/'),
        api.get('/school/classes/')
      ]);
      const list = Array.isArray(sRes?.results) ? sRes.results : Array.isArray(sRes) ? sRes : [];
      setStudents(list);

      const classList = Array.isArray(cRes?.results) ? cRes.results : Array.isArray(cRes) ? cRes : [];
      setClasses(classList);
    } catch (err) {
      console.error('Failed to load school students:', err);
      showToast(err.message || 'Failed to load school students.', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  const handleAddStudent = async (e) => {
    e.preventDefault();
    if (!admissionNumber || !firstName || !lastName) {
      showToast('Admission Number, First Name and Last Name are required.', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        admission_number: admissionNumber,
        first_name: firstName,
        last_name: lastName,
        gender,
        date_of_birth: dateOfBirth,
        phone,
        email,
        address,
        status: 'active'
      };
      await api.post('/school/students/', payload);
      showToast(`School Student "${firstName} ${lastName}" registered successfully!`, 'success');
      setIsAddModalOpen(false);
      setAdmissionNumber('');
      setFirstName('');
      setLastName('');
      fetchStudents();
    } catch (err) {
      console.error('Add student error:', err);
      showToast(err.message || 'Failed to register school student.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filtered = students.filter((s) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      (s.first_name || '').toLowerCase().includes(q) ||
      (s.last_name || '').toLowerCase().includes(q) ||
      (s.admission_number || '').toLowerCase().includes(q) ||
      (s.email || '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="learning-page-container">
      <div className="page-header">
        <div>
          <div className="page-title-wrap">
            <GraduationCap className="text-emerald-600" size={28} />
            <h1 className="page-title">School Students Roster</h1>
          </div>
          <p className="page-subtitle">
            Manage school student profiles, academic year enrollments, classes, and sections.
          </p>
        </div>

        <button className="btn btn-primary" style={{ backgroundColor: '#059669' }} onClick={() => setIsAddModalOpen(true)}>
          <Plus size={18} />
          <span>Add Campus Student</span>
        </button>
      </div>

      <div className="table-controls-bar">
        <div className="search-box-wrap" style={{ width: '100%' }}>
          <Search size={18} className="search-icon" />
          <input 
            type="text"
            className="search-input"
            placeholder="Search school students by admission number, name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {isLoading ? (
        <div className="loading-state">
          <Loader2 size={32} className="animate-spin text-emerald-600" />
          <p>Loading school students...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state-card">
          <GraduationCap size={48} className="text-slate-400 mb-2" />
          <h3>No school students available</h3>
          <p>Register school students to manage academic history, attendance, and exam results.</p>
          <button className="btn btn-primary mt-4" style={{ backgroundColor: '#059669' }} onClick={() => setIsAddModalOpen(true)}>
            <Plus size={16} /> Add School Student
          </button>
        </div>
      ) : (
        <div className="table-card">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Admission #</th>
                <th>Student Name</th>
                <th>Gender</th>
                <th>Date of Birth</th>
                <th>Current Class & Section</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((std) => (
                <tr key={std.id}>
                  <td>
                    <span className="font-mono font-bold text-emerald-800 bg-emerald-50 px-2 py-1 rounded">
                      {std.admission_number}
                    </span>
                  </td>
                  <td>
                    <div>
                      <div className="font-bold text-slate-900">{std.first_name} {std.last_name}</div>
                      <div className="text-xs text-slate-400">{std.email || 'No email'}</div>
                    </div>
                  </td>
                  <td>
                    <span className="capitalize text-xs font-medium text-slate-600">{std.gender}</span>
                  </td>
                  <td>
                    <span className="text-xs text-slate-600">{std.date_of_birth}</span>
                  </td>
                  <td>
                    {std.current_enrollment ? (
                      <span className="text-xs font-semibold text-slate-800">
                        {std.current_enrollment.class_name} ({std.current_enrollment.section_name})
                      </span>
                    ) : (
                      <span className="text-xs text-slate-400 italic">Not Enrolled</span>
                    )}
                  </td>
                  <td>
                    <span className="badge badge-success uppercase text-xs">{std.status}</span>
                  </td>
                  <td>
                    <button 
                      className="btn-action btn-action-view"
                      onClick={() => {
                        setSelectedStudent(std);
                        setIsProfileModalOpen(true);
                      }}
                    >
                      <Eye size={15} /> Preview Profile
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ADD STUDENT MODAL */}
      {isAddModalOpen && (
        <div className="modal-backdrop">
          <div className="modal-card modal-md">
            <div className="modal-header">
              <div className="modal-title-wrap">
                <GraduationCap className="text-emerald-600" size={22} />
                <h3>Add School Student</h3>
              </div>
              <button className="modal-close" onClick={() => setIsAddModalOpen(false)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAddStudent} className="modal-body">
              <div className="form-group">
                <label className="form-label required">Admission Number</label>
                <input 
                  type="text"
                  className="form-control font-mono"
                  placeholder="e.g. ADM-2026-001"
                  value={admissionNumber}
                  onChange={(e) => setAdmissionNumber(e.target.value)}
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group col-6">
                  <label className="form-label required">First Name</label>
                  <input 
                    type="text"
                    className="form-control"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group col-6">
                  <label className="form-label required">Last Name</label>
                  <input 
                    type="text"
                    className="form-control"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group col-6">
                  <label className="form-label required">Gender</label>
                  <select 
                    className="form-control"
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div className="form-group col-6">
                  <label className="form-label required">Date of Birth</label>
                  <input 
                    type="date"
                    className="form-control"
                    value={dateOfBirth}
                    onChange={(e) => setDateOfBirth(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group col-6">
                  <label className="form-label">Phone</label>
                  <input 
                    type="text"
                    className="form-control"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>

                <div className="form-group col-6">
                  <label className="form-label">Email</label>
                  <input 
                    type="email"
                    className="form-control"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Address</label>
                <textarea 
                  className="form-control"
                  rows={2}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                />
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setIsAddModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" style={{ backgroundColor: '#059669' }} disabled={isSubmitting}>
                  {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : 'Register Student'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PROFILE MODAL */}
      {isProfileModalOpen && selectedStudent && (
        <div className="modal-backdrop">
          <div className="modal-card modal-md">
            <div className="modal-header">
              <div className="modal-title-wrap">
                <User className="text-emerald-600" size={22} />
                <h3>School Student Profile</h3>
              </div>
              <button className="modal-close" onClick={() => setIsProfileModalOpen(false)}>
                <X size={20} />
              </button>
            </div>

            <div className="modal-body space-y-3">
              <div className="p-4 bg-emerald-50 rounded-lg border border-emerald-200">
                <h3 className="font-bold text-lg text-emerald-900">{selectedStudent.first_name} {selectedStudent.last_name}</h3>
                <div className="text-xs font-mono text-emerald-700">Admission #: {selectedStudent.admission_number}</div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-4 rounded-lg border">
                <div><span className="text-slate-500">Gender:</span> <span className="font-semibold capitalize">{selectedStudent.gender}</span></div>
                <div><span className="text-slate-500">Date of Birth:</span> <span className="font-semibold">{selectedStudent.date_of_birth}</span></div>
                <div><span className="text-slate-500">Phone:</span> <span className="font-semibold">{selectedStudent.phone || 'N/A'}</span></div>
                <div><span className="text-slate-500">Email:</span> <span className="font-semibold">{selectedStudent.email || 'N/A'}</span></div>
                <div className="col-span-2"><span className="text-slate-500">Address:</span> <span className="font-semibold">{selectedStudent.address || 'N/A'}</span></div>
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setIsProfileModalOpen(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SchoolStudentsPage;
