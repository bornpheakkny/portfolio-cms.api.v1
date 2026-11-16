import { createApp } from "./app";
import { env } from "./lib/env";

createApp().listen(env.PORT, () => {
  console.log(`🚀 API running on http://localhost:${env.PORT}`);
});
