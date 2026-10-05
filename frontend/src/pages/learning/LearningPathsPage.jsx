import React, { useState, useEffect, useCallback } from 'react';
import { Layers, Plus, Search, BookOpen, CheckCircle2, Award, Loader2, X, ChevronRight, Video, FileText, HelpCircle } from 'lucide-react';
import api from '../../services/api';
import { useToast } from '../../hooks/useToast';
import './LearningPages.css';

export const LearningPathsPage = () => {
  const { showToast } = useToast();
  const [paths, setPaths] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPath, setSelectedPath] = useState(null);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [code, setCode] = useState('');
  const [category, setCategory] = useState('Software Engineering');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchPaths = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/learning/paths/');
      const list = Array.isArray(res?.results) ? res.results : Array.isArray(res) ? res : [];
      setPaths(list);
      if (list.length > 0 && !selectedPath) {
        setSelectedPath(list[0]);
      }
    } catch (err) {
      console.error('Failed to fetch learning paths:', err);
      showToast(err.message || 'Failed to load learning paths.', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [showToast, selectedPath]);

  useEffect(() => {
    fetchPaths();
  }, [fetchPaths]);

  const handleCreatePath = async (e) => {
    e.preventDefault();
    if (!title || !code) {
      showToast('Title and Code are required.', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = { title, code, category, description, status: 'active' };
      const newPath = await api.post('/learning/paths/', payload);
      showToast(`Learning Path "${newPath.title}" created successfully!`, 'success');
      setIsCreateModalOpen(false);
      setTitle('');
      setCode('');
      setDescription('');
      fetchPaths();
    } catch (err) {
      console.error('Error creating learning path:', err);
      showToast(err.message || 'Failed to create learning path.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredPaths = paths.filter((p) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (p.title || '').toLowerCase().includes(q) || (p.code || '').toLowerCase().includes(q);
  });

  return (
    <div className="learning-page-container">
      <div className="page-header">
        <div>
          <div className="page-title-wrap">
            <Layers className="text-indigo" size={28} />
            <h1 className="page-title">Configurable Learning Paths</h1>
          </div>
          <p className="page-subtitle">
            Structured skill levels, learning modules, content lectures, and assessments.
          </p>
        </div>

        <button className="btn btn-primary" onClick={() => setIsCreateModalOpen(true)}>
          <Plus size={18} />
          <span>+ Create Learning Path</span>
        </button>
      </div>

      <div className="table-controls-bar">
        <div className="search-box-wrap" style={{ width: '100%' }}>
          <Search size={18} className="search-icon" />
          <input 
            type="text"
            className="search-input"
            placeholder="Search learning paths by title or code..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {isLoading ? (
        <div className="loading-state">
          <Loader2 size={32} className="animate-spin text-indigo" />
          <p>Loading learning paths...</p>
        </div>
      ) : filteredPaths.length === 0 ? (
        <div className="empty-state-card">
          <Layers size={48} className="text-slate-400 mb-2" />
          <h3>No learning paths available</h3>
          <p>Create your first structured learning path for students.</p>
          <button className="btn btn-primary mt-4" onClick={() => setIsCreateModalOpen(true)}>
            <Plus size={16} /> Create Path
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-12 gap-6">
          {/* Path Roster */}
          <div className="col-span-4 flex flex-col gap-3">
            {filteredPaths.map((path) => (
              <div
                key={path.id}
                className={`path-card ${selectedPath?.id === path.id ? 'path-card-active' : ''}`}
                onClick={() => setSelectedPath(path)}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-bold text-slate-900">{path.title}</h4>
                    <span className="text-xs font-mono text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">{path.code}</span>
                  </div>
                  <span className="badge badge-success">{path.status}</span>
                </div>
                <p className="text-xs text-slate-500 mt-2 line-clamp-2">{path.description || 'No description provided.'}</p>
                <div className="flex items-center gap-4 mt-3 text-xs text-slate-400 border-t pt-2">
                  <span>Category: {path.category}</span>
                  <span>Levels: {path.levels?.length || 0}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Path Details Breakdown */}
          <div className="col-span-8">
            {selectedPath ? (
              <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                <div className="flex justify-between items-center border-b pb-4 mb-4">
                  <div>
                    <h2 className="text-xl font-bold text-slate-900">{selectedPath.title}</h2>
                    <p className="text-sm text-slate-500">{selectedPath.description}</p>
                  </div>
                  <span className="px-3 py-1 bg-indigo-100 text-indigo-800 font-mono text-xs font-bold rounded-md">
                    {selectedPath.code}
                  </span>
                </div>

                <h3 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
                  <BookOpen size={18} className="text-indigo-600" />
                  Curriculum Hierarchy (Levels & Modules)
                </h3>

                {selectedPath.levels && selectedPath.levels.length > 0 ? (
                  <div className="flex flex-col gap-4">
                    {selectedPath.levels.map((lvl) => (
                      <div key={lvl.id} className="border border-slate-200 rounded-lg p-4 bg-slate-50">
                        <div className="font-bold text-slate-800 text-sm mb-2">
                          Level {lvl.level_number}: {lvl.title}
                        </div>
                        {lvl.modules && lvl.modules.length > 0 ? (
                          <div className="grid grid-cols-2 gap-2 mt-2">
                            {lvl.modules.map((mod) => (
                              <div key={mod.id} className="bg-white p-3 rounded border border-slate-200 text-xs">
                                <div className="font-semibold text-slate-900 flex items-center gap-1">
                                  <ChevronRight size={14} className="text-indigo-500" />
                                  {mod.title}
                                </div>
                                <div className="text-slate-500 mt-1">{mod.contents?.length || 0} contents included</div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-xs text-slate-400 italic">No modules added to this level.</div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-6 text-center text-slate-400 border border-dashed rounded-lg">
                    No curriculum levels configured yet for this path.
                  </div>
                )}
              </div>
            ) : (
              <div className="p-8 text-center text-slate-400 bg-white rounded-xl border">
                Select a learning path from the left to view details.
              </div>
            )}
          </div>
        </div>
      )}

      {/* CREATE PATH MODAL */}
      {isCreateModalOpen && (
        <div className="modal-backdrop">
          <div className="modal-card modal-md">
            <div className="modal-header">
              <div className="modal-title-wrap">
                <Layers className="text-indigo" size={22} />
                <h3>Create New Learning Path</h3>
              </div>
              <button className="modal-close" onClick={() => setIsCreateModalOpen(false)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreatePath} className="modal-body">
              <div className="form-group">
                <label className="form-label required">Path Title</label>
                <input 
                  type="text"
                  className="form-control"
                  placeholder="e.g. Full Stack Python & Django Architecture"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group col-6">
                  <label className="form-label required">Unique Code</label>
                  <input 
                    type="text"
                    className="form-control font-mono"
                    placeholder="e.g. PATH-PY-01"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group col-6">
                  <label className="form-label required">Category</label>
                  <select 
                    className="form-control"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                  >
                    <option value="Software Engineering">Software Engineering</option>
                    <option value="Data Science & AI">Data Science & AI</option>
                    <option value="Cloud & DevOps">Cloud & DevOps</option>
                    <option value="Cybersecurity">Cybersecurity</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea 
                  className="form-control"
                  rows={3}
                  placeholder="Overview of target skills and competencies..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setIsCreateModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                  {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : 'Create Learning Path'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default LearningPathsPage;
