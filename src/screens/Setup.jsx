import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTrip } from '../state/TripContext.jsx';
import { REGIONS, countDays, buildTrip } from '../lib/hikePlanner.js';

const DEFAULT_LEAVE = '2026-11-14T08:00';
const DEFAULT_RETURN = '2026-11-15T17:30';

export default function Setup() {
  const { setTrip } = useTrip();
  const navigate = useNavigate();

  const [leave, setLeave] = useState(DEFAULT_LEAVE);
  const [ret, setRet] = useState(DEFAULT_RETURN);
  const [region, setRegion] = useState('Lake District');
  const [customPlace, setCustomPlace] = useState('');

  const effectiveRegion = customPlace || region;
  const dateInvalid = new Date(ret) <= new Date(leave);
  const dayCount = useMemo(() => countDays(leave, ret), [leave, ret]);
  const nights = Math.max(0, dayCount - 1);
  const isCanonical = effectiveRegion === 'Lake District' && dayCount === 2 && !customPlace;

  function pickRegion(r) {
    setRegion(r);
    setCustomPlace('');
  }

  function handleContinue() {
    if (dateInvalid) return;
    const trip = buildTrip({ leave, ret, region, customPlace });
    setTrip(trip);
    navigate('/trip');
  }

  return (
    <div className="wrap form">
      <header className="page-header">
        <svg className="contour" viewBox="0 0 1000 140" preserveAspectRatio="none">
          <path d="M-20 30 Q 150 5, 300 35 T 600 30 T 1020 40" />
          <path d="M-20 65 Q 200 40, 380 70 T 750 62 T 1020 75" />
          <path d="M-20 100 Q 180 130, 420 100 T 800 105 T 1020 95" />
        </svg>
        <div className="header-row">
          <div>
            <h1>Plan a hike</h1>
            <p className="sub">Set the trip's dates and region — this decides how many day-by-day screens get created next.</p>
          </div>
          <span className="badge">Mock data</span>
        </div>
      </header>

      <div className="card">
        <h2>When are you going?</h2>
        <div className="date-grid">
          <div className="field" style={{ marginTop: 0 }}>
            <label htmlFor="leaveInput">Leave</label>
            <input type="datetime-local" id="leaveInput" value={leave} onChange={(e) => setLeave(e.target.value)} style={{ width: '100%' }} />
          </div>
          <div className="field" style={{ marginTop: 0 }}>
            <label htmlFor="returnInput">Return</label>
            <input type="datetime-local" id="returnInput" value={ret} onChange={(e) => setRet(e.target.value)} style={{ width: '100%' }} />
          </div>
        </div>
        <div className="duration-strip">
          <span className="n num">{dayCount}</span>
          <span className="lbl">{dayCount === 1 ? 'day' : 'days'} · {nights} {nights === 1 ? 'night' : 'nights'} on the trail</span>
          {dateInvalid && <span className="warn">Return should be after leave</span>}
        </div>
      </div>

      <div className="card">
        <h2>Where to?</h2>
        <div className="chip-grid" role="group" aria-label="Quick-pick region">
          {REGIONS.map((r) => (
            <button
              key={r}
              type="button"
              className="chip"
              aria-pressed={r === region && !customPlace}
              onClick={() => pickRegion(r)}
            >
              {r}
            </button>
          ))}
        </div>

        <div className="or-divider">or</div>

        <div className="search-row">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <circle cx="6" cy="6" r="5" stroke="var(--ink-muted)" strokeWidth="1.3" />
            <path d="M9.8 9.8 13 13" stroke="var(--ink-muted)" strokeWidth="1.3" strokeLinecap="round" />
          </svg>
          <input
            type="text"
            placeholder="Search a place name…"
            value={customPlace}
            onChange={(e) => setCustomPlace(e.target.value.trim())}
          />
        </div>
        <p className="search-hint">Stand-in for an OS Names lookup — free text here becomes the region label; Phase 3 wires this to the real OS Data Hub search.</p>

        <p className="selected-region">Selected: <b>{effectiveRegion}</b></p>
      </div>

      <div className="card">
        <h2>Trip preview</h2>
        <div className="preview-card" style={{ background: 'none', border: 'none', padding: 0, gap: 16, flexWrap: 'wrap' }}>
          <div className="preview-stat"><span className="v num">{dayCount}</span><span className="k">day screens</span></div>
          <div className="preview-stat"><span className="v num">{nights}</span><span className="k">nights to sort</span></div>
        </div>
        <p className="preview-note">
          {isCanonical
            ? 'Matches the Coniston → Windermere example — those two days come pre-filled so you can see the flow end to end.'
            : `Creates ${dayCount} generic placeholder ${dayCount === 1 ? 'day' : 'days'} for ${effectiveRegion} — edit each one on the day screen once you're through.`}
        </p>
      </div>

      <div className="cta-row">
        <button type="button" className="btn-primary" disabled={dateInvalid} onClick={handleContinue}>
          Continue to trip overview →
        </button>
      </div>
    </div>
  );
}
