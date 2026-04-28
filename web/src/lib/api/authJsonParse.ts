import jsonBigFactory from 'json-bigint'

/**
 * 與登入／refresh 相同：大於 15 位十進位的 JSON 數字會保留為字串，避免 `JSON.parse` 先變成 IEEE double。
 * 亦用於還原 localStorage 內之 user JSON（歷史資料可能含未加引號的大整數 id）。
 */
export const parseAuthJson = jsonBigFactory({ storeAsString: true })
