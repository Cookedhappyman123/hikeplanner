import { Link } from 'react-router-dom';
import { useTrip } from '../state/TripContext.jsx';
import {
  resolveDay, timeToMin, fmtClock, fmtDur, fmtDate, fmtDateShort, daylightStatus,
  SUN, LEG_MODE_LABEL
} from '../lib/hikePlanner.js';

const RANK = { success: 0, warning: 1, danger: 2 };

export default function Review() {
  const { trip } = useTrip();
  const days = trip.days;

  let worstStatus = 'success';
  let unbooked = 0;

  const rows = days.map((day, i) => {
    const r = resolveDay(day);
    const leg1Mode = day.leg1Mode || 'drive', leg2Mode = day.leg2Mode || 'bus';
    const startMin = timeToMin(day.startTime || '08:00');
    const leg1Min = r.leg1Table[leg1Mode];
    const leg2Min = r.leg2Table[leg2Mode];
    const t1 = startMin + leg1Min, t2 = t1 + r.hikeMin, finish = t2 + leg2Min;
    const ds = daylightStatus(startMin, finish, SUN);
    if (RANK[ds.status] > RANK[worstStatus]) worstStatus = ds.status;
    const isLast = i === days.length - 1;

    const acc = day.accommodation;
    let accClass = '', accName, accSub;
    if (acc && acc.mode === 'manual') { accName = acc.name || 'Untitled stay'; accSub = [acc.address, acc.notes].filter(Boolean).join('\n'); }
    else if (acc && acc.mode === 'link') { accName = acc.name || 'Booking link'; accSub = acc.link; }
    else if (isLast) { accName = 'No stay needed'; accSub = 'End of trip — heading home'; }
    else { accName = 'Not booked yet'; accClass = 'warn'; accSub = 'Sort this before you go'; unbooked++; }

    return { day, i, r, leg1Mode, leg2Mode, startMin, leg1Min, leg2Min, finish, ds, accClass, accName, accSub };
  });

  let overallClass = worstStatus, overallMsg;
  if (unbooked > 0) {
    overallClass = 'warning';
    overallMsg = `${unbooked} night${unbooked > 1 ? 's' : ''} still need booking`;
  } else if (worstStatus === 'danger') {
    overallMsg = 'At least one day runs into the dark — check the daylight pills below';
  } else if (worstStatus === 'warning') {
    overallMsg = 'At least one day is tight on daylight — check the pills below';
  } else {
    overallMsg = 'Every night is sorted and every day has daylight to spare';
  }

  return (
    <div className="wrap narrow">
      <p className="crumb"><Link to="/trip">← Trip overview</Link></p>

      <header className="page-header">
        <svg className="contour" viewBox="0 0 1000 120" preserveAspectRatio="none">
          <path d="M-20 25 Q 150 5, 300 30 T 600 25 T 1020 35" />
          <path d="M-20 60 Q 200 38, 380 62 T 750 55 T 1020 65" />
          <path d="M-20 90 Q 180 108, 420 90 T 800 95 T 1020 88" />
        </svg>
        <div className="header-row">
          <div>
            <p className="eyebrow">The night before</p>
            <span className="region-badge">{trip.region}</span>
            <h1>{trip.name}</h1>
            <p className="date-line">
              {fmtDateShort(days[0].date)} – {fmtDateShort(days[days.length - 1].date)} · {days.length} {days.length === 1 ? 'day' : 'days'}
            </p>
          </div>
          <span className="badge">Mock data</span>
        </div>
        <div className={`overall-pill ${overallClass}`}>{overallMsg}</div>
      </header>

      {rows.map(({ day, i, r, leg1Mode, leg2Mode, startMin, leg1Min, leg2Min, finish, ds, accClass, accName, accSub }) => (
        <div className="card" key={i}>
          <div className="day-card-head review">
            <div>
              <p className="date-line">{fmtDate(day.date)} · Day {i + 1} of {days.length}</p>
              <p className="day-route">{day.startPoint} → {day.endPoint}</p>
              <p className="day-via">via {day.hikeStart}{day.hikeStart !== day.hikeEnd ? ' · ' + day.hikeEnd : ''} · starts {day.startTime}</p>
            </div>
            <Link className="open-link" to={`/trip/day/${i}`}>Open day →</Link>
          </div>
          <div className="day-body">
            <div>
              <div className="leg-line"><span className="mode-chip">{LEG_MODE_LABEL[leg1Mode]}</span><span className="place">{day.startPoint} → {r.hikeStartName}</span><span className="dur num">{fmtDur(leg1Min)}</span></div>
              <div className="leg-line"><span className="mode-chip hike-chip">Hike</span><span className="place">{r.hikeStartName} → {r.hikeEndName}</span><span className="dur num">{fmtDur(r.hikeMin)}</span></div>
              <div className="leg-line"><span className="mode-chip">{LEG_MODE_LABEL[leg2Mode]}</span><span className="place">{r.hikeEndName} → {day.endPoint}</span><span className="dur num">{fmtDur(leg2Min)}</span></div>
              <div className="mini-stats">
                <span className="mini-stat"><b>{day.distanceKm} km</b> · {Math.round(r.ascent)}m ↑ {Math.round(r.descent)}m ↓</span>
              </div>
              <span className={`pill ${ds.status}`}>{fmtClock(startMin)} → {fmtClock(finish)} · {ds.msg}</span>
            </div>
            <div className={`accom-box ${accClass}`}>
              <h3>Tonight's stay</h3>
              <p className="accom-name">{accName}</p>
              <p className="accom-sub">{accSub || ''}</p>
            </div>
          </div>
        </div>
      ))}

      <p className="print-note">Read-only summary — open a day to change plans, then come back here before you leave.</p>
    </div>
  );
}
