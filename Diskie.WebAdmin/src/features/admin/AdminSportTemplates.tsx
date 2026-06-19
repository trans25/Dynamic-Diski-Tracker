import { useMemo, useState } from 'react'
import {
  Button,
  Card,
  CardContent,
  Grid,
  Pagination,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { PageHeader } from '../../components/PageHeader'
import { ErrorState, LoadingState } from '../../components/States'
import { extractErrorMessage } from '../../api/apiClient'
import { useTemplates, useTemplateMutations } from '../../hooks/useTemplates'
import { useNotify } from '../../components/NotificationProvider'
import type { SportType } from '../../api/types'

const sportTypes: SportType[] = ['Football', 'Rugby', 'Netball', 'Cricket']

export function AdminSportTemplates() {
  const query = useTemplates()
  const { create } = useTemplateMutations()
  const notify = useNotify()

  const [name, setName] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [sportType, setSportType] = useState<SportType>('Football')
  const [metricDefinitions, setMetricDefinitions] = useState('{"goals":"Goals","assists":"Assists"}')
  const [positionDefinitions, setPositionDefinitions] = useState('["GK","DEF","MID","FWD"]')
  const [searchQuery, setSearchQuery] = useState('')
  const [sportFilter, setSportFilter] = useState<'all' | SportType>('all')
  const [page, setPage] = useState(1)
  const pageSize = 6

  const totalTemplates = useMemo(() => query.data?.length ?? 0, [query.data])
  const filteredTemplates = useMemo(
    () =>
      (query.data ?? []).filter((template) => {
        const search = searchQuery.trim().toLowerCase()
        const matchesSearch =
          search.length === 0 ||
          template.displayName.toLowerCase().includes(search) ||
          template.name.toLowerCase().includes(search)
        const matchesSport = sportFilter === 'all' || template.sportType === sportFilter
        return matchesSearch && matchesSport
      }),
    [query.data, searchQuery, sportFilter],
  )
  const pageCount = Math.max(1, Math.ceil(filteredTemplates.length / pageSize))
  const pagedTemplates = filteredTemplates.slice((page - 1) * pageSize, page * pageSize)

  const handleSave = async () => {
    try {
      await create.mutateAsync({
        name,
        displayName: displayName || name,
        sportType,
        metricDefinitions,
        positionDefinitions,
        assessmentMetrics: [],
        matchStatsFields: [],
        positionOptions: null,
      })
      notify('Sport template created.', 'success')
      setName('')
      setDisplayName('')
    } catch (error) {
      notify(extractErrorMessage(error), 'error')
    }
  }

  if (query.isLoading) {
    return <LoadingState label="Loading sport templates..." />
  }

  if (query.isError) {
    return <ErrorState message={extractErrorMessage(query.error)} onRetry={query.refetch} />
  }

  return (
    <>
      <PageHeader
        title="Sport Management"
        description="Create and manage metadata-driven sport templates for clubs."
        action={
          <Stack direction="row" spacing={1}>
            <TextField
              size="small"
              label="Search"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                setPage(1)
              }}
              placeholder="Template name"
              sx={{ minWidth: 220 }}
            />
            <TextField
              select
              size="small"
              label="Sport"
              value={sportFilter}
              onChange={(e) => {
                setSportFilter(e.target.value as 'all' | SportType)
                setPage(1)
              }}
              sx={{ minWidth: 150 }}
            >
              <MenuItem value="all">All sports</MenuItem>
              {sportTypes.map((type) => (
                <MenuItem key={type} value={type}>
                  {type}
                </MenuItem>
              ))}
            </TextField>
          </Stack>
        }
      />

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, lg: 5 }}>
          <Card variant="outlined">
            <CardContent>
              <Stack spacing={2}>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  Create New Template
                </Typography>
                <TextField
                  label="Template Name"
                  placeholder="Football 11v11"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  fullWidth
                />
                <TextField
                  label="Display Name"
                  placeholder="Football 11v11"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  fullWidth
                />
                <TextField
                  label="Sport"
                  select
                  value={sportType}
                  onChange={(e) => setSportType(e.target.value as SportType)}
                >
                  {sportTypes.map((type) => (
                    <MenuItem key={type} value={type}>
                      {type}
                    </MenuItem>
                  ))}
                </TextField>
                <TextField
                  label="Metric Definitions JSON"
                  multiline
                  minRows={5}
                  value={metricDefinitions}
                  onChange={(e) => setMetricDefinitions(e.target.value)}
                  helperText='Example: {"tries":"Tries","conversions":"Conversions"}'
                />
                <TextField
                  label="Position Definitions JSON"
                  multiline
                  minRows={3}
                  value={positionDefinitions}
                  onChange={(e) => setPositionDefinitions(e.target.value)}
                  helperText='Example: ["Prop","Hooker","Lock"]'
                />
                <Button
                  variant="contained"
                  onClick={handleSave}
                  disabled={create.isPending || !name.trim()}
                >
                  Save Template
                </Button>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, lg: 7 }}>
          <Card variant="outlined">
            <CardContent>
              <Stack spacing={1.5}>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  Existing Templates ({totalTemplates})
                </Typography>
                {pagedTemplates.map((template) => (
                  <Card key={template.id} variant="outlined" sx={{ p: 1.5 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                      {template.displayName}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {template.sportType}
                    </Typography>
                  </Card>
                ))}
                <Stack direction="row" sx={{ justifyContent: 'flex-end' }}>
                  <Pagination count={pageCount} page={page} onChange={(_e, value) => setPage(value)} color="primary" />
                </Stack>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </>
  )
}