import { motion } from 'framer-motion';

// TODO: Replace with the real business WhatsApp number (include country code, no + or spaces)
// before going live — e.g. '923001234567' for a Pakistani +92 300 1234567 number.
const WHATSAPP_NUMBER = '923166953534'; // 
const DEFAULT_MESSAGE = "Hi! I have a question about an order from Khan Mobile Shop.";

const WhatsAppButton = () => {
  const href = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(DEFAULT_MESSAGE)}`;

  return (
    <motion.a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with us on WhatsApp"
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ delay: 0.6, type: 'spring', stiffness: 260, damping: 20 }}
      whileHover={{ scale: 1.08 }}
      whileTap={{ scale: 0.95 }}
      className="fixed bottom-6 right-6 z-[55] w-14 h-14 rounded-full bg-[#25D366] shadow-lg flex items-center justify-center"
    >
      <svg width="28" height="28" viewBox="0 0 24 24" fill="white">
        <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38a9.87 9.87 0 0 0 4.74 1.21h.01c5.46 0 9.91-4.45 9.91-9.91C21.96 6.45 17.51 2 12.05 2h-.01zm5.83 14.02c-.24.68-1.4 1.32-1.93 1.4-.51.08-1.15.11-1.86-.12a17 17 0 0 1-1.7-.63c-3-1.3-4.96-4.33-5.11-4.53-.15-.2-1.22-1.62-1.22-3.1s.77-2.2 1.05-2.5c.27-.3.6-.37.8-.37.2 0 .4 0 .58.01.19.01.44-.07.68.53.25.6.85 2.08.92 2.23.08.15.13.32.02.52-.1.2-.15.32-.3.5-.15.17-.31.39-.45.52-.15.15-.3.31-.13.6.17.3.76 1.26 1.64 2.04 1.13 1 2.08 1.32 2.38 1.47.3.15.47.13.65-.07.17-.2.73-.85.92-1.14.2-.3.4-.24.66-.14.28.1 1.75.83 2.05.98.3.15.5.22.57.35.08.13.08.75-.16 1.44z"/>
      </svg>
    </motion.a>
  );
};

export default WhatsAppButton;
