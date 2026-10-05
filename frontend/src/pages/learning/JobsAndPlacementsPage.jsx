import React, { useState, useEffect, useCallback } from 'react';
import { Briefcase, Plus, Search, Building2, MapPin, DollarSign, Calendar, CheckCircle2, User, Loader2, X } from 'lucide-react';
import api from '../../services/api';
import studentService from '../../services/studentService';
import { useToast } from '../../hooks/useToast';

export const JobsAndPlacementsPage = () => {
  const { showToast } = useToast();
  const [jobs, setJobs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [students, setStudents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal States
  const [isPostJobModalOpen, setIsPostJobModalOpen] = useState(false);
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);

  // Job Form
  const [jobTitle, setJobTitle] = useState('');
  const [companyId, setCompanyId] = useState('');
  const [jobType, setJobType] = useState('full_time');
  const [location, setLocation] = useState('Chennai / Hybrid');
  const [ctc, setCtc] = useState('6.5 LPA');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Apply Form
  const [selectedJob, setSelectedJob] = useState(null);
  const [selectedStudentId, setSelectedStudentId] = useState('');

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [jRes, aRes, cRes, sRes] = await Promise.all([
        api.get('/learning/jobs/'),
        api.get('/learning/applications/'),
        studentService.getCompanies(),
        studentService.getStudents({ status: 'completed' })
      ]);

      const jobList = Array.isArray(jRes?.results) ? jRes.results : Array.isArray(jRes) ? jRes : [];
      setJobs(jobList);

      const appList = Array.isArray(aRes?.results) ? aRes.results : Array.isArray(aRes) ? aRes : [];
      setApplications(appList);

      const compList = Array.isArray(cRes?.results) ? cRes.results : Array.isArray(cRes) ? cRes : [];
      setCompanies(compList);

      const stdList = Array.isArray(sRes?.results) ? sRes.results : Array.isArray(sRes?.data) ? sRes.data : Array.isArray(sRes) ? sRes : [];
      setStudents(stdList);
    } catch (err) {
      console.error('Failed to load jobs/applications:', err);
      showToast(err.message || 'Failed to load recruitment data.', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handlePostJob = async (e) => {
    e.preventDefault();
    if (!jobTitle || !companyId) {
      showToast('Job Title and Company are required.', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        title: jobTitle,
        company: parseInt(companyId),
        job_type: jobType,
        location,
        ctc_or_stipend: ctc,
        description,
        is_active: true
      };
      await api.post('/learning/jobs/', payload);
      showToast(`Job Opportunity "${jobTitle}" posted successfully!`, 'success');
      setIsPostJobModalOpen(false);
      setJobTitle('');
      loadData();
    } catch (err) {
      console.error('Post job error:', err);
      showToast(err.message || 'Failed to post job opportunity.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleApplyStudent = async (e) => {
    e.preventDefault();
    if (!selectedJob || !selectedStudentId) {
      showToast('Select a job and eligible student.', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        job: selectedJob.id,
        student: parseInt(selectedStudentId),
        status: 'applied'
      };
      await api.post('/learning/applications/', payload);
      showToast('Student application submitted to hiring pipeline!', 'success');
      setIsApplyModalOpen(false);
      loadData();
    } catch (err) {
      console.error('Apply error:', err);
      showToast(err.message || 'Failed to submit application.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="learning-page-container">
      <div className="page-header">
        <div>
          <div className="page-title-wrap">
            <Briefcase className="text-indigo" size={28} />
            <h1 className="page-title">Internships & Job Opportunities</h1>
          </div>
          <p className="page-subtitle">
            Hiring partner positions, student placement applications, and interview pipelines.
          </p>
        </div>

        <button className="btn btn-primary" onClick={() => setIsPostJobModalOpen(true)}>
          <Plus size={18} />
          <span>+ Post Job / Internship</span>
        </button>
      </div>

      {isLoading ? (
        <div className="loading-state">
          <Loader2 size={32} className="animate-spin text-indigo" />
          <p>Loading recruitment pipeline...</p>
        </div>
      ) : (
        <div className="grid grid-cols-12 gap-6">
          {/* Active Job Opportunities */}
          <div className="col-span-7 flex flex-col gap-4">
            <h3 className="font-bold text-slate-800 text-base">Active Opportunities ({jobs.length})</h3>
            {jobs.length === 0 ? (
              <div className="empty-state-card">
                <Briefcase size={40} className="text-slate-400 mb-2" />
                <p>No job postings available yet.</p>
              </div>
            ) : (
              jobs.map((job) => (
                <div key={job.id} className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-bold text-slate-900 text-lg">{job.title}</h4>
                      <div className="flex items-center gap-2 text-sm text-indigo-600 font-medium">
                        <Building2 size={16} />
                        <span>{job.company_name}</span>
                      </div>
                    </div>
                    <span className="badge badge-primary uppercase text-xs">
                      {job.job_type === 'full_time' ? 'Full-Time' : 'Internship'}
                    </span>
                  </div>

                  <div className="flex items-center gap-4 mt-3 text-xs text-slate-600">
                    <div className="flex items-center gap-1">
                      <MapPin size={14} className="text-slate-400" />
                      <span>{job.location}</span>
                    </div>
                    <div className="flex items-center gap-1 font-semibold text-emerald-700">
                      <span>Package: {job.ctc_or_stipend}</span>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t flex justify-between items-center">
                    <span className="text-xs text-slate-400">
                      Posted: {new Date(job.created_at).toLocaleDateString()}
                    </span>
                    <button 
                      className="btn btn-secondary text-xs"
                      onClick={() => {
                        setSelectedJob(job);
                        setIsApplyModalOpen(true);
                      }}
                    >
                      <User size={14} /> Submit Candidate
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Application Pipeline Roster */}
          <div className="col-span-5 bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
            <h3 className="font-bold text-slate-800 text-base mb-4">Application Pipeline ({applications.length})</h3>
            {applications.length === 0 ? (
              <div className="text-center text-slate-400 text-xs py-8">
                No active candidate applications.
              </div>
            ) : (
              <div className="space-y-3">
                {applications.map((app) => (
                  <div key={app.id} className="border border-slate-200 rounded-lg p-3 bg-slate-50 text-xs">
                    <div className="flex justify-between items-center font-bold text-slate-900">
                      <span>{app.student_name}</span>
                      <span className="badge badge-success capitalize">{app.status}</span>
                    </div>
                    <div className="text-slate-500 mt-1">{app.job_title} @ {app.company_name}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* POST JOB MODAL */}
      {isPostJobModalOpen && (
        <div className="modal-backdrop">
          <div className="modal-card modal-md">
            <div className="modal-header">
              <div className="modal-title-wrap">
                <Briefcase className="text-indigo" size={22} />
                <h3>Post Job / Internship</h3>
              </div>
              <button className="modal-close" onClick={() => setIsPostJobModalOpen(false)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handlePostJob} className="modal-body">
              <div className="form-group">
                <label className="form-label required">Job Title</label>
                <input 
                  type="text"
                  className="form-control"
                  placeholder="e.g. Junior Full Stack Engineer"
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label required">Hiring Partner Company</label>
                <select 
                  className="form-control"
                  value={companyId}
                  onChange={(e) => setCompanyId(e.target.value)}
                  required
                >
                  <option value="">-- Select Company --</option>
                  {companies.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div className="form-row">
                <div className="form-group col-6">
                  <label className="form-label required">Role Type</label>
                  <select 
                    className="form-control"
                    value={jobType}
                    onChange={(e) => setJobType(e.target.value)}
                  >
                    <option value="full_time">Full Time Job</option>
                    <option value="internship">Internship Program</option>
                  </select>
                </div>

                <div className="form-group col-6">
                  <label className="form-label required">CTC / Stipend</label>
                  <input 
                    type="text"
                    className="form-control"
                    placeholder="e.g. 6.5 LPA or ₹25,000/mo"
                    value={ctc}
                    onChange={(e) => setCtc(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Location</label>
                <input 
                  type="text"
                  className="form-control"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                />
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setIsPostJobModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                  {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : 'Post Job'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* APPLY STUDENT MODAL */}
      {isApplyModalOpen && selectedJob && (
        <div className="modal-backdrop">
          <div className="modal-card modal-md">
            <div className="modal-header">
              <div className="modal-title-wrap">
                <User className="text-indigo" size={22} />
                <h3>Submit Candidate for {selectedJob.title}</h3>
              </div>
              <button className="modal-close" onClick={() => setIsApplyModalOpen(false)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleApplyStudent} className="modal-body">
              <div className="form-group">
                <label className="form-label required">Select Eligible Completed Student</label>
                <select 
                  className="form-control"
                  value={selectedStudentId}
                  onChange={(e) => setSelectedStudentId(e.target.value)}
                  required
                >
                  <option value="">-- Choose Candidate --</option>
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>{s.full_name} ({s.enrollment_id})</option>
                  ))}
                </select>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setIsApplyModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                  {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : 'Submit Candidate'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default JobsAndPlacementsPage;
