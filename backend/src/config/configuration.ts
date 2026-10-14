export interface AppConfig {
  port: number;
  nodeEnv: string;
  database: {
    url: string;
  };
  redis: {
    host: string;
    port: number;
  };
  jwt: {
    accessSecret: string;
    refreshSecret: string;
    accessExpiry: string;
    refreshExpiry: string;
  };
  frontendUrl: string;
  corsOrigins: string[];
  demoMode: boolean;
}

export default (): AppConfig => ({
  port: parseInt(process.env.PORT ?? '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  database: {
    url: process.env.DATABASE_URL || '',
  },
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT ?? '6379', 10),
  },
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET || 'dev_access_secret_change_in_production_min32',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'dev_refresh_secret_change_in_production_min32',
    accessExpiry: process.env.JWT_ACCESS_EXPIRY || '15m',
    refreshExpiry: process.env.JWT_REFRESH_EXPIRY || '7d',
  },
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
  corsOrigins: (process.env.CORS_ORIGINS || 'http://localhost:5173')
    .split(',')
    .map((origin) => origin.trim()),
  demoMode: process.env.DEMO_MODE === 'true',
});
