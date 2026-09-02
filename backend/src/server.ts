import { buildApp } from "./app";
import { env } from "./config/env";

const app = buildApp();

app
  .listen({ port: env.PORT, host: env.HOST })
  .then(() => {
    app.log.info(`KK4 Doc Record API running at http://${env.HOST}:${env.PORT}`);
    app.log.info(`Swagger docs available at http://${env.HOST}:${env.PORT}/docs`);
  })
  .catch((err) => {
    app.log.error(err);
    process.exit(1);
  });
