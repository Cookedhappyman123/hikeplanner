import { Link } from 'react-router-dom';
import { useTrip } from '../state/TripContext.jsx';
import {
  resolveDay, timeToMin, daylightStatus, fmtDate, fmtDateShort, fmtClock, SUN
} from '../lib/hikePlanner.js';

export default function Overview() {
  const { trip } = useTrip();
  const days = trip.days;

  let totalDist = 0, totalAscent = 0, nightsNeeded = 0, nightsSorted = 0;
  days.forEach((day, i) => {
    totalDist += day.distanceKm;
    const r = resolveDay(day);
    totalAscent += r.ascent;
    const isLast = i === days.length - 1;
    if (!isLast) {
      nightsNeeded++;
      if (day.accommodation) nightsSorted++;
    }
  });

  return (
    <div className="wrap narrow">
      <p className="crumb"><Link to="/">← Trip setup</Link></p>

      <header className="page-header">
        <svg className="contour" viewBox="0 0 1000 120" preserveAspectRatio="none">
          <path d="M-20 25 Q 150 5, 300 30 T 600 25 T 1020 35" />
          <path d="M-20 60 Q 200 38, 380 62 T 750 55 T 1020 65" />
          <path d="M-20 90 Q 180 108, 420 90 T 800 95 T 1020 88" />
        </svg>
        <div className="header-row">
          <div>
            <span className="region-badge">{trip.region}</span>
            <h1>{trip.name}</h1>
            <p className="date-line">
              {fmtDateShort(days[0].date)} – {fmtDateShort(days[days.length - 1].date)} · {days.length} {days.length === 1 ? 'day' : 'days'}
            </p>
          </div>
          <span className="badge">Mock data</span>
        </div>
        <div className="trip-stats">
          <div className="stat"><span className="v num">{days.length}</span><span className="k">days</span></div>
          <div className="stat"><span className="v num">{totalDist.toFixed(1)} km</span><span className="k">total distance</span></div>
          <div className="stat"><span className="v num">{Math.round(totalAscent)} m</span><span className="k">total ascent</span></div>
          <div className="stat"><span className="v num">{nightsSorted} of {nightsNeeded}</span><span className="k">nights sorted</span></div>
        </div>
        <Link className="review-btn" to="/trip/review">📋 Open trip review →</Link>
      </header>

      <div className="timeline-list">
        {days.map((day, i) => {
          const r = resolveDay(day);
          const startMin = timeToMin(day.startTime || '08:00');
          const leg1Min = r.leg1Table[day.leg1Mode || 'drive'];
          const leg2Min = r.leg2Table[day.leg2Mode || 'bus'];
          const finish = startMin + leg1Min + r.hikeMin + leg2Min;
          const ds = daylightStatus(startMin, finish, SUN);
          const isLast = i === days.length - 1;
          const acc = day.accommodation;

          let accIconClass = 'muted', accIcon = '—';
          let accName = isLast ? 'No stay needed' : 'Not booked yet';
          let accSub = isLast ? 'End of trip' : "You'll need somewhere for tonight";
          if (acc && acc.mode === 'manual') {
            accIconClass = ''; accIcon = '🏠'; accName = acc.name || 'Untitled stay'; accSub = acc.address || acc.notes || '';
          } else if (acc && acc.mode === 'link') {
            accIconClass = ''; accIcon = '🔗'; accName = acc.name || 'Booking link'; accSub = 'Booked via link';
          } else if (!isLast && !acc) {
            accIconClass = 'warn';
          }

          return (
            <div className="day-row" key={i}>
              <div className="rail">
                <div className="dot" />
                <div className={`line ${isLast ? 'last' : ''}`} />
              </div>
              <div className="day-card">
                <div className="day-card-head">
                  <div>
                    <p className="day-label">Day {i + 1} · {fmtDate(day.date)}</p>
                    <p className="day-route">{day.startPoint} → {day.endPoint}</p>
                    <p className="day-via">via {day.hikeStart}{day.hikeStart !== day.hikeEnd ? ' · ' + day.hikeEnd : ''}</p>
                  </div>
                  <Link className="open-link" to={`/trip/day/${i}`}>Open day →</Link>
                </div>
                <div className="day-stats">
                  <span className="mini-stat"><b>{day.distanceKm} km</b> · {Math.round(r.ascent)}m ↑ {Math.round(r.descent)}m ↓</span>
                  <span className="mini-stat">Est. finish <b>{fmtClock(finish)}</b></span>
                  <span className={`pill ${ds.status}`}>{ds.msg}</span>
                </div>
                <div className="accom-row">
                  <div className={`accom-icon ${accIconClass}`}>{accIcon}</div>
                  <div className="accom-text">
                    <p className="accom-name">{accName}</p>
                    <p className="accom-sub">{accSub}</p>
                  </div>
                  <Link className="accom-edit" to={`/trip/day/${i}/accommodation`}>Edit →</Link>
                </div>
                {!isLast && <p className="carry-note">↳ carries forward as Day {i + 2}'s start point</p>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
