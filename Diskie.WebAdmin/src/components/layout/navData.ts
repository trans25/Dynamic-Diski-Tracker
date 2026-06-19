import DashboardIcon from '@mui/icons-material/Dashboard'
import ApartmentIcon from '@mui/icons-material/Apartment'
import GroupIcon from '@mui/icons-material/Group'
import PaymentsIcon from '@mui/icons-material/Payments'
import CategoryIcon from '@mui/icons-material/Category'
import MonitorHeartIcon from '@mui/icons-material/MonitorHeart'
import PersonIcon from '@mui/icons-material/Person'
import type { SvgIconComponent } from '@mui/icons-material'

export type NavItem = {
  title: string
  to: string
  icon: SvgIconComponent
}

export type NavGroup = {
  title: string
  items: NavItem[]
}

export const navGroups: NavGroup[] = [
  {
    title: 'General',
    items: [
      { title: 'Dashboard', to: '/', icon: DashboardIcon },
      { title: 'Tenants', to: '/tenants', icon: ApartmentIcon },
      { title: 'Users', to: '/users', icon: GroupIcon },
    ],
  },
  {
    title: 'Platform',
    items: [
      { title: 'Billing', to: '/billing', icon: PaymentsIcon },
      { title: 'Sport Templates', to: '/templates', icon: CategoryIcon },
      { title: 'Admin Sports', to: '/admin/sports', icon: CategoryIcon },
      { title: 'Pending Requests', to: '/admin/pending-requests', icon: ApartmentIcon },
      { title: 'System Health', to: '/health', icon: MonitorHeartIcon },
    ],
  },
  {
    title: 'Account',
    items: [{ title: 'Profile', to: '/profile', icon: PersonIcon }],
  },
]
