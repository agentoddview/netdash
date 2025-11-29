import React, { useState } from "react";
import blank from "../assets/blank.svg";

interface AvatarProps {
  src: string;
  alt: string;
  className?: string;
  style?: React.CSSProperties;
}

export const Avatar: React.FC<AvatarProps> = ({ src, alt, className, style }) => {
  const [error, setError] = useState(false);

  return (
    <img
      src={error ? blank : src}
      alt={alt}
      className={className}
      onError={() => setError(true)}
      referrerPolicy="no-referrer"
      style={style}
    />
  );
};

export default Avatar;
