/**
 * SmartAttend AI - Stat Card Component
 * 
 * A reusable card that displays a statistic with an icon, title, value,
 * and optional change indicator. Used on all dashboard pages.
 * 
 * Usage:
 *   <StatCard
 *     title="Total Students"
 *     value="1,234"
 *     change="+12%"
 *     changeType="positive"
 *     icon={HiOutlineUsers}
 *     color="blue"
 *   />
 */

const colorMap = {
  blue: {
    bg: 'bg-blue-50',
    icon: 'bg-blue-500',
    text: 'text-blue-700',
  },
  green: {
    bg: 'bg-emerald-50',
    icon: 'bg-emerald-500',
    text: 'text-emerald-700',
  },
  purple: {
    bg: 'bg-purple-50',
    icon: 'bg-purple-500',
    text: 'text-purple-700',
  },
  orange: {
    bg: 'bg-orange-50',
    icon: 'bg-orange-500',
    text: 'text-orange-700',
  },
  red: {
    bg: 'bg-red-50',
    icon: 'bg-red-500',
    text: 'text-red-700',
  },
  cyan: {
    bg: 'bg-cyan-50',
    icon: 'bg-cyan-500',
    text: 'text-cyan-700',
  },
};

export default function StatCard({ title, value, change, changeType, icon: Icon, color = 'blue' }) {
  const colors = colorMap[color] || colorMap.blue;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 hover:shadow-lg hover:shadow-gray-100 transition-all duration-300">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
          {change && (
            <p
              className={`text-sm mt-2 font-medium ${
                changeType === 'positive' ? 'text-emerald-600' : 'text-red-500'
              }`}
            >
              {change}
              <span className="text-gray-400 font-normal ml-1">vs last month</span>
            </p>
          )}
        </div>
        <div className={`w-12 h-12 ${colors.icon} rounded-xl flex items-center justify-center shadow-lg`}>
          {Icon && <Icon className="w-6 h-6 text-white" />}
        </div>
      </div>
    </div>
  );
}
