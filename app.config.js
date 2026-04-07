import "dotenv/config";

export default {
  expo: {
    name: "Alaz Oto",
    slug: "dijital-foreman",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/alaz_oto_5002.jpeg",
    scheme: "dijitalforeman",
    userInterfaceStyle: "automatic",
    ios: {
      icon: "./assets/alaz_oto_5002.jpeg",
    },
    android: {
      adaptiveIcon: {
        backgroundColor: "#E6F4FE",
        foregroundImage: "./assets/alaz_oto_5002.jpeg",
      },
      predictiveBackGestureEnabled: false,
      package: "com.umutlaguler.dijitalforeman",
    },
    web: {
      output: "single",
      favicon: "./assets/images/favicon.png",
    },
    plugins: [
      [
        "expo-splash-screen",
        {
          backgroundColor: "#208AEF",
          android: {
            image: "./assets/images/splash-icon.png",
            imageWidth: 76,
          },
        },
      ],
      [
        "expo-notifications",
        {
          sounds: [],
        },
      ],
      "expo-localization",
    ],
    extra: {
      posthogApiKey: process.env.POSTHOG_API_KEY,
      posthogHost: process.env.POSTHOG_HOST,
      eas: {
        projectId: "e2879dac-2a15-40aa-8e83-a91f223c9568",
      },
    },
  },
};
