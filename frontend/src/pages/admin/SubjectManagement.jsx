/**
 * SmartAttend AI - Subject / Course Management Page
 */

import { useState } from 'react';
import { MOCK_SUBJECTS, DEPARTMENTS } from '../../utils/mockData';
import Modal from '../../components/common/Modal';
import {
  HiOutlineBookOpen,
  HiOutlinePlusCircle,
  HiOutlineAcademicCap,
  HiOutlineChartBar,
} from 'react-icons/hi2';

export default function SubjectManagement() {
  const [subjects, setSubjects] = useState(MOCK_SUBJECTS);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newSubject, setNewSubject] = useState({
    code: '',
    name: '',
    department: DEPARTMENTS[0],
    semester: 5,
    credits: 4,
    faculty_name: 'Prof. Ananya Sundaram',
  });

  const handleAddSubject = (e) => {
    e.preventDefault();
    const created = {
      id: `sub-${Date.now()}`,
      code: newSubject.code,
      name: newSubject.name,
      department: newSubject.department,
      semester: Number(newSubject.semester),
      credits: Number(newSubject.credits),
      faculty_name: newSubject.faculty_name,
      total_sessions_held: 0,
      avg_attendance: 100.0,
    };
    setSubjects([...subjects, created]);
    setIsAddModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Subject & Course Catalog</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Curriculum mapping, semester credit allocations, and faculty assignments.
          </p>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary-500 hover:bg-primary-600 text-white rounded-xl text-xs font-bold shadow-md shadow-primary-500/20 transition-all self-start sm:self-auto"
        >
          <HiOutlinePlusCircle className="w-4 h-4" />
          Add Subject Code
        </button>
      </div>

      {/* Subjects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {subjects.map((sub) => (
          <div
            key={sub.id}
            className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between">
                <span className="font-mono text-xs font-extrabold px-3 py-1 rounded-lg bg-primary-50 text-primary-700 border border-primary-200">
                  {sub.code}
                </span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                  {sub.credits} Credits • Sem {sub.semester}
                </span>
              </div>

              <h3 className="font-bold text-slate-900 text-base mt-3 leading-snug">
                {sub.name}
              </h3>
              <p className="text-xs text-slate-500 mt-1">{sub.department}</p>

              <div className="mt-4 p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1.5 text-xs">
                <div className="flex items-center justify-between text-slate-600">
                  <span className="flex items-center gap-1.5">
                    <HiOutlineAcademicCap className="w-4 h-4 text-slate-400" />
                    Faculty In Charge:
                  </span>
                  <span className="font-semibold text-slate-900">{sub.faculty_name}</span>
                </div>
                <div className="flex items-center justify-between text-slate-600">
                  <span className="flex items-center gap-1.5">
                    <HiOutlineChartBar className="w-4 h-4 text-slate-400" />
                    Sessions Conducted:
                  </span>
                  <span className="font-bold text-primary-700">{sub.total_sessions_held} classes</span>
                </div>
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-500">
                Avg Attendance: <strong className="text-emerald-700 font-bold">{sub.avg_attendance}%</strong>
              </span>
              <button className="text-primary-600 hover:text-primary-800 font-bold">
                View Roster
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add Subject Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add New Subject"
        subtitle="Registers course code, assigns lead faculty, and enables attendance marking."
      >
        <form onSubmit={handleAddSubject} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Subject Code
              </label>
              <input
                type="text"
                required
                value={newSubject.code}
                onChange={(e) => setNewSubject({ ...newSubject, code: e.target.value })}
                placeholder="e.g. CS505"
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-primary-500 focus:outline-none font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Credits
              </label>
              <input
                type="number"
                min="1"
                max="6"
                required
                value={newSubject.credits}
                onChange={(e) => setNewSubject({ ...newSubject, credits: e.target.value })}
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-primary-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Subject Name
            </label>
            <input
              type="text"
              required
              value={newSubject.name}
              onChange={(e) => setNewSubject({ ...newSubject, name: e.target.value })}
              placeholder="e.g. Advanced Computer Architecture"
              className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-primary-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Department
              </label>
              <select
                value={newSubject.department}
                onChange={(e) => setNewSubject({ ...newSubject, department: e.target.value })}
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-primary-500 focus:outline-none"
              >
                {DEPARTMENTS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Assigned Faculty
              </label>
              <input
                type="text"
                required
                value={newSubject.faculty_name}
                onChange={(e) => setNewSubject({ ...newSubject, faculty_name: e.target.value })}
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-primary-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="px-4 py-2 border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-xl text-xs font-bold shadow-md shadow-primary-500/20"
            >
              Save Subject
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
