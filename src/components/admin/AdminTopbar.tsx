'use client';

interface AdminTopbarProps {
  title: string;
  lastUpdated: string;
  onRefresh: () => void;
}

export default function AdminTopbar({ title, lastUpdated, onRefresh }: AdminTopbarProps) {
  return (
    <div className="topbar">
      <div className="topbar-title">{title}</div>
      <button className="topbar-refresh" onClick={onRefresh}>
        ↻ Refresh
      </button>
      <div className="topbar-time">{lastUpdated}</div>
    </div>
  );
}
