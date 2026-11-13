import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';
import { cn } from '@/utils/cn';
import { motionVariants } from '@/design-system/motion';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
}

const maxWidthMap = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  '2xl': 'max-w-2xl',
};

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  className,
  maxWidth = 'md',
}) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Close on ESC key and lock body scroll
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  const modalNode = (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          {/* Backdrop */}
          <motion.div
            variants={motionVariants.modalBackdrop}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={onClose}
            className="fixed inset-0 bg-forest/60 dark:bg-black/80 backdrop-blur-md z-0"
          />

          {/* Dialog Container */}
          <motion.div
            variants={motionVariants.modalContent}
            initial="hidden"
            animate="visible"
            exit="exit"
            role="dialog"
            aria-modal="true"
            className={cn(
              'relative w-full rounded-2xl bg-white dark:bg-[#0A1E17] text-forest dark:text-white p-6 sm:p-8 shadow-2xl border border-forest/15 dark:border-white/15 z-10 max-h-[90vh] overflow-y-auto my-auto',
              maxWidthMap[maxWidth],
              className
            )}
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-4 mb-4 pb-3 border-b border-forest/10 dark:border-white/10">
              <div>
                {title && (
                  <h3 className="font-heading font-bold text-xl text-forest dark:text-white">
                    {title}
                  </h3>
                )}
                {description && (
                  <p className="text-sm text-forest/70 dark:text-ivory/70 mt-1">
                    {description}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close dialog"
                className="w-8 h-8 rounded-full flex items-center justify-center text-forest/60 dark:text-ivory/60 hover:text-forest dark:hover:text-white hover:bg-forest/5 dark:hover:bg-white/10 transition-colors shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content Slot */}
            <div>{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );

  if (!mounted || typeof document === 'undefined') {
    return null;
  }

  return createPortal(modalNode, document.body);
};
