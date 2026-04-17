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

function shouldDisableTypingAssistance({ type, inputMode }: AutoCapitalizeOptions = {}) {
  if (type && NON_CAPITALIZING_TYPES.has(type.toLowerCase())) {
    return true;
  }

  if (inputMode && NON_CAPITALIZING_INPUT_MODES.has(inputMode.toLowerCase())) {
    return true;
  }

  return false;
}

export function getDefaultAutoCapitalize({
  type,
  inputMode,
  multiline = false,
}: AutoCapitalizeOptions = {}) {
  if (shouldDisableTypingAssistance({ type, inputMode })) {
    return "none";
  }

  return multiline ? "sentences" : "words";
}

export function getDefaultAutoCorrect({
  type,
  inputMode,
}: AutoCapitalizeOptions = {}) {
  return shouldDisableTypingAssistance({ type, inputMode }) ? "off" : "on";
}

export function getDefaultSpellCheck({
  type,
  inputMode,
}: AutoCapitalizeOptions = {}) {
  return !shouldDisableTypingAssistance({ type, inputMode });
}
