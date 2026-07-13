import "dotenv/config";

function required(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;
  if (value === undefined) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const env = {
  port: Number(process.env.PORT ?? 3000),
  host: process.env.HOST ?? "0.0.0.0",
  databaseUrl: process.env.DATABASE_URL ?? "",
  jwtSecret: process.env.JWT_SECRET ?? "change-me",
  frontendUrl: process.env.FRONTEND_URL ?? "http://localhost:5173",
  fortyTwo: {
    clientId: process.env.FORTYTWO_CLIENT_ID ?? "",
    clientSecret: process.env.FORTYTWO_CLIENT_SECRET ?? "",
    callbackUrl: process.env.FORTYTWO_CALLBACK_URL ?? "",
  },
};
