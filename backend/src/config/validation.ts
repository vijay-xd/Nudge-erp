import Joi from 'joi';

export const validationSchema = Joi.object({
  NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
  PORT: Joi.number().default(3000),
  DATABASE_URL: Joi.string().required(),
  REDIS_HOST: Joi.string().default('localhost'),
  REDIS_PORT: Joi.number().default(6379),
  JWT_ACCESS_SECRET: Joi.string().min(16).required(),
  JWT_REFRESH_SECRET: Joi.string().min(16).required(),
  JWT_ACCESS_EXPIRY: Joi.string().default('15m'),
  JWT_REFRESH_EXPIRY: Joi.string().default('7d'),
  FRONTEND_URL: Joi.string().uri().default('http://localhost:5173'),
  CORS_ORIGINS: Joi.string().default('http://localhost:5173'),
  DEMO_MODE: Joi.string().valid('true', 'false').default('false'),
});
