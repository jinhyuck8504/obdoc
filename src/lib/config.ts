interface AppConfig {
  app: {
    name: string
    version: string
    url: string
    environment: string
  }
  database: {
    url: string
    maxConnections: number
  }
  auth: {
    sessionTimeout: number
    maxLoginAttempts: number
    lockoutDuration: number
  }
  security: {
    encryptionKey: string
    csrfSecret: string
    rateLimiting: {
      max: number
      windowMs: number
    }
  }
  features: {
    community: boolean
    payments: boolean
    notifications: boolean
  }
  monitoring: {
    sentry: {
      dsn: string | undefined
      environment: string
      tracesSampleRate: number
    }
    analytics: {
      googleAnalyticsId: string | undefined
    }
  }
  external: {
    supabase: {
      url: string
      anonKey: string
      serviceRoleKey: string
    }
    email: {
      host: string
      port: number
      user: string
      password: string
      from: string
    }
    storage: {
      maxFileSize: number
      allowedTypes: string[]
    }
  }
}

function getRequiredEnv(key: string): string {
  const value = process.env[key]
  if (!value) {
    // 프로덕션 환경에서는 경고만 출력하고 더미 값 반환
    if (process.env.NODE_ENV === 'production') {
      console.warn(`⚠️ Missing environment variable: ${key}`)
      return `missing_${key.toLowerCase()}`
    }
    throw new Error(`Missing required environment variable: ${key}`)
  }
  return value
}

function getOptionalEnv(key: string, defaultValue: string = ''): string {
  return process.env[key] || defaultValue
}

function getNumberEnv(key: string, defaultValue: number): number {
  const value = process.env[key]
  return value ? parseInt(value, 10) : defaultValue
}

function getBooleanEnv(key: string, defaultValue: boolean = false): boolean {
  const value = process.env[key]
  return value ? value.toLowerCase() === 'true' : defaultValue
}

export const config: AppConfig = {
  app: {
    name: getOptionalEnv('NEXT_PUBLIC_APP_NAME', 'OBDOC'),
    version: getOptionalEnv('NEXT_PUBLIC_APP_VERSION', '1.0.0'),
    url: getOptionalEnv('NEXT_PUBLIC_APP_URL', 'http://localhost:3000'),
    environment: getOptionalEnv('NODE_ENV', 'development'),
  },

  database: {
    url: getRequiredEnv('DATABASE_URL'),
    maxConnections: getNumberEnv('DB_MAX_CONNECTIONS', 10),
  },

  auth: {
    sessionTimeout: getNumberEnv('SESSION_TIMEOUT', 1800000), // 30 minutes
    maxLoginAttempts: getNumberEnv('MAX_LOGIN_ATTEMPTS', 5),
    lockoutDuration: getNumberEnv('LOCKOUT_DURATION', 900000), // 15 minutes
  },

  security: {
    encryptionKey: getRequiredEnv('ENCRYPTION_KEY'),
    csrfSecret: getRequiredEnv('CSRF_SECRET'),
    rateLimiting: {
      max: getNumberEnv('RATE_LIMIT_MAX', 100),
      windowMs: getNumberEnv('RATE_LIMIT_WINDOW', 900000), // 15 minutes
    },
  },

  features: {
    community: getBooleanEnv('ENABLE_COMMUNITY', true),
    payments: getBooleanEnv('ENABLE_PAYMENTS', false),
    notifications: getBooleanEnv('ENABLE_NOTIFICATIONS', true),
  },

  monitoring: {
    sentry: {
      dsn: getOptionalEnv('SENTRY_DSN'),
      environment: getOptionalEnv('NODE_ENV', 'development'),
      tracesSampleRate: getOptionalEnv('NODE_ENV', 'development') === 'production' ? 0.1 : 1.0,
    },
    analytics: {
      googleAnalyticsId: getOptionalEnv('NEXT_PUBLIC_GOOGLE_ANALYTICS_ID'),
    },
  },

  external: {
    supabase: {
      url: getRequiredEnv('NEXT_PUBLIC_SUPABASE_URL'),
      anonKey: getRequiredEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY'),
      serviceRoleKey: getRequiredEnv('SUPABASE_SERVICE_ROLE_KEY'),
    },
    email: {
      host: getOptionalEnv('SMTP_HOST', 'smtp.gmail.com'),
      port: getNumberEnv('SMTP_PORT', 587),
      user: getOptionalEnv('SMTP_USER'),
      password: getOptionalEnv('SMTP_PASSWORD'),
      from: getOptionalEnv('SMTP_FROM', 'noreply@obdoc.co.kr'),
    },
    storage: {
      maxFileSize: getNumberEnv('NEXT_PUBLIC_MAX_FILE_SIZE', 5242880), // 5MB
      allowedTypes: ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'],
    },
  },
}

// Validation
export function validateConfig(): void {
  const errors: string[] = []
  const warnings: string[] = []

  // Required environment variables
  const requiredVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
    'ENCRYPTION_KEY',
    'CSRF_SECRET',
  ]

  requiredVars.forEach(varName => {
    if (!process.env[varName]) {
      if (process.env.NODE_ENV === 'production') {
        warnings.push(`Missing environment variable: ${varName}`)
      } else {
        errors.push(`Missing required environment variable: ${varName}`)
      }
    }
  })

  // Validate encryption key length (only if present)
  if (config.security.encryptionKey && config.security.encryptionKey.length !== 32 && !config.security.encryptionKey.startsWith('missing_')) {
    errors.push('ENCRYPTION_KEY must be exactly 32 characters long')
  }

  // Validate URLs (only if not dummy values)
  try {
    if (!config.app.url.includes('localhost')) {
      new URL(config.app.url)
    }
    if (!config.external.supabase.url.startsWith('missing_')) {
      new URL(config.external.supabase.url)
    }
  } catch (error) {
    warnings.push('Invalid URL format in configuration')
  }

  // Log warnings
  if (warnings.length > 0) {
    console.warn('Configuration warnings:')
    warnings.forEach(warning => console.warn(`  ⚠️ ${warning}`))
  }

  // Only throw error in development
  if (errors.length > 0 && process.env.NODE_ENV !== 'production') {
    console.error('Configuration validation failed:')
    errors.forEach(error => console.error(`  - ${error}`))
    throw new Error('Invalid configuration')
  }
}

// Environment-specific configurations
export const isDevelopment = config.app.environment === 'development'
export const isProduction = config.app.environment === 'production'
export const isTest = config.app.environment === 'test'

// Feature flags
export const features = config.features

// Export commonly used values
export const {
  app: appConfig,
  database: dbConfig,
  auth: authConfig,
  security: securityConfig,
  external: externalConfig,
} = config