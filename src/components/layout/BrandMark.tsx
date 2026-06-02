type BrandMarkProps = {
  variant?: 'header' | 'auth' | 'mobile';
};

const sizes = {
  header: {
    wrap: 'h-12 w-[270px]',
    icon: 'h-12 w-24',
    text: 'h-12 w-40',
  },
  mobile: {
    wrap: 'h-11 w-[230px]',
    icon: 'h-11 w-20',
    text: 'h-11 w-36',
  },
  auth: {
    wrap: 'mx-auto h-28 w-full max-w-[340px] sm:h-36 sm:max-w-[620px]',
    icon: 'h-28 w-28 sm:h-36 sm:w-56',
    text: 'h-28 w-0 flex-1 sm:h-36',
  },
};

export function BrandMark({ variant = 'header' }: BrandMarkProps) {
  const size = sizes[variant];
  const textOffset = variant === 'auth' ? 'translate-y-4 sm:translate-y-7' : '';

  return (
    <div className={`flex items-center gap-3 overflow-visible sm:gap-6 ${size.wrap}`} aria-label="Corvo">
      <img className={`${size.icon} shrink-0 object-contain object-left`} src="/brand/corvo-isotipo.svg" alt="" aria-hidden="true" />
      <img className={`${size.text} ${textOffset} min-w-0 object-contain object-left`} src="/brand/corvo-texto.svg" alt="Corvo" />
    </div>
  );
}

export function BrandSolo({ variant = 'header' }: BrandMarkProps) {
  const compact = variant === 'mobile';

  return (
    <div className={`flex items-center gap-0 overflow-visible ${compact ? 'h-11 w-[190px]' : 'h-12 w-[210px]'}`} aria-label="Corvo">
      <img
        className={`${compact ? 'h-11 w-24' : 'h-12 w-24'} shrink-0 object-contain object-left`}
        src="/brand/corvo-isotipo.svg"
        alt=""
        aria-hidden="true"
      />
      <img className={`${compact ? 'h-9 w-32 -ml-[14px]' : 'h-9 w-32 -ml-[14px]'} object-contain object-left`} src="/brand/corvo-solo.svg" alt="Corvo" />
    </div>
  );
}
