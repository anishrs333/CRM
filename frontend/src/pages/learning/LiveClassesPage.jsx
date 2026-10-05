import React, { useState, useEffect, useCallback } from 'react';
import { BookOpen, Plus, Calendar, Clock, Video, MapPin, CheckCircle2, X, Loader2, Users } from 'lucide-react';
import api from '../../services/api';
import studentService from '../../services/studentService';
import { useToast } from '../../hooks/useToast';

export const LiveClassesPage = () => {
  const { showToast } = useToast();
  const [classes, setClasses] = useState([]);
  const [courses, setCourses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [courseId, setCourseId] = useState('');
  const [classDate, setClassDate] = useState(new Date().toISOString().split('T')[0]);
  const [startTime, setStartTime] = useState('10:00');
  const [endTime, setEndTime] = useState('11:30');
  const [mode, setMode] = useState('online');
  const [meetingLink, setMeetingLink] = useState('');
  const [location, setLocation] = useState('Online Stream');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchClasses = useCallback(async () => {
    setIsLoading(true);
    try {
      const [cRes, crsRes] = await Promise.all([
        api.get('/learning/live-classes/'),
        studentService.getCourses()
      ]);
      const list = Array.isArray(cRes?.results) ? cRes.results : Array.isArray(cRes) ? cRes : [];
      setClasses(list);

      const courseList = Array.isArray(crsRes?.results) ? crsRes.results : Array.isArray(crsRes) ? crsRes : [];
      setCourses(courseList);
    } catch (err) {
      console.error('Failed to load live classes:', err);
      showToast(err.message || 'Failed to load live classes.', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchClasses();
  }, [fetchClasses]);

  const handleScheduleClass = async (e) => {
    e.preventDefault();
    if (!title || !classDate || !startTime || !endTime) {
      showToast('Title, date and times are required.', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        title,
        course: courseId ? parseInt(courseId) : null,
        class_date: classDate,
        start_time: startTime + ':00',
        end_time: endTime + ':00',
        mode,
        meeting_link: meetingLink,
        location,
        status: 'scheduled'
      };
      await api.post('/learning/live-classes/', payload);
      showToast(`Live Class "${title}" scheduled successfully!`, 'success');
      setIsScheduleModalOpen(false);
      setTitle('');
      setMeetingLink('');
      fetchClasses();
    } catch (err) {
      console.error('Schedule class error:', err);
      showToast(err.message || 'Failed to schedule class.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="learning-page-container">
      <div className="page-header">
        <div>
          <div className="page-title-wrap">
            <BookOpen className="text-indigo" size={28} />
            <h1 className="page-title">Live Classes & Learning Sessions</h1>
          </div>
          <p className="page-subtitle">
            Schedule live interactive lectures, technical workshops, and attendance tracking.
          </p>
        </div>

        <button className="btn btn-primary" onClick={() => setIsScheduleModalOpen(true)}>
          <Plus size={18} />
          <span>+ Schedule Live Class</span>
        </button>
      </div>

      {isLoading ? (
        <div className="loading-state">
          <Loader2 size={32} className="animate-spin text-indigo" />
          <p>Loading live class schedule...</p>
        </div>
      ) : classes.length === 0 ? (
        <div className="empty-state-card">
          <Calendar size={48} className="text-slate-400 mb-2" />
          <h3>No live classes scheduled</h3>
          <p>Schedule your first live learning session for enrolled students.</p>
          <button className="btn btn-primary mt-4" onClick={() => setIsScheduleModalOpen(true)}>
            <Plus size={16} /> Schedule Session
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {classes.map((cls) => (
            <div key={cls.id} className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-all">
              <div className="flex justify-between items-start mb-2">
                <span className={`badge ${cls.mode === 'online' ? 'badge-primary' : 'badge-success'}`}>
                  {cls.mode === 'online' ? <Video size={12} /> : <MapPin size={12} />}
                  <span className="capitalize">{cls.mode}</span>
                </span>
                <span className="badge badge-success capitalize">{cls.status}</span>
              </div>

              <h3 className="font-bold text-slate-900 text-lg mb-1">{cls.title}</h3>
              <div className="text-xs text-slate-500 mb-3">{cls.course_name || 'General Workshop'}</div>

              <div className="space-y-1.5 text-xs text-slate-600 border-t pt-3">
                <div className="flex items-center gap-2">
                  <Calendar size={14} className="text-slate-400" />
                  <span>{cls.class_date}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock size={14} className="text-slate-400" />
                  <span>{cls.start_time} - {cls.end_time}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users size={14} className="text-slate-400" />
                  <span>Faculty: {cls.faculty_name || 'Assigned Instructor'}</span>
                </div>
              </div>

              {cls.meeting_link && (
                <div className="mt-4 pt-3 border-t">
                  <a 
                    href={cls.meeting_link} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="btn btn-secondary w-full text-center justify-center text-xs font-semibold"
                  >
                    <Video size={14} /> Join Session Stream
                  </a>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* SCHEDULE MODAL */}
      {isScheduleModalOpen && (
        <div className="modal-backdrop">
          <div className="modal-card modal-md">
            <div className="modal-header">
              <div className="modal-title-wrap">
                <Video className="text-indigo" size={22} />
                <h3>Schedule New Live Class</h3>
              </div>
              <button className="modal-close" onClick={() => setIsScheduleModalOpen(false)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleScheduleClass} className="modal-body">
              <div className="form-group">
                <label className="form-label required">Session Title</label>
                <input 
                  type="text"
                  className="form-control"
                  placeholder="e.g. Masterclass: Django ORM Performance & Indexing"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Associated Course (Optional)</label>
                <select 
                  className="form-control"
                  value={courseId}
                  onChange={(e) => setCourseId(e.target.value)}
                >
                  <option value="">-- All Courses / Open Workshop --</option>
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>{c.title || c.course_name}</option>
                  ))}
                </select>
              </div>

              <div className="form-row">
                <div className="form-group col-6">
                  <label className="form-label required">Date</label>
                  <input 
                    type="date"
                    className="form-control"
                    value={classDate}
                    onChange={(e) => setClassDate(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group col-6">
                  <label className="form-label required">Mode</label>
                  <select 
                    className="form-control"
                    value={mode}
                    onChange={(e) => setMode(e.target.value)}
                  >
                    <option value="online">Online Stream</option>
                    <option value="offline">In-Person Physical Class</option>
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group col-6">
                  <label className="form-label required">Start Time</label>
                  <input 
                    type="time"
                    className="form-control"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group col-6">
                  <label className="form-label required">End Time</label>
                  <input 
                    type="time"
                    className="form-control"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Meeting Link / Location</label>
                <input 
                  type="text"
                  className="form-control"
                  placeholder={mode === 'online' ? "https://meet.google.com/xyz-abc" : "Lab 102, Main Campus"}
                  value={mode === 'online' ? meetingLink : location}
                  onChange={(e) => mode === 'online' ? setMeetingLink(e.target.value) : setLocation(e.target.value)}
                />
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setIsScheduleModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                  {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : 'Schedule Class'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default LiveClassesPage;
