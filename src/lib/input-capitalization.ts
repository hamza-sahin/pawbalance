const NON_CAPITALIZING_TYPES = new Set([
  "email",
  "number",
  "password",
  "tel",
  "url",
]);

const NON_CAPITALIZING_INPUT_MODES = new Set([
  "decimal",
  "email",
  "none",
  "numeric",
  "tel",
  "url",
]);

interface AutoCapitalizeOptions {
  type?: string;
  inputMode?: string;
  multiline?: boolean;
}

export function getDefaultAutoCapitalize({
  type,
  inputMode,
  multiline = false,
}: AutoCapitalizeOptions = {}) {
  if (type && NON_CAPITALIZING_TYPES.has(type.toLowerCase())) {
    return "none";
  }

  if (inputMode && NON_CAPITALIZING_INPUT_MODES.has(inputMode.toLowerCase())) {
    return "none";
  }

  return multiline ? "sentences" : "words";
}
