/**
 * SmartAttend AI - Native Language Badge Component
 * Displays language name with native script and visual pill
 */

import { LANGUAGES_LIST } from '../../utils/mockData';

export default function LanguageBadge({ code, showNative = true }) {
  const lang = LANGUAGES_LIST.find((l) => l.code === code) || {
    name: code || 'English',
    native: code || 'English',
    flag: '🌐',
  };

  const colors = {
    ta: 'bg-blue-50 text-blue-800 border-blue-200',
    en: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    te: 'bg-amber-50 text-amber-800 border-amber-200',
    hi: 'bg-rose-50 text-rose-800 border-rose-200',
    ml: 'bg-purple-50 text-purple-800 border-purple-200',
    kn: 'bg-pink-50 text-pink-800 border-pink-200',
  };

  const colorClass = colors[code] || 'bg-gray-50 text-gray-800 border-gray-200';

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border ${colorClass}`}
      title={`${lang.name} (${lang.native})`}
    >
      <span>{lang.flag}</span>
      <span className="font-semibold">{lang.name}</span>
      {showNative && code !== 'en' && (
        <span className="opacity-75 text-[11px] font-normal">({lang.native})</span>
      )}
    </span>
  );
}
