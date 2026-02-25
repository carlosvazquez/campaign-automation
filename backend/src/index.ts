/** @file Entry point — bootstraps the HTTP server and starts listening */

import { app } from './app';

const PORT = process.env.PORT ?? 3001;

app.listen(PORT, () => {
  console.warn(`Server running on http://localhost:${PORT}`);
});
