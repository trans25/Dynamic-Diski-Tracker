import { apiClient, unwrap } from '../apiClient'
import type {
  ApiResponse,
  AuthResponse,
  ForgotPasswordRequest,
  ForgotPasswordResponse,
  LoginRequest,
  ParentAuthResponse,
  ParentMagicLinkRequest,
  ParentMagicLinkResponse,
  ParentMagicTokenExchangeRequest,
  PlayerParentOtpRequest,
  PlayerParentOtpRequestResponse,
  PlayerParentOtpVerifyRequest,
  RegisterRequest,
  ResetPasswordRequest,
  SportTemplateViewModel,
} from '../types'

export type RegisterNextStep = 'signin' | 'verify-email' | 'approval'

export interface RegisterOutcome {
  nextStep: RegisterNextStep
  message?: string
  code?: string
}

function resolveRegisterNextStep(code?: string, message?: string): RegisterNextStep {
  const text = `${code ?? ''} ${message ?? ''}`.toLowerCase()
  if (
    text.includes('verify') ||
    text.includes('verification') ||
    text.includes('confirm-email') ||
    text.includes('confirm email')
  ) {
    return 'verify-email'
  }
  if (
    text.includes('approval') ||
    text.includes('approve') ||
    text.includes('pending') ||
    text.includes('review')
  ) {
    return 'approval'
  }
  return 'signin'
}

// Maps to AuthController (api/auth) - anonymous endpoints.
export const authService = {
  async login(payload: LoginRequest): Promise<AuthResponse> {
    const res = await apiClient.post<ApiResponse<AuthResponse>>(
      '/auth/login',
      payload
    )
    return unwrap(res)
  },

  async register(payload: RegisterRequest): Promise<AuthResponse> {
    const res = await apiClient.post<ApiResponse<AuthResponse>>(
      '/auth/register',
      payload
    )
    return unwrap(res)
  },

  async getSignupSportTemplates(): Promise<SportTemplateViewModel[]> {
    const res = await apiClient.get<ApiResponse<SportTemplateViewModel[]>>(
      '/auth/sport-templates'
    )
    return unwrap(res)
  },

  async registerWithOutcome(payload: RegisterRequest): Promise<RegisterOutcome> {
    const res = await apiClient.post<ApiResponse<AuthResponse | null>>(
      '/auth/register',
      payload
    )
    const body = res.data
    if (!body.success) {
      throw new Error(body.message || 'Could not create account')
    }
    return {
      nextStep: resolveRegisterNextStep(body.code, body.message),
      message: body.message,
      code: body.code,
    }
  },

  async forgotPassword(
    payload: ForgotPasswordRequest
  ): Promise<ForgotPasswordResponse | null> {
    const res = await apiClient.post<ApiResponse<ForgotPasswordResponse>>(
      '/auth/forgot-password',
      payload
    )
    // The API always returns success here ,
    // but data may be an empty object when the email does not exist.
    return res.data.data ?? null
  },

  async resetPassword(payload: ResetPasswordRequest): Promise<void> {
    await apiClient.post<ApiResponse<object>>('/auth/reset-password', payload)
  },

  async requestParentMagicLink(
    payload: ParentMagicLinkRequest
  ): Promise<ParentMagicLinkResponse> {
    const res = await apiClient.post<ApiResponse<ParentMagicLinkResponse>>(
      '/auth/parent/magic-link/request',
      payload
    )
    return unwrap(res)
  },

  async consumeParentMagicToken(
    payload: ParentMagicTokenExchangeRequest
  ): Promise<ParentAuthResponse> {
    const res = await apiClient.post<ApiResponse<ParentAuthResponse>>(
      '/auth/parent/magic-link/consume',
      payload
    )
    return unwrap(res)
  },

  async requestPlayerParentOTP(
    payload: PlayerParentOtpRequest
  ): Promise<PlayerParentOtpRequestResponse> {
    const res = await apiClient.post<ApiResponse<PlayerParentOtpRequestResponse>>(
      '/auth/player/otp/request',
      payload
    )
    return unwrap(res)
  },

  async verifyPlayerParentOTP(
    payload: PlayerParentOtpVerifyRequest
  ): Promise<ParentAuthResponse> {
    const res = await apiClient.post<ApiResponse<ParentAuthResponse>>(
      '/auth/player/otp/verify',
      payload
    )
    return unwrap(res)
  },
}
