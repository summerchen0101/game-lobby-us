import { describe, expect, it } from "vitest";
import {
  lobbyDecodedGamesToApiGames,
  type LobbyGetDecoded,
} from "./lobbyDecode";

/** LOBBY_GET `games.games` 單列最小形狀（其餘 wire 欄位省略） */
function gameRow(
  id: string,
  status: unknown,
  path = "Slot1.res",
): Record<string, unknown> {
  return {
    ID: id,
    displayName: `Game ${id}`,
    status,
    path,
    sort: 0,
    hotSort: 0,
    slotSort: 0,
    cardSort: 0,
    fishSort: 0,
    arcadeSort: 0,
    lotterySort: 0,
    battleSort: 0,
    classicSort: 0,
  };
}

describe("lobbyDecodedGamesToApiGames", () => {
  it("只保留 status 為 ENABLE 的列", () => {
    const decoded = {
      games: {
        games: [
          gameRow("1", "ENABLE"),
          gameRow("2", "DISABLE"),
          gameRow("3", "MAINTAINING"),
          gameRow("4", "COMING"),
          gameRow("5", 1),
          gameRow("6", "1"),
          gameRow("7", 0),
          gameRow("8", undefined),
          gameRow("9", "enable"),
        ],
      },
    } as unknown as LobbyGetDecoded;
    const items = lobbyDecodedGamesToApiGames(decoded);
    expect(items.map((g) => g.id).sort()).toEqual(["1", "5", "6", "9"]);
  });
});
