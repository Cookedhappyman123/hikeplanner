import { Routes, Route, Navigate } from 'react-router-dom';
import Setup from './screens/Setup.jsx';
import Overview from './screens/Overview.jsx';
import DayView from './screens/DayView.jsx';
import Accommodation from './screens/Accommodation.jsx';
import Review from './screens/Review.jsx';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Setup />} />
      <Route path="/trip" element={<Overview />} />
      <Route path="/trip/day/:dayIndex" element={<DayView />} />
      <Route path="/trip/day/:dayIndex/accommodation" element={<Accommodation />} />
      <Route path="/trip/review" element={<Review />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
