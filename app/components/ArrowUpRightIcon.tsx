"use client";

import { motion } from "framer-motion";

interface ArrowUpRightIconProps {
  size?: number;
  className?: string;
  animate?: boolean;
}

export function ArrowUpRightIcon({ size = 28, className, animate = true }: ArrowUpRightIconProps) {
  return (
    <div className={className}>
      <svg
        fill="none"
        height={size}
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        viewBox="0 0 24 24"
        width={size}
        xmlns="http://www.w3.org/2000/svg"
      >
        <motion.g
          animate={animate ? {
            scale: [1, 0.85, 1],
            translateX: [0, -3, 0],
            translateY: [0, 3, 0],
          } : undefined}
          transition={animate ? {
            duration: 1.2,
            ease: "easeInOut",
            repeat: Infinity,
            repeatDelay: 1,
          } : undefined}
        >
          <path d="M7 7H17" />
          <path d="M17 7V17" />
          <path d="M7 17L17 7" />
        </motion.g>
      </svg>
    </div>
  );
}
