"use client";

import { motion, type Variants } from "framer-motion";
import type { CSSProperties, ReactNode } from "react";

import { cn } from "@/lib/utils";

type RevealDirection = "up" | "down" | "left" | "right" | "none";

interface RevealProps {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  /** Direction the content travels in from. */
  direction?: RevealDirection;
  /** Distance (px) traveled during the reveal. */
  distance?: number;
  /** Seconds before this element's animation starts. */
  delay?: number;
  /** Animation duration in seconds. */
  duration?: number;
  /**
   * When set, children are staggered instead of animating together.
   * Wrap each child in <RevealItem> when using this.
   */
  stagger?: number;
  /** Portion of the element that must be visible to trigger the reveal (0-1). */
  amount?: number;
  as?: "div" | "section";
  /** Starting scale before the reveal (e.g. 1.15 for a scale-down-in image effect). */
  scale?: number;
}

const offsetFor = (direction: RevealDirection, distance: number) => {
  switch (direction) {
    case "up":
      return { y: distance };
    case "down":
      return { y: -distance };
    case "left":
      return { x: distance };
    case "right":
      return { x: -distance };
    default:
      return {};
  }
};

export function Reveal({
  children,
  className,
  style,
  direction = "up",
  distance = 30,
  delay = 0,
  duration = 0.6,
  stagger,
  amount = 0.2,
  as = "div",
  scale,
}: RevealProps) {
  const container: Variants = {
    hidden: {},
    visible: {
      transition: stagger
        ? { staggerChildren: stagger, delayChildren: delay }
        : {},
    },
  };

  const item: Variants = {
    hidden: { opacity: 0, ...offsetFor(direction, distance), ...(scale ? { scale } : {}) },
    visible: {
      opacity: 1,
      x: 0,
      y: 0,
      ...(scale ? { scale: 1 } : {}),
      transition: { duration, delay: stagger ? 0 : delay, ease: "easeOut" },
    },
  };

  const Component = as === "section" ? motion.section : motion.div;

  return (
    <Component
      className={cn(className)}
      style={style}
      variants={stagger ? container : item}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount }}
    >
      {children}
    </Component>
  );
}

export function RevealItem({
  children,
  className,
  direction = "up",
  distance = 30,
  duration = 0.6,
}: Pick<RevealProps, "children" | "className" | "direction" | "distance" | "duration">) {
  const item: Variants = {
    hidden: { opacity: 0, ...offsetFor(direction, distance) },
    visible: { opacity: 1, x: 0, y: 0, transition: { duration, ease: "easeOut" } },
  };

  return (
    <motion.div className={cn(className)} variants={item}>
      {children}
    </motion.div>
  );
}
