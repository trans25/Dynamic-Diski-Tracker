import { useMemo, useState } from 'react'
import {
  Button,
  Card,
  CardContent,
  Chip,
  IconButton,
  InputAdornment,
  MenuItem,
  Pagination,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined'
import SearchIcon from '@mui/icons-material/Search'
import DeleteIcon from '@mui/icons-material/Delete'
import { PageHeader } from '../../components/PageHeader'
import { ErrorState, LoadingState } from '../../components/States'
import { useNotify } from '../../components/NotificationProvider'
import { extractErrorMessage } from '../../api/apiClient'
import {
  useCoachTeams,
  useCoachTemplates,
  useMatchHistory,
  useMatchMutations,
} from '../../hooks/useCoach'
import { NewMatchDialog, type NewMatchFormValues } from './NewMatchDialog'
import { fixtureResultToName } from '../../utils/coachFormat'
import { formatDate } from '../../utils/format'
import type { FixtureViewModel } from '../../api/types'

function resultChipColor(result: number | null | undefined):
  | 'success'
  | 'warning'
  | 'error'
  | 'default' {
  if (result == null) return 'default'
  if (result === 0) return 'success'
  if (result === 1) return 'error'
  return 'warning'
}

export function CoachMatchHistoryPage() {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [resultFilter, setResultFilter] = useState('all')
  const [page, setPage] = useState(1)
  const pageSize = 8

  const notify = useNotify()
  const teamsQuery = useCoachTeams()
  const templatesQuery = useCoachTemplates()
  const historyQuery = useMatchHistory()
  const { createMatch, updateMatch, deleteMatch } = useMatchMutations()

  const rows = useMemo(() => {
    const items = historyQuery.data ?? []
    return items.filter((item) => {
      const opponent = item.opponent?.toLowerCase() ?? ''
      const matchesQuery = query.trim() ? opponent.includes(query.trim().toLowerCase()) : true
      const matchesResult =
        resultFilter === 'all' ? true : String(item.result ?? 'none') === resultFilter
      return matchesQuery && matchesResult
    })
  }, [historyQuery.data, query, resultFilter])

  const pageCount = Math.max(1, Math.ceil(rows.length / pageSize))
  const pagedRows = rows.slice((page - 1) * pageSize, page * pageSize)

  const statLabels = useMemo(() => {
    const firstTeam = (teamsQuery.data ?? [])[0]
    const template = templatesQuery.data?.find(
      (item) => item.id === firstTeam?.sportTemplateId
    )
    return {
      lead: template?.matchStatsFields?.[0]?.displayName ?? 'Top Performer',
      second: template?.matchStatsFields?.[1]?.displayName ?? 'Match Stat 2',
    }
  }, [teamsQuery.data, templatesQuery.data])

  const handleCreate = async (values: NewMatchFormValues, seasonId: string) => {
    try {
      const created = await createMatch.mutateAsync({
        teamId: values.teamId,
        seasonId,
        fixtureDate: values.fixtureDate,
        startTime:
          values.startTime.length === 5 ? `${values.startTime}:00` : values.startTime,
        endTime: values.endTime
          ? values.endTime.length === 5
            ? `${values.endTime}:00`
            : values.endTime
          : null,
        venue: values.venue || null,
        opponent: values.isTraining ? null : values.opponent || null,
        type: values.type,
        isTraining: values.isTraining,
      })

      if (
        values.result ||
        values.homeScore ||
        values.awayScore ||
        values.matchReport
      ) {
        await updateMatch.mutateAsync({
          id: created.id,
          teamId: created.teamId,
          seasonId: created.seasonId,
          fixtureDate: created.fixtureDate,
          startTime: created.startTime,
          endTime: created.endTime ?? null,
          venue: created.venue ?? null,
          opponent: created.opponent ?? null,
          type: created.type,
          result:
            values.result !== undefined && values.result !== ''
              ? Number(values.result)
              : null,
          homeScore:
            values.homeScore !== undefined && values.homeScore !== ''
              ? Number(values.homeScore)
              : null,
          awayScore:
            values.awayScore !== undefined && values.awayScore !== ''
              ? Number(values.awayScore)
              : null,
          matchReport: values.matchReport || null,
          isTraining: created.isTraining,
          isCancelled: created.isCancelled,
        })
      }

      notify('Match saved.', 'success')
      setDialogOpen(false)
    } catch (error) {
      notify(extractErrorMessage(error), 'error')
    }
  }

  const handleDelete = async (fixture: FixtureViewModel) => {
    if (!window.confirm('Delete this match record?')) return
    try {
      await deleteMatch.mutateAsync(fixture.id)
      notify('Match removed.', 'success')
    } catch (error) {
      notify(extractErrorMessage(error), 'error')
    }
  }

  return (
    <>
      <PageHeader
        title="Match History"
        description="Review past performances and compare match statistics."
        action={
          <Stack direction="row" spacing={1}>
            <Button variant="outlined" startIcon={<DescriptionOutlinedIcon />}>
              Export Report
            </Button>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setDialogOpen(true)}
              disabled={!teamsQuery.data || teamsQuery.data.length === 0}
            >
              New Match
            </Button>
          </Stack>
        }
      />

      {historyQuery.isLoading ? (
        <LoadingState label="Loading match history..." />
      ) : historyQuery.isError ? (
        <ErrorState
          message={extractErrorMessage(historyQuery.error)}
          onRetry={historyQuery.refetch}
        />
      ) : (
        <Stack spacing={3}>
          <Card>
            <CardContent>
              <Stack
                direction={{ xs: 'column', md: 'row' }}
                spacing={1.5}
                sx={{ mb: 2, justifyContent: 'space-between' }}
              >
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  Full Match History
                </Typography>
                <Stack direction="row" spacing={1}>
                  <TextField
                    size="small"
                    placeholder="Search opponents..."
                    value={query}
                    onChange={(e) => {
                      setQuery(e.target.value)
                      setPage(1)
                    }}
                    slotProps={{
                      input: {
                        startAdornment: (
                          <InputAdornment position="start">
                            <SearchIcon fontSize="small" />
                          </InputAdornment>
                        ),
                      },
                    }}
                  />
                  <TextField
                    select
                    size="small"
                    value={resultFilter}
                    onChange={(e) => {
                      setResultFilter(e.target.value)
                      setPage(1)
                    }}
                    sx={{ minWidth: 130 }}
                  >
                    <MenuItem value="all">All Results</MenuItem>
                    <MenuItem value="0">Win</MenuItem>
                    <MenuItem value="1">Loss</MenuItem>
                    <MenuItem value="2">Draw</MenuItem>
                    <MenuItem value="none">No Result</MenuItem>
                  </TextField>
                </Stack>
              </Stack>

              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Date</TableCell>
                    <TableCell>Opponent</TableCell>
                    <TableCell>Score</TableCell>
                    <TableCell>Result</TableCell>
                    <TableCell>{statLabels.lead}</TableCell>
                    <TableCell>{statLabels.second}</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {rows.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} align="center">
                        <Typography variant="body2" color="text.secondary" sx={{ py: 3 }}>
                          No matches yet.
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    pagedRows.map((row) => (
                      <TableRow key={row.id} hover>
                        <TableCell>{formatDate(row.fixtureDate)}</TableCell>
                        <TableCell>{row.opponent || 'Training'}</TableCell>
                        <TableCell>
                          {row.homeScore != null && row.awayScore != null
                            ? `${row.homeScore} - ${row.awayScore}`
                            : '0 - 0'}
                        </TableCell>
                        <TableCell>
                          <Chip
                            size="small"
                            color={resultChipColor(row.result)}
                            label={fixtureResultToName(row.result) === '—' ? 'Draw' : fixtureResultToName(row.result)}
                          />
                        </TableCell>
                        <TableCell>elias</TableCell>
                        <TableCell>
                          <Chip size="small" color="warning" label="Request Trial" />
                        </TableCell>
                        <TableCell align="right">
                          <Stack
                            direction="row"
                            spacing={0.5}
                            sx={{ justifyContent: 'flex-end' }}
                          >
                            <Button size="small">Details</Button>
                            <IconButton size="small" onClick={() => handleDelete(row)}>
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Stack>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
                {rows.length > pageSize ? (
                  <Stack direction="row" sx={{ justifyContent: 'flex-end', mt: 2 }}>
                    <Pagination count={pageCount} page={page} onChange={(_e, value) => setPage(value)} color="primary" />
                  </Stack>
                ) : null}
            </CardContent>
          </Card>

          <Card sx={{ bgcolor: 'primary.main', color: 'primary.contrastText' }}>
            <CardContent sx={{ py: 3 }}>
              <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
                Request a Trial Match
              </Typography>
              <Typography variant="body1" sx={{ maxWidth: 760, opacity: 0.95 }}>
                Want to test your squad against a specific academy? Use our trial request
                workflow to coordinate friendly matches and scout new talent.
              </Typography>
              <Stack direction="row" spacing={1.5} sx={{ mt: 2.5 }}>
                <Button variant="contained" color="warning">
                  Start New Request
                </Button>
                <Button variant="outlined" sx={{ color: 'inherit', borderColor: 'rgba(255,255,255,0.35)' }}>
                  View Active Requests
                </Button>
              </Stack>
            </CardContent>
          </Card>
        </Stack>
      )}

      <NewMatchDialog
        open={dialogOpen}
        teams={teamsQuery.data ?? []}
        templates={templatesQuery.data ?? []}
        variant="match"
        submitting={createMatch.isPending || updateMatch.isPending}
        onClose={() => setDialogOpen(false)}
        onSubmit={handleCreate}
      />
    </>
  )
}
