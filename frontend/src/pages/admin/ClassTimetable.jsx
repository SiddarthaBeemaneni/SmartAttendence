/**
 * SmartAttend AI - Class & Timetable Management
 */

import { useState } from 'react';
import { MOCK_CLASSES, MOCK_TIMETABLE } from '../../utils/mockData';
import {
  HiOutlineCalendarDays,
  HiOutlineClock,
  HiOutlineBuildingOffice2,
  HiOutlineUserGroup,
} from 'react-icons/hi2';

export default function ClassTimetable() {
  const [selectedClass, setSelectedClass] = useState(MOCK_CLASSES[0]);
  const [activeDay, setActiveDay] = useState('Monday');

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

  const scheduleForDay = MOCK_TIMETABLE.filter((t) => t.day === activeDay);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Class & Timetable Master</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Section schedules, weekly time slot allocations, and classroom assignments.
          </p>
        </div>
      </div>

      {/* Class Selector Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {MOCK_CLASSES.map((cls) => (
          <div
            key={cls.id}
            onClick={() => setSelectedClass(cls)}
            className={`p-4 rounded-2xl border cursor-pointer transition-all ${
              selectedClass.id === cls.id
                ? 'bg-primary-50/80 border-primary-500 shadow-sm ring-1 ring-primary-500'
                : 'bg-white border-slate-200/80 hover:border-slate-300'
            }`}
          >
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-sm">{cls.name}</h3>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                {cls.strength} Students
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">{cls.department}</p>
            <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
              <span className="flex items-center gap-1">
                <HiOutlineBuildingOffice2 className="w-3.5 h-3.5 text-slate-400" />
                {cls.room}
              </span>
              <span>Advisor: {cls.faculty_advisor.split(' ')[1]}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Day Selector Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {days.map((day) => (
          <button
            key={day}
            onClick={() => setActiveDay(day)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
              activeDay === day
                ? 'bg-primary-500 text-white shadow-xs'
                : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            {day}
          </button>
        ))}
      </div>

      {/* Timetable Schedule Cards for Active Day */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs">
        <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
          <HiOutlineCalendarDays className="w-5 h-5 text-primary-500" />
          Schedule for {activeDay} • {selectedClass.name}
        </h3>

        {scheduleForDay.length > 0 ? (
          <div className="space-y-3">
            {scheduleForDay.map((slot, index) => (
              <div
                key={index}
                className="p-4 rounded-xl border border-slate-100 bg-slate-50/70 hover:bg-slate-50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="flex items-start sm:items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 text-primary-700 flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                    P{index + 1}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">{slot.subject}</h4>
                    <p className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                      <span>{slot.faculty}</span>
                      <span>•</span>
                      <span className="font-semibold text-slate-700">{slot.room}</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 font-mono text-xs font-semibold px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 self-start sm:self-auto">
                  <HiOutlineClock className="w-4 h-4 text-slate-400" />
                  {slot.time}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-slate-400 text-xs">
            No lecture sessions configured for {activeDay}.
          </div>
        )}
      </div>
    </div>
  );
}
