import { getPortraitUrl, getInitials } from '../../lib/avatar';

interface PortraitProps {
  name: string;
  gender?: 'female' | 'male';
  portraitUrl?: string | null;
  size?: number;
  className?: string;
}

export default function Portrait({ name, gender, portraitUrl, size = 32, className = '' }: PortraitProps) {
  const src = getPortraitUrl(name, gender, portraitUrl);
  const initials = getInitials(name);

  return (
    <div
      className={`relative rounded-full overflow-hidden shrink-0 ${className}`}
      style={{
        width: size,
        height: size,
        background: 'var(--brand-primary-bg)',
      }}
    >
      <img
        src={src}
        alt={name}
        loading="lazy"
        className="w-full h-full object-cover"
        onError={(e) => {
          (e.target as HTMLImageElement).style.display = 'none';
          const fallback = (e.target as HTMLImageElement).nextElementSibling as HTMLElement;
          if (fallback) fallback.classList.remove('hidden');
        }}
      />
      <div
        className="hidden absolute inset-0 flex items-center justify-center font-semibold"
        style={{
          background: 'var(--brand-primary-bg)',
          color: 'var(--brand-primary-dark)',
          fontSize: size < 32 ? '0.5rem' : size < 48 ? '0.625rem' : '0.875rem',
        }}
      >
        {initials}
      </div>
    </div>
  );
}
