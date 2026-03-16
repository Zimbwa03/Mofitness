import { act } from '@testing-library/react-native';

import supabaseService from '../services/SupabaseService';
import { useAuthStore } from '../stores/authStore';

jest.mock('../services/SupabaseService', () => ({
  __esModule: true,
  default: {
    getSession: jest.fn(),
    signIn: jest.fn(),
    signUp: jest.fn(),
    signOut: jest.fn(),
    fetchProfile: jest.fn(),
    fetchPreferences: jest.fn(),
    upsertProfile: jest.fn(),
    upsertPreferences: jest.fn(),
    onAuthStateChange: jest.fn(),
  },
}));

const mockedService = jest.mocked(supabaseService);

const session = {
  user: {
    id: 'user-1',
    email: 'test@example.com',
    user_metadata: {
      full_name: 'Test User',
    },
  },
} as const;

const basePreferences = {
  training_days_per_week: null,
  available_equipment: [],
  preferred_workout_time: null,
  dietary_restrictions: [],
  country_code: null,
  allergies: [],
  cuisine_preferences: [],
  medical_conditions: '',
  activity_type: null,
  sport_focus: '',
  interest_in_mindfulness: false,
  wants_challenges: true,
  has_wearable: false,
};

describe('authStore', () => {
  beforeEach(() => {
    useAuthStore.setState({
      session: null,
      user: null,
      profile: null,
      loading: false,
      isOnboardingComplete: false,
    });
    jest.clearAllMocks();
  });

  it('hydrates session and profile state', async () => {
    mockedService.getSession.mockResolvedValue({
      data: { session: session as never },
      error: null,
    } as never);
    mockedService.fetchProfile.mockResolvedValue({
      id: 'user-1',
      full_name: 'Test User',
      email: 'test@example.com',
      gender: null,
      date_of_birth: null,
      height_cm: null,
      weight_kg: null,
      body_fat_pct: null,
      experience_level: 'beginner',
      goals: [],
      activity_level: null,
      onboarding_completed: true,
    });

    await act(async () => {
      await useAuthStore.getState().hydrateSession();
    });

    expect(useAuthStore.getState().user?.id).toBe('user-1');
    expect(useAuthStore.getState().isOnboardingComplete).toBe(true);
  });

  it('logs in and sets the user session', async () => {
    mockedService.signIn.mockResolvedValue({
      data: {
        session: session as never,
        user: session.user as never,
      },
      error: null,
    } as never);
    mockedService.fetchProfile.mockResolvedValue(null);

    await act(async () => {
      await useAuthStore.getState().login('test@example.com', 'password123');
    });

    expect(useAuthStore.getState().user?.email).toBe('test@example.com');
    expect(useAuthStore.getState().isOnboardingComplete).toBe(false);
  });

  it('updates onboarding flags when setOnboardingComplete is called', async () => {
    useAuthStore.setState({
      session: session as never,
      user: session.user as never,
      profile: {
        id: 'user-1',
        full_name: 'Test User',
        email: 'test@example.com',
        gender: null,
        date_of_birth: null,
        height_cm: null,
        weight_kg: null,
        body_fat_pct: null,
        experience_level: 'beginner',
        goals: [],
        activity_level: null,
        onboarding_completed: false,
      },
      preferences: basePreferences,
      loading: false,
      isOnboardingComplete: false,
    });

    mockedService.upsertProfile.mockResolvedValue({
      id: 'user-1',
      full_name: 'Test User',
      email: 'test@example.com',
      gender: null,
      date_of_birth: null,
      height_cm: null,
      weight_kg: null,
      body_fat_pct: null,
      experience_level: 'beginner',
      goals: [],
      activity_level: null,
      onboarding_completed: true,
    });
    mockedService.upsertPreferences.mockResolvedValue({
      ...basePreferences,
      user_id: 'user-1',
    });

    await act(async () => {
      await useAuthStore.getState().completeOnboarding();
    });

    expect(useAuthStore.getState().isOnboardingComplete).toBe(true);
  });
});
