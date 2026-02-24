import { ACCOUNTS, POSITIONS } from "../types";

interface Props {
  account: string;
  position: string;
  search: string;
  onAccountChange: (v: string) => void;
  onPositionChange: (v: string) => void;
  onSearchChange: (v: string) => void;
}

export default function FilterBar({ account, position, search, onAccountChange, onPositionChange, onSearchChange }: Props) {
  return (
    <div className="px-6 py-3 pb-5 flex items-center gap-5 border-b border-gray-200">
      <div className="flex items-center gap-2.5">
        <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Account</label>
        <div className="relative">
          <select
            value={account}
            onChange={(e) => onAccountChange(e.target.value)}
            className="appearance-none text-[13px] font-medium text-gray-800 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl px-4 py-2 pr-9 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300 cursor-pointer transition-all"
          >
            {ACCOUNTS.map((a) => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>
          <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
      <div className="flex items-center gap-2.5">
        <label className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Position</label>
        <div className="relative">
          <select
            value={position}
            onChange={(e) => onPositionChange(e.target.value)}
            className="appearance-none text-[13px] font-medium text-gray-800 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl px-4 py-2 pr-9 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300 cursor-pointer transition-all"
          >
            {POSITIONS.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
          <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
      <div className="relative ml-auto">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search candidates..."
          className="pl-9 pr-4 py-2 text-[13px] w-60 border border-gray-200 rounded-xl bg-gray-50 hover:bg-gray-100 text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300 transition-all"
        />
      </div>
    </div>
  );
}
