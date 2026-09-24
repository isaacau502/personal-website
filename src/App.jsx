import SlopeBackground from './SlopeBackground.jsx';
import Work from './Work.jsx';
import Borrow from './Borrow.jsx';

// Path-based split: "/" is the cinematic run, "/work" is the professional
// reference. Full-page navigation between them (plain <a href>), so the Worker
// serves index.html for /work via SPA not_found_handling (see wrangler.jsonc).
function App() {
  const path = window.location.pathname.replace(/\/+$/, '');
  if (path === '/work') return <Work />;
  if (path === '/borrowmystuff') return <Borrow />;
  return <SlopeBackground />;
}

export default App;
