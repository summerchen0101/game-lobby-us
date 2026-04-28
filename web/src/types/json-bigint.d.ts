declare module "json-bigint" {
  export type JsonBigIntOptions = {
    strict?: boolean
    storeAsString?: boolean
    useNativeBigInt?: boolean
    alwaysParseAsBig?: boolean
  }
  export type JsonBigInstance = {
    parse(text: string, reviver?: (key: string, value: unknown) => unknown): unknown
    stringify(value: unknown): string
  }
  function jsonBig(options?: JsonBigIntOptions): JsonBigInstance
  export default jsonBig
}
