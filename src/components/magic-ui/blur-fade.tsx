'use client';

import { motion, type Variants } from 'framer-motion';
import { cn } from '@/lib/utils';

const defaultVariants: Variants = {
  hidden: { opacity: 0, y: 8, filter: 'blur(6px)' },
  visible: { opacity: 1, y: 0, filter: 'blur(0px)' },
};

export function BlurFade({
  children,
  className,
  delay = 0,
  duration = 0.45,
  inView = true,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  duration?: number;
  inView?: boolean;
}) {
  return (
    <motion.div
      className={cn(className)}
      initial="hidden"
      animate={inView ? 'visible' : undefined}
      whileInView={inView ? undefined : 'visible'}
      viewport={{ once: true, margin: '-40px' }}
      variants={defaultVariants}
      transition={{ duration, delay, ease: [0.21, 0.47, 0.32, 0.98] }}
    >
      {children}
    </motion.div>
  );
}
