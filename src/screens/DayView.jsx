import { useParams, Link, Navigate } from 'react-router-dom';
import { useTrip } from '../state/TripContext.jsx';
import {
  resolveDay, fmtClock, fmtDur, timeToMin, fmtDate, daylightStatus, SUN, LEG_MODES, LEG_MODE_LABEL
} from '../lib/hikePlanner.js';

const PX = [80, 260, 440, 620];
const PY = 140;

function segPath(a, b, arc) {
  if (!arc) return `M ${PX[a]} ${PY} L ${PX[b]} ${PY}`;
  const mid = (PX[a] + PX[b]) / 2, ctrlY = PY + arc * 70;
  return `M ${PX[a]} ${PY} Q ${mid} ${ctrlY} ${PX[b]} ${PY}`;
}

export default function DayView() {
  const { dayIndex: dayIndexParam } = useParams();
  const { trip, updateDay } = useTrip();
  const dayIndex = parseInt(dayIndexParam, 10);

  if (isNaN(dayIndex) || dayIndex < 0 || dayIndex >= trip.days.length) {
    return <Navigate to="/trip" replace />;
  }

  const day = trip.days[dayIndex];
  const direction = day.direction || 'forward';
  const leg1Mode = day.leg1Mode || 'drive';
  const leg2Mode = day.leg2Mode || 'bus';
  const startMin = timeToMin(day.startTime || '08:00');

  const r = resolveDay(day);
  const leg1Min = r.leg1Table[leg1Mode];
  const leg2Min = r.leg2Table[leg2Mode];
  const t0 = startMin, t1 = t0 + leg1Min, t2 = t1 + r.hikeMin, finish = t2 + leg2Min;

  const barStart = Math.min(t0, SUN.sunrise);
  const barEnd = Math.max(finish, SUN.sunset);
  const total = barEnd - barStart;
  const pct = (x) => ((x - barStart) / total) * 100;
  const clampLabel = (p) => Math.min(94, Math.max(6, p));
  const ds = daylightStatus(t0, finish, SUN);

  const hikeStartIdx = r.forward ? 1 : 2;
  const hikeEndIdx = r.forward ? 2 : 1;
  const pathLeg1 = hikeStartIdx === 1 ? segPath(0, 1, 0) : segPath(0, 2, -1);
  const pathHike = segPath(hikeStartIdx, hikeEndIdx, 0);
  const pathLeg2 = hikeEndIdx === 2 ? segPath(2, 3, 0) : segPath(1, 3, 1);

  return (
    <div className="wrap">
      <p className="crumb">
        <Link to="/trip">← Trip overview</Link>
        <span> · {trip.name}</span>
      </p>

      <header className="page-header">
        <svg className="contour" viewBox="0 0 1000 140" preserveAspectRatio="none">
          <path d="M-20 30 Q 150 5, 300 35 T 600 30 T 1020 40" />
          <path d="M-20 65 Q 200 40, 380 70 T 750 62 T 1020 75" />
          <path d="M-20 100 Q 180 130, 420 100 T 800 105 T 1020 95" />
        </svg>
        <div className="header-row">
          <div>
            <p className="date-line">{fmtDate(day.date)} · Day {dayIndex + 1} of {trip.days.length}</p>
            <h1>{day.startPoint} to {day.endPoint}</h1>
            <p className="date-line">via {day.hikeStart}</p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 10 }}>
            <span className="badge">Mock data</span>
            <div className="time-field">
              <label htmlFor="startTime">Day start time</label>
              <input
                type="time"
                id="startTime"
                value={day.startTime || '08:00'}
                onChange={(e) => updateDay(dayIndex, { startTime: e.target.value })}
              />
            </div>
          </div>
        </div>
      </header>

      <div className="grid">
        <div className="col-left">
          <section className="block">
            <h2>Day start point</h2>
            <p className="place">{day.startPoint}</p>
            <p className="place-sub">{day.startNote}</p>
          </section>

          <section className="block">
            <h2>Leg 1 · to the trailhead</h2>
            <div className="segmented" role="group" aria-label="Leg 1 transport mode">
              {LEG_MODES.map((mode) => (
                <button key={mode} type="button" aria-pressed={leg1Mode === mode}
                  onClick={() => updateDay(dayIndex, { leg1Mode: mode })}>
                  {LEG_MODE_LABEL[mode]}
                </button>
              ))}
            </div>
            <div className="leg-summary">
              <span className="dur num">{fmtDur(leg1Min)}</span>
              <span className="lbl">{day.startPoint} → {r.hikeStartName}</span>
            </div>
          </section>

          <section className="block">
            <h2>Hike</h2>
            <p className="place">{r.hikeStartName}</p>
            <p className="place-sub">to {r.hikeEndName}</p>
            <div className="segmented" role="group" aria-label="Hike direction">
              <button type="button" aria-pressed={direction === 'forward'}
                onClick={() => updateDay(dayIndex, { direction: 'forward' })}>
                Start at {day.hikeStart}
              </button>
              <button type="button" aria-pressed={direction === 'reversed'}
                onClick={() => updateDay(dayIndex, { direction: 'reversed' })}>
                Start at {day.hikeEnd}
              </button>
            </div>
            <div className="route-stats">
              <div className="stat"><span className="v num">{day.distanceKm} km</span><span className="k">distance</span></div>
              <div className="stat"><span className="v num">{Math.round(r.ascent)} m</span><span className="k">ascent</span></div>
              <div className="stat"><span className="v num">{Math.round(r.descent)} m</span><span className="k">descent</span></div>
              <div className="stat"><span className="v num">{fmtDur(r.hikeMin)}</span><span className="k">estimated</span></div>
            </div>
          </section>

          <section className="block">
            <h2>Leg 2 · to the day's end</h2>
            <div className="segmented" role="group" aria-label="Leg 2 transport mode">
              {LEG_MODES.map((mode) => (
                <button key={mode} type="button" aria-pressed={leg2Mode === mode}
                  onClick={() => updateDay(dayIndex, { leg2Mode: mode })}>
                  {LEG_MODE_LABEL[mode]}
                </button>
              ))}
            </div>
            <div className="leg-summary">
              <span className="dur num">{fmtDur(leg2Min)}</span>
              <span className="lbl">{r.hikeEndName} → {day.endPoint}</span>
            </div>
          </section>

          <section className="block">
            <h2>Day end point</h2>
            <p className="place">{day.endPoint}</p>
            <p className="place-sub">{day.endNote}</p>
            <Link className="block-link" to={`/trip/day/${dayIndex}/accommodation`}>🏠 Edit tonight's accommodation →</Link>
          </section>
        </div>

        <div className="col-right">
          <div className="map-card">
            <h2>Route map</h2>
            <svg viewBox="0 0 700 250" width="100%" role="img" aria-label="Schematic map of the day's stops and travel legs">
              <defs>
                <marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                  <path d="M2 1L8 5L2 9" fill="none" stroke="context-stroke" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </marker>
              </defs>
              <path fill="none" stroke="var(--travel)" strokeWidth="2" strokeDasharray="2 6" strokeLinecap="round" markerEnd="url(#arrow)" d={pathLeg1} />
              <path fill="none" stroke="var(--hike)" strokeWidth="3" strokeLinecap="round" markerEnd="url(#arrow)" d={pathHike} />
              <path fill="none" stroke="var(--travel)" strokeWidth="2" strokeDasharray="2 6" strokeLinecap="round" markerEnd="url(#arrow)" d={pathLeg2} />

              <g>
                <circle cx={PX[0]} cy={PY} r="7" fill="var(--ink-muted)" />
                <text className="pin-place" x={PX[0]} y="118" textAnchor="middle">{day.startPoint}</text>
                <text className="pin-role" x={PX[0]} y="168" textAnchor="middle">Day start</text>
              </g>
              <g>
                <circle cx={PX[1]} cy={PY} r="7" fill="var(--hike)" />
                <text className="pin-place" x={PX[1]} y="118" textAnchor="middle">{day.hikeStart}</text>
                <text className="pin-role" x={PX[1]} y="168" textAnchor="middle">{r.forward ? 'Hike start' : 'Hike end'}</text>
              </g>
              <g>
                <circle cx={PX[2]} cy={PY} r="7" fill="var(--hike)" />
                <text className="pin-place" x={PX[2]} y="118" textAnchor="middle">{day.hikeEnd}</text>
                <text className="pin-role" x={PX[2]} y="168" textAnchor="middle">{r.forward ? 'Hike end' : 'Hike start'}</text>
              </g>
              <g>
                <circle cx={PX[3]} cy={PY} r="7" fill="var(--ink-muted)" />
                <text className="pin-place" x={PX[3]} y="118" textAnchor="middle">{day.endPoint}</text>
                <text className="pin-role" x={PX[3]} y="168" textAnchor="middle">Day end</text>
              </g>
            </svg>
            <p className="map-note">Solid line: the imported trail. Dotted lines: travel legs, tappable for turn-by-turn directions once connected.</p>
          </div>

          <div className="timeline-card">
            <h2>Daylight check</h2>
            <p className="timeline-caption">
              {fmtClock(t0)} → {fmtClock(finish)} · sunrise {fmtClock(SUN.sunrise)} · sunset {fmtClock(SUN.sunset)}
            </p>
            <div className="bar">
              <div className="seg idle" style={{ width: pct(t0) + '%' }} />
              <div className="seg travel" style={{ width: (pct(t1) - pct(t0)) + '%' }} />
              <div className="seg hike" style={{ width: (pct(t2) - pct(t1)) + '%' }}>Hike</div>
              <div className="seg travel" style={{ width: (pct(finish) - pct(t2)) + '%' }} />
              <div className="seg idle" style={{ width: (100 - pct(finish)) + '%' }} />
            </div>
            <div className="tick-row">
              <span className="tick" style={{ left: clampLabel(pct(SUN.sunrise)) + '%' }}>Sunrise {fmtClock(SUN.sunrise)}</span>
              <span className="tick" style={{ left: clampLabel(pct(SUN.sunset)) + '%' }}>Sunset {fmtClock(SUN.sunset)}</span>
            </div>
            <div className={`status-pill ${ds.status}`}>{ds.msg}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
