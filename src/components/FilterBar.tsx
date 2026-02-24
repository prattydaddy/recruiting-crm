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
    <div className="px-6 py-3 bg-white border-b border-gray-200 flex items-center gap-4">
      <div className="flex items-center gap-2">
        <label className="text-[11px] font-medium text-gray-400 uppercase tracking-wider">Account</label>
        <select
          value={account}
          onChange={(e) => onAccountChange(e.target.value)}
          className="text-[13px] text-gray-700 bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-300 cursor-pointer"
        >
          {ACCOUNTS.map((a) => (
            <option key={a} value={a}>{a}</option>
          ))}
        </select>
      </div>
      <div className="flex items-center gap-2">
        <label className="text-[11px] font-medium text-gray-400 uppercase tracking-wider">Position</label>
        <select
          value={position}
          onChange={(e) => onPositionChange(e.target.value)}
          className="text-[13px] text-gray-700 bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-300 cursor-pointer"
        >
          {POSITIONS.map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
      </div>
      <div className="relative ml-auto">
        <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search candidates..."
          className="pl-8 pr-3 py-1.5 text-[13px] w-56 border border-gray-200 rounded-lg bg-gray-50 text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-300"
        />
      </div>
    </div>
  );
}
