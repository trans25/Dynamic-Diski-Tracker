import {
    useMutation,
    useQuery,
    useQueryClient,
} from '@tanstack/react-query'
import { coachService } from '../api/services/coachService'
import { matchService } from '../api/services/matchService'
import type {
    CreateAnnouncementRequest,
    CreateCoachTeamRequest,
    CreateFixtureRequest,
    CreateMatchEventRequest,
    CreateInjuryRequest,
    CreateRosterPlayerRequest,
    ImportPlayersRequest,
    InviteGuardianRequest,
    UpdateAnnouncementRequest,
    UpdateCoachTeamRequest,
    UpdateFixtureRequest,
    UpdateInjuryRequest,
    UpdateRosterPlayerRequest,
} from '../api/types'

export const coachKeys = {
    dashboard: ['coach', 'dashboard'] as const,
    teams: ['coach', 'teams'] as const,
    templates: ['coach', 'templates'] as const,
    roster: (teamId: string) => ['coach', 'roster', teamId] as const,
    performance: (playerId: string) =>
        ['coach', 'performance', playerId] as const,
    upcoming: ['coach', 'schedule', 'upcoming'] as const,
    history: (teamId?: string) =>
        ['coach', 'schedule', 'history', teamId ?? 'all'] as const,
    injuries: (teamId?: string) =>
        ['coach', 'injuries', teamId ?? 'all'] as const,
    announcements: ['coach', 'announcements'] as const,
    analytics: ['coach', 'analytics'] as const,
    metricInsights: ['coach', 'metric-insights'] as const,
    playerGrowth: (playerId: string) => ['coach', 'player-growth', playerId] as const,
    playerGrowthSeason: (playerId: string, season: string) => ['coach', 'player-growth', playerId, season] as const,
    playerSkills: (playerId: string) => ['coach', 'player-skills', playerId] as const,
    playerAchievements: (playerId: string) => ['coach', 'player-achievements', playerId] as const,
    squadAttendance: (teamId: string, sessionDate: string) => ['coach', 'squad-attendance', teamId, sessionDate] as const,
    playerInjuries: (playerId: string) => ['coach', 'player-injuries', playerId] as const,
    positionalDepth: ['coach', 'positional-depth'] as const,
    squadFatigue: ['coach', 'squad-fatigue'] as const,
    trainingCorrelation: ['coach', 'training-correlation'] as const,
    chemistryPairs: (top: number) => ['coach', 'chemistry-pairs', top] as const,
    globalSearch: (query: string, type: string, page: number, pageSize: number) =>
        ['coach', 'global-search', query, type, page, pageSize] as const,
    availability: (matchId: string) => ['coach', 'availability', matchId] as const,
    tactics: (matchId: string) => ['coach', 'tactics', matchId] as const,
    alerts: ['coach', 'alerts'] as const,
    liveMatch: (matchId: string) => ['coach', 'live-match', matchId] as const,
}

export function useCoachDashboard() {
    return useQuery({
        queryKey: coachKeys.dashboard,
        queryFn: () => coachService.getDashboard(),
    })
}

export function useSeedCoachData() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: () => coachService.seedDemoData(),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: coachKeys.dashboard })
            queryClient.invalidateQueries({ queryKey: coachKeys.upcoming })
            queryClient.invalidateQueries({ queryKey: coachKeys.history() })
            queryClient.invalidateQueries({ queryKey: coachKeys.analytics })
            queryClient.invalidateQueries({ queryKey: coachKeys.metricInsights })
        },
    })
}

export function useResetCoachSeedData() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: () => coachService.resetDemoData(),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: coachKeys.dashboard })
            queryClient.invalidateQueries({ queryKey: coachKeys.upcoming })
            queryClient.invalidateQueries({ queryKey: coachKeys.history() })
            queryClient.invalidateQueries({ queryKey: coachKeys.analytics })
            queryClient.invalidateQueries({ queryKey: coachKeys.metricInsights })
            queryClient.invalidateQueries({ queryKey: coachKeys.injuries() })
            queryClient.invalidateQueries({ queryKey: coachKeys.announcements })
            queryClient.invalidateQueries({ queryKey: coachKeys.teams })
        },
    })
}

export function useCoachTeams() {
    return useQuery({
        queryKey: coachKeys.teams,
        queryFn: () => coachService.getTeams(),
    })
}

export function useCoachTemplates() {
    return useQuery({
        queryKey: coachKeys.templates,
        queryFn: () => coachService.getTemplates(),
    })
}

export function useTeamMutations() {
    const queryClient = useQueryClient()
    const invalidate = () => {
        queryClient.invalidateQueries({ queryKey: coachKeys.teams })
        queryClient.invalidateQueries({ queryKey: coachKeys.dashboard })
    }

    const createTeam = useMutation({
        mutationFn: (payload: CreateCoachTeamRequest) =>
            coachService.createTeam(payload),
        onSuccess: invalidate,
    })

    const updateTeam = useMutation({
        mutationFn: (payload: UpdateCoachTeamRequest) =>
            coachService.updateTeam(payload),
        onSuccess: invalidate,
    })

    const deleteTeam = useMutation({
        mutationFn: (teamId: string) => coachService.deleteTeam(teamId),
        onSuccess: invalidate,
    })

    return { createTeam, updateTeam, deleteTeam }
}

export function useCoachRoster(teamId: string | undefined) {
    return useQuery({
        queryKey: coachKeys.roster(teamId ?? ''),
        queryFn: () => coachService.getRoster(teamId as string),
        enabled: Boolean(teamId),
    })
}

export function usePlayerPerformance(playerId: string | undefined) {
    return useQuery({
        queryKey: coachKeys.performance(playerId ?? ''),
        queryFn: () => coachService.getPlayerPerformance(playerId as string),
        enabled: Boolean(playerId),
    })
}

export function useUpcomingFixtures() {
    return useQuery({
        queryKey: coachKeys.upcoming,
        queryFn: () => coachService.getUpcomingFixtures(),
    })
}

export function useMatchHistory(teamId?: string) {
    return useQuery({
        queryKey: coachKeys.history(teamId),
        queryFn: () => coachService.getMatchHistory(teamId),
    })
}

export function useCoachInjuries(teamId?: string) {
    return useQuery({
        queryKey: coachKeys.injuries(teamId),
        queryFn: () => coachService.getInjuries(teamId),
    })
}

export function useCoachAnnouncements() {
    return useQuery({
        queryKey: coachKeys.announcements,
        queryFn: () => coachService.getAnnouncements(),
    })
}

export function useCoachAnalytics() {
    return useQuery({
        queryKey: coachKeys.analytics,
        queryFn: () => coachService.getAnalytics(),
    })
}

export function useMetricInsights() {
    return useQuery({
        queryKey: coachKeys.metricInsights,
        queryFn: () => coachService.getMetricInsights(),
    })
}

export function usePlayerGrowth(playerId: string | undefined, season?: string) {
    return useQuery({
        queryKey: season
            ? coachKeys.playerGrowthSeason(playerId ?? '', season)
            : coachKeys.playerGrowth(playerId ?? ''),
        queryFn: () => coachService.getPlayerGrowth(playerId as string, season),
        enabled: Boolean(playerId),
    })
}

export function usePlayerSkills(playerId: string | undefined) {
    return useQuery({
        queryKey: coachKeys.playerSkills(playerId ?? ''),
        queryFn: () => coachService.getPlayerSkills(playerId as string),
        enabled: Boolean(playerId),
    })
}

export function usePlayerAchievements(playerId: string | undefined) {
    return useQuery({
        queryKey: coachKeys.playerAchievements(playerId ?? ''),
        queryFn: () => coachService.getPlayerAchievements(playerId as string),
        enabled: Boolean(playerId),
    })
}

export function usePlayerInjuries(playerId: string | undefined) {
    return useQuery({
        queryKey: coachKeys.playerInjuries(playerId ?? ''),
        queryFn: () => coachService.getPlayerInjuries(playerId as string),
        enabled: Boolean(playerId),
    })
}

export function useSquadAttendance(teamId: string | undefined, sessionDate: string) {
    return useQuery({
        queryKey: coachKeys.squadAttendance(teamId ?? 'all', sessionDate),
        queryFn: () => coachService.getSquadAttendance(teamId, sessionDate),
        enabled: Boolean(sessionDate),
    })
}

export function useTrainingAttendanceMutation(teamId: string | undefined, sessionDate: string) {
    const queryClient = useQueryClient()

    return useMutation({
        mutationFn: coachService.markTrainingAttendance,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: coachKeys.squadAttendance(teamId ?? 'all', sessionDate) })
        },
    })
}

export function useMatchAvailability(matchId: string | undefined) {
    return useQuery({
        queryKey: coachKeys.availability(matchId ?? ''),
        queryFn: () => coachService.getMatchAvailability(matchId as string),
        enabled: Boolean(matchId),
        refetchInterval: 15000,
    })
}

export function useAvailabilityMutations(matchId: string | undefined) {
    const queryClient = useQueryClient()
    const invalidate = () => {
        if (matchId) {
            queryClient.invalidateQueries({ queryKey: coachKeys.availability(matchId) })
        }
    }

    const requestAvailability = useMutation({
        mutationFn: (playerIds: string[]) => coachService.requestAvailability(matchId as string, { playerIds }),
        onSuccess: invalidate,
    })

    const updateAvailability = useMutation({
        mutationFn: (players: Array<{ playerId: string; status: string }>) =>
            coachService.updateAvailability(matchId as string, { players }),
        onSuccess: invalidate,
    })

    return { requestAvailability, updateAvailability }
}

export function useTacticalLayout(matchId: string | undefined) {
    return useQuery({
        queryKey: coachKeys.tactics(matchId ?? ''),
        queryFn: () => coachService.getTacticalLayout(matchId as string),
        enabled: Boolean(matchId),
    })
}

export function useSaveTacticalLayout() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: coachService.saveTacticalLayout,
        onSuccess: (result) => {
            queryClient.invalidateQueries({ queryKey: coachKeys.tactics(result.matchId) })
        },
    })
}

export function useAlerts() {
    return useQuery({
        queryKey: coachKeys.alerts,
        queryFn: () => coachService.getAlerts(),
        refetchInterval: 15000,
    })
}

export function useMarkAlertRead() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: coachService.markAlertRead,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: coachKeys.alerts })
        },
    })
}

export function useCsvImportMutation(teamId: string | undefined) {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: (file: File) => coachService.importPlayersCsv(teamId as string, file),
        onSuccess: () => {
            if (teamId) {
                queryClient.invalidateQueries({ queryKey: coachKeys.roster(teamId) })
            }
            queryClient.invalidateQueries({ queryKey: coachKeys.teams })
        },
    })
}

export function usePositionalDepth() {
    return useQuery({
        queryKey: coachKeys.positionalDepth,
        queryFn: () => coachService.getPositionalDepth(),
    })
}

export function useSquadFatigue() {
    return useQuery({
        queryKey: coachKeys.squadFatigue,
        queryFn: () => coachService.getSquadFatigue(),
    })
}

export function useTrainingCorrelation() {
    return useQuery({
        queryKey: coachKeys.trainingCorrelation,
        queryFn: () => coachService.getTrainingCorrelation(),
    })
}

export function useChemistryPairs(top = 5) {
    return useQuery({
        queryKey: coachKeys.chemistryPairs(top),
        queryFn: () => coachService.getChemistryPairs(top),
    })
}

export function useGlobalSearch(
    query: string,
    options?: {
        type?: string
        page?: number
        pageSize?: number
        teamId?: string
        clubId?: string
        enabled?: boolean
    }
) {
    const type = options?.type ?? 'all'
    const page = options?.page ?? 1
    const pageSize = options?.pageSize ?? 8
    const enabled = options?.enabled ?? query.trim().length >= 2

    return useQuery({
        queryKey: coachKeys.globalSearch(query, type, page, pageSize),
        queryFn: () => coachService.search({
            q: query,
            type,
            page,
            pageSize,
            teamId: options?.teamId,
            clubId: options?.clubId,
        }),
        enabled,
    })
}

export function useLiveMatch(matchId: string) {
    const queryClient = useQueryClient()

    const liveMatchQuery = useQuery({
        queryKey: coachKeys.liveMatch(matchId),
        queryFn: () => matchService.getLiveMatch(matchId),
        enabled: Boolean(matchId),
    })

    const postMatchEvent = useMutation({
        mutationFn: (payload: CreateMatchEventRequest) =>
            matchService.postMatchEvent(matchId, payload),
        onMutate: async (payload) => {
            await queryClient.cancelQueries({ queryKey: coachKeys.liveMatch(matchId) })
            const previous = queryClient.getQueryData(coachKeys.liveMatch(matchId))
            const tempId = `temp-${Date.now()}-${Math.random().toString(36).slice(2)}`
            queryClient.setQueryData(coachKeys.liveMatch(matchId), (current: any) => {
                if (!current) return current
                const next = structuredClone(current)
                const event = {
                    id: tempId,
                    matchId,
                    playerId: payload.playerId,
                    playerName: payload.playerName,
                    kind: payload.kind,
                    side: payload.side,
                    minute: payload.minute,
                    createdAt: new Date().toISOString(),
                }
                next.events = [event, ...next.events]
                const player = next.players.find((p: any) => p.playerId === payload.playerId)
                if (player) {
                    if (payload.kind === 'Goal') player.goals += 1
                    if (payload.kind === 'Assist') player.assists += 1
                    if (payload.kind === 'YellowCard') player.yellowCards += 1
                    player.metricScore = Math.min(
                        100,
                        player.goals * 12 + player.assists * 8 - player.yellowCards * 5 + 50
                    )
                }
                if (payload.kind === 'Goal') {
                    if (payload.side === 'home') next.homeScore += 1
                    else next.awayScore += 1
                }
                return next
            })
            return { previous, tempId }
        },
        onError: (_error, _payload, context) => {
            if (context?.previous) {
                queryClient.setQueryData(coachKeys.liveMatch(matchId), context.previous)
            }
        },
        onSuccess: (event, _payload, context) => {
            queryClient.setQueryData(coachKeys.liveMatch(matchId), (current: any) => {
                if (!current) return current
                const next = structuredClone(current)
                const index = next.events.findIndex((item: any) => item.id === context?.tempId)
                if (index >= 0) next.events[index] = event
                return next
            })
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: coachKeys.liveMatch(matchId) })
        },
    })

    return { liveMatchQuery, postMatchEvent }
}

export function useRosterMutations(teamId: string | undefined) {
    const queryClient = useQueryClient()
    const invalidate = () => {
        queryClient.invalidateQueries({ queryKey: coachKeys.dashboard })
        if (teamId) {
            queryClient.invalidateQueries({ queryKey: coachKeys.roster(teamId) })
        }
        queryClient.invalidateQueries({ queryKey: coachKeys.teams })
    }

    const addPlayer = useMutation({
        mutationFn: (payload: CreateRosterPlayerRequest) =>
            coachService.addPlayer(teamId as string, payload),
        onSuccess: invalidate,
    })

    const updatePlayer = useMutation({
        mutationFn: ({
            playerId,
            payload,
        }: {
            playerId: string
            payload: UpdateRosterPlayerRequest
        }) => coachService.updatePlayer(teamId as string, playerId, payload),
        onSuccess: invalidate,
    })

    const removePlayer = useMutation({
        mutationFn: (playerId: string) =>
            coachService.removePlayer(teamId as string, playerId),
        onSuccess: invalidate,
    })

    const importPlayers = useMutation({
        mutationFn: (payload: ImportPlayersRequest) =>
            coachService.importPlayers(teamId as string, payload),
        onSuccess: invalidate,
    })

    const inviteGuardian = useMutation({
        mutationFn: (payload: InviteGuardianRequest) =>
            coachService.inviteGuardian(payload),
        onSuccess: invalidate,
    })

    return {
        addPlayer,
        updatePlayer,
        removePlayer,
        importPlayers,
        inviteGuardian,
    }
}

export function useMatchMutations() {
    const queryClient = useQueryClient()

    const invalidateSchedule = () => {
        queryClient.invalidateQueries({ queryKey: coachKeys.upcoming })
        queryClient.invalidateQueries({ queryKey: coachKeys.dashboard })
        queryClient.invalidateQueries({
            queryKey: ['coach', 'schedule', 'history'],
        })
    }

    const createMatch = useMutation({
        mutationFn: (payload: CreateFixtureRequest) =>
            coachService.createMatch(payload),
        onSuccess: invalidateSchedule,
    })

    const updateMatch = useMutation({
        mutationFn: (payload: UpdateFixtureRequest) =>
            coachService.updateMatch(payload),
        onSuccess: invalidateSchedule,
    })

    const cancelMatch = useMutation({
        mutationFn: (fixtureId: string) => coachService.cancelMatch(fixtureId),
        onSuccess: invalidateSchedule,
    })

    const deleteMatch = useMutation({
        mutationFn: (fixtureId: string) => coachService.deleteMatch(fixtureId),
        onSuccess: invalidateSchedule,
    })

    return { createMatch, updateMatch, cancelMatch, deleteMatch }
}

export function useAnnouncementMutations() {
    const queryClient = useQueryClient()
    const invalidate = () => {
        queryClient.invalidateQueries({ queryKey: coachKeys.announcements })
        queryClient.invalidateQueries({ queryKey: coachKeys.dashboard })
    }

    const createAnnouncement = useMutation({
        mutationFn: (payload: CreateAnnouncementRequest) =>
            coachService.createAnnouncement(payload),
        onSuccess: invalidate,
    })

    const updateAnnouncement = useMutation({
        mutationFn: (payload: UpdateAnnouncementRequest) =>
            coachService.updateAnnouncement(payload),
        onSuccess: invalidate,
    })

    const deleteAnnouncement = useMutation({
        mutationFn: (id: string) => coachService.deleteAnnouncement(id),
        onSuccess: invalidate,
    })

    return { createAnnouncement, updateAnnouncement, deleteAnnouncement }
}

export function useInjuryMutations() {
    const queryClient = useQueryClient()
    const invalidate = () => {
        queryClient.invalidateQueries({ queryKey: ['coach', 'injuries'] })
        queryClient.invalidateQueries({ queryKey: coachKeys.dashboard })
        queryClient.invalidateQueries({ queryKey: coachKeys.analytics })
    }

    const createInjury = useMutation({
        mutationFn: (payload: CreateInjuryRequest) =>
            coachService.createInjury(payload),
        onSuccess: invalidate,
    })

    const updateInjury = useMutation({
        mutationFn: (payload: UpdateInjuryRequest) =>
            coachService.updateInjury(payload),
        onSuccess: invalidate,
    })

    const deleteInjury = useMutation({
        mutationFn: (injuryId: string) => coachService.deleteInjury(injuryId),
        onSuccess: invalidate,
    })

    return { createInjury, updateInjury, deleteInjury }
}
