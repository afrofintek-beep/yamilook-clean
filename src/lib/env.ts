// Environment configuration
export type Environment = 'development' | 'staging' | 'production';

export const getEnvironment = (): Environment => {
  const mode = import.meta.env.MODE;
  
  if (mode === 'production') {
    // Check for staging subdomain or flag
    if (window.location.hostname.includes('staging') || 
        import.meta.env.VITE_ENV === 'staging') {
      return 'staging';
    }
    return 'production';
  }
  
  return 'development';
};

export const env = {
  current: getEnvironment(),
  isDevelopment: getEnvironment() === 'development',
  isStaging: getEnvironment() === 'staging',
  isProduction: getEnvironment() === 'production',
  
  // Feature flags per environment
  features: {
    enableDebugTools: getEnvironment() !== 'production',
    enableMockData: getEnvironment() === 'development',
    enableAnalytics: getEnvironment() === 'production',
    enableTestAccounts: getEnvironment() !== 'production',
  },
  
  // API configuration
  api: {
    supabaseUrl: import.meta.env.VITE_SUPABASE_URL,
    supabaseKey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
  }
};

export default env;
