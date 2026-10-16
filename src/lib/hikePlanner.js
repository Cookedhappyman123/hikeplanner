/*
 * Hike planner mock-data helpers.
 *
 * Ported from the Phase 1 artifact prototype's shared.js. The
 * URL-hash state-passing helpers (encodeState/decodeState/buildLink)
 * from that version are gone — this is now one single-page app, so
 * shared trip state just lives in TripContext (see src/state/TripContext.jsx)
 * instead of being smuggled between separately-hosted pages via the URL.
 * Every other function/constant here is unchanged from the prototype.
 */

export function fmtClock(mins) {
  mins = ((Math.round(mins) % 1440) + 1440) % 1440;
  const h = Math.floor(mins / 60), m = mins % 60;
  return String(h).padStart(2, '0') + ':' + String(m).padStart(2, '0');
}

export function fmtDur(mins) {
  mins = Math.round(mins);
  const h = Math.floor(mins / 60), m = mins % 60;
  if (h > 0) return m > 0 ? (h + 'h ' + m + 'm') : (h + 'h');
  return m + 'm';
}

export function timeToMin(t) {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

export function naismith(distanceKm, ascentM) {
  return distanceKm * 12 + ascentM * 0.1;
}

export function fmtDate(iso, opts) {
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString('en-GB', opts || { weekday: 'long', day: 'numeric', month: 'long' });
}

export function fmtDateShort(iso) {
  return fmtDate(iso, { weekday: 'short', day: 'numeric', month: 'short' });
}

// Given a day object and its current direction, resolve the effective
// leg-1 / leg-2 minutes-by-mode tables and hike start/end labels.
export function resolveDay(day) {
  const forward = day.direction !== 'reversed';
  const hikeStartName = forward ? day.hikeStart : day.hikeEnd;
  const hikeEndName = forward ? day.hikeEnd : day.hikeStart;
  const ascent = forward ? day.ascentForward : day.descentForward;
  const descent = forward ? day.descentForward : day.ascentForward;
  const hikeMin = naismith(day.distanceKm, ascent);
  const leg1Table = forward ? day.legMinutes.toHikeStart : day.legMinutes.toHikeEnd;
  const leg2Table = forward ? day.legMinutes.fromHikeEnd : day.legMinutes.fromHikeStart;
  return { forward, hikeStartName, hikeEndName, ascent, descent, hikeMin, leg1Table, leg2Table };
}

export function daylightStatus(startMin, finishMin, sun) {
  const startsDark = startMin < sun.civilDawn;
  const startsDim = !startsDark && startMin < sun.sunrise;
  const finishesDark = finishMin > sun.civilDusk;
  const finishesDim = !finishesDark && finishMin > sun.sunset;
  let status = 'success', msg;
  if (startsDark || finishesDark) {
    status = 'danger';
    msg = finishesDark ? ('Finishes ' + fmtDur(finishMin - sun.civilDusk) + ' after dark')
                        : ('Starts ' + fmtDur(sun.civilDawn - startMin) + ' before dawn');
  } else if (startsDim || finishesDim) {
    status = 'warning';
    msg = finishesDim ? 'Finishes during dusk — tight' : 'Starts before sunrise — tight';
  } else {
    status = 'success';
    msg = fmtDur(sun.civilDusk - finishMin) + ' of daylight to spare';
  }
  return { status, msg };
}

export function countDays(leaveStr, returnStr) {
  const a = new Date(leaveStr.split('T')[0] + 'T00:00:00');
  const b = new Date(returnStr.split('T')[0] + 'T00:00:00');
  const diff = Math.round((b - a) / 86400000);
  return Math.max(1, diff + 1);
}

// Generic mock day generator for any region / day count other than the
// canonical 2-day Lake District example (see buildTrip below).
export function genericDays(n, region, leaveDate, leaveTime) {
  const days = [];
  const base = new Date(leaveDate + 'T00:00:00');
  for (let i = 0; i < n; i++) {
    const d = new Date(base); d.setDate(base.getDate() + i);
    const iso = d.toISOString().slice(0, 10);
    const isFirst = i === 0, isLast = i === n - 1;
    const startPoint = isFirst ? region + ' trailhead car park' : 'Camp ' + i;
    const endPoint = isLast ? region + ' trailhead car park' : 'Camp ' + (i + 1);
    days.push({
      date: iso,
      startPoint, startNote: isFirst ? 'Arrival' : "Last night's stay",
      hikeStart: startPoint, hikeEnd: endPoint,
      distanceKm: Math.round((9 + (i % 3) * 2.4) * 10) / 10,
      ascentForward: 180 + i * 45,
      descentForward: 160 + i * 40,
      legMinutes: {
        toHikeStart: { drive: 10, walk: 20, bus: 20, taxi: 8 },
        toHikeEnd: { drive: 10, walk: 20, bus: 20, taxi: 8 },
        fromHikeStart: { drive: 10, walk: 20, bus: 20, taxi: 8 },
        fromHikeEnd: { drive: 10, walk: 20, bus: 20, taxi: 8 }
      },
      endPoint, endNote: isLast ? 'Journey home' : 'On to the next camp',
      direction: 'forward',
      startTime: isFirst ? leaveTime : '08:00',
      leg1Mode: 'drive', leg2Mode: 'walk',
      accommodation: null
    });
  }
  return days;
}

// Builds a full trip object from the trip-setup form's inputs. Reuses the
// canonical Coniston -> Windermere example verbatim when the defaults
// (Lake District, 2 days, no custom place typed) are left untouched, so
// the "click through with no changes" path still shows real, specific
// data rather than generic placeholders.
export function buildTrip({ leave, ret, region, customPlace }) {
  const n = countDays(leave, ret);
  const effectiveRegion = customPlace || region;
  const leaveDate = leave.split('T')[0];
  const leaveTime = leave.split('T')[1] || '08:00';
  const isCanonical = effectiveRegion === 'Lake District' && n === 2 && !customPlace;

  let days;
  if (isCanonical) {
    days = JSON.parse(JSON.stringify(DEFAULT_TRIP.days));
    days[0].date = leaveDate;
    const d1 = new Date(leaveDate + 'T00:00:00'); d1.setDate(d1.getDate() + 1);
    days[1].date = d1.toISOString().slice(0, 10);
    days[0].startTime = leaveTime;
  } else {
    days = genericDays(n, effectiveRegion, leaveDate, leaveTime);
  }

  return {
    name: isCanonical ? 'Coniston to Windermere' : effectiveRegion + ' hiking trip',
    region: effectiveRegion, start: leave, end: ret, days
  };
}

export const LEG_MODES = ['drive', 'walk', 'bus', 'taxi'];
export const LEG_MODE_LABEL = { drive: 'Drive', walk: 'Walk', bus: 'Bus', taxi: 'Taxi' };

// November constants — Phase 3 replaces these with a real sunrise-sunset.org lookup per day/location.
export const SUN = { sunrise: 7 * 60 + 38, sunset: 16 * 60 + 15, civilDawn: 7 * 60 + 4, civilDusk: 16 * 60 + 49 };

export const REGIONS = [
  'Lake District', 'Peak District', 'Snowdonia (Eryri)', 'Yorkshire Dales',
  'South Downs', 'Brecon Beacons (Bannau Brycheiniog)', 'Dartmoor', 'Cairngorms', 'Exmoor', 'Northumberland'
];

export const DEFAULT_TRIP = {
  name: 'Coniston to Windermere',
  region: 'Lake District',
  start: '2026-11-14T08:00',
  end: '2026-11-15T17:30',
  days: [
    {
      date: '2026-11-14',
      startPoint: 'Coniston village',
      startNote: "Last night's stay",
      hikeStart: 'Tarn Hows',
      hikeEnd: 'Ambleside (Lake Road car park)',
      distanceKm: 11.5,
      ascentForward: 210,
      descentForward: 480,
      legMinutes: {
        toHikeStart: { drive: 15, walk: 75, bus: 25, taxi: 12 },
        toHikeEnd: { drive: 12, walk: 55, bus: 18, taxi: 10 },
        fromHikeStart: { drive: 28, walk: 150, bus: 45, taxi: 22 },
        fromHikeEnd: { drive: 10, walk: 40, bus: 15, taxi: 8 }
      },
      endPoint: 'Windermere',
      endNote: 'Onward travel after the hike',
      direction: 'forward',
      startTime: '08:00',
      leg1Mode: 'drive',
      leg2Mode: 'bus',
      accommodation: {
        mode: 'manual',
        name: 'Windermere YHA',
        address: 'Bridge Lane, Troutbeck, Windermere LA23 1LA',
        notes: 'Dorm bed booked · check-in from 15:00, key safe after hours',
        link: ''
      }
    },
    {
      date: '2026-11-15',
      startPoint: 'Windermere',
      startNote: "Last night's stay",
      hikeStart: 'Windermere (Bowness pier)',
      hikeEnd: 'Ambleside',
      distanceKm: 8.2,
      ascentForward: 320,
      descentForward: 300,
      legMinutes: {
        toHikeStart: { drive: 6, walk: 12, bus: 8, taxi: 6 },
        toHikeEnd: { drive: 18, walk: 90, bus: 25, taxi: 14 },
        fromHikeStart: { drive: 18, walk: 90, bus: 25, taxi: 14 },
        fromHikeEnd: { drive: 15, walk: 70, bus: 20, taxi: 12 }
      },
      endPoint: 'Windermere station',
      endNote: 'Journey home',
      direction: 'forward',
      startTime: '08:30',
      leg1Mode: 'walk',
      leg2Mode: 'bus',
      accommodation: null
    }
  ]
};
