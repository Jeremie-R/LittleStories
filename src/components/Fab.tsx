import { Link } from 'react-router'
import { Icon } from './Icon'

/** The round yellow + above the tab bar (or the bottom of a detail screen). */
export function Fab({ to, label, docked = false }: { to: string; label: string; docked?: boolean }) {
  return (
    <Link to={to} className={`fab ${docked ? 'fab--docked' : ''}`} aria-label={label} title={label}>
      <Icon name="plus" size={28} strokeWidth={2.2} />
    </Link>
  )
}
