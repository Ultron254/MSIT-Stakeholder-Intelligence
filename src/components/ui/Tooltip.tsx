import { useState, useRef, useEffect, cloneElement, isValidElement } from 'react';
import type { ReactElement, ReactNode, CSSProperties } from 'react';

type Side = 'top' | 'bottom' | 'left' | 'right';

interface TooltipProps {
  /** Tooltip text or React node */
  content: ReactNode;
  /** Optional keyboard shortcut shown as a kbd badge */
  shortcut?: string;
  /** Preferred side; the tooltip auto-flips if not enough room */
  side?: Side;
  /** Delay (ms) before showing on hover */
  delay?: number;
  /** Children must be a single element that accepts ref/event handlers */
  children: ReactElement;
  /** Disable tooltip entirely */
  disabled?: boolean;
}

/**
 * Lightweight, accessible, brand-styled tooltip.
 *
 * Wraps a single child element and renders a positioned tooltip on hover or
 * keyboard focus. Auto-flips to stay within the viewport. Pure portal-free
 * implementation (uses fixed positioning) — safe with overflow:hidden parents.
 *
 * Usage:
 *   <Tooltip content="Search stakeholders" shortcut="⌘K">
 *     <button>...</button>
 *   </Tooltip>
 */
export default function Tooltip({
  content,
  shortcut,
  side = 'top',
  delay = 250,
  children,
  disabled,
}: TooltipProps) {
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState<{ top: number; left: number; placement: Side } | null>(null);
  const triggerRef = useRef<HTMLElement | null>(null);
  const tipRef = useRef<HTMLDivElement | null>(null);
  const timerRef = useRef<number | null>(null);

  const clearTimer = () => {
    if (timerRef.current) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  const show = () => {
    if (disabled) return;
    clearTimer();
    timerRef.current = window.setTimeout(() => setOpen(true), delay);
  };

  const hide = () => {
    clearTimer();
    setOpen(false);
  };

  // Compute position once tooltip is rendered
  useEffect(() => {
    if (!open || !triggerRef.current || !tipRef.current) return;
    const tr = triggerRef.current.getBoundingClientRect();
    const tipEl = tipRef.current;
    const tw = tipEl.offsetWidth;
    const th = tipEl.offsetHeight;
    const margin = 8;
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    const positions: Record<Side, { top: number; left: number }> = {
      top:    { top: tr.top - th - margin,             left: tr.left + tr.width / 2 - tw / 2 },
      bottom: { top: tr.bottom + margin,               left: tr.left + tr.width / 2 - tw / 2 },
      left:   { top: tr.top + tr.height / 2 - th / 2,  left: tr.left - tw - margin },
      right:  { top: tr.top + tr.height / 2 - th / 2,  left: tr.right + margin },
    };

    // Auto-flip if no room
    let placement: Side = side;
    const fits = (s: Side) => {
      const p = positions[s];
      return p.top >= 4 && p.left >= 4 && p.top + th <= vh - 4 && p.left + tw <= vw - 4;
    };
    if (!fits(side)) {
      const opposite: Record<Side, Side> = { top: 'bottom', bottom: 'top', left: 'right', right: 'left' };
      if (fits(opposite[side])) placement = opposite[side];
      else if (fits('top')) placement = 'top';
      else if (fits('bottom')) placement = 'bottom';
    }

    let { top, left } = positions[placement];
    // Clamp to viewport with 4px padding
    left = Math.max(4, Math.min(vw - tw - 4, left));
    top = Math.max(4, Math.min(vh - th - 4, top));
    setCoords({ top, left, placement });
  }, [open, side]);

  // Hide on scroll/resize
  useEffect(() => {
    if (!open) return;
    const onChange = () => setOpen(false);
    window.addEventListener('scroll', onChange, true);
    window.addEventListener('resize', onChange);
    return () => {
      window.removeEventListener('scroll', onChange, true);
      window.removeEventListener('resize', onChange);
    };
  }, [open]);

  useEffect(() => () => clearTimer(), []);

  if (!isValidElement(children)) return children as unknown as ReactElement;

  // Augment child with our event handlers + ref
  const childProps = (children.props ?? {}) as {
    onMouseEnter?: (e: React.MouseEvent) => void;
    onMouseLeave?: (e: React.MouseEvent) => void;
    onFocus?: (e: React.FocusEvent) => void;
    onBlur?: (e: React.FocusEvent) => void;
    ref?: React.Ref<HTMLElement>;
  };

  const enhanced = cloneElement(children, {
    ref: (node: HTMLElement) => {
      triggerRef.current = node;
      const childRef = childProps.ref;
      if (typeof childRef === 'function') childRef(node);
      else if (childRef && typeof childRef === 'object') {
        (childRef as React.MutableRefObject<HTMLElement | null>).current = node;
      }
    },
    onMouseEnter: (e: React.MouseEvent) => { show(); childProps.onMouseEnter?.(e); },
    onMouseLeave: (e: React.MouseEvent) => { hide(); childProps.onMouseLeave?.(e); },
    onFocus: (e: React.FocusEvent) => { show(); childProps.onFocus?.(e); },
    onBlur: (e: React.FocusEvent) => { hide(); childProps.onBlur?.(e); },
  } as Record<string, unknown>);

  const tipStyle: CSSProperties = coords
    ? { top: coords.top, left: coords.left, opacity: 1 }
    : { top: -9999, left: -9999, opacity: 0 };

  return (
    <>
      {enhanced}
      {open && (
        <div
          ref={tipRef}
          role="tooltip"
          className="tooltip-bubble"
          style={{
            position: 'fixed',
            zIndex: 9999,
            pointerEvents: 'none',
            ...tipStyle,
          }}
        >
          <div
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md whitespace-nowrap"
            style={{
              background: '#0F1E29',
              color: '#FFFFFF',
              fontSize: '0.75rem',
              fontWeight: 500,
              lineHeight: 1.3,
              boxShadow: '0 8px 24px rgba(15,30,41,0.25), 0 2px 4px rgba(15,30,41,0.1)',
              border: '1px solid rgba(45, 166, 126, 0.25)',
              maxWidth: 280,
            }}
          >
            <span style={{ whiteSpace: 'normal' }}>{content}</span>
            {shortcut && (
              <kbd
                style={{
                  background: 'rgba(255,255,255,0.12)',
                  color: 'rgba(255,255,255,0.85)',
                  padding: '1px 5px',
                  borderRadius: 3,
                  fontSize: '0.625rem',
                  fontWeight: 600,
                  fontFamily: 'inherit',
                  border: '1px solid rgba(255,255,255,0.15)',
                }}
              >
                {shortcut}
              </kbd>
            )}
          </div>
        </div>
      )}
    </>
  );
}
