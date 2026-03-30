import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.pawbalance.app",
  appName: "PawBalance",
  webDir: "out",
  backgroundColor: "#FAF8F5",
  server: {
    androidScheme: "https",
    hostname: "app.pawbalance.com",
  },
  plugins: {
    SplashScreen: {
      launchAutoHide: true,
      androidSplashResourceName: "splash",
      androidScaleType: "CENTER_CROP",
    },
    CapacitorUpdater: {
      autoUpdate: true,
      statsUrl: "https://supabase.optalgo.com/functions/v1/stats",
      channelUrl: "https://supabase.optalgo.com/functions/v1/channel_self",
      updateUrl: "https://supabase.optalgo.com/functions/v1/updates",
    },
  },
};

export default config;

