import { Link } from 'react-router-dom';
import Container from '../components/Container';
import Button from '../components/Button';

/**
 * NotFound — 404 stub rendered for undefined routes.
 */
const NotFound = () => {
  return (
    <main className="min-h-screen flex items-center justify-center">
      <Container>
        <div className="text-center" data-aos="fade-up">
          <p className="text-accent text-8xl font-extrabold mb-4">404</p>
          <h1 className="text-3xl font-bold mb-4">Page Not Found</h1>
          <p className="text-slate-500 mb-8">
            The page you&apos;re looking for doesn&apos;t exist or has been moved.
          </p>
          <Link to="/">
            <Button>Back to Home</Button>
          </Link>
        </div>
      </Container>
    </main>
  );
};

export default NotFound;
