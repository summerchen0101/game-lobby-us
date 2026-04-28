/**
 * protobufjs/light 首次 configure 時若環境沒有全域 Long，Reader.uint64 會用 LongBits.toNumber，
 * 大 uint64 先變 IEEE double，toObject({ longs: String }) 只會 String(壞值)。
 * 掛上 long.js 後重新 configure，讓 varint/fixed64 經 Long.toString()。
 */
import Long from "long";
import * as protobuf from "protobufjs/light.js";

protobuf.util.Long = Long;
protobuf.configure();
