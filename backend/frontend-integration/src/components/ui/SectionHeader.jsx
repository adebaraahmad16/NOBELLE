import { useScrollAnimation } from '../../hooks/useScrollAnimation';

export default function SectionHeader({ title, subtitle, align = 'center', light = false }) {
  const [ref, isVisible] = useScrollAnimation();

  return (
    <div
      ref={ref}
      className={`mb-10 lg:mb-14 ${align === 'center' ? 'text-center' : 'text-left'} ${
        isVisible ? 'animate-fade-in-up' : 'opacity-0'
      }`}
    >
      <h2
        className={`section-title ${light ? 'text-white' : 'text-brand-charcoal'}`}
      >
        {title}
      </h2>
      {subtitle && (
        <p className={`section-subtitle ${light ? 'text-white/60' : 'text-brand-gray'}`}>
          {subtitle}
        </p>
      )}
      <div
        className={`mt-4 mx-auto h-px w-16 ${
          align === 'center' ? 'mx-auto' : 'mx-0'
        } ${light ? 'bg-white/30' : 'bg-brand-red'}`}
      />
    </div>
  );
}
