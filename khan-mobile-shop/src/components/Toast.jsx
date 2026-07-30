import { AnimatePresence, motion } from 'framer-motion';
import { useCart } from '../context/CartContext';

const Toast = () => {
  const { toast } = useCart();

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] pointer-events-none px-4 w-full flex justify-center">
      <AnimatePresence>
        {toast && (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
            className="bg-slate-900 border border-accent/40 text-white text-sm font-medium px-5 py-3 rounded-xl2 shadow-glow flex items-center gap-2"
          >
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="#22C55E" strokeWidth={2.5} className="shrink-0">
              <circle cx="12" cy="12" r="10" />
              <path strokeLinecap="round" strokeLinejoin="round" d="m8 12 3 3 5-6" />
            </svg>
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Toast;
