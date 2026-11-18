/**
 * SmartAttend AI - Reusable Status Badge Component
 */

export default function Badge({ variant = 'default', children, className = '' }) {
  const variants = {
    // Attendance states
    present: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    absent: 'bg-red-50 text-red-700 border-red-200',
    late: 'bg-amber-50 text-amber-700 border-amber-200',

    // Call states
    completed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    calling: 'bg-blue-50 text-blue-700 border-blue-200 animate-pulse',
    unanswered: 'bg-amber-50 text-amber-700 border-amber-200',
    failed: 'bg-red-50 text-red-700 border-red-200',
    blocked_no_consent: 'bg-gray-100 text-gray-700 border-gray-300',

    // Generic status
    good: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    warning: 'bg-amber-50 text-amber-700 border-amber-200',
    critical: 'bg-red-50 text-red-700 border-red-200',
    active: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    draft: 'bg-gray-100 text-gray-700 border-gray-200',
    finalized: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    verified: 'bg-teal-50 text-teal-700 border-teal-200',
    unverified: 'bg-gray-100 text-gray-600 border-gray-200',
    default: 'bg-gray-100 text-gray-800 border-gray-200',
  };

  const style = variants[variant] || variants.default;

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${style} ${className}`}
    >
      {children}
    </span>
  );
}
