/**
 * TypeScript models mirroring the Diskie.API C# view models and enums.
 * Kept in sync with Diskie.DataAccess.Model/Models/ViewModels and Enums.
 */

// ---- Enums (string unions matching C# enum names) ----
export const UserRole = {
  SuperAdmin: 'SuperAdmin',
  SchoolAdmin: 'SchoolAdmin',
  Coach: 'Coach',
  Player: 'Player',
  Guardian: 'Guardian',
} as const
export type UserRole = (typeof UserRole)[keyof typeof UserRole]

export const BillingPlan = {
  Free: 'Free',
  Starter: 'Starter',
  Pro: 'Pro',
  Enterprise: 'Enterprise',
} as const
export type BillingPlan = (typeof BillingPlan)[keyof typeof BillingPlan]

export const SportType = {
  Football: 'Football',
  Rugby: 'Rugby',
  Netball: 'Netball',
  Cricket: 'Cricket',
} as const
export type SportType = (typeof SportType)[keyof typeof SportType]

export const SportRequestStatus = {
  Pending: 'Pending',
  Approved: 'Approved',
  Rejected: 'Rejected',
} as const
export type SportRequestStatus = (typeof SportRequestStatus)[keyof typeof SportRequestStatus]

// The API serializes enums as numbers by default (System.Text.Json).
// These arrays map the numeric value <-> name based on C# declaration order.
export const userRoleNames: UserRole[] = [
  'SuperAdmin',
  'SchoolAdmin',
  'Coach',
  'Player',
  'Guardian',
]

export const billingPlanNames: BillingPlan[] = [
  'Free',
  'Starter',
  'Pro',
  'Enterprise',
]

// ---- Common API envelope ----
export interface ApiResponse<T> {
  success: boolean
  message: string
  code: string
  data?: T
}

// ---- Auth ----
export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  email: string
  password: string
  firstName: string
  lastName: string
  role: number
  phone?: string | null
  clubName?: string | null
  tenantId?: string | null
  requestedSportTemplateId?: string | null
}

export interface ForgotPasswordRequest {
  email: string
}

export interface ForgotPasswordResponse {
  email: string
  resetToken: string
}

export interface ResetPasswordRequest {
  email: string
  token: string
  newPassword: string
}

export interface AuthResponse {
  accessToken: string
  tokenType: string
  expiresAt: string
  user: UserViewModel
}

export interface ParentMagicLinkRequest {
  childIdNumber: string
}

export interface ParentMagicLinkResponse {
  magicLink?: string | null
  expiresAt?: string | null
}

export interface ParentMagicTokenExchangeRequest {
  token: string
}

export interface ParentAuthResponse {
  accessToken: string
  tokenType: string
  expiresAt: string
  childId: string
  childName?: string | null
  role?: number | string | null
}

export interface PlayerParentOtpRequest {
  contact: string
  method: 'phone' | 'email'
}

export interface PlayerParentOtpRequestResponse {
  success: boolean
  challengeId?: string | null
  expiresIn?: number | null
  resendAfterSeconds?: number | null
  maxAttempts?: number | null
}

export interface PlayerParentOtpVerifyRequest {
  contact: string
  method: 'phone' | 'email'
  code: string
  challengeId?: string
}

// ---- Users ----
export interface UserViewModel {
  id: string
  tenantId?: string | null
  role: number
  email?: string | null
  phone?: string | null
  firstName: string
  lastName: string
  profilePhotoUrl?: string | null
  isActive: boolean
  lastLoginAt?: string | null
  dateOfBirth?: string | null
  gender?: string | null
  emergencyContactName?: string | null
  emergencyContactPhone?: string | null
  emergencyContactRelationship?: string | null
  jerseyNumber?: number | null
  preferredPosition?: string | null
  isBoarding?: boolean
  relationship?: string | null
  isPrimaryGuardian?: boolean
  canConsent?: boolean
  receivesUpdates?: boolean
  qualification?: string | null
  experienceYears?: number | null
  sportSpecializations?: string[] | null
  coachingLicense?: string | null
}

export interface AssignRoleRequest {
  userId: string
  role: number
}

// ---- Tenants ----
export interface TenantViewModel {
  id: string
  name: string
  address?: string | null
  city?: string | null
  province?: string | null
  phone?: string | null
  email?: string | null
  logoUrl?: string | null
  assignedSportTemplateId?: string | null
  assignedSportTemplateName?: string | null
  isActive: boolean
  isApproved: boolean
  createdAt: string
  updatedAt: string
}

export interface CreateTenantRequest {
  name: string
  address?: string | null
  city?: string | null
  province?: string | null
  phone?: string | null
  email?: string | null
  logoUrl?: string | null
  assignedSportTemplateId?: string | null
}

export interface UpdateTenantRequest extends CreateTenantRequest {
  id: string
  isActive: boolean
  isApproved: boolean
}

// ---- Billing ----
export interface TenantBillingViewModel {
  tenantId: string
  tenantName: string
  billingPlan: number
  billingPlanAssignedAt?: string | null
}

export interface AssignBillingPlanRequest {
  tenantId: string
  billingPlan: number
}

// ---- Sport Templates ----
export interface AssessmentMetric {
  key: string
  displayName: string
  type: string
  description?: string | null
  minValue?: number | null
  maxValue?: number | null
  isRequired: boolean
}

export interface MatchStatField {
  key: string
  displayName: string
  type: string
  description?: string | null
  defaultValue?: number | null
}

export interface SportTemplateViewModel {
  id: string
  name: string
  displayName: string
  sportType: SportType
  icon?: string | null
  description?: string | null
  metricDefinitions: string
  positionDefinitions: string
  assessmentMetrics: AssessmentMetric[]
  matchStatsFields: MatchStatField[]
  positionOptions?: string[] | null
  defaultSeasonWeeks?: number | null
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface CreateSportTemplateRequest {
  name: string
  displayName: string
  sportType?: SportType
  icon?: string | null
  description?: string | null
  metricDefinitions?: string
  positionDefinitions?: string
  assessmentMetrics: AssessmentMetric[]
  matchStatsFields: MatchStatField[]
  positionOptions?: string[] | null
  defaultSeasonWeeks?: number | null
}

export interface UpdateSportTemplateRequest extends CreateSportTemplateRequest {
  id: string
  isActive: boolean
}

export interface PendingSportRequestViewModel {
  id: string
  tenantId: string
  tenantName: string
  tenantEmail?: string | null
  city?: string | null
  province?: string | null
  requestedSportTemplateId: string
  requestedSportTemplateName: string
  sportType: SportType
  status: SportRequestStatus
  requestedDate: string
}

// ---- Health ----
export interface HealthCheckItem {
  component: string
  status: string
  description?: string | null
}

export interface SystemHealthViewModel {
  status: string
  checkedAt: string
  uptimeSeconds: number
  checks: HealthCheckItem[]
}

// ---- Dashboard ----
export interface SuperAdminDashboardViewModel {
  totalTenants: number
  activeTenants: number
  suspendedTenants: number
  totalUsers: number
  activeUsers: number
  totalSportTemplates: number
  tenantsByBillingPlan: Record<string, number>
  usersByRole: Record<string, number>
  generatedAt: string
}

// ---- Coach enum helpers ----
// FixtureType: Home, Away, Neutral (C# declaration order).
export const fixtureTypeNames = ['Home', 'Away', 'Neutral'] as const
// FixtureResult: Win, Loss, Draw, Cancelled, Postponed.
export const fixtureResultNames = [
  'Win',
  'Loss',
  'Draw',
  'Cancelled',
  'Postponed',
] as const
// InjurySeverity: Mild, Moderate, Severe.
export const injurySeverityNames = ['Mild', 'Moderate', 'Severe'] as const
// InjuryStatus: Active, Recovering, Recovered.
export const injuryStatusNames = ['Active', 'Recovering', 'Recovered'] as const
// AnnouncementAudience: Team, Players, Guardians, Everyone.
export const announcementAudienceNames = [
  'Team',
  'Players',
  'Guardians',
  'Everyone',
] as const
// AnnouncementPriority: Normal, Important, Urgent.
export const announcementPriorityNames = [
  'Normal',
  'Important',
  'Urgent',
] as const
// MessageChannel: WhatsApp, Email, Sms, Push.
export const messageChannelNames = ['WhatsApp', 'Email', 'Sms', 'Push'] as const

// ---- Coach: Teams & Roster ----
export interface CoachTeamViewModel {
  id: string
  tenantId: string
  seasonId: string
  sportTemplateId: string
  name: string
  ageGroup?: string | null
  genderCategory?: string | null
  level?: string | null
  coachRole?: string | null
  isPrimaryCoach: boolean
  playerCount: number
  isActive: boolean
}

export interface RosterPlayerViewModel {
  playerId: string
  teamId: string
  firstName: string
  lastName: string
  email?: string | null
  phone?: string | null
  profilePhotoUrl?: string | null
  jerseyNumber?: number | null
  position?: string | null
  teamRole?: string | null
  isActive: boolean
  hasActiveInjury: boolean
}

export interface CreateRosterPlayerRequest {
  fullName: string
  position?: string | null
  jerseyNumber?: number | null
  dateOfBirth?: string | null
  guardianName?: string | null
  guardianEmail?: string | null
  guardianPhone?: string | null
}

export interface UpdateRosterPlayerRequest {
  fullName: string
  position?: string | null
  jerseyNumber?: number | null
  teamRole?: string | null
  isActive: boolean
}

export interface CreateCoachTeamRequest {
  sportTemplateId: string
  name: string
  ageGroup?: string | null
  genderCategory?: string | null
  level?: string | null
  seasonId?: string | null
}

export interface UpdateCoachTeamRequest {
  id: string
  name: string
  ageGroup?: string | null
  genderCategory?: string | null
  level?: string | null
  isActive: boolean
}

export interface ImportPlayerRow {
  fullName: string
  position?: string | null
  jerseyNumber?: number | null
  dateOfBirth?: string | null
  guardianName?: string | null
  guardianEmail?: string | null
  guardianPhone?: string | null
}

export interface ImportPlayersRequest {
  players: ImportPlayerRow[]
}

export interface ImportPlayersResultViewModel {
  createdCount: number
  failedCount: number
  createdPlayers: RosterPlayerViewModel[]
  errors: string[]
}

// ---- Coach: Guardians ----
export interface InviteGuardianRequest {
  playerId: string
  guardianName: string
  guardianEmail: string
  guardianPhone?: string | null
  relationship?: string | null
  isPrimary: boolean
}

export interface GuardianInviteResultViewModel {
  guardianId: string
  playerId: string
  guardianName: string
  guardianEmail: string
  relationship?: string | null
  isPrimary: boolean
  accountCreated: boolean
}

// ---- Coach: Schedule & Matches ----
export interface FixtureViewModel {
  id: string
  teamId: string
  seasonId: string
  fixtureDate: string
  startTime: string
  endTime?: string | null
  venue?: string | null
  opponent?: string | null
  type: number
  result?: number | null
  homeScore?: number | null
  awayScore?: number | null
  matchReport?: string | null
  isTraining: boolean
  isCancelled: boolean
  createdAt: string
  updatedAt: string
}

export interface CreateFixtureRequest {
  teamId: string
  seasonId: string
  fixtureDate: string
  startTime: string
  endTime?: string | null
  venue?: string | null
  opponent?: string | null
  type: number
  isTraining: boolean
}

export interface UpdateFixtureRequest {
  id: string
  teamId: string
  seasonId: string
  fixtureDate: string
  startTime: string
  endTime?: string | null
  venue?: string | null
  opponent?: string | null
  type: number
  result?: number | null
  homeScore?: number | null
  awayScore?: number | null
  matchReport?: string | null
  isTraining: boolean
  isCancelled: boolean
}

export interface MatchAvailabilityItemViewModel {
  playerId: string
  playerName: string
  status: 'Available' | 'Unavailable' | 'NoResponse' | string
  responseDate?: string | null
  position?: string | null
}

export interface RequestAvailabilityRequest {
  playerIds: string[]
}

export interface UpdateAvailabilityItemRequest {
  playerId: string
  status: string
}

export interface UpdateMatchAvailabilityRequest {
  players: UpdateAvailabilityItemRequest[]
}

export interface TacticalLayoutItemViewModel {
  playerId: string
  playerName: string
  x: number
  y: number
}

export interface MatchdayPlannerViewModel {
  status: string
  captainId?: string | null
  viceCaptainId?: string | null
  penaltyTakerId?: string | null
  squadNotes?: string | null
  inPossessionPlan?: string | null
  outOfPossessionPlan?: string | null
  setPieceNotes?: string | null
}

export interface TacticalLayoutViewModel {
  matchId: string
  formationId?: string | null
  benchPlayerIds: string[]
  planner: MatchdayPlannerViewModel
  players: TacticalLayoutItemViewModel[]
}

export interface SaveTacticalLayoutRequest {
  matchId: string
  formationId?: string | null
  benchPlayerIds: string[]
  planner: MatchdayPlannerViewModel
  players: TacticalLayoutItemViewModel[]
}

export interface AlertViewModel {
  id: string
  playerId: string
  matchId?: string | null
  playerName: string
  message: string
  severity: 'info' | 'warning' | 'error' | string
  isRead: boolean
  createdAt: string
}

export interface AlertsResponseViewModel {
  unreadCount: number
  items: AlertViewModel[]
}

export interface ImportPlayersCsvResultViewModel {
  importedCount: number
  duplicateCount: number
  errors: string[]
}

// ---- Coach: Live Match ----
export type MatchEventKind = 'Goal' | 'Assist' | 'YellowCard'

export type MatchSide = 'home' | 'away'

export interface MatchEventViewModel {
  id: string
  matchId: string
  playerId: string
  playerName: string
  kind: MatchEventKind
  side: MatchSide
  minute: number
  createdAt: string
}

export interface MatchPlayerStatsViewModel {
  playerId: string
  playerName: string
  goals: number
  assists: number
  yellowCards: number
  metricScore: number
}

export interface LiveMatchViewModel {
  id: string
  homeTeamName: string
  awayTeamName: string
  homeScore: number
  awayScore: number
  clockSecondsRemaining: number
  formation: string
  status: 'Live' | 'Paused' | 'Finished'
  events: MatchEventViewModel[]
  players: MatchPlayerStatsViewModel[]
}

export interface CreateMatchEventRequest {
  playerId: string
  playerName: string
  kind: MatchEventKind
  side: MatchSide
  minute: number
}

// ---- Coach: Injuries ----
export interface InjuryViewModel {
  id: string
  playerId: string
  injuryType: string
  bodyPart: string
  severity: number
  occurredAt: string
  estimatedReturnDate?: string | null
  actualReturnDate?: string | null
  status: number
  medicalNotes?: string | null
  treatmentNotes?: string | null
  reportedBy?: string | null
  isMatchInjury: boolean
  fixtureId?: string | null
  createdAt: string
  updatedAt: string
}

export interface CreateInjuryRequest {
  playerId: string
  injuryType: string
  bodyPart: string
  severity: number
  occurredAt: string
  estimatedReturnDate?: string | null
  medicalNotes?: string | null
  treatmentNotes?: string | null
  isMatchInjury: boolean
  fixtureId?: string | null
}

export interface UpdateInjuryRequest {
  id: string
  injuryType: string
  bodyPart: string
  severity: number
  estimatedReturnDate?: string | null
  actualReturnDate?: string | null
  status: number
  medicalNotes?: string | null
  treatmentNotes?: string | null
}

// ---- Coach: Communication ----
export interface AnnouncementViewModel {
  id: string
  tenantId: string
  teamId?: string | null
  senderId: string
  title: string
  body: string
  audience: number
  priority: number
  channel: number
  sentAt?: string | null
  createdAt: string
  updatedAt: string
}

export interface CreateAnnouncementRequest {
  teamId?: string | null
  title: string
  body: string
  audience: number
  priority: number
  channel: number
}

export interface UpdateAnnouncementRequest {
  id: string
  teamId?: string | null
  title: string
  body: string
  audience: number
  priority: number
  channel: number
}

// ---- Coach: Dashboard ----
export interface CoachDashboardViewModel {
  teamCount: number
  playerCount: number
  upcomingFixtureCount: number
  activeInjuryCount: number
  assignedSportTemplate?: SportTemplateViewModel | null
  teams: CoachTeamViewModel[]
  upcomingFixtures: FixtureViewModel[]
  recentAnnouncements: AnnouncementViewModel[]
}

// ---- Coach: Player Performance ----
export interface PlayerAssessmentViewModel {
  id: string
  playerId: string
  coachId: string
  teamId: string
  assessmentDate: string
  freeText?: string | null
  overallRating?: number | null
  isMatchAssessment: boolean
  createdAt: string
}

export interface PlayerPerformanceViewModel {
  playerId: string
  firstName: string
  lastName: string
  profilePhotoUrl?: string | null
  jerseyNumber?: number | null
  position?: string | null
  totalSessions: number
  sessionsAttended: number
  attendanceRate: number
  assessmentCount: number
  averageRating?: number | null
  hasActiveInjury: boolean
  injuryCount: number
  recentInjuries: InjuryViewModel[]
  recentAssessments: PlayerAssessmentViewModel[]
}

// ---- Coach: Analytics ----
export interface TeamAnalyticsViewModel {
  teamId: string
  teamName: string
  playerCount: number
  matches: number
  wins: number
  losses: number
  draws: number
  winRate: number
  attendanceRate: number
  activeInjuryCount: number
}

export interface PlayerGrowthPointViewModel {
  matchDate: string
  rating: number
  goals: number
  assists: number
}

export interface PlayerSkillRadarPointViewModel {
  skill: string
  playerValue: number
  squadAverage: number
}

export interface PlayerSkillsViewModel {
  playerId: string
  playerName: string
  season: string
  points: PlayerSkillRadarPointViewModel[]
}

export interface MarkTrainingAttendanceRequest {
  playerId: string
  sessionDate: string
  isPresent: boolean
  isLate: boolean
}

export interface SquadAttendanceSummaryViewModel {
  playerId: string
  playerName: string
  attendancePercentage: number
  presentSessions: number
  totalSessions: number
  isPresentForSession?: boolean | null
  isLateForSession?: boolean | null
}

export interface PlayerAchievementViewModel {
  id: string
  playerId: string
  type: string
  title: string
  description: string
  iconKey: string
  awardedAt: string
}

export interface PositionalDepthItemViewModel {
  position: string
  averageRating: number
  squadAverage: number
  isBelowSquadAverage: boolean
}

export interface TrainingMatchCorrelationPointViewModel {
  playerId: string
  playerName: string
  trainingCount: number
  matchRating: number
}

export interface ChemistryPairViewModel {
  playerAId: string
  playerAName: string
  playerBId: string
  playerBName: string
  matchesTogether: number
  goalsPerGame: number
  winPercentage: number
  combinedGoalContributionsPerGame: number
}

export interface SquadFatigueItemViewModel {
  playerId: string
  playerName: string
  minutesPlayedLast7Days: number
  status: 'Fit' | 'Tired' | 'Exhausted'
}

export interface GlobalSearchItemViewModel {
  type: 'player' | 'match' | string
  id: string
  title: string
  subtitle: string
  createdAt: string
}

export interface GlobalSearchResponseViewModel {
  query: string
  typeFilter: string
  page: number
  pageSize: number
  totalCount: number
  items: GlobalSearchItemViewModel[]
}

export interface GlobalSearchRequest {
  q: string
  type?: string
  page?: number
  pageSize?: number
  teamId?: string
  clubId?: string
}

export interface CoachAnalyticsViewModel {
  teamCount: number
  playerCount: number
  totalMatches: number
  wins: number
  losses: number
  draws: number
  winRate: number
  overallAttendanceRate: number
  activeInjuryCount: number
  totalInjuryCount: number
  teams: TeamAnalyticsViewModel[]
}

// ---- Coach: Metric Insights ----
export interface MetricInsightsViewModel {
  formation: string
  formScore: number
  h2hScore: number
  starPlayerId?: string | null
  starPlayerName: string
  starPlayerMetricScore: number
  starPlayerSummary?: string | null
}
