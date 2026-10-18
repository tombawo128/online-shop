import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <main className="center-empty-screen notfound-page">
      <div className="notfound-card">
        <span className="notfound-code">404</span>
        <h1 className="notfound-title">Page Not Found</h1>
        <p className="notfound-text">
          The page you are looking for does not exist.
        </p>
        <div className="notfound-links">
          <Link to="/" className="btn btn-primary">
            Return to Homepage
          </Link>
          <Link to="/shop" className="btn btn-outline">
            Shop Clothes
          </Link>
        </div>
      </div>
    </main>
  );
}
