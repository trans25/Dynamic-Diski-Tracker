import {
  Box,
  Divider,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Stack,
  Toolbar,
  Typography,
} from '@mui/material'
import { NavLink } from 'react-router-dom'
import { Logo } from '../Logo'
import { navGroups } from './navData'

export const SIDEBAR_WIDTH = 256

type SidebarContentProps = {
  onNavigate?: () => void
}

export function SidebarContent({ onNavigate }: SidebarContentProps) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Toolbar sx={{ px: 2 }}>
        <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
          <Box
            sx={{
              width: 36,
              height: 36,
              borderRadius: 1.5,
              bgcolor: 'primary.main',
              color: 'primary.contrastText',
              display: 'grid',
              placeItems: 'center',
            }}
          >
            <Logo size={20} />
          </Box>
          <Box>
            <Typography
              variant="subtitle2"
              sx={{ fontWeight: 700, lineHeight: 1.1 }}
            >
              Diski Tracker Hub
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Super Admin
            </Typography>
          </Box>
        </Stack>
      </Toolbar>
      <Divider />
      <Box sx={{ overflowY: 'auto', flex: 1, px: 1.5, py: 1 }}>
        {navGroups.map((group) => (
          <Box key={group.title} sx={{ mb: 1.5 }}>
            <Typography
              variant="overline"
              color="text.secondary"
              sx={{ px: 1.5, fontWeight: 600 }}
            >
              {group.title}
            </Typography>
            <List dense disablePadding>
              {group.items.map((item) => {
                const Icon = item.icon
                return (
                  <ListItemButton
                    key={item.to}
                    component={NavLink}
                    to={item.to}
                    end={item.to === '/'}
                    onClick={onNavigate}
                    sx={{
                      borderRadius: 1.5,
                      mb: 0.5,
                      '&.active': {
                        bgcolor: 'action.selected',
                        fontWeight: 600,
                      },
                      '&.active .MuiListItemIcon-root': {
                        color: 'primary.main',
                      },
                    }}
                  >
                    <ListItemIcon sx={{ minWidth: 36 }}>
                      <Icon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText
                      primary={item.title}
                      slotProps={{ primary: { variant: 'body2' } }}
                    />
                  </ListItemButton>
                )
              })}
            </List>
          </Box>
        ))}
      </Box>
    </Box>
  )
}
