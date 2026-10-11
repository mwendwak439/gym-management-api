import app from "./app";
import { config } from "./config";
import { testConnection } from "./db";

const start = async () => {
  await testConnection();
  app.listen(config.port, () => {
    console.log(`🚀 Server running on http://localhost:${config.port}`);
    console.log(`📊 Environment: ${config.env}`);
  });
};

start();