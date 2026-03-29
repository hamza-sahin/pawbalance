import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.pawbalance.app",
  appName: "PawBalance",
  webDir: "out",
  server: {
    androidScheme: "https",
  },
  plugins: {
    SplashScreen: {
      launchAutoHide: true,
      androidSplashResourceName: "splash",
      androidScaleType: "CENTER_CROP",
    },
  },
};

export default config;
