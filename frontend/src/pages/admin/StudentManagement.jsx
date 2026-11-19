/**
 * CampusAI / SmartAttend AI - Multi-Tenant Student Management Section
 * 
 * Features:
 * 1. Add Student Manually
 * 2. Bulk Upload Students using Excel (.xlsx) or CSV
 * 3. Download Sample Excel (.xlsx) and CSV Templates
 * 4. Pre-import preview with validation
 * 5. Parent & student field validation (language, form of address, phone)
 * 6. Duplicate record detection (within file and against university database)
 * 7. In-line table corrections for invalid records before importing
 * 8. Real database save to university's tenant-isolated tables
 * 9. View, search, filter, edit, and delete student records
 */

import { useState, useEffect, useRef } from 'react';
import api from '../../services/api';
import Badge from '../../components/common/Badge';
import LanguageBadge from '../../components/common/LanguageBadge';
import Modal from '../../components/common/Modal';
import { LANGUAGES_LIST, DEPARTMENTS } from '../../utils/mockData';
import {
  HiOutlineUserPlus,
  HiOutlineArrowUpTray,
  HiOutlineArrowDownTray,
  HiOutlineMagnifyingGlass,
  HiOutlineFunnel,
  HiOutlinePencilSquare,
  HiOutlineTrash,
  HiOutlineCheckCircle,
  HiOutlineExclamationCircle,
  HiOutlineDocumentText,
  HiOutlineTableCells,
  HiOutlineArrowPath,
  HiOutlineXMark,
  HiOutlineCheck,
} from 'react-icons/hi2';

export default function StudentManagement() {
  // Navigation tabs: 'directory' | 'manual' | 'bulk'
  const [activeTab, setActiveTab] = useState('directory');

  // Directory State
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDept, setSelectedDept] = useState('All');
  const [selectedYear, setSelectedYear] = useState('All');

  // Modals & Feedback
  const [notification, setNotification] = useState(null); // { type: 'success' | 'error', message: '' }
  const [editStudent, setEditStudent] = useState(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  // Manual Add Form State
  const [manualForm, setManualForm] = useState({
    name: '',
    roll_number: '',
    department: 'Computer Science & Engineering',
    year: 1,
    semester: 1,
    section: 'A',
    parent_name: '',
    parent_phone: '',
    preferred_language: 'ta',
    preferred_form_of_address: 'Mr.',
    consent_given: false,
  });
  const [manualSaving, setManualSaving] = useState(false);

  // Bulk Upload State
  const fileInputRef = useRef(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewData, setPreviewData] = useState(null); // { total_records, valid_count, invalid_count, duplicate_count, records: [] }
  const [importing, setImporting] = useState(false);

  // Fetch student directory from backend
  const fetchStudents = async () => {
    setLoading(true);
    try {
      const response = await api.get('/api/students');
      setStudents(response.data);
    } catch (err) {
      // If server is starting up or has no records, fallback gracefully
      setStudents([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  const showNotification = (type, message) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  // Filter students
  const filteredStudents = students.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.roll_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.parent_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDept = selectedDept === 'All' || s.department === selectedDept;
    const matchesYear = selectedYear === 'All' || s.year.toString() === selectedYear;
    return matchesSearch && matchesDept && matchesYear;
  });

  // ========================================================
  // 1. ADD STUDENT MANUALLY
  // ========================================================
  const handleManualSubmit = async (e) => {
    e.preventDefault();
    setManualSaving(true);
    try {
      await api.post('/api/students', manualForm);
      showNotification('success', `Student '${manualForm.name}' (${manualForm.roll_number}) added successfully!`);
      // Reset form & reload directory
      setManualForm({
        name: '',
        roll_number: '',
        department: 'Computer Science & Engineering',
        year: 1,
        semester: 1,
        section: 'A',
        parent_name: '',
        parent_phone: '',
        preferred_language: 'ta',
        preferred_form_of_address: 'Mr.',
        consent_given: true,
      });
      fetchStudents();
      setActiveTab('directory');
    } catch (err) {
      showNotification('error', err.response?.data?.detail || 'Failed to save student record.');
    } finally {
      setManualSaving(false);
    }
  };

  // ========================================================
  // 2. EDIT STUDENT
  // ========================================================
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/api/students/${editStudent.id}`, editStudent);
      showNotification('success', `Student '${editStudent.name}' updated successfully.`);
      setEditStudent(null);
      fetchStudents();
    } catch (err) {
      showNotification('error', err.response?.data?.detail || 'Failed to update student.');
    }
  };

  // ========================================================
  // 3. DELETE STUDENT
  // ========================================================
  const handleDeleteStudent = async (studentId) => {
    try {
      await api.delete(`/api/students/${studentId}`);
      showNotification('success', 'Student record deleted successfully.');
      setDeleteConfirmId(null);
      fetchStudents();
    } catch (err) {
      showNotification('error', err.response?.data?.detail || 'Failed to delete student.');
    }
  };

  // ========================================================
  // 4. DOWNLOAD TEMPLATES (EXCEL & CSV)
  // ========================================================
  const handleDownloadTemplate = (type) => {
    const url = `${api.defaults.baseURL || 'http://localhost:8001'}/api/students/template/${type}`;
    window.open(url, '_blank');
  };

  // ========================================================
  // 5. BULK UPLOAD & PREVIEW
  // ========================================================
  const handleFileSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setSelectedFile(file);
    setPreviewLoading(true);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await api.post('/api/students/bulk-preview', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setPreviewData(response.data);
    } catch (err) {
      showNotification('error', err.response?.data?.detail || 'Failed to parse uploaded file.');
      setSelectedFile(null);
    } finally {
      setPreviewLoading(false);
    }
  };

  // 6. In-line table correction update
  const handleCorrection = (index, field, value) => {
    if (!previewData) return;
    const updated = [...previewData.records];
    updated[index][field] = value;

    // Re-check validity for that row
    const row = updated[index];
    const newErrors = [];
    if (!row.name.trim()) newErrors.push('Student Name is required.');
    if (!row.roll_number.trim()) newErrors.push('Roll Number is required.');
    if (!row.parent_name.trim()) newErrors.push('Parent Name is required.');
    if (!row.parent_phone.trim()) newErrors.push('Parent Phone is required.');

    row.errors = newErrors;
    row.is_valid = newErrors.length === 0 && !row.is_duplicate;

    const validCount = updated.filter((r) => r.is_valid).length;
    const invalidCount = updated.length - validCount;

    setPreviewData({
      ...previewData,
      valid_count: validCount,
      invalid_count: invalidCount,
      records: updated,
    });
  };

  // 7. Bulk Import Valid Records to Database
  const handleConfirmBulkImport = async () => {
    if (!previewData || previewData.valid_count === 0) return;

    setImporting(true);
    const validRecords = previewData.records
      .filter((r) => r.is_valid)
      .map((r) => ({
        name: r.name,
        roll_number: r.roll_number,
        department: r.department,
        year: r.year,
        semester: r.semester,
        section: r.section,
        parent_name: r.parent_name,
        parent_phone: r.parent_phone,
        preferred_language: r.preferred_language,
        preferred_form_of_address: r.preferred_form_of_address,
        consent_given: true,
        phone_verified: true,
      }));

    try {
      const response = await api.post('/api/students/bulk-import', {
        records: validRecords,
      });
      showNotification('success', response.data.message);
      // Reset preview state
      setSelectedFile(null);
      setPreviewData(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      fetchStudents();
      setActiveTab('directory');
    } catch (err) {
      showNotification('error', err.response?.data?.detail || 'Import failed.');
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Notification Toast */}
      {notification && (
        <div
          className={`p-4 rounded-2xl text-xs sm:text-sm font-semibold flex items-center justify-between shadow-sm animate-fade-in ${
            notification.type === 'success'
              ? 'bg-emerald-50 border border-emerald-200 text-emerald-900'
              : 'bg-rose-50 border border-rose-200 text-rose-900'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {notification.type === 'success' ? (
              <HiOutlineCheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
            ) : (
              <HiOutlineExclamationCircle className="w-5 h-5 text-rose-600 shrink-0" />
            )}
            <span>{notification.message}</span>
          </div>
          <button onClick={() => setNotification(null)} className="font-bold text-xs opacity-60 hover:opacity-100">
            ✕
          </button>
        </div>
      )}

      {/* Header & Main Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-primary-700 bg-primary-50 px-2.5 py-1 rounded-full border border-primary-200">
            Student Database Governance
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-1.5">
            Student Database & Roster Management
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Maintain enrolled student records, registered guardian contacts, and multi-lingual voice outreach preferences.
          </p>
        </div>

        {/* Tab Switcher Buttons */}
        <div className="flex items-center gap-2 p-1.5 bg-slate-100 rounded-2xl border border-slate-200 text-xs font-bold self-start sm:self-auto">
          <button
            onClick={() => setActiveTab('directory')}
            className={`px-4 py-2 rounded-xl transition-all ${
              activeTab === 'directory'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Student Directory ({students.length})
          </button>
          <button
            onClick={() => setActiveTab('manual')}
            className={`px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 ${
              activeTab === 'manual'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <HiOutlineUserPlus className="w-4 h-4" />
            Add Manually
          </button>
          <button
            onClick={() => setActiveTab('bulk')}
            className={`px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 ${
              activeTab === 'bulk'
                ? 'bg-primary-500 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <HiOutlineArrowUpTray className="w-4 h-4" />
            Bulk Upload (Excel / CSV)
          </button>
        </div>
      </div>

      {/* ========================================================
          TAB 1: STUDENT DIRECTORY
          ======================================================== */}
      {activeTab === 'directory' && (
        <div className="space-y-4">
          {/* Search & Filter Bar */}
          <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="relative w-full md:w-96">
              <HiOutlineMagnifyingGlass className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by student name, roll number, or parent..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
              <select
                value={selectedDept}
                onChange={(e) => setSelectedDept(e.target.value)}
                className="px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none"
              >
                <option value="All">All Departments</option>
                {DEPARTMENTS.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>

              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none"
              >
                <option value="All">All Years</option>
                <option value="1">Year 1</option>
                <option value="2">Year 2</option>
                <option value="3">Year 3</option>
                <option value="4">Year 4</option>
              </select>

              <button
                onClick={fetchStudents}
                className="p-2.5 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-xl border border-slate-200 transition-colors"
                title="Refresh Database"
              >
                <HiOutlineArrowPath className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Student Table */}
          <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs">
            {loading ? (
              <div className="p-12 text-center text-slate-400 space-y-2">
                <HiOutlineArrowPath className="w-6 h-6 animate-spin mx-auto text-primary-500" />
                <p className="text-xs font-semibold">Loading student records from university database...</p>
              </div>
            ) : filteredStudents.length === 0 ? (
              <div className="p-12 text-center text-slate-400 space-y-3">
                <HiOutlineTableCells className="w-12 h-12 mx-auto text-slate-300" />
                <h3 className="font-bold text-slate-700 text-sm">No Student Records Found</h3>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  Your university database is ready. Add a student manually or upload in bulk using Excel / CSV.
                </p>
                <button
                  onClick={() => setActiveTab('bulk')}
                  className="px-4 py-2 bg-primary-500 text-white rounded-xl text-xs font-bold shadow-xs hover:bg-primary-600"
                >
                  Bulk Upload Students
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase text-[11px] font-bold tracking-wider">
                    <tr>
                      <th className="py-3.5 px-4 sm:px-6">Roll & Name</th>
                      <th className="py-3.5 px-4">Department & Class</th>
                      <th className="py-3.5 px-4">Guardian Contact</th>
                      <th className="py-3.5 px-4">Language & Salutation</th>
                      <th className="py-3.5 px-4">Attendance</th>
                      <th className="py-3.5 px-4 sm:px-6 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredStudents.map((s) => (
                      <tr key={s.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3.5 px-4 sm:px-6">
                          <p className="font-bold text-slate-900">{s.name}</p>
                          <p className="text-xs text-slate-400 font-mono">{s.roll_number}</p>
                        </td>
                        <td className="py-3.5 px-4 text-slate-700">
                          <p className="font-medium truncate max-w-xs">{s.department}</p>
                          <p className="text-[11px] text-slate-400">
                            Year {s.year} • Sem {s.semester} • Sec {s.section}
                          </p>
                        </td>
                        <td className="py-3.5 px-4 text-slate-700">
                          <p className="font-medium">
                            <span className="text-slate-400">{s.preferred_form_of_address} </span>
                            {s.parent_name}
                          </p>
                          <p className="text-xs text-slate-400 font-mono">{s.parent_phone}</p>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-1.5">
                            <LanguageBadge code={s.preferred_language} showNative={false} />
                            <span className="text-[11px] font-mono text-slate-500">
                              {s.preferred_form_of_address}
                            </span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`text-xs font-bold px-2 py-0.5 rounded-lg border ${
                              s.attendance_percentage >= 75
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                : 'bg-rose-50 text-rose-800 border-rose-200'
                            }`}
                          >
                            {s.attendance_percentage?.toFixed(1) || '100.0'}%
                          </span>
                        </td>
                        <td className="py-3.5 px-4 sm:px-6 text-right space-x-2">
                          <button
                            onClick={() => setEditStudent(s)}
                            className="p-1.5 text-slate-400 hover:text-primary-600 rounded-lg hover:bg-slate-100 transition-colors"
                            title="Edit Student"
                          >
                            <HiOutlinePencilSquare className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeleteConfirmId(s.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                            title="Delete Student"
                          >
                            <HiOutlineTrash className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================
          TAB 2: ADD STUDENT MANUALLY
          ======================================================== */}
      {activeTab === 'manual' && (
        <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs p-6 sm:p-10 max-w-3xl">
          <div className="border-b border-slate-100 pb-4 mb-6">
            <h2 className="text-lg font-bold text-slate-900">Add Student Record Manually</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Creates a single verified student and guardian record in your university database.
            </p>
          </div>

          <form onSubmit={handleManualSubmit} className="space-y-6">
            {/* Student Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Student Full Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={manualForm.name}
                  onChange={(e) => setManualForm({ ...manualForm, name: e.target.value })}
                  placeholder="e.g. S. Karthik"
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Roll Number <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={manualForm.roll_number}
                  onChange={(e) => setManualForm({ ...manualForm, roll_number: e.target.value })}
                  placeholder="2026-CSE-101"
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-sm font-mono focus:ring-2 focus:ring-primary-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Department <span className="text-rose-500">*</span>
                </label>
                <select
                  value={manualForm.department}
                  onChange={(e) => setManualForm({ ...manualForm, department: e.target.value })}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 focus:outline-none"
                >
                  {DEPARTMENTS.map((dept) => (
                    <option key={dept} value={dept}>
                      {dept}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Academic Year & Semester
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={manualForm.year}
                    onChange={(e) => setManualForm({ ...manualForm, year: Number(e.target.value) })}
                    className="w-full px-3 py-2.5 border border-slate-300 rounded-xl text-xs font-semibold focus:outline-none"
                  >
                    {[1, 2, 3, 4, 5].map((y) => (
                      <option key={y} value={y}>
                        Year {y}
                      </option>
                    ))}
                  </select>
                  <select
                    value={manualForm.semester}
                    onChange={(e) => setManualForm({ ...manualForm, semester: Number(e.target.value) })}
                    className="w-full px-3 py-2.5 border border-slate-300 rounded-xl text-xs font-semibold focus:outline-none"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                      <option key={s} value={s}>
                        Sem {s}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Section
                </label>
                <input
                  type="text"
                  value={manualForm.section}
                  onChange={(e) => setManualForm({ ...manualForm, section: e.target.value })}
                  placeholder="A"
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-sm uppercase focus:ring-2 focus:ring-primary-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Parent Info & AI Voice Preferences */}
            <div className="pt-4 border-t border-slate-100">
              <h3 className="text-xs font-extrabold text-primary-900 uppercase tracking-wider mb-4">
                Parent / Guardian & Calling Configuration
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Form of Address
                  </label>
                  <select
                    value={manualForm.preferred_form_of_address}
                    onChange={(e) => setManualForm({ ...manualForm, preferred_form_of_address: e.target.value })}
                    className="w-full px-3 py-2.5 border border-slate-300 rounded-xl text-xs font-semibold focus:outline-none"
                  >
                    <option value="Mr.">Mr.</option>
                    <option value="Mrs.">Mrs.</option>
                    <option value="Ms.">Ms.</option>
                    <option value="Dr.">Dr.</option>
                    <option value="Prof.">Prof.</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Parent / Guardian Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={manualForm.parent_name}
                    onChange={(e) => setManualForm({ ...manualForm, parent_name: e.target.value })}
                    placeholder="e.g. S. Subramanian"
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Parent Mobile Number <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={manualForm.parent_phone}
                    onChange={(e) => setManualForm({ ...manualForm, parent_phone: e.target.value })}
                    placeholder="+91 98410 99881"
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-sm font-mono focus:ring-2 focus:ring-primary-500 focus:outline-none"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Preferred AI Voice Language
                  </label>
                  <select
                    value={manualForm.preferred_language}
                    onChange={(e) => setManualForm({ ...manualForm, preferred_language: e.target.value })}
                    className="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 focus:outline-none"
                  >
                    {LANGUAGES_LIST.map((lang) => (
                      <option key={lang.code} value={lang.code}>
                        {lang.name} ({lang.native})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="sm:col-span-2 p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="manual_consent"
                    checked={manualForm.consent_given}
                    onChange={(e) => setManualForm({ ...manualForm, consent_given: e.target.checked })}
                    className="w-4 h-4 rounded text-primary-600 focus:ring-0"
                  />
                  <label htmlFor="manual_consent" className="text-xs font-semibold text-slate-700 cursor-pointer">
                    Guardian has granted official consent to receive automated AI attendance calls (Telecom Compliance)
                  </label>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setActiveTab('directory')}
                className="px-5 py-2.5 border border-slate-200 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={manualSaving}
                className="px-6 py-2.5 bg-primary-500 hover:bg-primary-600 text-white rounded-xl text-xs font-bold shadow-md shadow-primary-500/20 disabled:opacity-50"
              >
                {manualSaving ? 'Saving Record...' : 'Save to University Database'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ========================================================
          TAB 3: BULK UPLOAD (EXCEL & CSV)
          ======================================================== */}
      {activeTab === 'bulk' && (
        <div className="space-y-6">
          {/* Step 1: Upload & Template Download Card */}
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs p-6 sm:p-8">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-6 border-b border-slate-100">
              <div>
                <h3 className="text-base font-extrabold text-slate-900">
                  Bulk Student Database Upload
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Upload an Excel (.xlsx) or CSV file containing your student and parent records.
                </p>
              </div>

              {/* Download Sample Templates */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleDownloadTemplate('excel')}
                  className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors"
                >
                  <HiOutlineArrowDownTray className="w-4 h-4 text-emerald-600" />
                  <span>Download Sample .xlsx</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleDownloadTemplate('csv')}
                  className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors"
                >
                  <HiOutlineArrowDownTray className="w-4 h-4 text-blue-600" />
                  <span>Download Sample .csv</span>
                </button>
              </div>
            </div>

            {/* Drop Zone */}
            <div className="mt-6 border-2 border-dashed border-slate-300 hover:border-primary-500 rounded-3xl p-8 sm:p-12 text-center transition-colors bg-slate-50/50">
              <HiOutlineTableCells className="w-12 h-12 text-slate-400 mx-auto mb-3" />
              <h4 className="text-sm font-bold text-slate-800">
                Select your Student Database Spreadsheet
              </h4>
              <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                Supports Excel (.xlsx) or Comma-Separated Values (.csv). Max 5,000 records per upload.
              </p>

              <div className="mt-4">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx, .csv"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="studentUploadInput"
                />
                <label
                  htmlFor="studentUploadInput"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-primary-500 hover:bg-primary-600 text-white font-extrabold text-xs rounded-xl shadow-md shadow-primary-500/20 cursor-pointer transition-all"
                >
                  <HiOutlineArrowUpTray className="w-4 h-4" />
                  <span>Browse & Upload File</span>
                </label>
              </div>

              {selectedFile && (
                <div className="mt-4 inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-primary-50 border border-primary-200 text-xs font-mono text-primary-900">
                  <HiOutlineDocumentText className="w-4 h-4 text-primary-600" />
                  <span>{selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)</span>
                </div>
              )}
            </div>
          </div>

          {/* Loading Preview */}
          {previewLoading && (
            <div className="p-8 bg-white rounded-3xl border border-slate-200 text-center space-y-2">
              <HiOutlineArrowPath className="w-8 h-8 text-primary-500 animate-spin mx-auto" />
              <p className="text-xs font-bold text-slate-700">Validating Student & Parent Records...</p>
              <p className="text-[11px] text-slate-400">Checking duplicate roll numbers and multi-lingual language codes</p>
            </div>
          )}

          {/* Preview & In-Line Correction Table */}
          {previewData && !previewLoading && (
            <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden space-y-4 p-6 sm:p-8 animate-fade-in">
              {/* Summary Metrics */}
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">
                    Upload Preview & Validation Inspection
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Review parsed rows. Fix any highlighted issues in-place before committing to the database.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3 text-xs font-bold">
                  <span className="px-3 py-1 rounded-xl bg-slate-100 text-slate-700">
                    Total: {previewData.total_records}
                  </span>
                  <span className="px-3 py-1 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200">
                    Valid: {previewData.valid_count}
                  </span>
                  {previewData.invalid_count > 0 && (
                    <span className="px-3 py-1 rounded-xl bg-rose-50 text-rose-800 border border-rose-200">
                      Invalid: {previewData.invalid_count}
                    </span>
                  )}
                  {previewData.duplicate_count > 0 && (
                    <span className="px-3 py-1 rounded-xl bg-amber-50 text-amber-800 border border-amber-200">
                      Duplicates: {previewData.duplicate_count}
                    </span>
                  )}
                </div>
              </div>

              {/* Table */}
              <div className="overflow-x-auto border border-slate-200 rounded-2xl max-h-96 overflow-y-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase text-[10px] font-bold tracking-wider sticky top-0 z-10">
                    <tr>
                      <th className="py-3 px-3">#</th>
                      <th className="py-3 px-3">Status</th>
                      <th className="py-3 px-3">Student Name</th>
                      <th className="py-3 px-3">Roll Number</th>
                      <th className="py-3 px-3">Department</th>
                      <th className="py-3 px-3">Year/Sem</th>
                      <th className="py-3 px-3">Parent Name</th>
                      <th className="py-3 px-3">Parent Phone</th>
                      <th className="py-3 px-3">Language</th>
                      <th className="py-3 px-3">Form of Address</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {previewData.records.map((r, idx) => (
                      <tr
                        key={idx}
                        className={`transition-colors ${
                          !r.is_valid
                            ? r.is_duplicate
                              ? 'bg-amber-50/50'
                              : 'bg-rose-50/40'
                            : 'hover:bg-slate-50/50'
                        }`}
                      >
                        <td className="py-2.5 px-3 font-mono text-slate-400">{r.row_number}</td>
                        <td className="py-2.5 px-3">
                          {r.is_valid ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                              <HiOutlineCheck className="w-3 h-3" /> Valid
                            </span>
                          ) : (
                            <span
                              className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                                r.is_duplicate
                                  ? 'bg-amber-50 text-amber-800 border-amber-200'
                                  : 'bg-rose-50 text-rose-800 border-rose-200'
                              }`}
                              title={r.errors.join('; ')}
                            >
                              ✕ {r.is_duplicate ? 'Duplicate' : 'Invalid'}
                            </span>
                          )}
                        </td>

                        {/* In-Line Editable Inputs for Immediate Correction */}
                        <td className="py-2 px-3">
                          <input
                            type="text"
                            value={r.name}
                            onChange={(e) => handleCorrection(idx, 'name', e.target.value)}
                            className="w-36 px-2 py-1 bg-white border border-slate-200 rounded text-xs focus:ring-1 focus:ring-primary-500 focus:outline-none"
                          />
                        </td>

                        <td className="py-2 px-3">
                          <input
                            type="text"
                            value={r.roll_number}
                            onChange={(e) => handleCorrection(idx, 'roll_number', e.target.value)}
                            className="w-28 px-2 py-1 bg-white border border-slate-200 rounded text-xs font-mono focus:ring-1 focus:ring-primary-500 focus:outline-none"
                          />
                        </td>

                        <td className="py-2 px-3">
                          <input
                            type="text"
                            value={r.department}
                            onChange={(e) => handleCorrection(idx, 'department', e.target.value)}
                            className="w-32 px-2 py-1 bg-white border border-slate-200 rounded text-xs focus:ring-1 focus:ring-primary-500 focus:outline-none"
                          />
                        </td>

                        <td className="py-2 px-3">
                          <span className="text-slate-600 font-mono">Y{r.year} / S{r.semester}</span>
                        </td>

                        <td className="py-2 px-3">
                          <input
                            type="text"
                            value={r.parent_name}
                            onChange={(e) => handleCorrection(idx, 'parent_name', e.target.value)}
                            className="w-32 px-2 py-1 bg-white border border-slate-200 rounded text-xs focus:ring-1 focus:ring-primary-500 focus:outline-none"
                          />
                        </td>

                        <td className="py-2 px-3">
                          <input
                            type="text"
                            value={r.parent_phone}
                            onChange={(e) => handleCorrection(idx, 'parent_phone', e.target.value)}
                            className="w-28 px-2 py-1 bg-white border border-slate-200 rounded text-xs font-mono focus:ring-1 focus:ring-primary-500 focus:outline-none"
                          />
                        </td>

                        <td className="py-2 px-3">
                          <select
                            value={r.preferred_language}
                            onChange={(e) => handleCorrection(idx, 'preferred_language', e.target.value)}
                            className="px-2 py-1 bg-white border border-slate-200 rounded text-xs focus:outline-none"
                          >
                            {LANGUAGES_LIST.map((lang) => (
                              <option key={lang.code} value={lang.code}>
                                {lang.name}
                              </option>
                            ))}
                          </select>
                        </td>

                        <td className="py-2 px-3">
                          <select
                            value={r.preferred_form_of_address}
                            onChange={(e) => handleCorrection(idx, 'preferred_form_of_address', e.target.value)}
                            className="px-2 py-1 bg-white border border-slate-200 rounded text-xs focus:outline-none"
                          >
                            <option value="Mr.">Mr.</option>
                            <option value="Mrs.">Mrs.</option>
                            <option value="Ms.">Ms.</option>
                            <option value="Dr.">Dr.</option>
                            <option value="Prof.">Prof.</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Action Bar */}
              <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                <span className="text-xs text-slate-500">
                  Ready to import: <strong>{previewData.valid_count}</strong> records (Skips {previewData.invalid_count} uncorrected or duplicate records).
                </span>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setPreviewData(null);
                      setSelectedFile(null);
                    }}
                    className="px-4 py-2.5 border border-slate-200 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-50"
                  >
                    Clear Preview
                  </button>

                  <button
                    type="button"
                    onClick={handleConfirmBulkImport}
                    disabled={importing || previewData.valid_count === 0}
                    className="px-6 py-2.5 bg-primary-500 hover:bg-primary-600 text-white rounded-xl text-xs font-extrabold shadow-md shadow-primary-500/20 transition-all disabled:opacity-50 flex items-center gap-2 cursor-pointer"
                  >
                    {importing ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Saving to Database...</span>
                      </>
                    ) : (
                      <>
                        <span>Import {previewData.valid_count} Valid Records</span>
                        <HiOutlineCheck className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================
          EDIT STUDENT MODAL
          ======================================================== */}
      {editStudent && (
        <Modal
          isOpen={!!editStudent}
          onClose={() => setEditStudent(null)}
          title={`Edit Student: ${editStudent.name}`}
          subtitle={`Roll Number: ${editStudent.roll_number}`}
        >
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Student Name</label>
                <input
                  type="text"
                  required
                  value={editStudent.name}
                  onChange={(e) => setEditStudent({ ...editStudent, name: e.target.value })}
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-primary-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Roll Number</label>
                <input
                  type="text"
                  required
                  value={editStudent.roll_number}
                  onChange={(e) => setEditStudent({ ...editStudent, roll_number: e.target.value })}
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-xs font-mono focus:ring-2 focus:ring-primary-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Department</label>
                <select
                  value={editStudent.department}
                  onChange={(e) => setEditStudent({ ...editStudent, department: e.target.value })}
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-primary-500 focus:outline-none"
                >
                  {DEPARTMENTS.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Section</label>
                <input
                  type="text"
                  value={editStudent.section}
                  onChange={(e) => setEditStudent({ ...editStudent, section: e.target.value })}
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-primary-500 focus:outline-none uppercase"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Parent Name</label>
                <input
                  type="text"
                  required
                  value={editStudent.parent_name}
                  onChange={(e) => setEditStudent({ ...editStudent, parent_name: e.target.value })}
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-primary-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Parent Phone</label>
                <input
                  type="text"
                  required
                  value={editStudent.parent_phone}
                  onChange={(e) => setEditStudent({ ...editStudent, parent_phone: e.target.value })}
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-xs font-mono focus:ring-2 focus:ring-primary-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Preferred Language</label>
                <select
                  value={editStudent.preferred_language}
                  onChange={(e) => setEditStudent({ ...editStudent, preferred_language: e.target.value })}
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-primary-500 focus:outline-none"
                >
                  {LANGUAGES_LIST.map((l) => (
                    <option key={l.code} value={l.code}>
                      {l.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Form of Address</label>
                <select
                  value={editStudent.preferred_form_of_address}
                  onChange={(e) => setEditStudent({ ...editStudent, preferred_form_of_address: e.target.value })}
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-primary-500 focus:outline-none"
                >
                  <option value="Mr.">Mr.</option>
                  <option value="Mrs.">Mrs.</option>
                  <option value="Ms.">Ms.</option>
                  <option value="Dr.">Dr.</option>
                  <option value="Prof.">Prof.</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setEditStudent(null)}
                className="px-4 py-2 border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-xl text-xs font-bold shadow-md shadow-primary-500/20"
              >
                Update Student
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* ========================================================
          DELETE CONFIRMATION MODAL
          ======================================================== */}
      {deleteConfirmId && (
        <Modal
          isOpen={!!deleteConfirmId}
          onClose={() => setDeleteConfirmId(null)}
          title="Delete Student Record"
          subtitle="Are you sure you want to permanently delete this student?"
        >
          <div className="space-y-4">
            <p className="text-xs text-slate-600 leading-relaxed">
              This action will remove the student from your university database and archive their attendance and calling logs.
            </p>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setDeleteConfirmId(null)}
                className="px-4 py-2 border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleDeleteStudent(deleteConfirmId)}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-md shadow-rose-600/20"
              >
                Permanently Delete
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
