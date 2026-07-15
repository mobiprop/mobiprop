"use client";

import { motion, type Variants } from "framer-motion";
import { Fragment, type CSSProperties, type ElementType } from "react";

import { cn } from "@/lib/utils";

interface SplitHeadingProps {
  text: string;
  className?: string;
  style?: CSSProperties;
  /** Per-character stagger looks better on short headings; word-level suits longer copy. */
  splitBy?: "char" | "word";
  /** Element the heading itself renders as (h1, h2, p, ...). Defaults to span. */
  as?: ElementType;
  delay?: number;
  amount?: number;
}

const container = (staggerChildren: number, delayChildren: number): Variants => ({
  hidden: {},
  visible: { transition: { staggerChildren, delayChildren } },
});

const piece: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
};

export function SplitHeading({
  text,
  className,
  style,
  splitBy = "word",
  as: Tag = "span",
  delay = 0,
  amount = 0.8,
}: SplitHeadingProps) {
  const pieces = splitBy === "char" ? Array.from(text) : text.split(" ");
  const staggerChildren = splitBy === "char" ? 0.02 : 0.06;

  return (
    <Tag className={cn(className)} style={style} aria-label={text}>
      <motion.span
        className="inline-block"
        variants={container(staggerChildren, delay)}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount }}
      >
        {pieces.map((chunk, index) => (
          <Fragment key={`${chunk}-${index}`}>
            <motion.span className="inline-block" variants={piece} aria-hidden>
              {chunk}
            </motion.span>
            {splitBy === "word" && index < pieces.length - 1 ? " " : ""}
          </Fragment>
        ))}
      </motion.span>
    </Tag>
  );
}
