import { describe, expect, it } from "vitest";
import { buildSlotLaunchUrl } from "./slotLaunchUrl";

const BASE = "https://example.com/WebGL_Build_WebEntry/index.html";

describe("buildSlotLaunchUrl", () => {
  it("無 token 時 URL 不含 token 參數", () => {
    const u = buildSlotLaunchUrl({
      baseUrl: BASE,
      gameId: 85,
      mode: 2,
      amount: 123456,
      vipLevel: 10,
    });
    expect(u).not.toMatch(/[?&]token=/);
    expect(u).toContain("game_id=85");
    expect(u).toContain("mode=2");
    expect(u).toContain("amount=123456");
    expect(u).toContain("vip_lv=10");
  });

  it("有 token 時帶入 token", () => {
    const u = buildSlotLaunchUrl({
      baseUrl: BASE,
      gameId: 85,
      mode: 1,
      amount: 100,
      vipLevel: 3,
      token: "iamkey.test",
    });
    expect(u).toContain("token=iamkey.test");
    expect(u).toContain("mode=1");
  });
});
