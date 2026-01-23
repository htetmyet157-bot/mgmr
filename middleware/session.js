import session from "express-session";
import Redis from "ioredis";
import connectRedis from "connect-redis";

const RedisStore = connectRedis(session); // Pass the session module itself
const redisClient = new Redis({ host: "127.0.0.1", port: 6379 });

app.use(
  session({
    store: new RedisStore({ client: redisClient }), // <-- Redis store here
    name: "sid",
    secret: "super-secret-key",
    resave: false,
    saveUninitialized: false,
    rolling: true,
    cookie: {
      maxAge: 15 * 60 * 1000,
      httpOnly: true,
      sameSite: "strict",
      secure: process.env.NODE_ENV === "production",
    },
  })
);