import { NavLink, Route, Routes } from 'react-router-dom';
import AboutPage from '@/pages/AboutPage';
import HomePage from '@/pages/HomePage';

export default function App() {
  return (
    <div className="shell">
      <header className="shell__header">
        <span className="shell__brand">__PROJECT_NAME__</span>
        <nav className="shell__nav">
          <NavLink to="/">Products</NavLink>
          <NavLink to="/about">About</NavLink>
        </nav>
      </header>

      <main className="shell__main">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/about" element={<AboutPage />} />
        </Routes>
      </main>

      <footer className="shell__footer">
        API requests are proxied from <code>/api</code> to the ASP.NET Core backend.
      </footer>
    </div>
  );
}
