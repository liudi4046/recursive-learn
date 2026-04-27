import { describe, expect, it } from "vitest";
import { MESSAGES } from "@/i18n/strings";
import { messageForAskApiError } from "./ask-api-error-message";

function t(key: keyof typeof MESSAGES.en, locale: "en" | "zh" = "en") {
  return MESSAGES[locale][key];
}

describe("messageForAskApiError", () => {
  it("maps exa_api_key_required to locale string", () => {
    expect(
      messageForAskApiError({ code: "exa_api_key_required" }, (k) => t(k, "zh"))
    ).toContain("Exa");
    expect(
      messageForAskApiError({ code: "exa_api_key_required" }, (k) => t(k, "en"))
    ).toContain("EXA_API_KEY");
  });

  it("falls back to error text when code is unknown", () => {
    expect(messageForAskApiError({ error: "custom" }, (k) => t(k))).toBe("custom");
  });

  it("uses nodeRequestFailed when empty", () => {
    expect(messageForAskApiError({}, (k) => t(k))).toBe(t("nodeRequestFailed"));
  });
});
