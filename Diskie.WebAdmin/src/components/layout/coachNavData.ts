import SpaceDashboardIcon from '@mui/icons-material/SpaceDashboard'
import GroupsIcon from '@mui/icons-material/Groups'
import EventIcon from '@mui/icons-material/Event'
import HistoryIcon from '@mui/icons-material/History'
import HealingIcon from '@mui/icons-material/Healing'
import CampaignIcon from '@mui/icons-material/Campaign'
import InsightsIcon from '@mui/icons-material/Insights'
import type { SvgIconComponent } from '@mui/icons-material'

export type CoachNavItem = {
  title: string
  to: string
  icon: SvgIconComponent
}

// The Coach portal intentionally uses a flat top-tab navigation that is
// visually and structurally distinct from the Super Admin sidebar.
export const coachNavItems: CoachNavItem[] = [
  { title: 'Dashboard', to: '/coach', icon: SpaceDashboardIcon },
  { title: 'Roster', to: '/coach/teams', icon: GroupsIcon },
  { title: 'Schedule', to: '/coach/schedule', icon: EventIcon },
  { title: 'Match History', to: '/coach/match-history', icon: HistoryIcon },
  { title: 'Analytics', to: '/coach/analytics', icon: InsightsIcon },
  { title: 'Communication', to: '/coach/communication', icon: CampaignIcon },
  { title: 'Injuries', to: '/coach/injuries', icon: HealingIcon },
]
