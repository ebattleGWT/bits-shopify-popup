import { createRequestHandler } from "@remix-run/express";
import express from "express";
import { startBackgroundTasks, stopBackgroundTasks } from "./app/services/background-tasks.server";

const app = express();
const port = process.env.PORT || 3000;
const server = app.listen(port, () => {
  console.log(`Express server listening on port ${port}`);
});

// Start background tasks
startBackgroundTasks().catch(error => {
  console.error("Failed to start background tasks:", error);
});

// Handle shutdown gracefully
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  stopBackgroundTasks();
  server.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
});

// ... rest of your server setup code ... 