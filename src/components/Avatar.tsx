import React, { useEffect, useState } from "react";
import blank from "../assets/blank.svg";

interface Props {
  src?: string | null;
  alt: string;
  className?: string;
  style?: React.CSSProperties;
}

export const Avatar: React.FC<Props> = ({ src, alt, className, style }) => {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [src]);

  const actualSrc = !src || failed ? blank : src;

  return (
    <img
      src={actualSrc}
      alt={alt}
      className={className}
      style={style}
      onError={() => {
        if (src) {
          setFailed(true);
        }
      }}
      referrerPolicy="no-referrer"
    />
  );
};

export default Avatar;
