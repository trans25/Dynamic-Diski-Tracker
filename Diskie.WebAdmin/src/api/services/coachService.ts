import { apiClient, unwrap } from '../apiClient'
import type {
  AnnouncementViewModel,
  ApiResponse,
  CoachAnalyticsViewModel,
  CoachDashboardViewModel,
  CoachTeamViewModel,
  MatchAvailabilityItemViewModel,
  MetricInsightsViewModel,
  MarkTrainingAttendanceRequest,
  PlayerGrowthPointViewModel,
  PlayerSkillsViewModel,
  PlayerAchievementViewModel,
  PositionalDepthItemViewModel,
  SquadAttendanceSummaryViewModel,
  SquadFatigueItemViewModel,
  TrainingMatchCorrelationPointViewModel,
  ChemistryPairViewModel,
  CreateAnnouncementRequest,
  CreateCoachTeamRequest,
  CreateFixtureRequest,
  CreateInjuryRequest,
  CreateRosterPlayerRequest,
  FixtureViewModel,
  GuardianInviteResultViewModel,
    GlobalSearchResponseViewModel,
  ImportPlayersRequest,
    ImportPlayersCsvResultViewModel,
    RequestAvailabilityRequest,
    SaveTacticalLayoutRequest,
    TacticalLayoutViewModel,
    UpdateMatchAvailabilityRequest,
    AlertsResponseViewModel,
  ImportPlayersResultViewModel,
  InjuryViewModel,
  InviteGuardianRequest,
  PlayerPerformanceViewModel,
  RosterPlayerViewModel,
  SportTemplateViewModel,
  UpdateAnnouncementRequest,
  UpdateCoachTeamRequest,
  UpdateFixtureRequest,
  UpdateInjuryRequest,
  UpdateRosterPlayerRequest,
} from '../types'

// Maps to the Coach module controllers (api/coach/*).
export const coachService = {
  async getDashboard(): Promise<CoachDashboardViewModel> {
    const res = await apiClient.get<ApiResponse<CoachDashboardViewModel>>(
      '/coach/dashboard'
    )
    return unwrap(res)
  },

  async seedDemoData(): Promise<void> {
    await apiClient.post<ApiResponse<object>>('/dev/seed')
  },

  async resetDemoData(): Promise<void> {
    await apiClient.post<ApiResponse<object>>('/dev/reset-seed')
  },

  async getTeams(): Promise<CoachTeamViewModel[]> {
    const res = await apiClient.get<ApiResponse<CoachTeamViewModel[]>>(
      '/coach/teams'
    )
    return unwrap(res)
  },

  async getTemplates(): Promise<SportTemplateViewModel[]> {
    const res = await apiClient.get<ApiResponse<SportTemplateViewModel[]>>(
      '/coach/teams/templates'
    )
    return unwrap(res)
  },

  async createTeam(
    payload: CreateCoachTeamRequest
  ): Promise<CoachTeamViewModel> {
    const res = await apiClient.post<ApiResponse<CoachTeamViewModel>>(
      '/coach/teams',
      payload
    )
    return unwrap(res)
  },

  async updateTeam(
    payload: UpdateCoachTeamRequest
  ): Promise<CoachTeamViewModel> {
    const res = await apiClient.put<ApiResponse<CoachTeamViewModel>>(
      `/coach/teams/${payload.id}`,
      payload
    )
    return unwrap(res)
  },

  async deleteTeam(teamId: string): Promise<void> {
    await apiClient.delete<ApiResponse<unknown>>(`/coach/teams/${teamId}`)
  },

  async getRoster(teamId: string): Promise<RosterPlayerViewModel[]> {
    const res = await apiClient.get<ApiResponse<RosterPlayerViewModel[]>>(
      `/coach/teams/${teamId}/roster`
    )
    return unwrap(res)
  },

  async addPlayer(
    teamId: string,
    payload: CreateRosterPlayerRequest
  ): Promise<RosterPlayerViewModel> {
    const res = await apiClient.post<ApiResponse<RosterPlayerViewModel>>(
      `/coach/teams/${teamId}/roster`,
      payload
    )
    return unwrap(res)
  },

  async updatePlayer(
    teamId: string,
    playerId: string,
    payload: UpdateRosterPlayerRequest
  ): Promise<RosterPlayerViewModel> {
    const res = await apiClient.put<ApiResponse<RosterPlayerViewModel>>(
      `/coach/teams/${teamId}/roster/${playerId}`,
      payload
    )
    return unwrap(res)
  },

  async removePlayer(teamId: string, playerId: string): Promise<void> {
    await apiClient.delete<ApiResponse<unknown>>(
      `/coach/teams/${teamId}/roster/${playerId}`
    )
  },

  async importPlayers(
    teamId: string,
    payload: ImportPlayersRequest
  ): Promise<ImportPlayersResultViewModel> {
    const res = await apiClient.post<ApiResponse<ImportPlayersResultViewModel>>(
      `/coach/teams/${teamId}/roster/import`,
      payload
    )
    return unwrap(res)
  },

    async importPlayersCsv(teamId: string, file: File): Promise<ImportPlayersCsvResultViewModel> {
      const formData = new FormData()
      formData.append('file', file)
      const res = await apiClient.post<ApiResponse<ImportPlayersCsvResultViewModel>>(
        `/players/import?teamId=${encodeURIComponent(teamId)}`,
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      )
      return unwrap(res)
    },

  async getPlayerPerformance(
    playerId: string
  ): Promise<PlayerPerformanceViewModel> {
    const res = await apiClient.get<ApiResponse<PlayerPerformanceViewModel>>(
      `/coach/teams/players/${playerId}/performance`
    )
    return unwrap(res)
  },

    async getPlayerInjuries(playerId: string): Promise<InjuryViewModel[]> {
      const res = await apiClient.get<ApiResponse<InjuryViewModel[]>>(
        `/player/${playerId}/injuries`
      )
      return unwrap(res)
    },

    async createPlayerInjury(payload: CreateInjuryRequest): Promise<InjuryViewModel> {
      const res = await apiClient.post<ApiResponse<InjuryViewModel>>(
        '/player/injury',
        payload
      )
      return unwrap(res)
    },

  async inviteGuardian(
    payload: InviteGuardianRequest
  ): Promise<GuardianInviteResultViewModel> {
    const res = await apiClient.post<ApiResponse<GuardianInviteResultViewModel>>(
      '/coach/teams/guardians/invite',
      payload
    )
    return unwrap(res)
  },

  async getUpcomingFixtures(): Promise<FixtureViewModel[]> {
    const res = await apiClient.get<ApiResponse<FixtureViewModel[]>>(
      '/coach/schedule/upcoming'
    )
    return unwrap(res)
  },

  async getMatchHistory(teamId?: string): Promise<FixtureViewModel[]> {
    const res = await apiClient.get<ApiResponse<FixtureViewModel[]>>(
      '/coach/schedule/history',
      { params: teamId ? { teamId } : undefined }
    )
    return unwrap(res)
  },

  async createMatch(payload: CreateFixtureRequest): Promise<FixtureViewModel> {
    const res = await apiClient.post<ApiResponse<FixtureViewModel>>(
      '/coach/schedule/matches',
      payload
    )
    return unwrap(res)
  },

  async updateMatch(payload: UpdateFixtureRequest): Promise<FixtureViewModel> {
    const res = await apiClient.put<ApiResponse<FixtureViewModel>>(
      `/coach/schedule/matches/${payload.id}`,
      payload
    )
    return unwrap(res)
  },

  async cancelMatch(fixtureId: string): Promise<FixtureViewModel> {
    const res = await apiClient.patch<ApiResponse<FixtureViewModel>>(
      `/coach/schedule/matches/${fixtureId}/cancel`
    )
    return unwrap(res)
  },

  async deleteMatch(fixtureId: string): Promise<void> {
    await apiClient.delete<ApiResponse<unknown>>(
      `/coach/schedule/matches/${fixtureId}`
    )
  },

  async getInjuries(teamId?: string): Promise<InjuryViewModel[]> {
    const res = await apiClient.get<ApiResponse<InjuryViewModel[]>>(
      '/coach/injuries',
      { params: teamId ? { teamId } : undefined }
    )
    return unwrap(res)
  },

  async createInjury(payload: CreateInjuryRequest): Promise<InjuryViewModel> {
    const res = await apiClient.post<ApiResponse<InjuryViewModel>>(
      '/coach/injuries',
      payload
    )
    return unwrap(res)
  },

  async updateInjury(payload: UpdateInjuryRequest): Promise<InjuryViewModel> {
    const res = await apiClient.put<ApiResponse<InjuryViewModel>>(
      `/coach/injuries/${payload.id}`,
      payload
    )
    return unwrap(res)
  },

  async deleteInjury(injuryId: string): Promise<void> {
    await apiClient.delete<ApiResponse<unknown>>(`/coach/injuries/${injuryId}`)
  },

  async getAnnouncements(): Promise<AnnouncementViewModel[]> {
    const res = await apiClient.get<ApiResponse<AnnouncementViewModel[]>>(
      '/coach/announcements'
    )
    return unwrap(res)
  },

  async createAnnouncement(
    payload: CreateAnnouncementRequest
  ): Promise<AnnouncementViewModel> {
    const res = await apiClient.post<ApiResponse<AnnouncementViewModel>>(
      '/coach/announcements',
      payload
    )
    return unwrap(res)
  },

  async updateAnnouncement(
    payload: UpdateAnnouncementRequest
  ): Promise<AnnouncementViewModel> {
    const res = await apiClient.put<ApiResponse<AnnouncementViewModel>>(
      `/coach/announcements/${payload.id}`,
      payload
    )
    return unwrap(res)
  },

  async deleteAnnouncement(id: string): Promise<void> {
    await apiClient.delete<ApiResponse<unknown>>(
      `/coach/announcements/${id}`
    )
  },

  async getAnalytics(): Promise<CoachAnalyticsViewModel> {
    const res = await apiClient.get<ApiResponse<CoachAnalyticsViewModel>>(
      '/coach/analytics'
    )
    return unwrap(res)
  },

  async getMetricInsights(): Promise<MetricInsightsViewModel> {
    const res = await apiClient.get<ApiResponse<MetricInsightsViewModel>>(
      '/coach/analytics/metric-insights'
    )
    return unwrap(res)
  },

  async getPlayerGrowth(playerId: string, season?: string): Promise<PlayerGrowthPointViewModel[]> {
    const res = await apiClient.get<ApiResponse<PlayerGrowthPointViewModel[]>>(
      `/player/${playerId}/growth`,
      { params: season ? { season } : undefined }
    )
    return unwrap(res)
  },

  async getPlayerSkills(playerId: string): Promise<PlayerSkillsViewModel> {
    const res = await apiClient.get<ApiResponse<PlayerSkillsViewModel>>(
      `/player/${playerId}/skills`
    )
    return unwrap(res)
  },

  async getPlayerAchievements(playerId: string): Promise<PlayerAchievementViewModel[]> {
    const res = await apiClient.get<ApiResponse<PlayerAchievementViewModel[]>>(
      `/player/${playerId}/achievements`
    )
    return unwrap(res)
  },

  async getSquadAttendance(teamId?: string, sessionDate?: string): Promise<SquadAttendanceSummaryViewModel[]> {
    const res = await apiClient.get<ApiResponse<SquadAttendanceSummaryViewModel[]>>(
      '/squad/attendance',
      { params: { teamId, sessionDate } }
    )
    return unwrap(res)
  },

  async markTrainingAttendance(payload: MarkTrainingAttendanceRequest): Promise<SquadAttendanceSummaryViewModel> {
    const res = await apiClient.post<ApiResponse<SquadAttendanceSummaryViewModel>>(
      '/training/attendance',
      payload
    )
    return unwrap(res)
  },

  async getPositionalDepth(): Promise<PositionalDepthItemViewModel[]> {
    const res = await apiClient.get<ApiResponse<PositionalDepthItemViewModel[]>>(
      '/squad/positional-depth'
    )
    return unwrap(res)
  },

  async getSquadFatigue(): Promise<SquadFatigueItemViewModel[]> {
    const res = await apiClient.get<ApiResponse<SquadFatigueItemViewModel[]>>(
      '/squad/fatigue'
    )
    return unwrap(res)
  },

  async getTrainingCorrelation(): Promise<TrainingMatchCorrelationPointViewModel[]> {
    const res = await apiClient.get<ApiResponse<TrainingMatchCorrelationPointViewModel[]>>(
      '/analytics/training-correlation'
    )
    return unwrap(res)
  },

  async getChemistryPairs(top = 5): Promise<ChemistryPairViewModel[]> {
    const res = await apiClient.get<ApiResponse<ChemistryPairViewModel[]>>(
      '/analytics/chemistry-pairs',
      { params: { top } }
    )
    return unwrap(res)
  },

    async getMatchAvailability(matchId: string): Promise<MatchAvailabilityItemViewModel[]> {
      const res = await apiClient.get<ApiResponse<MatchAvailabilityItemViewModel[]>>(
        `/matches/${matchId}/availability`
      )
      return unwrap(res)
    },

    async requestAvailability(matchId: string, payload: RequestAvailabilityRequest): Promise<MatchAvailabilityItemViewModel[]> {
      const res = await apiClient.post<ApiResponse<MatchAvailabilityItemViewModel[]>>(
        `/matches/${matchId}/availability/request`,
        payload
      )
      return unwrap(res)
    },

    async updateAvailability(matchId: string, payload: UpdateMatchAvailabilityRequest): Promise<MatchAvailabilityItemViewModel[]> {
      const res = await apiClient.post<ApiResponse<MatchAvailabilityItemViewModel[]>>(
        `/matches/${matchId}/availability`,
        payload
      )
      return unwrap(res)
    },

    async getTacticalLayout(matchId: string): Promise<TacticalLayoutViewModel> {
      const res = await apiClient.get<ApiResponse<TacticalLayoutViewModel>>(
        `/tactics/${matchId}`
      )
      return unwrap(res)
    },

    async saveTacticalLayout(payload: SaveTacticalLayoutRequest): Promise<TacticalLayoutViewModel> {
      const res = await apiClient.post<ApiResponse<TacticalLayoutViewModel>>(
        '/tactics/save',
        payload
      )
      return unwrap(res)
    },

    async getAlerts(): Promise<AlertsResponseViewModel> {
      const res = await apiClient.get<ApiResponse<AlertsResponseViewModel>>('/alerts')
      return unwrap(res)
    },

    async markAlertRead(alertId: string): Promise<void> {
      await apiClient.post<ApiResponse<object>>(`/alerts/${alertId}/read`)
    },

  async search(params: {
    q: string
    type?: string
    page?: number
    pageSize?: number
    teamId?: string
    clubId?: string
  }): Promise<GlobalSearchResponseViewModel> {
    const res = await apiClient.get<ApiResponse<GlobalSearchResponseViewModel>>(
      '/search',
      { params }
    )
    return unwrap(res)
  },
}
