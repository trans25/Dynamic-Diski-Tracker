import { apiClient, unwrap } from '../apiClient'
import type {
  ApiResponse,
  CreateMatchEventRequest,
  LiveMatchViewModel,
  MatchEventViewModel,
} from '../types'

export const matchService = {
  async getLiveMatch(matchId: string): Promise<LiveMatchViewModel> {
    const res = await apiClient.get<ApiResponse<LiveMatchViewModel>>(
      `/matches/${matchId}`
    )
    return unwrap(res)
  },

  async postMatchEvent(
    matchId: string,
    payload: CreateMatchEventRequest
  ): Promise<MatchEventViewModel> {
    const res = await apiClient.post<ApiResponse<MatchEventViewModel>>(
      `/matches/${matchId}/events`,
      payload
    )
    return unwrap(res)
  },
}
