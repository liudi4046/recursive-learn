import type { MessageKey } from "@/i18n/strings";

/** JSON error body from `POST /api/ask` when `!res.ok`. */
export type AskApiErrorBody = { error?: string; code?: string };

const ASK_ERR: Partial<Record<string, MessageKey>> = {
  llm_api_key_required: "askLlmKeyRequired",
  exa_api_key_required: "askWebSearchExaKeyRequired",
  brave_api_key_required: "askWebSearchBraveKeyRequired",
  tavily_api_key_required: "askWebSearchTavilyKeyRequired",
  question_required: "askQuestionRequired",
  stream_required: "askStreamOnly",
  invalid_mode: "askInvalidMode"
};

/**
 * Resolves a user-facing message for `/api/ask` error responses using the app locale.
 */
export function messageForAskApiError(
  errBody: AskApiErrorBody,
  t: (key: MessageKey) => string
): string {
  const code = errBody.code;
  if (code === "web_search_failed") {
    return errBody.error
      ? `${t("askWebSearchFailed")} ${errBody.error}`
      : t("askWebSearchFailed");
  }
  const key = code ? ASK_ERR[code] : undefined;
  if (key) return t(key);
  if (errBody.error) return errBody.error;
  return t("nodeRequestFailed");
}
