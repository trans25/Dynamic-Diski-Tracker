import { useMemo } from 'react'
import {
  Card,
  CardContent,
  CardHeader,
  FormControlLabel,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material'
import { useSquadAttendance, useTrainingAttendanceMutation } from '../hooks/useCoach'
import { ErrorState, LoadingState } from './States'
import { extractErrorMessage } from '../api/apiClient'

type TrainingAttendanceTableProps = {
  teamId?: string
  sessionDate: string
}

export function TrainingAttendanceTable({ teamId, sessionDate }: TrainingAttendanceTableProps) {
  const attendanceQuery = useSquadAttendance(teamId, sessionDate)
  const markAttendance = useTrainingAttendanceMutation(teamId, sessionDate)

  const sortedRows = useMemo(
    () => [...(attendanceQuery.data ?? [])].sort((a, b) => a.playerName.localeCompare(b.playerName)),
    [attendanceQuery.data]
  )

  return (
    <Card sx={{ height: '100%' }}>
      <CardHeader title="Attendance Tracker" subheader={`Training session: ${sessionDate}`} />
      <CardContent>
        {attendanceQuery.isLoading ? (
          <LoadingState label="Loading attendance…" />
        ) : attendanceQuery.isError ? (
          <ErrorState
            message={extractErrorMessage(attendanceQuery.error)}
            onRetry={attendanceQuery.refetch}
          />
        ) : (
          sortedRows.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              No players found for this squad selection.
            </Typography>
          ) : (
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Player</TableCell>
                  <TableCell>Attendance %</TableCell>
                  <TableCell>Present</TableCell>
                  <TableCell>Late</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {sortedRows.map((row) => (
                  <TableRow key={row.playerId} hover>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 700 }}>
                        {row.playerName}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {row.presentSessions}/{row.totalSessions} sessions
                      </Typography>
                    </TableCell>
                    <TableCell>{row.attendancePercentage}%</TableCell>
                    <TableCell>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={Boolean(row.isPresentForSession)}
                            onChange={(_, checked) => {
                              markAttendance.mutate({
                                playerId: row.playerId,
                                sessionDate,
                                isPresent: checked,
                                isLate: checked ? Boolean(row.isLateForSession) : false,
                              })
                            }}
                          />
                        }
                        label=""
                      />
                    </TableCell>
                    <TableCell>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={Boolean(row.isLateForSession)}
                            disabled={!row.isPresentForSession}
                            onChange={(_, checked) => {
                              markAttendance.mutate({
                                playerId: row.playerId,
                                sessionDate,
                                isPresent: Boolean(row.isPresentForSession),
                                isLate: checked,
                              })
                            }}
                          />
                        }
                        label=""
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )
        )}
      </CardContent>
    </Card>
  )
}
