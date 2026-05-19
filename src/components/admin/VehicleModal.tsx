'use client';

import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { createClient } from '@/lib/supabase';

interface VehicleModalProps {
  open: boolean;
  vehicleId: string | null;
  title: string;
  onClose: () => void;
  currentToken: string | null;
}

interface VehicleInfo {
  vehicle_id: string;
  vehicle_brand: string;
  vehicle_model: string;
  vrn: string;
  vin: string;
  year: string | number;
  vehicle_color: string;
  insured: boolean;
  car_front: string | null;
  car_back: string | null;
  car_side: string | null;
  vrn_id: string | null;
  vin_id: string | null;
}

interface Images {
  car_front: string | null;
  car_back: string | null;
  car_side: string | null;
  vrn: string | null;
  vin: string | null;
}

export default function VehicleModal({
  open,
  vehicleId,
  title,
  onClose,
  currentToken,
}: VehicleModalProps) {
  const [vehicleInfo, setVehicleInfo] = useState<VehicleInfo | null>(null);
  const [images, setImages] = useState<Images | null>(null);
  const [loading, setLoading] = useState(false);
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);

  const sb = createClient();
  const API_BASE = process.env.NEXT_PUBLIC_API_BASE || '';

  useEffect(() => {
    if (!open || !vehicleId) return;

    setLoading(true);
    setVehicleInfo(null);
    setImages(null);

    const load = async () => {
      let imgs: Images | null = null;
      let info: VehicleInfo | null = null;

      if (API_BASE && !API_BASE.includes('YOUR_SERVER') && currentToken) {
        try {
          const res = await fetch(`${API_BASE}/admin/fleet/${vehicleId}/images`, {
            headers: { Authorization: `Bearer ${currentToken}` },
          });
          if (res.ok) {
            const body = await res.json();
            imgs = body.images;
            info = body;
          }
        } catch {}
      }

      if (!imgs) {
        const { data: v } = await sb
          .from('fleet')
          .select('vehicle_id,vehicle_brand,vehicle_model,vrn,vin,year,vehicle_color,insured,car_front,car_back,car_side,vrn_id,vin_id')
          .eq('vehicle_id', vehicleId)
          .single();

        if (v) {
          info = v as VehicleInfo;
          const sign = async (id: string | null) => {
            if (!id) return null;
            const { data } = await sb.storage.from('vehicles').createSignedUrl(id, 3600);
            return data?.signedUrl ?? null;
          };
          const [front, back, side, vrnUrl, vinUrl] = await Promise.all([
            sign(v.car_front),
            sign(v.car_back),
            sign(v.car_side),
            sign(v.vrn_id),
            sign(v.vin_id),
          ]);
          imgs = { car_front: front, car_back: back, car_side: side, vrn: vrnUrl, vin: vinUrl };
        }
      }

      setVehicleInfo(info);
      setImages(imgs);
      setLoading(false);
    };

    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, vehicleId]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (lightboxSrc) {
          setLightboxSrc(null);
        } else {
          onClose();
        }
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose, lightboxSrc]);

  const ImageTile = ({
    label,
    url,
    wide = false,
  }: {
    label: string;
    url: string | null;
    wide?: boolean;
  }) => (
    <div className={`img-tile${wide ? ' wide' : ''}`}>
      <div className="img-tile-label">{label}</div>
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={url}
          alt={label}
          loading="lazy"
          onClick={() => setLightboxSrc(url)}
        />
      ) : (
        <div className="img-placeholder">
          <svg
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ opacity: 0.3 }}
          >
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <polyline points="21 15 16 10 5 21" />
          </svg>
          <span style={{ fontSize: '12px' }}>Not available</span>
        </div>
      )}
    </div>
  );

  return (
    <>
      <div
        className={`modal-overlay${open ? ' open' : ''}`}
        onClick={e => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        <div className="modal-card">
          <div className="modal-header">
            <div className="modal-title">{title || 'Vehicle Images'}</div>
            <button className="modal-close" onClick={onClose}>
              <X />
            </button>
          </div>
          <div className="modal-body">
            {loading && (
              <div style={{ textAlign: 'center', padding: '40px', color: 'var(--ink-mute)' }}>
                <span className="spinner"></span>
              </div>
            )}
            {!loading && !images && (
              <p style={{ color: 'var(--red)', padding: '20px' }}>Could not load vehicle images.</p>
            )}
            {!loading && images && vehicleInfo && (
              <>
                <div className="vehicle-meta">
                  <div className="vehicle-meta-item">
                    <div className="vm-label">Make / Model</div>
                    <div className="vm-value">
                      {vehicleInfo.vehicle_brand || '—'} {vehicleInfo.vehicle_model || '—'}
                    </div>
                  </div>
                  <div className="vehicle-meta-item">
                    <div className="vm-label">VRN</div>
                    <div className="vm-value">{vehicleInfo.vrn || '—'}</div>
                  </div>
                  <div className="vehicle-meta-item">
                    <div className="vm-label">Year</div>
                    <div className="vm-value">{vehicleInfo.year || '—'}</div>
                  </div>
                  <div className="vehicle-meta-item">
                    <div className="vm-label">Color</div>
                    <div className="vm-value">{vehicleInfo.vehicle_color || '—'}</div>
                  </div>
                  <div className="vehicle-meta-item">
                    <div className="vm-label">Insured</div>
                    <div className="vm-value">{vehicleInfo.insured ? 'Yes' : 'No'}</div>
                  </div>
                  <div className="vehicle-meta-item">
                    <div className="vm-label">VIN</div>
                    <div className="vm-value" style={{ fontSize: '12px' }}>
                      {vehicleInfo.vin || '—'}
                    </div>
                  </div>
                </div>
                <div className="img-grid">
                  <ImageTile label="Front of vehicle" url={images.car_front} />
                  <ImageTile label="Back of vehicle" url={images.car_back} />
                  <ImageTile label="Side of vehicle" url={images.car_side} />
                  <ImageTile label="VRN plate document" url={images.vrn} />
                  <ImageTile label="VIN plate document" url={images.vin} wide />
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Lightbox */}
      {lightboxSrc && (
        <div className="lightbox open" onClick={() => setLightboxSrc(null)}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={lightboxSrc} alt="Full size" />
        </div>
      )}
    </>
  );
}
