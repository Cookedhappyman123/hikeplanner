import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link, Navigate } from 'react-router-dom';
import { useTrip } from '../state/TripContext.jsx';
import { fmtDate } from '../lib/hikePlanner.js';

function domainOf(url) {
  try { return new URL(url).hostname.replace(/^www\./, ''); } catch (e) { return ''; }
}

const EMPTY_ACC = { mode: 'none', name: '', address: '', notes: '', link: '' };

function initialFieldsFor(acc) {
  return {
    mode: acc.mode || 'none',
    manualName: acc.mode !== 'link' ? (acc.name || '') : '',
    manualAddress: acc.mode !== 'link' ? (acc.address || '') : '',
    manualNotes: acc.mode !== 'link' ? (acc.notes || '') : '',
    linkUrl: acc.mode === 'link' ? (acc.link || '') : '',
    linkName: acc.mode === 'link' ? (acc.name || '') : ''
  };
}

export default function Accommodation() {
  const { dayIndex: dayIndexParam } = useParams();
  const { trip, updateDay } = useTrip();
  const navigate = useNavigate();
  const dayIndex = parseInt(dayIndexParam, 10);

  // Hooks must run unconditionally every render (Rules of Hooks), so the
  // out-of-range redirect below happens *after* all of these — never
  // return early before a hook call, even for an invalid :dayIndex.
  const dayExists = !isNaN(dayIndex) && dayIndex >= 0 && dayIndex < trip.days.length;
  const day = dayExists ? trip.days[dayIndex] : null;
  const isLastDay = dayExists && dayIndex === trip.days.length - 1;
  const acc = (day && day.accommodation) || EMPTY_ACC;

  const [fields, setFields] = useState(() => initialFieldsFor(acc));
  const { mode, manualName, manualAddress, manualNotes, linkUrl, linkName } = fields;

  // Re-sync the form if the day being edited changes under us (e.g. the
  // route re-renders this same component instance with a new :dayIndex
  // instead of remounting it) so stale data from a previous night can
  // never linger in the fields.
  useEffect(() => {
    setFields(initialFieldsFor(acc));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dayIndex]);

  function setMode(mode) { setFields((f) => ({ ...f, mode })); }
  function setManualName(manualName) { setFields((f) => ({ ...f, manualName })); }
  function setManualAddress(manualAddress) { setFields((f) => ({ ...f, manualAddress })); }
  function setManualNotes(manualNotes) { setFields((f) => ({ ...f, manualNotes })); }
  function setLinkUrl(linkUrl) { setFields((f) => ({ ...f, linkUrl })); }
  function setLinkName(linkName) { setFields((f) => ({ ...f, linkName })); }

  const domain = domainOf(linkUrl);

  if (!dayExists) {
    return <Navigate to="/trip" replace />;
  }

  function buildAccommodation() {
    if (mode === 'manual') return { mode: 'manual', name: manualName, address: manualAddress, notes: manualNotes, link: '' };
    if (mode === 'link') return { mode: 'link', name: linkName || domain, address: '', notes: '', link: linkUrl };
    return null;
  }

  function handleSave() {
    updateDay(dayIndex, { accommodation: buildAccommodation() });
    navigate('/trip');
  }

  let previewIcon = '—', previewName, previewSub, showDomain = false;
  if (mode === 'manual') {
    previewIcon = '🏠';
    previewName = manualName || 'Untitled stay';
    previewSub = [manualAddress, manualNotes].filter(Boolean).join('\n') || 'No address or notes yet';
  } else if (mode === 'link') {
    previewIcon = '🔗';
    previewName = linkName || (domain || 'Untitled booking link');
    previewSub = linkUrl ? 'Booked via link — tap through for details' : 'Paste a booking link above';
    showDomain = !!domain;
  } else {
    previewName = isLastDay ? 'No stay needed' : 'Not booked yet';
    previewSub = isLastDay ? 'End of trip' : "You'll need somewhere for this night eventually";
  }

  return (
    <div className="wrap form">
      <p className="crumb">
        <Link to="/trip">← Trip overview</Link>
        <span> · {trip.name}</span>
      </p>

      <header className="page-header">
        <svg className="contour" viewBox="0 0 1000 120" preserveAspectRatio="none">
          <path d="M-20 25 Q 150 5, 300 30 T 600 25 T 1020 35" />
          <path d="M-20 60 Q 200 38, 380 62 T 750 55 T 1020 65" />
          <path d="M-20 90 Q 180 108, 420 90 T 800 95 T 1020 88" />
        </svg>
        <div className="header-row">
          <div>
            <p className="date-line">Night after Day {dayIndex + 1} of {trip.days.length}</p>
            <h1>Accommodation</h1>
            <p className="date-line">{fmtDate(day.date)}</p>
          </div>
          <span className="badge">Mock data</span>
        </div>
        <div className="carry-callout">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M2 8h10m0 0-4-4m4 4-4 4" stroke="var(--ink-muted)" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
          Wherever this stay is, it becomes <b>{isLastDay ? "the end of the trip — there's no next day to carry forward to" : `Day ${dayIndex + 2}'s start point`}</b> tomorrow morning.
        </div>
      </header>

      <div className="card">
        <h2>How is this booked?</h2>
        <div className="segmented full" role="group" aria-label="Accommodation entry mode">
          <button type="button" aria-pressed={mode === 'manual'} onClick={() => setMode('manual')}>Manual entry</button>
          <button type="button" aria-pressed={mode === 'link'} onClick={() => setMode('link')}>Booking link</button>
          <button type="button" aria-pressed={mode === 'none'} onClick={() => setMode('none')}>Not needed</button>
        </div>

        {mode === 'manual' && (
          <div className="mode-panel active">
            <div className="field">
              <label htmlFor="manualName">Place name</label>
              <input type="text" id="manualName" style={{ width: '100%' }} placeholder="e.g. Windermere YHA"
                value={manualName} onChange={(e) => setManualName(e.target.value)} />
            </div>
            <div className="field">
              <label htmlFor="manualAddress">Address or area</label>
              <input type="text" id="manualAddress" style={{ width: '100%' }} placeholder="e.g. Bridge Lane, Troutbeck, Windermere LA23 1LA"
                value={manualAddress} onChange={(e) => setManualAddress(e.target.value)} />
            </div>
            <div className="field">
              <label htmlFor="manualNotes">Check-in notes</label>
              <textarea id="manualNotes" placeholder="Check-in time, key safe code, booking reference…"
                value={manualNotes} onChange={(e) => setManualNotes(e.target.value)} />
            </div>
          </div>
        )}

        {mode === 'link' && (
          <div className="mode-panel active">
            <div className="field">
              <label htmlFor="linkUrl">Booking link</label>
              <input type="url" id="linkUrl" style={{ width: '100%' }} placeholder="https://www.booking.com/…"
                value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} />
            </div>
            <div className="field">
              <label htmlFor="linkName">Display name <span className="hint" style={{ display: 'inline' }}>(optional — taken from the link's domain otherwise)</span></label>
              <input type="text" id="linkName" style={{ width: '100%' }} placeholder="e.g. The Wild Boar Inn"
                value={linkName} onChange={(e) => setLinkName(e.target.value)} />
            </div>
            <div className="linkout-note">
              <span>🔗</span>
              <span>For now this just keeps the link and shows its domain — tapping it later opens the real booking site. Phase 4 swaps this for a proper affiliate-API lookup that pulls in the name, address and check-in time automatically.</span>
            </div>
          </div>
        )}

        {mode === 'none' && (
          <div className="mode-panel active">
            <p className="empty-copy">
              {isLastDay ? 'Last night of the trip — mark it as not needed and you’re done.' : 'No stay needed for this night — mark it and move on.'}
            </p>
            <p className="field hint" style={{ marginTop: 2 }}>Use this for a night you're already sorted for elsewhere, or the last night of the trip when you're heading home.</p>
          </div>
        )}
      </div>

      <div className="card">
        <p className="preview-label">How this will appear on the trip overview</p>
        <div className="preview-card">
          <div className="preview-icon">{previewIcon}</div>
          <div>
            <p className="preview-name">{previewName}</p>
            <p className="preview-sub">{previewSub}</p>
            {showDomain && <span className="preview-domain">{domain}</span>}
          </div>
        </div>
      </div>

      <div className="actions">
        <Link to="/trip" className="btn ghost">Cancel</Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span className="save-hint">{mode !== 'none' ? 'Carries forward automatically' : ''}</span>
          <button type="button" className="btn primary" onClick={handleSave}>Save &amp; return to overview</button>
        </div>
      </div>
    </div>
  );
}
