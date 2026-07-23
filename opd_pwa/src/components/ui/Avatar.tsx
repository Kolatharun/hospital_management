import React from 'react';
import { clsx } from 'clsx';
import { User } from 'lucide-react';

export interface AvatarProps {
  src?: string;
  name?: string;
  size?: 'small' | 'medium' | 'large';
  className?: string;
}

export const Avatar: React.FC<AvatarProps> = ({ src, name, size = 'medium', className }) => {
  const sizes = {
    small: 'w-8 h-8 text-xs',
    medium: 'w-12 h-12 text-sm',
    large: 'w-16 h-16 text-lg',
  };

  const getInitials = (n?: string) => {
    if (!n) return '';
    const parts = n.split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return n.slice(0, 2).toUpperCase();
  };

  return (
    <div
      className={clsx(
        'relative rounded-full overflow-hidden flex items-center justify-center bg-[#DFF3F5] text-[#0B6875] font-bold border border-[#0B6875]/20 shrink-0',
        sizes[size],
        className
      )}
    >
      {src ? (
        <img src={src} alt={name || 'Avatar'} className="w-full h-full object-cover" />
      ) : name ? (
        <span>{getInitials(name)}</span>
      ) : (
        <User className="w-1/2 h-1/2" />
      )}
    </div>
  );
};
