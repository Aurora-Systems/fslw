'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { Search, X, Camera } from 'lucide-react';
import { useDebounce } from '../hooks/useDebounce';

const API = process.env.NEXT_PUBLIC_API_BASE;
const LIMIT = 25;

interface Vehicle {
  id: string;
  vehicle_id: string;
  vehicle_brand: string;
  vehicle_model: string;
  vehicle_color: string;
  vrn: string;
  vin: string;
  year: string | number;
  insured: boolean;
  user_id: string;
  created_at: string;
  users: { first_name: string; last_name: string } | null;
}

interface VehiclesTabProps {
  onOpenVehicleImages: (vehicleId: string, title: string) => void;
  token: string;
}

function fmtDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function VehiclesTab({ onOpenVehicleImages, token }: VehiclesTabProps) {
  const [rows, setRows] = useState<Vehicle[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState<number | null>(null);
  const [search, setSearch] = useState('');
  const [empty, setEmpty] = useState(false);

  const debouncedSearch = useDebounce(search, 300);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const pageRef = useRef(1);
  const hasMoreRef = useRef(true);
  const loadingRef = useRef(false);

  const reset = useCallback(() => {
    setRows([]);
    setPage(1);
    pageRef.current = 1;
    setHasMore(true);
    hasMoreRef.current = true;
    setLoading(false);
    loadingRef.current = false;
    setTotal(null);
    setEmpty(false);
  }, []);

  const fetchVehicles = useCallback(
    async (currentPage: number, currentSearch: string) => {
      if (loadingRef.current || !hasMoreRef.current) return;
      loadingRef.current = true;
      setLoading(true);

      try {
        const params = new URLSearchParams({ page: String(currentPage), limit: String(LIMIT) });
        const res = await fetch(`${API}/admin/fleet?${params}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) { setEmpty(true); hasMoreRef.current = false; setHasMore(false); return; }

        const body = await res.json();
        const newRows: Vehicle[] = body.data ?? [];
        const totalCount: number = body.meta?.total ?? 0;

        const filtered = currentSearch
          ? newRows.filter(v => {
              const q = currentSearch.toLowerCase();
              return (
                (v.vehicle_brand || '').toLowerCase().includes(q) ||
                (v.vehicle_model || '').toLowerCase().includes(q) ||
                (v.vrn || '').toLowerCase().includes(q) ||
                (v.vin || '').toLowerCase().includes(q)
              );
            })
          : newRows;

        if (!filtered.length && currentPage === 1) {
          setEmpty(true);
          hasMoreRef.current = false;
          setHasMore(false);
          return;
        }

        setRows(prev => (currentPage === 1 ? filtered : [...prev, ...filtered]));
        setTotal(totalCount);

        pageRef.current = currentPage + 1;
        setPage(currentPage + 1);

        if (newRows.length < LIMIT) { hasMoreRef.current = false; setHasMore(false); }
      } finally {
        loadingRef.current = false;
        setLoading(false);
      }
    },
    [token]
  );

  useEffect(() => {
    reset();
    fetchVehicles(1, debouncedSearch);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && hasMoreRef.current && !loadingRef.current) {
          fetchVehicles(pageRef.current, debouncedSearch);
        }
      },
      { rootMargin: '120px' }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch]);

  const countLabel = total != null ? `${rows.length} / ${total.toLocaleString()}` : `${rows.length} loaded`;

  return (
    <div className="tab-panel active">
      <div className="panel">
        <div className="panel-header">
          <div className="panel-title">Registered Vehicles</div>
          <div className="panel-count">{countLabel}</div>
          <div className="search-wrap" style={{ marginLeft: 'auto' }}>
            <span className="search-icon"><Search /></span>
            <input
              className="search-input"
              type="text"
              placeholder="Brand, model, VRN, VIN…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            {search && (
              <button className="search-clear" onClick={() => setSearch('')}><X /></button>
            )}
          </div>
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th>Vehicle</th>
              <th>Owner</th>
              <th>VRN</th>
              <th>Year</th>
              <th>Color</th>
              <th>Insured</th>
              <th>Registered</th>
              <th>Images</th>
            </tr>
          </thead>
          <tbody>
            {empty && (
              <tr className="state-row"><td colSpan={8}>No vehicles found</td></tr>
            )}
            {rows.map(v => (
              <tr key={v.vehicle_id}>
                <td>
                  <div className="user-name">{v.vehicle_brand || ''} {v.vehicle_model || ''}</div>
                  <div className="user-sub">{v.vin || '—'}</div>
                </td>
                <td>
                  <div className="user-cell">
                    <div
                      className="user-avatar"
                      style={{ background: 'linear-gradient(135deg,#ede9fe,#ddd6fe)', color: '#5b21b6' }}
                    >
                      {((v.users?.first_name || '?')[0]).toUpperCase()}
                    </div>
                    <div className="user-name">{v.users?.first_name || ''} {v.users?.last_name || ''}</div>
                  </div>
                </td>
                <td style={{ fontWeight: 600 }}>{v.vrn || '—'}</td>
                <td>{v.year || '—'}</td>
                <td>{v.vehicle_color || '—'}</td>
                <td>
                  {v.insured ? (
                    <span className="badge badge-completed">Yes</span>
                  ) : (
                    <span className="badge badge-cancelled">No</span>
                  )}
                </td>
                <td style={{ color: 'var(--ink-mute)', fontSize: '12px' }}>{fmtDate(v.created_at)}</td>
                <td>
                  <button
                    className="action-btn"
                    onClick={() => onOpenVehicleImages(v.vehicle_id, `${v.vehicle_brand} ${v.vehicle_model} · ${v.vrn}`)}
                  >
                    <Camera size={13} style={{ verticalAlign: 'middle', marginRight: '4px' }} />
                    Images
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="sentinel" ref={sentinelRef}>
          <div className={`load-spinner${loading ? ' active' : ''}`}>
            <span className="spinner"></span> Loading more…
          </div>
          <div className={`end-msg${!hasMore && rows.length > 0 ? ' active' : ''}`}>
            All vehicles loaded
          </div>
        </div>
      </div>
    </div>
  );
}
