# Plan reconciliation: expenses without a jar, September 2026

Read-only Supabase snapshot checked on 2026-09-25 across the household's transaction history. Every no-jar expense row found is dated September 2026. There are 23 active rows (`posted` or `pending_mapping`) totaling **14,927,601 ₫**, plus 3 reversed originals totaling 7,208,334 ₫. The reversed originals have replacement correction rows, so their amounts are not counted again. No jar was inferred or assigned.

| Row group | Status | Rows | Amount | Treatment |
|---|---|---:|---:|---|
| Current no-jar expenses | `posted` | 13 | 7,219,454 ₫ | Posted savings tax and card correction rows; no jar can be inferred safely |
| Current no-jar expenses | `pending_mapping` | 10 | 7,708,147 ₫ | Existing classification follow-up |
| Replaced originals | `reversed` | 3 | 7,208,334 ₫ | Excluded from active spend; each has a correction child listed below |

## Reversed originals already replaced

Each correction row is included in the 23 active no-jar rows below. The original and its reversal are historical legs; do not classify or count them as additional spend.

| Date | Amount | Original account | Note | Original ID | Correction ID |
|---|---:|---|---|---|---|
| 2026-09-06 | 1,666,681 ₫ | TP Bank chồng | Số dư kỳ trước | `7d4e44fb-ec35-4f4c-a6dd-6a0a464ece42` | `b1be7013-d7c4-470f-95ef-4f440aace738` |
| 2026-09-06 | 1,732,628 ₫ | Techcom bank chồng | Trả góp shopee | `afd2a2ab-5264-4293-9c2b-f0d3a2686a32` | `e61c2b83-487f-4b3f-85a5-85848661efb9` |
| 2026-09-06 | 3,809,025 ₫ | Techcom bank chồng | Trả góp shop | `83ffc811-26dd-4f89-b142-2be1d8859ace` | `198d65e4-e64f-4cba-b63d-773d248d497c` |

## Assigned personal expenses counted by the new rule

The 22 September expenses already assigned to family jars total **4,673,394 ₫** (21 `posted`, 1 `pending_mapping`), matching current Plan status handling:

| Jar | Personal transactions | Amount |
|---|---:|---:|
| Hũ chi tiêu trong tháng | 15 posted + 1 pending_mapping | 1,241,350 ₫ |
| Hũ hiếu hỷ | 2 posted | 912,800 ₫ |
| Hũ shopping cho vợ | 4 posted | 2,519,244 ₫ |

Hũ shopping cho vợ also has 290,000 ₫ of household-account spending. With a 2,000,000 ₫ budget, the reconciled Plan result is **2,809,244 ₫ spent**, **809,244 ₫ over budget**.

The 39,000 ₫ “Ăn trưa grab” correction chain in Hũ chi tiêu trong tháng consists of the reversed original, its reversal, and a posted corrected expense. The Plan calculation must ignore the reversal when a correction exists and count the corrected expense once: **39,000 ₫**.

| Status | Account | Rows | Amount |
|---|---|---:|---:|
| `posted` | Savings Products | 10 | 11,120 ₫ |
| `posted` | TP bank visa chồng | 3 | 7,208,334 ₫ |
| `pending_mapping` | TP Bank chồng, TP bank visa chồng, VCB | 8 | 4,309,625 ₫ |
| `pending_mapping` | Vp shopee (`personal`) | 2 | 3,398,522 ₫ |
| **Total** |  | **23** | **14,927,601 ₫** |

## Posted savings tax rows

Reason: `SAVINGS_TAX` expense events have no jar. Keep these as special savings tax events; the available row does not identify a safe spending jar.

| Date | Amount | Account | Note | Transaction ID |
|---|---:|---|---|---|
| 2026-09-08 | 619 ₫ | Savings Products | Thuế lãi tiết kiệm: Tikop 2 tuần của vợ | `188784e3-2075-45d8-b82a-a7ac37766d1a` |
| 2026-09-13 | 286 ₫ | Savings Products | Thuế lãi tiết kiệm: Tikop 1 tháng của vợ | `59cc084f-f557-4f6c-a789-101a5d9575f5` |
| 2026-09-13 | 190 ₫ | Savings Products | Thuế lãi tiết kiệm: Tikop 2 tuần của vợ | `64b6d79c-5f23-40bc-b7a6-2b51ba9e26cc` |
| 2026-09-13 | 588 ₫ | Savings Products | Thuế lãi tiết kiệm: Tikop 1 tháng của vợ | `90db0c17-141e-4474-8b6f-44f94da7da84` |
| 2026-09-14 | 847 ₫ | Savings Products | Thuế lãi tiết kiệm: Tikop 1 tháng của vợ | `ee82541d-bc20-44a4-a742-8cadca5bd59d` |
| 2026-09-17 | 190 ₫ | Savings Products | Thuế lãi tiết kiệm: Tikop 2 tuần của vợ | `ccb803e8-b25f-4088-9318-a433bef1f703` |
| 2026-09-17 | 1,300 ₫ | Savings Products | Thuế lãi tiết kiệm: Tikop 1 tháng của vợ | `f01897db-1887-4e8b-a961-962295f6c1f7` |
| 2026-09-18 | 328 ₫ | Savings Products | Thuế lãi tiết kiệm: Tikop 1 tháng của vợ | `3820bf7a-54f8-4531-b31d-e67eb9c614c2` |
| 2026-09-22 | 621 ₫ | Savings Products | Thuế lãi tiết kiệm: Tikop 2 tuần của vợ | `cf041da7-8b31-4111-b3e5-7b4b90a15e2c` |
| 2026-09-25 | 6,151 ₫ | Savings Products | Thuế lãi tiết kiệm: Tikop 2 tháng của vợ | `149c3e2b-d6bd-4d2e-87c3-7067674c63ab` |

## Posted card correction rows

Reason: these are posted card-account correction rows with no jar. Their three source rows are card balance/installment records; the transaction links alone do not identify the intended jar.

| Date | Amount | Account | Note | Transaction ID |
|---|---:|---|---|---|
| 2026-09-06 | 1,666,681 ₫ | TP bank visa chồng | Số dư kỳ trước | `b1be7013-d7c4-470f-95ef-4f440aace738` |
| 2026-09-06 | 1,732,628 ₫ | TP bank visa chồng | Trả góp shopee | `e61c2b83-487f-4b3f-85a5-85848661efb9` |
| 2026-09-06 | 3,809,025 ₫ | TP bank visa chồng | Trả góp shop | `198d65e4-e64f-4cba-b63d-773d248d497c` |

## Pending household rows

Reason: these rows already require classification. Use the existing Inbox/transaction classification flow to decide the jar.

| Date | Amount | Account | Note | Transaction ID |
|---|---:|---|---|---|
| 2026-09-11 | 480,000 ₫ | TP Bank chồng | Sửa xe | `8491fb47-0aba-4b6a-a607-9f5559eb1d64` |
| 2026-09-09 | 1,491,750 ₫ | TP bank visa chồng | Mua máy lọc không khí | `38483bf8-b5ce-4947-903f-316a8327be94` |
| 2026-09-09 | 1,850,000 ₫ | TP bank visa chồng | Mua collagen cho mẹ | `822c15e2-dd29-47ee-bad9-03d7b40b1a04` |
| 2026-09-15 | 22,500 ₫ | TP bank visa chồng | — | `5d387941-d920-4ef8-9c3e-3839d7d0a9bd` |
| 2026-09-20 | 67,365 ₫ | TP bank visa chồng | — | `f78c8421-9784-4800-a325-2ae0ef76bc4e` |
| 2026-09-24 | 23,010 ₫ | TP bank visa chồng | Khoảng không rõ | `01f25113-06f1-4334-8ac1-84e395e4eeb5` |
| 2026-09-10 | 95,000 ₫ | VCB | — | `c9e0df24-7296-4c9a-8a44-0900f8e21ab4` |
| 2026-09-19 | 280,000 ₫ | VCB | Tiền xe | `a8c799d1-2d14-4abf-9111-f580499f2eb5` |

## Pending personal rows

Reason: both are unassigned expenses from a personal account. Keep them out of the family Plan until the user chooses a family jar.

| Date | Amount | Account | Note | Transaction ID |
|---|---:|---|---|---|
| 2026-09-09 | 2,041,000 ₫ | Vp shopee (`personal`) | Collagen mẹ | `c5f91832-03d1-4da3-b95a-cc7aa9f92f41` |
| 2026-09-13 | 1,357,522 ₫ | Vp shopee (`personal`) | Dư nợ trước đó | `51429c51-a72f-4d49-9d6c-d34638389ca4` |
