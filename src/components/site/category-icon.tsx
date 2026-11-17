import {
  Car,
  Cog,
  Cpu,
  Dumbbell,
  Gem,
  Package,
  Palette,
  Shirt,
  Sofa,
  Watch,
  type LucideIcon,
} from 'lucide-react'

const ICONS: Record<string, LucideIcon> = {
  Car,
  Cog,
  Cpu,
  Dumbbell,
  Gem,
  Package,
  Palette,
  Shirt,
  Sofa,
  Watch,
}

export function CategoryIcon({
  name,
  className,
}: {
  name: string
  className?: string
}) {
  const Icon = ICONS[name] ?? Package
  return <Icon className={className} aria-hidden="true" />
}
