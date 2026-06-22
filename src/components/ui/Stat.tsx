import { cn } from '@/lib/utils'
interface Props { label:string; value:string|number; sub?:string; color?:string }
export default function Stat({ label, value, sub, color }: Props) {
  return (
    <div className="stat">
      <div className="stat-label">{label}</div>
      <div className={cn('stat-value', color)}>{value}</div>
      {sub && <div className="stat-sub">{sub}</div>}
    </div>
  )
}
