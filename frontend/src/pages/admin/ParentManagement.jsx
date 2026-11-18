/**
 * SmartAttend AI - Parent Management Page
 * 
 * Features:
 * - List of registered parents / guardians
 * - Form of address (Mr., Mrs., Dr.)
 * - Preferred voice language configuration (Tamil, English, Telugu, Hindi, Malayalam, Kannada)
 * - Consent status tracking & phone verification badges
 * - Edit Language & Contact Modal
 */

import { useState } from 'react';
import LanguageBadge from '../../components/common/LanguageBadge';
import Modal from '../../components/common/Modal';
import { MOCK_PARENTS, LANGUAGES_LIST } from '../../utils/mockData';
import {
  HiOutlineUserGroup,
  HiOutlineShieldCheck,
  HiOutlinePhone,
  HiOutlineMagnifyingGlass,
  HiOutlinePencilSquare,
  HiOutlineCheckBadge,
} from 'react-icons/hi2';

export default function ParentManagement() {
  const [parents, setParents] = useState(MOCK_PARENTS);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingParent, setEditingParent] = useState(null);

  const filteredParents = parents.filter((p) => {
    return (
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.phone.includes(searchTerm) ||
      p.students.some((s) => s.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  });

  const handleUpdateParent = (e) => {
    e.preventDefault();
    setParents(
      parents.map((p) => (p.id === editingParent.id ? editingParent : p))
    );
    setEditingParent(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Parent & Guardian Registry</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Guardian verification, form of address, consent governance, and 6-language voice preferences.
          </p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
        <div className="relative w-full sm:w-96">
          <HiOutlineMagnifyingGlass className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by parent name, phone, or child's name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
      </div>

      {/* Parents Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase text-[11px] font-bold tracking-wider">
              <tr>
                <th className="py-3.5 px-4 sm:px-6">Guardian Name & Title</th>
                <th className="py-3.5 px-4">Contact & Phone Verification</th>
                <th className="py-3.5 px-4">Linked Student(s)</th>
                <th className="py-3.5 px-4">AI Voice Language</th>
                <th className="py-3.5 px-4">Calling Consent</th>
                <th className="py-3.5 px-4">Calls Logged</th>
                <th className="py-3.5 px-4 sm:px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredParents.map((parent) => (
                <tr key={parent.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3.5 px-4 sm:px-6">
                    <p className="font-bold text-slate-900">{parent.name}</p>
                    <p className="text-xs text-slate-400">
                      Relation: {parent.relationship} • Title: {parent.form_of_address}
                    </p>
                  </td>
                  <td className="py-3.5 px-4 text-slate-700">
                    <div className="flex items-center gap-1.5 font-mono text-xs font-semibold">
                      <span>{parent.phone}</span>
                      {parent.verified && (
                        <span title="Phone Verified" className="text-teal-600">
                          <HiOutlineCheckBadge className="w-4 h-4" />
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-400 truncate max-w-[160px]">{parent.email}</div>
                  </td>
                  <td className="py-3.5 px-4 text-slate-700">
                    {parent.students.map((student, idx) => (
                      <span
                        key={idx}
                        className="inline-block bg-slate-100 text-slate-800 text-xs px-2 py-0.5 rounded-md font-medium"
                      >
                        {student}
                      </span>
                    ))}
                  </td>
                  <td className="py-3.5 px-4">
                    <LanguageBadge code={parent.preferred_language} />
                  </td>
                  <td className="py-3.5 px-4">
                    {parent.consent_given ? (
                      <div>
                        <span className="inline-flex items-center gap-1 text-xs text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                          <HiOutlineShieldCheck className="w-3.5 h-3.5" /> Approved
                        </span>
                        <p className="text-[10px] text-slate-400 mt-0.5">On: {parent.consent_date}</p>
                      </div>
                    ) : (
                      <span className="inline-flex items-center text-xs text-rose-700 font-semibold bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">
                        Not Authorized
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 font-semibold text-slate-800">
                    {parent.total_calls_received} calls
                  </td>
                  <td className="py-3.5 px-4 sm:px-6 text-right">
                    <button
                      onClick={() => setEditingParent(parent)}
                      className="inline-flex items-center gap-1 text-xs text-primary-600 hover:text-primary-800 font-bold px-2.5 py-1 rounded-lg hover:bg-slate-100 transition-colors"
                    >
                      <HiOutlinePencilSquare className="w-3.5 h-3.5" />
                      Configure
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Parent Modal */}
      {editingParent && (
        <Modal
          isOpen={!!editingParent}
          onClose={() => setEditingParent(null)}
          title={`Configure Parent Profile: ${editingParent.name}`}
          subtitle="Update preferred language, form of address, and automated call authorization."
        >
          <form onSubmit={handleUpdateParent} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Form of Address (Stored in profile, never guessed)
                </label>
                <select
                  value={editingParent.form_of_address}
                  onChange={(e) =>
                    setEditingParent({ ...editingParent, form_of_address: e.target.value })
                  }
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-primary-500 focus:outline-none"
                >
                  <option value="Mr.">Mr.</option>
                  <option value="Mrs.">Mrs.</option>
                  <option value="Ms.">Ms.</option>
                  <option value="Dr.">Dr.</option>
                  <option value="Prof.">Prof.</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Relationship
                </label>
                <input
                  type="text"
                  value={editingParent.relationship}
                  onChange={(e) =>
                    setEditingParent({ ...editingParent, relationship: e.target.value })
                  }
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-primary-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Preferred AI Voice Calling Language
              </label>
              <select
                value={editingParent.preferred_language}
                onChange={(e) =>
                  setEditingParent({ ...editingParent, preferred_language: e.target.value })
                }
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-primary-500 focus:outline-none"
              >
                {LANGUAGES_LIST.map((lang) => (
                  <option key={lang.code} value={lang.code}>
                    {lang.name} ({lang.native})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Verified Phone Number
              </label>
              <input
                type="text"
                value={editingParent.phone}
                onChange={(e) =>
                  setEditingParent({ ...editingParent, phone: e.target.value })
                }
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-primary-500 focus:outline-none font-mono"
              />
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={editingParent.consent_given}
                  onChange={(e) =>
                    setEditingParent({ ...editingParent, consent_given: e.target.checked })
                  }
                  className="w-4 h-4 text-primary-600 rounded-sm"
                />
                <span className="text-xs font-semibold text-slate-800">
                  Consent given for automated absence notification calls
                </span>
              </label>
            </div>

            <div className="flex justify-end gap-3 pt-3">
              <button
                type="button"
                onClick={() => setEditingParent(null)}
                className="px-4 py-2 border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-xl text-xs font-bold shadow-md shadow-primary-500/20"
              >
                Save Preferences
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
