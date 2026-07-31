"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
} from "react";

/**
 * Drag-to-reorder for a grid/list, built on Pointer Events.
 *
 * The HTML5 drag-and-drop API (`draggable` + `dragstart`/`drop`) this replaces
 * is mouse-only — iOS Safari and Android Chrome never fire those events, so
 * reordering was impossible on phones and iPads. Pointer Events cover mouse,
 * touch and pen with one code path.
 *
 * Touch needs a long press to start a drag, otherwise every attempt to scroll
 * the page over the grid would pick an item up instead. Mouse starts as soon as
 * the cursor moves past a small threshold, so it still feels immediate.
 */

/** How long a finger must stay put before a drag begins (mouse skips this). */
const TOUCH_HOLD_MS = 220;
/** Movement before the hold completes = the user is scrolling, not dragging. */
const TOUCH_CANCEL_SLOP_PX = 10;
/** Mouse has to travel this far before a drag starts, so plain clicks survive. */
const MOUSE_START_THRESHOLD_PX = 4;
/** Distance from a scroll container's edge that triggers auto-scroll. */
const EDGE_SCROLL_ZONE_PX = 56;
const EDGE_SCROLL_SPEED_PX = 10;
/**
 * Auto-scroll also requires the pointer to have travelled this far *towards*
 * the edge it is near. Items in the last visible row start inside the bottom
 * edge zone, so without this a plain sideways drag from one of them would run
 * the list away under the cursor the instant it was picked up.
 */
const EDGE_SCROLL_INTENT_PX = 8;

/** Controls inside an item (cover, remove, arrows) must keep working normally. */
const INTERACTIVE_SELECTOR = "button, a, input, select, textarea, [role='button']";

function findScrollParent(element: HTMLElement | null): HTMLElement | null {
  let node = element?.parentElement ?? null;
  while (node) {
    const { overflowY } = getComputedStyle(node);
    if ((overflowY === "auto" || overflowY === "scroll") && node.scrollHeight > node.clientHeight) {
      return node;
    }
    node = node.parentElement;
  }
  return null;
}

type UseDragReorderOptions = {
  /** Commit a move. Not called when the item is dropped back where it started. */
  onReorder: (from: number, to: number) => void;
  disabled?: boolean;
};

export function useDragReorder({ onReorder, disabled = false }: UseDragReorderOptions) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);

  // Everything the in-flight gesture needs, kept in a ref so the document
  // listeners below never go stale between renders.
  const gesture = useRef<{
    pointerId: number;
    from: number;
    startX: number;
    startY: number;
    active: boolean;
    holdTimer: ReturnType<typeof setTimeout> | null;
  } | null>(null);
  const overIndexRef = useRef<number | null>(null);
  const autoScrollFrame = useRef<number | null>(null);
  const autoScrollStep = useRef(0);
  /** Last pointer position, so auto-scroll can re-test what's under it. */
  const lastPoint = useRef({ x: 0, y: 0 });

  const onReorderRef = useRef(onReorder);
  useEffect(() => {
    onReorderRef.current = onReorder;
  }, [onReorder]);

  const stopAutoScroll = useCallback(() => {
    if (autoScrollFrame.current !== null) cancelAnimationFrame(autoScrollFrame.current);
    autoScrollFrame.current = null;
    autoScrollStep.current = 0;
  }, []);

  const reset = useCallback(() => {
    if (gesture.current?.holdTimer) clearTimeout(gesture.current.holdTimer);
    gesture.current = null;
    overIndexRef.current = null;
    stopAutoScroll();
    setDragIndex(null);
    setOverIndex(null);
  }, [stopAutoScroll]);

  /** Which item sits under the pointer — only within this hook's own container. */
  const indexAtPoint = useCallback((clientX: number, clientY: number): number | null => {
    const container = containerRef.current;
    if (!container) return null;
    const element = document.elementFromPoint(clientX, clientY);
    const item = element?.closest<HTMLElement>("[data-drag-index]");
    if (!item || !container.contains(item)) return null;
    const parsed = Number(item.dataset.dragIndex);
    return Number.isNaN(parsed) ? null : parsed;
  }, []);

  const startAutoScroll = useCallback(() => {
    if (autoScrollFrame.current !== null) return;

    function tick() {
      const step = autoScrollStep.current;
      if (step === 0) {
        autoScrollFrame.current = null;
        return;
      }
      const scroller = findScrollParent(containerRef.current);
      if (scroller) scroller.scrollTop += step;
      else window.scrollBy(0, step);

      // The list is moving under a stationary pointer, so the hovered item
      // changes with no pointermove to announce it. Re-test every frame, or a
      // drop would land on whatever sat under the finger before the scroll.
      const hovered = indexAtPoint(lastPoint.current.x, lastPoint.current.y);
      if (hovered !== null && hovered !== overIndexRef.current) {
        overIndexRef.current = hovered;
        setOverIndex(hovered);
      }

      autoScrollFrame.current = requestAnimationFrame(tick);
    }

    autoScrollFrame.current = requestAnimationFrame(tick);
  }, [indexAtPoint]);

  const updateAutoScroll = useCallback(
    (clientY: number, startY: number) => {
      const scroller = findScrollParent(containerRef.current);
      const bounds = scroller
        ? scroller.getBoundingClientRect()
        : ({ top: 0, bottom: window.innerHeight } as DOMRect);

      const draggedUp = clientY < startY - EDGE_SCROLL_INTENT_PX;
      const draggedDown = clientY > startY + EDGE_SCROLL_INTENT_PX;

      if (draggedUp && clientY < bounds.top + EDGE_SCROLL_ZONE_PX) {
        autoScrollStep.current = -EDGE_SCROLL_SPEED_PX;
      } else if (draggedDown && clientY > bounds.bottom - EDGE_SCROLL_ZONE_PX) {
        autoScrollStep.current = EDGE_SCROLL_SPEED_PX;
      } else {
        autoScrollStep.current = 0;
      }

      if (autoScrollStep.current !== 0) startAutoScroll();
    },
    [startAutoScroll],
  );

  // Document-level listeners live for as long as a gesture is pending or
  // active, so the drag survives the pointer leaving the item it started on.
  useEffect(() => {
    if (disabled) return;

    function activate(index: number) {
      const current = gesture.current;
      if (!current || current.active) return;
      current.active = true;
      overIndexRef.current = index;
      setDragIndex(index);
      setOverIndex(index);
    }

    function handleMove(event: PointerEvent) {
      const current = gesture.current;
      if (!current || event.pointerId !== current.pointerId) return;
      lastPoint.current = { x: event.clientX, y: event.clientY };

      const dx = Math.abs(event.clientX - current.startX);
      const dy = Math.abs(event.clientY - current.startY);

      if (!current.active) {
        if (current.holdTimer) {
          // Waiting on a long press: real movement means the user is scrolling.
          if (Math.hypot(dx, dy) > TOUCH_CANCEL_SLOP_PX) reset();
          return;
        }
        // Mouse (no hold timer): start once the cursor has actually travelled.
        if (Math.hypot(dx, dy) < MOUSE_START_THRESHOLD_PX) return;
        activate(current.from);
      }

      const target = indexAtPoint(event.clientX, event.clientY);
      if (target !== null && target !== overIndexRef.current) {
        overIndexRef.current = target;
        setOverIndex(target);
      }
      updateAutoScroll(event.clientY, current.startY);
    }

    function handleUp(event: PointerEvent) {
      const current = gesture.current;
      if (!current || event.pointerId !== current.pointerId) return;
      const { from, active } = current;
      const to = overIndexRef.current;
      reset();
      if (active && to !== null && to !== from) onReorderRef.current(from, to);
    }

    function handleCancel(event: PointerEvent) {
      if (gesture.current && event.pointerId === gesture.current.pointerId) reset();
    }

    // iOS Safari keeps scrolling the page mid-drag unless the touch stream is
    // cancelled outright; this listener must be non-passive to be allowed to.
    function blockTouchScroll(event: TouchEvent) {
      if (gesture.current?.active) event.preventDefault();
    }

    document.addEventListener("pointermove", handleMove);
    document.addEventListener("pointerup", handleUp);
    document.addEventListener("pointercancel", handleCancel);
    document.addEventListener("touchmove", blockTouchScroll, { passive: false });
    return () => {
      document.removeEventListener("pointermove", handleMove);
      document.removeEventListener("pointerup", handleUp);
      document.removeEventListener("pointercancel", handleCancel);
      document.removeEventListener("touchmove", blockTouchScroll);
    };
  }, [disabled, indexAtPoint, reset, updateAutoScroll]);

  useEffect(() => reset, [reset]);

  const handlePointerDown = useCallback(
    (index: number) => (event: ReactPointerEvent<HTMLElement>) => {
      if (disabled || event.button !== 0) return;
      if ((event.target as HTMLElement).closest(INTERACTIVE_SELECTOR)) return;

      const isTouch = event.pointerType !== "mouse";
      lastPoint.current = { x: event.clientX, y: event.clientY };
      gesture.current = {
        pointerId: event.pointerId,
        from: index,
        startX: event.clientX,
        startY: event.clientY,
        active: false,
        holdTimer: null,
      };

      if (isTouch) {
        gesture.current.holdTimer = setTimeout(() => {
          const current = gesture.current;
          if (!current) return;
          current.holdTimer = null;
          current.active = true;
          overIndexRef.current = index;
          setDragIndex(index);
          setOverIndex(index);
        }, TOUCH_HOLD_MS);
      }
    },
    [disabled],
  );

  /** Spread onto every draggable item. */
  const getItemProps = useCallback(
    (index: number) => ({
      "data-drag-index": index,
      onPointerDown: handlePointerDown(index),
      // A long press on an image otherwise pops iOS's save-image callout.
      onContextMenu: (event: ReactMouseEvent) => {
        if (gesture.current) event.preventDefault();
      },
      style: {
        touchAction: "manipulation",
        WebkitTouchCallout: "none",
        WebkitUserSelect: "none",
        userSelect: "none",
      } as CSSProperties,
    }),
    [handlePointerDown],
  );

  return {
    containerRef,
    getItemProps,
    /** Index being dragged, or null. */
    dragIndex,
    /** Index the dragged item would land on, or null. */
    overIndex,
    isDragging: dragIndex !== null,
  };
}
