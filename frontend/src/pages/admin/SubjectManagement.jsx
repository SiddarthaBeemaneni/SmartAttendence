/**
 * SmartAttend AI / CampusAI - Subject / Course Management Page (Database Connected)
 */

import { useState, useEffect } from 'react';
import api from '../../services/api';
import { DEPARTMENTS } from '../../utils/mockData';
import Modal from '../../components/common/Modal';
import {
  HiOutlineBookOpen,
  HiOutlinePlusCircle,
  HiOutlineAcademicCap,
  HiOutlineChartBar,
  HiOutlineArrowPath,
  HiOutlineExclamationCircle,
} from 'react-icons/hi2';

export default function SubjectManagement() {
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const [newSubject, setNewSubject] = useState({
    code: '',
    name: '',
    department: DEPARTMENTS[0],
    semester: 5,
    credits: 4,
    faculty_name: 'Prof. Ananya Sundaram',
  });

  const fetchSubjects = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/subjects');
      setSubjects(res.data || []);
    } catch (err) {
      console.error('Failed to load subjects:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubjects();
  }, []);

  const handleAddSubject = async (e) => {
    e.preventDefault();
    setSaving(true);
    setErrorMessage('');
    try {
      await api.post('/api/subjects', {
        code: newSubject.code.trim().toUpperCase(),
        name: newSubject.name.trim(),
        department: newSubject.department,
        semester: Number(newSubject.semester),
        credits: Number(newSubject.credits),
        faculty_name: newSubject.faculty_name,
      });

      setIsAddModalOpen(false);
      setNewSubject({
        code: '',
        name: '',
        department: DEPARTMENTS[0],
        semester: 5,
        credits: 4,
        faculty_name: 'Prof. Ananya Sundaram',
      });
      fetchSubjects();
    } catch (err) {
      setErrorMessage(err.response?.data?.detail || 'Failed to add subject.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Subject & Course Catalog</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Curriculum mapping, semester credit allocations, and faculty assignments for your college.
          </p>
        </div>
        <button
          onClick={() => { setErrorMessage(''); setIsAddModalOpen(true); }}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary-500 hover:bg-primary-600 text-white rounded-xl text-xs font-bold shadow-md shadow-primary-500/20 transition-all self-start sm:self-auto"
        >
          <HiOutlinePlusCircle className="w-4 h-4" />
          Add Subject Code
        </button>
      </div>

      {loading ? (
        <div className="p-12 text-center text-slate-400 space-y-2">
          <HiOutlineArrowPath className="w-6 h-6 animate-spin mx-auto text-primary-500" />
          <p className="text-xs font-semibold">Loading curriculum courses...</p>
        </div>
      ) : subjects.length === 0 ? (
        <div className="p-12 text-center text-slate-400 space-y-3 bg-white rounded-2xl border border-slate-200">
          <HiOutlineBookOpen className="w-10 h-10 mx-auto text-slate-300" />
          <p className="text-sm font-bold text-slate-700">No Subjects Found</p>
          <p className="text-xs text-slate-400">Add your college's subjects to start taking class attendance.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {subjects.map((sub) => (
            <div
              key={sub.id}
              className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="px-2.5 py-1 rounded-lg bg-primary-50 text-primary-700 font-bold text-xs font-mono">
                    {sub.code}
                  </span>
                  <span className="text-xs font-semibold text-slate-400">
                    Sem {sub.semester} • {sub.credits} Credits
                  </span>
                </div>
                <h3 className="font-bold text-base text-slate-900 leading-snug">{sub.name}</h3>
                <p className="text-xs text-slate-500 mt-1">{sub.department}</p>
              </div>

              <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-600 font-medium flex items-center gap-1.5">
                  <HiOutlineAcademicCap className="w-4 h-4 text-slate-400" />
                  {sub.faculty_name || 'Unassigned'}
                </span>
                <span className="text-emerald-600 font-bold">Active</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Subject Modal */}
      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Add New Subject Code">
        <form onSubmit={handleAddSubject} className="space-y-4">
          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs font-semibold flex items-center gap-2">
              <HiOutlineExclamationCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Subject Code</label>
            <input
              type="text"
              required
              placeholder="e.g. CS8501"
              value={newSubject.code}
              onChange={(e) => setNewSubject({ ...newSubject, code: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm font-mono uppercase focus:outline-none focus:ring-2 focus:ring-primary-500/20"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Subject Name</label>
            <input
              type="text"
              required
              placeholder="e.g. Theory of Computation"
              value={newSubject.name}
              onChange={(e) => setNewSubject({ ...newSubject, name: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Department</label>
              <select
                value={newSubject.department}
                onChange={(e) => setNewSubject({ ...newSubject, department: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none"
              >
                {DEPARTMENTS.map((dept) => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Semester</label>
              <select
                value={newSubject.semester}
                onChange={(e) => setNewSubject({ ...newSubject, semester: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none"
              >
                {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                  <option key={sem} value={sem}>Sem {sem}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-xl text-xs font-bold shadow-md shadow-primary-500/20"
            >
              {saving ? 'Adding Subject...' : 'Save Subject'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
