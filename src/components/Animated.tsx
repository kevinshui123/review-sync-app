import React, { useEffect, useRef, useState } from 'react';

interface AnimateProps {
  children: React.ReactNode;
  in: boolean;
  onEnter?: () => void;
  onExit?: () => void;
  enterClass?: string;
  exitClass?: string;
  className?: string;
  enterStyle?: React.CSSProperties;
  exitStyle?: React.CSSProperties;
  unmountOnExit?: boolean;
}

export function Animated({
  children,
  in: inProp,
  onEnter,
  onExit,
  enterClass = 'animate-fade-in',
  exitClass = 'animate-fade-out',
  className = '',
  enterStyle,
  exitStyle,
  unmountOnExit = true,
}: AnimateProps) {
  const [visible, setVisible] = useState(inProp);
  const [displayed, setDisplayed] = useState(inProp);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (inProp) {
      setDisplayed(true);
      setVisible(true);
      onEnter?.();
    } else {
      setVisible(false);
      onExit?.();
      if (unmountOnExit) {
        timeoutRef.current = setTimeout(() => setDisplayed(false), 300);
      }
    }
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [inProp]);

  if (!displayed) return null;

  const style: React.CSSProperties = inProp
    ? (enterStyle || {})
    : (exitStyle || {});

  const cls = inProp ? enterClass : exitClass;

  return (
    <div className={`${cls} ${className}`} style={style}>
      {children}
    </div>
  );
}
