"use client";

import { motion, type Variants } from "framer-motion";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type RevealDirection = "up" | "down" | "left" | "right" | "none";

interface RevealProps {
  children: ReactNode;
  className?: string;
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
   * Wrap each child in <Reveal.Item> when using this.
   */
  stagger?: number;
  /** Portion of the element that must be visible to trigger the reveal (0-1). */
  amount?: number;
  as?: "div" | "section";
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
  direction = "up",
  distance = 30,
  delay = 0,
  duration = 0.6,
  stagger,
  amount = 0.2,
  as = "div",
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
    hidden: { opacity: 0, ...offsetFor(direction, distance) },
    visible: {
      opacity: 1,
      x: 0,
      y: 0,
      transition: { duration, delay: stagger ? 0 : delay, ease: "easeOut" },
    },
  };

  const Component = as === "section" ? motion.section : motion.div;

  return (
    <Component
      className={cn(className)}
      variants={stagger ? container : item}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount }}
    >
      {children}
    </Component>
  );
}

Reveal.Item = function RevealItem({
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
};
