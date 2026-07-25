import { MissionPriority, PriorityCode } from '../api/emsTypes'

export function getPriorityBadge(priority: MissionPriority): {
  label: string
  code: PriorityCode
  bgColor: string
  textColor: string
  borderColor: string
  pulse: boolean
} {
  switch (priority) {
    case 1:
      return {
        label: 'Priority 1 - Critical Emergency',
        code: 'P1',
        bgColor: 'bg-red-500/20',
        textColor: 'text-red-400',
        borderColor: 'border-red-500/40',
        pulse: true,
      }
    case 2:
      return {
        label: 'Priority 2 - Urgent Care',
        code: 'P2',
        bgColor: 'bg-amber-500/20',
        textColor: 'text-amber-400',
        borderColor: 'border-amber-500/40',
        pulse: false,
      }
    case 3:
      return {
        label: 'Priority 3 - Moderate',
        code: 'P3',
        bgColor: 'bg-emerald-500/20',
        textColor: 'text-emerald-400',
        borderColor: 'border-emerald-500/40',
        pulse: false,
      }
    default:
      return {
        label: 'Priority 4 - Non-Urgent Transport',
        code: 'P4',
        bgColor: 'bg-blue-500/20',
        textColor: 'text-blue-400',
        borderColor: 'border-blue-500/40',
        pulse: false,
      }
  }
}
