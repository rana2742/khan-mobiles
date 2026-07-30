import { Navigate } from 'react-router-dom';
import PropTypes from 'prop-types';
import { useAuth } from '../context/AuthContext';

// Requires a logged-in admin. Non-admins are sent home; logged-out visitors
// go to /login first.
const AdminRoute = ({ children }) => {
  const { isAuthenticated, isAdmin, loading } = useAuth();

  if (loading) return null;
  if (!isAuthenticated) return <Navigate to="/login?redirect=/admin" replace />;
  if (!isAdmin) return <Navigate to="/" replace />;

  return children;
};

AdminRoute.propTypes = { children: PropTypes.node.isRequired };

export default AdminRoute;
