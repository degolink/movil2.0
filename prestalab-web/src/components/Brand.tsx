import React from 'react';

// Glifo `flask-outline` de MaterialCommunityIcons (mismo path de @mdi/js sin requerir dependencia externa)
const mdiFlaskOutline =
  'M6,2V4H7V11L3.5,17C2.78,18.25 3.67,20 5.12,20H18.88C20.33,20 21.22,18.25 20.5,17L17,11V4H18V2H6M8.5,12H15.5L17.75,16H6.25L8.5,12Z';

/**
 * Marca PrestaLab — réplica exacta del componente Brand de la app móvil:
 * cuadrado verde #1F5B3A (radio 30%), glifo `flask-outline` de
 * MaterialCommunityIcons al 55% del cuadro y wordmark Inter Bold #1F5B3A.
 */
const SIZES = {
  sm: { mark: 36, word: 19 },
  md: { mark: 44, word: 22 },
  lg: { mark: 56, word: 26 },
} as const;

export default function Brand({
  size = 'md',
  subtitle = null,
}: {
  size?: keyof typeof SIZES;
  subtitle?: string | null;
}) {
  const s = SIZES[size];
  const icon = Math.round(s.mark * 0.55);

  return (
    <div className="flex items-center" style={{ gap: 12 }}>
      <div
        style={{
          width: s.mark,
          height: s.mark,
          borderRadius: s.mark * 0.3,
          background: '#1F5B3A',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <svg width={icon} height={icon} viewBox="0 0 24 24" aria-hidden="true">
          <path d={mdiFlaskOutline} fill="#FEFFFE" />
        </svg>
      </div>

      <div className="min-w-0">
        <p
          style={{
            fontSize: s.word,
            fontWeight: 700,
            letterSpacing: '-0.3px',
            color: '#1F5B3A',
            lineHeight: 1.05,
          }}
        >
          PrestaLab
        </p>
        {subtitle ? (
          <p
            className="truncate"
            style={{ fontSize: 12, color: 'var(--text-soft)', marginTop: 2 }}
          >
            {subtitle}
          </p>
        ) : null}
      </div>
    </div>
  );
}
