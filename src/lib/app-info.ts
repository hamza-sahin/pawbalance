import packageJson from "../../package.json";

type PackageJson = {
  version?: string;
};

const pkg = packageJson as PackageJson;

export const APP_VERSION = pkg.version ?? "";

export function getAppVersionLabel() {
  return APP_VERSION;
}
