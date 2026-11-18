/**
 * SmartAttend AI - Faculty Management Page
 */

import { useState } from 'react';
import { MOCK_FACULTY, DEPARTMENTS } from '../../utils/mockData';
import Modal from '../../components/common/Modal';
import {
  HiOutlineAcademicCap,
  HiOutlineUserPlus,
  HiOutlineMagnifyingGlass,
  HiOutlineBookOpen,
  HiOutlineEnvelope,
  HiOutlinePhone,
} from 'react-icons/hi2';

export default function FacultyManagement() {
  const [facultyList, setFacultyList] = useState(MOCK_FACULTY);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newFaculty, setNewFaculty] = useState({
    name: '',
    employee_id: '',
    department: DEPARTMENTS[0],
    email: '',
    phone: '',
    designation: 'Assistant Professor',
  });

  const filteredFaculty = facultyList.filter(
    (f) =>
      f.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.employee_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.department.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddFaculty = (e) => {
    e.preventDefault();
    const created = {
      id: `f-${Date.now()}`,
      name: newFaculty.name,
      employee_id: newFaculty.employee_id,
      department: newFaculty.department,
      email: newFaculty.email,
      phone: newFaculty.phone,
      designation: newFaculty.designation,
      subjects: ['CS501 - Distributed Systems'],
      classes_assigned: ['CSE-5A'],
      status: 'Active',
    };
    setFacultyList([created, ...facultyList]);
    setIsAddModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Faculty Directory</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Manage professors, departmental assignments, and authorized attendance markers.
          </p>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary-500 hover:bg-primary-600 text-white rounded-xl text-xs font-bold shadow-md shadow-primary-500/20 transition-all self-start sm:self-auto"
        >
          <HiOutlineUserPlus className="w-4 h-4" />
          Add Faculty Member
        </button>
      </div>

      {/* Search */}
      <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="relative w-full sm:w-96">
          <HiOutlineMagnifyingGlass className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by faculty name, ID, or department..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
      </div>

      {/* Faculty Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
        {filteredFaculty.map((f) => (
          <div
            key={f.id}
            className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-primary-50 text-primary-700 flex items-center justify-center font-bold text-lg">
                    <HiOutlineAcademicCap className="w-7 h-7" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-base">{f.name}</h3>
                    <p className="text-xs text-slate-500 font-medium">
                      {f.designation} • <span className="font-mono text-primary-600">{f.employee_id}</span>
                    </p>
                  </div>
                </div>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold">
                  {f.status}
                </span>
              </div>

              <div className="mt-4 pt-4 border-t border-slate-100 space-y-2 text-xs text-slate-600">
                <p className="font-semibold text-slate-800">{f.department}</p>
                <div className="flex items-center gap-2">
                  <HiOutlineEnvelope className="w-4 h-4 text-slate-400" />
                  <span>{f.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <HiOutlinePhone className="w-4 h-4 text-slate-400" />
                  <span className="font-mono">{f.phone}</span>
                </div>
              </div>

              {/* Assigned Subjects */}
              <div className="mt-4">
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Assigned Subjects
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {f.subjects.map((sub, i) => (
                    <span
                      key={i}
                      className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-800 text-xs font-medium flex items-center gap-1.5"
                    >
                      <HiOutlineBookOpen className="w-3.5 h-3.5 text-primary-600" />
                      {sub}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
              <span className="text-slate-400">Classes: {f.classes_assigned.join(', ')}</span>
              <button className="text-primary-600 hover:text-primary-800 font-bold">
                Assign Courses
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add Faculty Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add Faculty Member"
        subtitle="Grants attendance marking and class session finalization access."
      >
        <form onSubmit={handleAddFaculty} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Faculty Name & Title
              </label>
              <input
                type="text"
                required
                value={newFaculty.name}
                onChange={(e) => setNewFaculty({ ...newFaculty, name: e.target.value })}
                placeholder="e.g. Prof. R. Balaji"
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-primary-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Employee ID
              </label>
              <input
                type="text"
                required
                value={newFaculty.employee_id}
                onChange={(e) => setNewFaculty({ ...newFaculty, employee_id: e.target.value })}
                placeholder="FAC-CSE-099"
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-primary-500 focus:outline-none font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Department
              </label>
              <select
                value={newFaculty.department}
                onChange={(e) => setNewFaculty({ ...newFaculty, department: e.target.value })}
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
                Designation
              </label>
              <input
                type="text"
                value={newFaculty.designation}
                onChange={(e) => setNewFaculty({ ...newFaculty, designation: e.target.value })}
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-primary-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Email Address
              </label>
              <input
                type="email"
                required
                value={newFaculty.email}
                onChange={(e) => setNewFaculty({ ...newFaculty, email: e.target.value })}
                placeholder="faculty@smartattend.edu"
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-primary-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Phone Number
              </label>
              <input
                type="text"
                required
                value={newFaculty.phone}
                onChange={(e) => setNewFaculty({ ...newFaculty, phone: e.target.value })}
                placeholder="+91 98401 22334"
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-primary-500 focus:outline-none font-mono"
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
              Add Faculty
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
