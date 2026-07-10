/**
 * AppConfig.js
 * Central configuration for the application
 */

import { APP_INFO } from "../utils/constants.js";

export const AppConfig = {
  // Trello Power-Up API Key
  // This is the public identifier for the app. It is safe to expose in client-side code.
  APP_KEY: "aa778b9ec659bc02679d3e28d6e0b92e",

  // Application Name
  APP_NAME: APP_INFO.POWER_UP_NAME,

  // Feature Flags (for future use)
  FEATURES: {
    REST_API_ENABLED: true,
  },
};
