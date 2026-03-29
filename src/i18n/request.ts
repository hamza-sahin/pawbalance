import { getRequestConfig } from "next-intl/server";

export default getRequestConfig(async () => {
  // Static export can't use cookies() — default to English.
  // Locale switching is handled client-side via useLocale hook.
  const locale = "en";

  return {
    locale,
    messages: (await import(`@/messages/${locale}.json`)).default,
  };
});
