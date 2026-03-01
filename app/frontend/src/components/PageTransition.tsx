import React, { Children } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
interface PageTransitionProps {
  children: React.ReactNode;
  pageKey: string;
}
const pageVariants = {
  initial: {
    opacity: 0,
    y: 12
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.28,
      ease: [0.25, 0.46, 0.45, 0.94]
    }
  },
  exit: {
    opacity: 0,
    y: -8,
    transition: {
      duration: 0.18,
      ease: 'easeIn'
    }
  }
};
export function PageTransition({ children, pageKey }: PageTransitionProps) {
  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={pageKey}
        variants={pageVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        style={{
          width: '100%'
        }}>

        {children}
      </motion.div>
    </AnimatePresence>);

}
// Staggered children animation container
export const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.07,
      delayChildren: 0.05
    }
  }
};
export const fadeInUp = {
  initial: {
    opacity: 0,
    y: 16
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.35,
      ease: [0.25, 0.46, 0.45, 0.94]
    }
  }
};
export const fadeIn = {
  initial: {
    opacity: 0
  },
  animate: {
    opacity: 1,
    transition: {
      duration: 0.3
    }
  }
};