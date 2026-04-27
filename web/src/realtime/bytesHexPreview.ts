/** 將前 `maxBytes` 個位元組轉成連續 hex 字串（僅用於除錯／日誌）。 */
export function hexPreview(u8: Uint8Array, maxBytes: number): string {
  const n = Math.min(maxBytes, u8.byteLength)
  let s = ''
  for (let i = 0; i < n; i++) {
    s += u8[i]!.toString(16).padStart(2, '0')
  }
  return s
}
