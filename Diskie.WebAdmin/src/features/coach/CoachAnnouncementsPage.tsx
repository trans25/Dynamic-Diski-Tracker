import { useMemo, useState } from 'react'
import {
  Badge,
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Chip,
  Divider,
  InputAdornment,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Pagination,
  Paper,
  Tab,
  Tabs,
  TextField,
  IconButton,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import SendIcon from '@mui/icons-material/Send'
import CampaignOutlinedIcon from '@mui/icons-material/CampaignOutlined'
import Groups2OutlinedIcon from '@mui/icons-material/Groups2Outlined'
import FamilyRestroomOutlinedIcon from '@mui/icons-material/FamilyRestroomOutlined'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'
import { PageHeader } from '../../components/PageHeader'
import { EmptyState, ErrorState, LoadingState } from '../../components/States'
import { useNotify } from '../../components/NotificationProvider'
import { extractErrorMessage } from '../../api/apiClient'
import {
  useAnnouncementMutations,
  useCoachAnnouncements,
  useCoachTeams,
} from '../../hooks/useCoach'
import {
  AnnouncementDialog,
  type AnnouncementFormValues,
} from './AnnouncementDialog'
import { formatDateTime } from '../../utils/format'
import {
  announcementPriorityToName,
} from '../../utils/coachFormat'
import type { AnnouncementViewModel } from '../../api/types'

type GuardianThread = {
  id: string
  guardianName: string
  playerName: string
  preview: string
  lastAt: string
  messages: { id: string; sender: 'guardian' | 'coach'; text: string; time: string }[]
}

const guardianThreads: GuardianThread[] = [
  {
    id: '1',
    guardianName: 'Mrs Mdluli',
    playerName: "Sipho",
    preview: "Will Sipho need boots for Saturday's match?",
    lastAt: '10:32 AM',
    messages: [
      {
        id: 'm1',
        sender: 'guardian',
        text: "Will Sipho need boots for Saturday's match?",
        time: '10:32 AM',
      },
    ],
  },
  {
    id: '2',
    guardianName: 'Mr Cele',
    playerName: 'Thabo',
    preview: 'Thabo will be late to practice on Thursday.',
    lastAt: 'Yesterday',
    messages: [
      {
        id: 'm2',
        sender: 'guardian',
        text: 'Thabo will be late to practice on Thursday.',
        time: 'Yesterday',
      },
    ],
  },
  {
    id: '3',
    guardianName: 'Ms Dube',
    playerName: 'Lunga',
    preview: 'Thank you for the injury update, Coach.',
    lastAt: 'Mon',
    messages: [
      {
        id: 'm3',
        sender: 'guardian',
        text: 'Thank you for the injury update, Coach.',
        time: 'Mon',
      },
    ],
  },
]

export function CoachAnnouncementsPage() {
  const [tab, setTab] = useState<'announcements' | 'messages'>('announcements')
  const [audience, setAudience] = useState<'all' | 'players' | 'guardians'>('all')
  const [selectedThreadId, setSelectedThreadId] = useState(guardianThreads[0].id)
  const [reply, setReply] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [announcementPage, setAnnouncementPage] = useState(1)
  const [messagePage, setMessagePage] = useState(1)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<AnnouncementViewModel | null>(null)
  const notify = useNotify()
  const announcementPageSize = 5
  const messagePageSize = 5

  const teamsQuery = useCoachTeams()
  const { data, isLoading, isError, error, refetch } = useCoachAnnouncements()
  const { createAnnouncement, updateAnnouncement, deleteAnnouncement } =
    useAnnouncementMutations()

  const selectedThread =
    guardianThreads.find((item) => item.id === selectedThreadId) ??
    guardianThreads[0]

  const visibleAnnouncements = useMemo(
    () =>
      (data ?? []).filter((item) => {
        const search = searchQuery.trim().toLowerCase()
        const matchesSearch =
          search.length === 0 ||
          item.title.toLowerCase().includes(search) ||
          item.body.toLowerCase().includes(search)
        if (audience === 'all') return matchesSearch
        if (audience === 'players') return item.audience === 1 && matchesSearch
        return item.audience === 2 && matchesSearch
      }),
    [audience, data, searchQuery],
  )

  const visibleThreads = useMemo(
    () =>
      guardianThreads.filter((thread) => {
        const search = searchQuery.trim().toLowerCase()
        if (search.length === 0) return true
        return (
          thread.guardianName.toLowerCase().includes(search) ||
          thread.playerName.toLowerCase().includes(search) ||
          thread.preview.toLowerCase().includes(search)
        )
      }),
    [searchQuery],
  )

  const announcementPageCount = Math.max(1, Math.ceil(visibleAnnouncements.length / announcementPageSize))
  const pagedAnnouncements = visibleAnnouncements.slice((announcementPage - 1) * announcementPageSize, announcementPage * announcementPageSize)
  const messagePageCount = Math.max(1, Math.ceil(visibleThreads.length / messagePageSize))
  const pagedThreads = visibleThreads.slice((messagePage - 1) * messagePageSize, messagePage * messagePageSize)

  const openCreate = () => {
    setEditing(null)
    setDialogOpen(true)
  }

  const openEdit = (announcement: AnnouncementViewModel) => {
    setEditing(announcement)
    setDialogOpen(true)
  }

  const closeDialog = () => {
    setDialogOpen(false)
    setEditing(null)
  }

  const handleSubmit = async (values: AnnouncementFormValues) => {
    try {
      if (editing) {
        await updateAnnouncement.mutateAsync({
          id: editing.id,
          teamId: values.teamId || null,
          title: values.title,
          body: values.body,
          audience: values.audience,
          priority: values.priority,
          channel: values.channel,
        })
        notify('Announcement updated.', 'success')
      } else {
        await createAnnouncement.mutateAsync({
          teamId: values.teamId || null,
          title: values.title,
          body: values.body,
          audience: values.audience,
          priority: values.priority,
          channel: values.channel,
        })
        notify('Announcement posted.', 'success')
      }
      closeDialog()
    } catch (err) {
      notify(extractErrorMessage(err), 'error')
    }
  }

  const handleDelete = async (announcement: AnnouncementViewModel) => {
    if (!window.confirm('Delete this announcement? This cannot be undone.'))
      return
    try {
      await deleteAnnouncement.mutateAsync(announcement.id)
      notify('Announcement deleted.', 'success')
    } catch (err) {
      notify(extractErrorMessage(err), 'error')
    }
  }

  const handleSendReply = () => {
    if (!reply.trim()) return
    notify('Reply sent to guardian.', 'success')
    setReply('')
  }

  return (
    <>
      <PageHeader
        title="Communication Hub"
        description="Send announcements and manage guardian messages"
        action={
          <Stack direction="row" spacing={1}>
            <TextField
              size="small"
              label="Search"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                setAnnouncementPage(1)
                setMessagePage(1)
              }}
              placeholder={tab === 'announcements' ? 'Title or body' : 'Guardian or player'}
              sx={{ minWidth: 220 }}
            />
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={openCreate}
            >
              New Announcement
            </Button>
          </Stack>
        }
      />

      {isLoading ? (
        <LoadingState label="Loading announcements…" />
      ) : isError ? (
        <ErrorState message={extractErrorMessage(error)} onRetry={refetch} />
      ) : (
        <Stack spacing={2}>
          <Tabs
            value={tab}
            onChange={(_e, value) => setTab(value)}
            sx={{
              minHeight: 0,
              '& .MuiTabs-indicator': { display: 'none' },
              '& .MuiTab-root': {
                minHeight: 36,
                textTransform: 'none',
                borderRadius: 2,
                mr: 1,
                border: 1,
                borderColor: 'divider',
              },
              '& .Mui-selected': {
                bgcolor: 'primary.main',
                color: 'primary.contrastText !important',
                borderColor: 'primary.main',
              },
            }}
          >
            <Tab value="announcements" label="Announcements" />
            <Tab
              value="messages"
              label={
                <Badge color="error" badgeContent={1}>
                  Guardian Messages
                </Badge>
              }
            />
          </Tabs>

          {tab === 'announcements' ? (
            <>
              <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                <Card
                  variant="outlined"
                  className="coach-interactive-card"
                  sx={{ flex: 1, cursor: 'pointer' }}
                  onClick={() => setAudience('all')}
                >
                  <CardContent>
                    <Chip size="small" icon={<CampaignOutlinedIcon />} label="All" />
                    <Typography variant="subtitle1" sx={{ mt: 1, fontWeight: 700 }}>
                      Send to Everyone
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Broadcast to all players and guardians
                    </Typography>
                  </CardContent>
                </Card>
                <Card
                  variant="outlined"
                  className="coach-interactive-card"
                  sx={{ flex: 1, cursor: 'pointer' }}
                  onClick={() => setAudience('players')}
                >
                  <CardContent>
                    <Chip size="small" icon={<Groups2OutlinedIcon />} label="Players" />
                    <Typography variant="subtitle1" sx={{ mt: 1, fontWeight: 700 }}>
                      Send to Players Only
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Notify your squad directly
                    </Typography>
                  </CardContent>
                </Card>
                <Card
                  variant="outlined"
                  className="coach-interactive-card"
                  sx={{ flex: 1, cursor: 'pointer' }}
                  onClick={() => setAudience('guardians')}
                >
                  <CardContent>
                    <Chip
                      size="small"
                      color="warning"
                      icon={<FamilyRestroomOutlinedIcon />}
                      label="Guardians"
                    />
                    <Typography variant="subtitle1" sx={{ mt: 1, fontWeight: 700 }}>
                      Send to Guardians Only
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Keep parents informed
                    </Typography>
                  </CardContent>
                </Card>
              </Stack>

              {visibleAnnouncements.length === 0 ? (
                <EmptyState
                  title="No announcements yet"
                  description="Send your first announcement."
                />
              ) : (
                <Stack spacing={1.5}>
                  {pagedAnnouncements.map((item) => (
                    <Card key={item.id} variant="outlined" className="coach-interactive-card">
                      <CardContent>
                        <Stack
                          direction="row"
                          spacing={1}
                          sx={{ justifyContent: 'space-between', alignItems: 'flex-start' }}
                        >
                          <Box>
                            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                              {item.title}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                              {item.body}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                              {formatDateTime(item.createdAt)}
                            </Typography>
                          </Box>
                          <Stack direction="row" spacing={0.5}>
                            <Chip
                              size="small"
                              label={announcementPriorityToName(item.priority)}
                              color={item.priority >= 2 ? 'error' : item.priority === 1 ? 'warning' : 'default'}
                            />
                            <Tooltip title="Edit">
                              <IconButton size="small" onClick={() => openEdit(item)}>
                                <EditIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Delete">
                              <IconButton size="small" color="error" onClick={() => handleDelete(item)}>
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </Stack>
                        </Stack>
                      </CardContent>
                    </Card>
                  ))}
                  {visibleAnnouncements.length > announcementPageSize ? (
                    <Stack direction="row" sx={{ justifyContent: 'flex-end' }}>
                      <Pagination count={announcementPageCount} page={announcementPage} onChange={(_e, value) => setAnnouncementPage(value)} color="primary" />
                    </Stack>
                  ) : null}
                </Stack>
              )}
            </>
          ) : (
            <Stack direction={{ xs: 'column', lg: 'row' }} spacing={2}>
              <Card variant="outlined" className="coach-interactive-card" sx={{ width: { xs: '100%', lg: 360 } }}>
                <CardHeader title="Guardian Messages" sx={{ pb: 0 }} />
                <List>
                  {pagedThreads.map((thread) => (
                    <ListItem key={thread.id} disablePadding>
                      <ListItemButton
                        selected={selectedThreadId === thread.id}
                        onClick={() => setSelectedThreadId(thread.id)}
                      >
                        <ListItemText
                          primary={`${thread.guardianName} (${thread.playerName}'s Guardian)`}
                          secondary={thread.preview}
                        />
                        <Typography variant="caption" color="text.secondary">
                          {thread.lastAt}
                        </Typography>
                      </ListItemButton>
                    </ListItem>
                  ))}
                </List>
                {visibleThreads.length > messagePageSize ? (
                  <Box sx={{ px: 2, pb: 2, display: 'flex', justifyContent: 'flex-end' }}>
                    <Pagination count={messagePageCount} page={messagePage} onChange={(_e, value) => setMessagePage(value)} color="primary" />
                  </Box>
                ) : null}
              </Card>

              <Card variant="outlined" className="coach-interactive-card" sx={{ flex: 1 }}>
                <CardHeader title={`${selectedThread.guardianName} (${selectedThread.playerName}'s Guardian)`} />
                <Divider />
                <CardContent>
                  <Stack spacing={1.5}>
                    {selectedThread.messages.map((message) => (
                      <Paper
                        key={message.id}
                        sx={{
                          p: 1.5,
                          maxWidth: 520,
                          bgcolor: message.sender === 'guardian' ? 'action.hover' : 'primary.main',
                          color: message.sender === 'guardian' ? 'text.primary' : 'primary.contrastText',
                          borderRadius: 2,
                        }}
                      >
                        <Typography variant="body2">{message.text}</Typography>
                        <Typography variant="caption" sx={{ opacity: 0.8 }}>
                          {message.time}
                        </Typography>
                      </Paper>
                    ))}
                  </Stack>
                </CardContent>
                <Divider />
                <Box sx={{ p: 1.5 }}>
                  <TextField
                    fullWidth
                    size="small"
                    placeholder="Type your reply..."
                    value={reply}
                    onChange={(e) => setReply(e.target.value)}
                    slotProps={{
                      input: {
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton color="primary" onClick={handleSendReply}>
                              <SendIcon />
                            </IconButton>
                          </InputAdornment>
                        ),
                      },
                    }}
                  />
                </Box>
              </Card>
            </Stack>
          )}
        </Stack>
      )}

      <AnnouncementDialog
        open={dialogOpen}
        teams={teamsQuery.data ?? []}
        announcement={editing}
        submitting={createAnnouncement.isPending || updateAnnouncement.isPending}
        onClose={closeDialog}
        onSubmit={handleSubmit}
      />
    </>
  )
}
