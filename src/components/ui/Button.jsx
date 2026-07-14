export default function Button({
  variant = 'secondary',
  size,
  danger = false,
  active = false,
  disabled = false,
  type = 'button',
  onClick,
  children,
  title,
  className = '',
  'aria-label': ariaLabel,
  ...rest
}) {
  const cls = [
    'sdd-btn',
    `sdd-btn--${variant}`,
    size === 'sm'   && 'sdd-btn--sm',
    size === 'icon' && 'sdd-btn--icon',
    className,
  ].filter(Boolean).join(' ');

  return (
    <button
      type={type}
      className={cls}
      disabled={disabled}
      onClick={onClick}
      title={title}
      aria-label={ariaLabel ?? (typeof children === 'string' ? undefined : title)}
      data-active={active ? 'true' : undefined}
      data-danger={danger ? 'true' : undefined}
      {...rest}
    >
      {children}
    </button>
  );
}
