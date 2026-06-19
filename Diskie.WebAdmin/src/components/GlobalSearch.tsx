import { useEffect, useMemo, useState } from 'react'
import { Link as RouterLink } from 'react-router-dom'
import {
  Box,
  CircularProgress,
  ClickAwayListener,
  InputAdornment,
  List,
  ListItemButton,
  ListItemText,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import SearchIcon from '@mui/icons-material/Search'
import { useGlobalSearch } from '../hooks/useCoach'

type GlobalSearchProps = {
  teamId?: string
  clubId?: string
  placeholder?: string
}

function useDebouncedValue<T>(value: T, delayMs: number) {
  const [debounced, setDebounced] = useState(value)

  useEffect(() => {
    const handle = window.setTimeout(() => setDebounced(value), delayMs)
    return () => window.clearTimeout(handle)
  }, [delayMs, value])

  return debounced
}

function getResultPath(type: string, id: string) {
  if (type === 'player') {
    return `/coach/teams?playerId=${encodeURIComponent(id)}`
  }

  if (type === 'match') {
    return `/coach/live-match/${encodeURIComponent(id)}`
  }

  return '/coach'
}

export function GlobalSearch({ teamId, clubId, placeholder = 'Search players and matches…' }: GlobalSearchProps) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const debouncedQuery = useDebouncedValue(query, 500)

  const searchQuery = useGlobalSearch(debouncedQuery, {
    page: 1,
    pageSize: 8,
    teamId,
    clubId,
    enabled: debouncedQuery.trim().length >= 2,
  })

  const items = searchQuery.data?.items ?? []
  const hasQuery = debouncedQuery.trim().length >= 2

  const helperText = useMemo(() => {
    if (query.trim().length === 0) return 'Search, filter, and paginate across players and matches.'
    if (query.trim().length < 2) return 'Type at least 2 characters.'
    if (searchQuery.isLoading) return 'Searching…'
    if (searchQuery.isError) return 'Search failed.'
    return `${searchQuery.data?.totalCount ?? 0} result(s)`
  }, [query, searchQuery.data?.totalCount, searchQuery.isError, searchQuery.isLoading])

  return (
    <ClickAwayListener onClickAway={() => setOpen(false)}>
      <Box sx={{ position: 'relative', width: '100%', maxWidth: 420 }}>
        <TextField
          fullWidth
          size="small"
          value={query}
          onFocus={() => setOpen(true)}
          onChange={(event) => {
            setQuery(event.target.value)
            setOpen(true)
          }}
          placeholder={placeholder}
          helperText={helperText}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" sx={{ color: 'text.secondary' }} />
                </InputAdornment>
              ),
              endAdornment: searchQuery.isLoading ? (
                <InputAdornment position="end">
                  <CircularProgress size={16} />
                </InputAdornment>
              ) : undefined,
            },
          }}
        />

        {open && hasQuery ? (
          <Paper
            elevation={8}
            sx={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              mt: 1,
              zIndex: 20,
              overflow: 'hidden',
            }}
          >
            {items.length === 0 && !searchQuery.isLoading ? (
              <Box sx={{ px: 2, py: 1.5 }}>
                <Typography variant="body2" color="text.secondary">
                  No results found.
                </Typography>
              </Box>
            ) : (
              <List disablePadding>
                {items.map((item) => (
                  <ListItemButton
                    key={`${item.type}-${item.id}`}
                    component={RouterLink}
                    to={getResultPath(item.type, item.id)}
                    onClick={() => setOpen(false)}
                  >
                    <ListItemText
                      primary={
                        <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {item.title}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {item.type.toUpperCase()}
                          </Typography>
                        </Stack>
                      }
                      secondary={item.subtitle}
                    />
                  </ListItemButton>
                ))}
              </List>
            )}
          </Paper>
        ) : null}
      </Box>
    </ClickAwayListener>
  )
}
