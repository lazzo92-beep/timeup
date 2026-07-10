/**
 * AppConfig.js
 * Central configuration for the application
 */

import { APP_INFO } from "../utils/constants.js";

export const AppConfig = {
  // Trello Power-Up API Key
  // Replace this with the API key from your Trello Power-Up Admin page.
  // This is the public identifier for the app. It is safe to expose in client-side code.
  APP_KEY: "REPLACE_WITH_YOUR_TRELLO_POWER_UP_KEY",

  // Application Name
  APP_NAME: APP_INFO.POWER_UP_NAME,

  // Feature Flags (for future use)
  FEATURES: {
    REST_API_ENABLED: true,
  },
};
