import * as protobuf from "protobufjs/light.js";
import schema from "../gen/lobby_wire.schema.js";

const root = protobuf.Root.fromJSON(schema as protobuf.INamespace);

function mustLookup(name: string): protobuf.Type {
  const t = root.lookup(name);
  if (!t || !(t instanceof protobuf.Type)) {
    throw new Error(`lobby wire: missing message type ${name}`);
  }
  return t;
}

const ListPlayerAvatarsResponseType = mustLookup(
  "megaman.ListPlayerAvatarsResponse",
);
const UpdatePlayerCurrentAvatarRequestType = mustLookup(
  "megaman.UpdatePlayerCurrentAvatarRequest",
);
const GetThirdPartyGameInfoRequestType = mustLookup(
  "megaman.GetThirdPartyGameInfoRequest",
);
const GetThirdPartyGameInfoResponseType = mustLookup(
  "megaman.GetThirdPartyGameInfoResponse",
);

export type PlayerAvatarRowDecoded = {
  avatarID?: string | number;
  avatarUrl?: string;
  goodState?: string;
};

export function decodeListPlayerAvatarsResponseBytes(data: Uint8Array) {
  const msg = ListPlayerAvatarsResponseType.decode(data);
  return ListPlayerAvatarsResponseType.toObject(msg, {
    longs: String,
    defaults: true,
    enums: String,
  }) as { avatarsInfo?: PlayerAvatarRowDecoded[] };
}

export function encodeUpdatePlayerCurrentAvatarRequest(params: {
  avatarID: number | string;
  avatarURL?: string;
  isFBAvatar?: boolean;
}): Uint8Array {
  const payload: Record<string, unknown> = {
    avatarID:
      typeof params.avatarID === "string"
        ? Number(params.avatarID)
        : params.avatarID,
    avatarURL: params.avatarURL ?? "",
    isFBAvatar: params.isFBAvatar ? "YES" : "NO",
  };
  const err = UpdatePlayerCurrentAvatarRequestType.verify(payload);
  if (err) throw new Error(`UpdatePlayerCurrentAvatarRequest: ${err}`);
  const msg = UpdatePlayerCurrentAvatarRequestType.create(payload);
  return UpdatePlayerCurrentAvatarRequestType.encode(msg).finish();
}

export function encodeGetThirdPartyGameInfoRequest(
  platform: string,
  gameUID: string,
): Uint8Array {
  const payload = { platform, gameUID };
  const err = GetThirdPartyGameInfoRequestType.verify(payload);
  if (err) throw new Error(`GetThirdPartyGameInfoRequest: ${err}`);
  const msg = GetThirdPartyGameInfoRequestType.create(payload);
  return GetThirdPartyGameInfoRequestType.encode(msg).finish();
}

export type ThirdPartyGameInfoDecoded = {
  platform?: string;
  gameType?: string;
  gameName?: string;
  gameUID?: string;
  status?: string;
  gameLaunchURL?: string;
};

export function decodeGetThirdPartyGameInfoResponseBytes(data: Uint8Array): {
  thirdPartyGameInfo?: ThirdPartyGameInfoDecoded;
} {
  const msg = GetThirdPartyGameInfoResponseType.decode(data);
  return GetThirdPartyGameInfoResponseType.toObject(msg, {
    longs: String,
    defaults: true,
    enums: String,
  }) as { thirdPartyGameInfo?: ThirdPartyGameInfoDecoded };
}
