import * as protobuf from "protobufjs/light.js";
import schema from "../gen/gateway_wire.schema.js";

const root = protobuf.Root.fromJSON(schema as protobuf.INamespace);

function mustLookup(name: string): protobuf.Type {
  const t = root.lookup(name);
  if (!t || !(t instanceof protobuf.Type)) {
    throw new Error(`gateway wire: missing message type ${name}`);
  }
  return t;
}

export const GatewayRequestType = mustLookup("gateway.Request");
export const GatewayResponseType = mustLookup("gateway.Response");

/**
 * Gateway HTTP 語意對應：200／201／204 皆可代表成功。
 * 成功時 response data 為空也可能是正常（例如綁定完成無 MegaAccountBindingResponse）。
 */
export function isGatewaySuccessCode(code: string): boolean {
  return code === "200" || code === "201" || code === "204";
}

export function encodeGatewayRequest(message: object): Uint8Array {
  const err = GatewayRequestType.verify(message);
  if (err) throw new Error(`gateway Request verify: ${err}`);
  const msg = GatewayRequestType.create(message);
  return Uint8Array.from(GatewayRequestType.encode(msg).finish());
}

export function decodeGatewayResponse(buffer: Uint8Array): protobuf.Message {
  return GatewayResponseType.decode(buffer);
}

export function gatewayResponseToObject(msg: protobuf.Message) {
  return GatewayResponseType.toObject(msg, {
    longs: String,
    defaults: true,
    bytes: Uint8Array,
  });
}
