# Vietnam Credit-Card Installment Tracking

**Purpose.** This note defines the domain boundary for ViNha’s credit-card installment tracker. It summarizes representative official issuer materials accessed on 13 August 2026. It is not a fee schedule, an eligibility decision engine, or financial advice.

## What the official issuer materials show

| Issuer source | Observed pattern                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    | Product implication                                                                                                                                                                                       |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| VPBank        | The customer selects an existing purchase, chooses a term, and confirms a conversion request. VPBank describes non-partner programs with 3–36 month terms, including both 0% interest with a conversion fee and interest-bearing options with no conversion fee. Its article also distinguishes the conversion fee from interest, says its quoted example requires a minimum purchase value and registration before the transaction is stated, and describes fees potentially appearing in the first statement. [1] | The source purchase, term, interest, conversion fee, and fee timing must be separate fields. ViNha must not use VPBank’s example threshold, terms, or prices as global rules.                             |
| Techcombank   | The issuer promotes digital-app conversion and 3, 6, 9, and 12 month options. Its public page presents both a 0% interest message and a separate conversion-fee/monthly-payment context, and asks customers to check potential merchant-side charges. [2]                                                                                                                                                                                                                                                           | “0% interest” cannot be displayed as “free” unless all extra costs are zero. Bank and merchant conditions must remain configurable.                                                                       |
| MB Bank       | The bank describes transaction selection in the mobile app, a pre-statement registration window, an example purchase-value threshold, exclusions such as ATM cash withdrawal, terms from 3 to 24 months, and a choice of one-time or periodic fee collection. Its partner program may offer 0% interest and 0 fee. [3]                                                                                                                                                                                              | Product-level structural eligibility must be distinct from issuer eligibility. Fee timing belongs in the tracker, while partner and post-purchase origins can be recorded without encoding issuer policy. |

> **Issuer variation is the rule, not an edge case.** Terms, thresholds, fee collection, interest, merchant participation, approval windows, and statement treatment vary by issuer, customer, card, channel, campaign, and date.

## ViNha product contract

ViNha records an installment agreement that the user has already confirmed with the issuer. A plan is linked to one existing eligible card purchase and keeps that purchase as the only spending/expense event. Creating a plan must not create a second expense, a second full-principal card liability, a synthetic monthly payment, or an automatic issuer approval.

| Concept                | ViNha behavior                                                                                                                                                                         |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Source transaction     | Mandatory immutable link to an existing card purchase. The first release supports one tracker per purchase and does not model partial conversion.                                      |
| Structural eligibility | A positive card purchase that is neither a repayment, transfer, refund, correction, nor already linked to a tracker. This means _available to track_, not guaranteed bank eligibility. |
| Interest               | Stored independently from fee. A simple flat monthly rate is available only when the user enters it; otherwise bank-quoted repayment values can be recorded.                           |
| Conversion fee         | None, fixed VND, or percentage-derived VND. The exact bank-confirmed VND amount is persisted for the schedule.                                                                         |
| Fee timing             | First expected period, spread over expected periods, or included in a bank quote.                                                                                                      |
| Schedule               | A deterministic expected repayment projection. It is not an issuer statement and is not automatically marked paid by date or card settlement.                                          |
| Progress               | Explicit local tracking confirmation only. Card repayments can cover many charges and are not automatically matched to a plan.                                                         |
| Stop tracking          | Stops local tracking only. It does not cancel the issuer agreement.                                                                                                                    |
| Refund/correction      | Surfaces a review-required state rather than silently rewriting a bank agreement.                                                                                                      |

## Cost disclosure rules

A plan is not described simply as “0%” when it has a conversion fee. The preview always exposes the following separately: original purchase, principal, conversion fee, interest, total extra cost, total repayment, expected periodic amount, first expected period, and final rounding adjustment where applicable.

A true no-interest/no-fee plan may state **“0% lãi · 0đ phí chuyển đổi”** only when both the persisted interest total and conversion-fee total are zero. For all other programs, the user enters the actual terms confirmed by the issuer rather than selecting a bank-branded default.

## Accounting boundary

The card billing ledger remains authoritative for outstanding debt, available credit, statement balance, and payment settlement. An installment tracker only provides scheduling and agreement metadata. The source purchase stays counted once; card repayment remains real-money-to-liability settlement, not another expense. Expected schedule rows and actual bank statement items remain distinct until a future explicit reconciliation feature exists.

## References

[1] [VPBank — Phí chuyển đổi trả góp thẻ tín dụng là gì?](https://www.vpbank.com.vn/bi-kip-va-chia-se/retail-story-and-tips/credit-card-category/phi-chuyen-doi-tra-gop-the-tin-dung)

[2] [Techcombank — Trả góp linh hoạt với thẻ tín dụng](https://techcombank.com/khach-hang-ca-nhan/chi-tieu/the/the-tin-dung/tra-gop)

[3] [MB Bank — Trả góp lãi suất 0% cùng thẻ tín dụng MB](https://www.mbbank.com.vn/chi-tiet/tin-khuyen-mai-khcn/tra-gop-lai-suat-0-cung-the-tin-dung-mbbank-%E2%80%93-don-gian-de-dang-phi-tot-nhat-thi-truong-2024-3-5-11-40-2/2637)
