import React from 'react';
import { Github } from 'lucide-react';
import { motion } from 'framer-motion';

export const Footer: React.FC = () => {
  return (
    <motion.footer 
      className="app-footer"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.2 }}
    >
      <div className="footer-content">
        <motion.a
          href="https://github.com/JoeBuydemDips/financier"
          target="_blank"
          rel="noopener noreferrer"
          className="footer-link"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          aria-label="View source code on GitHub"
        >
          <Github size={18} />
          <span>View on GitHub</span>
        </motion.a>
        <div className="footer-divider">•</div>
        <span className="footer-text">
          Built with ❤️ for investors
        </span>
      </div>
    </motion.footer>
  );
};
