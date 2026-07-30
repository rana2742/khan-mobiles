import { Navigate, useLocation } from 'react-router-dom';
import PropTypes from 'prop-types';
import { useAuth } from '../context/AuthContext';

// Requires a logged-in user. Unauthenticated visitors are bounced to /login
// with a `redirect` query param so they land back where they started.
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) return null; // avoid a flash-redirect while /me is still resolving

  if (!isAuthenticated) {
    const redirect = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?redirect=${redirect}`} replace />;
  }

  return children;
};

ProtectedRoute.propTypes = { children: PropTypes.node.isRequired };

export default ProtectedRoute;
