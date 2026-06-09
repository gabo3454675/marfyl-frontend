'use client';

import {
  motion,
  useReducedMotion,
  type HTMLMotionProps,
  type Variants,
} from 'framer-motion';
import { cn } from '@/lib/utils';

const EASE = [0.22, 1, 0.36, 1] as const;

const REVEAL_VARIANTS = {
  'fade-up': {
    hidden: { opacity: 0, y: 28 },
    visible: { opacity: 1, y: 0 },
  },
  fade: {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
  },
  'blur-up': {
    hidden: { opacity: 0, y: 20, filter: 'blur(8px)' },
    visible: { opacity: 1, y: 0, filter: 'blur(0px)' },
  },
  scale: {
    hidden: { opacity: 0, scale: 0.94 },
    visible: { opacity: 1, scale: 1 },
  },
  'slide-left': {
    hidden: { opacity: 0, x: 36 },
    visible: { opacity: 1, x: 0 },
  },
  'slide-right': {
    hidden: { opacity: 0, x: -36 },
    visible: { opacity: 1, x: 0 },
  },
} satisfies Record<string, Variants>;

export type MarketingRevealVariant = keyof typeof REVEAL_VARIANTS;

type MarketingRevealProps = {
  children: React.ReactNode;
  className?: string;
  variant?: MarketingRevealVariant;
  delay?: number;
  duration?: number;
  /** Si true, anima al montar (hero) en lugar de al hacer scroll. */
  onMount?: boolean;
} & Pick<HTMLMotionProps<'div'>, 'id'>;

export function MarketingReveal({
  children,
  className,
  variant = 'fade-up',
  delay = 0,
  duration = 0.55,
  onMount = false,
  id,
}: MarketingRevealProps) {
  const reduce = useReducedMotion();

  if (reduce) {
    return (
      <div id={id} className={className}>
        {children}
      </div>
    );
  }

  return (
    <motion.div
      id={id}
      className={cn(className)}
      initial="hidden"
      {...(onMount
        ? { animate: 'visible' }
        : {
            whileInView: 'visible',
            viewport: { once: true, amount: 0.18, margin: '-48px 0px' },
          })}
      variants={REVEAL_VARIANTS[variant]}
      transition={{ duration, delay, ease: EASE }}
    >
      {children}
    </motion.div>
  );
}

const STAGGER_CONTAINER: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.04 },
  },
};

const STAGGER_ITEM: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: EASE },
  },
};

type MarketingStaggerProps = {
  children: React.ReactNode;
  className?: string;
  onMount?: boolean;
  stagger?: number;
};

export function MarketingStagger({
  children,
  className,
  onMount = false,
  stagger = 0.1,
}: MarketingStaggerProps) {
  const reduce = useReducedMotion();

  if (reduce) {
    return <div className={className}>{children}</div>;
  }

  const containerVariants: Variants = {
    ...STAGGER_CONTAINER,
    visible: {
      opacity: 1,
      transition: { staggerChildren: stagger, delayChildren: 0.04 },
    },
  };

  return (
    <motion.div
      className={cn(className)}
      initial="hidden"
      {...(onMount
        ? { animate: 'visible' }
        : {
            whileInView: 'visible',
            viewport: { once: true, amount: 0.12, margin: '-40px 0px' },
          })}
      variants={containerVariants}
    >
      {children}
    </motion.div>
  );
}

export function MarketingStaggerItem({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const reduce = useReducedMotion();

  if (reduce) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div className={cn(className)} variants={STAGGER_ITEM}>
      {children}
    </motion.div>
  );
}
