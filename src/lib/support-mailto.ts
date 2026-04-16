import { getAppVersionLabel } from "@/lib/app-info";

const SUPPORT_EMAIL = "2gurmepati@gmail.com";

export function getSupportEmail() {
  return SUPPORT_EMAIL;
}

export function buildSupportMailto(subject: string, message: string, locale: string) {
  const body = [
    message,
    "",
    `Locale: ${locale}`,
    `Version: ${getAppVersionLabel() || "unknown"}`,
  ].join("\n");

  const params = new URLSearchParams({
    subject: `PawBalance Support: ${subject}`,
    body,
  });

  return `mailto:${SUPPORT_EMAIL}?${params.toString()}`;
}
