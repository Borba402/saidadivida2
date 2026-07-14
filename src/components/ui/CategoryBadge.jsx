import { getCategory } from '../../lib/categories';

const SIZES = {
  sm: { fontSize: '0.68rem', padding: '0.15rem 0.45rem', iconSize: 11, gap: '0.25rem' },
  md: { fontSize: '0.78rem', padding: '0.25rem 0.6rem',  iconSize: 13, gap: '0.3rem'  },
};

export default function CategoryBadge({ category, size = 'sm' }) {
  const { icon: Icon, color, bg } = getCategory(category);
  const s = SIZES[size] ?? SIZES.sm;

  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: s.gap,
      padding: s.padding,
      borderRadius: '9999px',
      fontSize: s.fontSize,
      fontWeight: 600,
      whiteSpace: 'nowrap',
      background: bg,
      color,
      border: `1px solid ${color}30`,
    }}>
      <Icon size={s.iconSize} strokeWidth={2} />
      {category}
    </span>
  );
}
