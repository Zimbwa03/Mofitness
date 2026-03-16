describe('SupabaseService.invokeFunction', () => {
  let getSessionMock: jest.Mock;
  let fetchMock: jest.Mock;
  let supabaseService: typeof import('../services/SupabaseService').default;

  beforeEach(() => {
    jest.resetModules();
    getSessionMock = jest.fn();
    fetchMock = jest.fn();
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    jest.doMock('@supabase/supabase-js', () => ({
      createClient: jest.fn(() => ({
        auth: {
          getSession: getSessionMock,
          onAuthStateChange: jest.fn(() => ({ data: { subscription: { unsubscribe: jest.fn() } } })),
        },
        from: jest.fn(),
      })),
    }));

    jest.doMock('expo-secure-store', () => ({
      getItemAsync: jest.fn(),
      setItemAsync: jest.fn(),
      deleteItemAsync: jest.fn(),
    }));

    supabaseService = require('../services/SupabaseService').default;
  });

  afterEach(() => {
    jest.dontMock('@supabase/supabase-js');
    jest.dontMock('expo-secure-store');
    jest.restoreAllMocks();
  });

  it('sends an authenticated JSON request to the edge function endpoint', async () => {
    getSessionMock.mockResolvedValue({
      data: {
        session: {
          access_token: 'token-123',
        },
      },
      error: null,
    });

    fetchMock.mockResolvedValue({
      ok: true,
      headers: {
        get: () => 'application/json',
      },
      json: async () => ({ status: 'ok', planId: 'plan-1' }),
      text: async () => '',
    });

    const result = await supabaseService.invokeFunction('nutrition-plan', { action: 'generate', planDate: '2026-03-15' });

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringMatching(/\/functions\/v1\/nutrition-plan$/),
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: 'Bearer token-123',
          'Content-Type': 'application/json',
          Accept: 'application/json',
        }),
        body: JSON.stringify({ action: 'generate', planDate: '2026-03-15' }),
      }),
    );
    expect(result).toEqual({ status: 'ok', planId: 'plan-1' });
  });

  it('surfaces the edge function error payload when the function returns a non-200 response', async () => {
    getSessionMock.mockResolvedValue({
      data: {
        session: {
          access_token: 'token-123',
        },
      },
      error: null,
    });

    fetchMock.mockResolvedValue({
      ok: false,
      status: 400,
      headers: {
        get: () => 'application/json',
      },
      json: async () => ({ error: 'Goal id is required.' }),
      text: async () => '',
    });

    await expect(supabaseService.invokeFunction('nutrition-plan', { action: 'generate' })).rejects.toThrow(
      'Function nutrition-plan failed: Goal id is required.',
    );
  });

  it('requires a signed-in session before calling an edge function', async () => {
    getSessionMock.mockResolvedValue({
      data: {
        session: null,
      },
      error: null,
    });

    await expect(supabaseService.invokeFunction('nutrition-plan', { action: 'generate' })).rejects.toThrow(
      'You must be signed in to use this feature.',
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
