import { Helmet } from 'react-helmet-async';
import PropTypes from 'prop-types';

const SITE_NAME = 'Khan Mobile Shop';
const SITE_URL = 'https://khanmobile.pk'; // TODO: update to your real domain once deployed
const DEFAULT_IMAGE = `${SITE_URL}/og-default.png`;

// Centralizes per-page <title>/meta so every route gets a real, distinct
// title and description for search engines and link previews, instead of
// every page sharing the one static title from index.html.
const SEO = ({ title, description, path = '', image, noindex = false }) => {
  const fullTitle = title ? `${title} | ${SITE_NAME}` : `${SITE_NAME} — Premium Mobile Accessories`;
  const url = `${SITE_URL}${path}`;
  const ogImage = image || DEFAULT_IMAGE;

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={url} />
      {noindex && <meta name="robots" content="noindex, nofollow" />}

      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={url} />
      <meta property="og:image" content={ogImage} />

      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />
    </Helmet>
  );
};

SEO.propTypes = {
  title: PropTypes.string,
  description: PropTypes.string.isRequired,
  path: PropTypes.string,
  image: PropTypes.string,
  noindex: PropTypes.bool,
};

export default SEO;
