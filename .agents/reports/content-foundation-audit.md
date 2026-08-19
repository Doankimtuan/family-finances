# ViNha content foundation audit

Audit date: 2026-08-19  
Scope: user-facing messages in `messages/vi` and `messages/en`, plus source
strings that can reach the UI.  
Constraint: audit only. No production i18n file, component, route, behavior,
business logic, database code, or test was changed.

## Audit method and evidence

- Parsed all 44 locale JSON files successfully.
- Flattened and counted all leaf messages.
- Compared locale file sets, namespace trees, keys, and ICU argument names.
- Searched `app`, `shared`, `modules`, and `providers` for literal UI strings,
  with developer-only logs, error contracts, tests, identifiers, CSS classes,
  and internal constants excluded from the counted candidate total.
- Read the source for status lanes, Plan stubs, Inbox decisions, and Health
  states where copy may be masking an interaction or product problem.

The product is structurally mature as an i18n system, but content maturity is
uneven. The main problem is not coverage. It is terminology governance: the
same user concept is alternately expressed as a localized Vietnamese noun, an
English product noun, a translated technical noun, and an implementation term.

## A. Executive summary

### Major findings

1. **Locale structure is strong.** VI and EN both contain 22 namespaces and
   2,945 leaf messages. There are no missing or extra keys and no ICU argument
   mismatches.
2. **Vietnamese is not consistently native.** The clearest defects are the
   unaccented `plan.goals` funding block, mixed `Hủy`/`Huỷ`, `tùy`/`tuỳ`,
   `Sức khỏe`/`Sức khoẻ`, `khóa`/`khoá`, and phrases such as
   `Con người, quyền truy cập và cấu hình chung...`.
3. **English is generally readable, but often exposes architecture.**
   `Real Ledger`, `source module`, `Month Ritual`, `capacity`, `legacy`,
   `metadata`, `mutation`, `snapshot`, and `story` are repeated in
   primary surfaces without always explaining why a user needs the distinction.
4. **VI and EN usually preserve meaning, but not always the same precision.**
   The most important parity risk is activity copy where EN says “cleared
   moves” but VI says `giao dịch sổ cái`, losing the cleared/recorded status.
5. **Brand tone is over-applied.** `nhịp`, `ý định`, `nhẹ`, `êm`, `bình yên`,
   and “not invented” language recur across Home, Health, Inbox, Plan, and
   Money. A few occurrences establish identity; the current density makes the
   copy feel system-generated and occasionally evasive.
6. **The largest content risk is not missing translation coverage; it is
   repeated implementation language and inconsistent product nouns.** Plan and
   Money need a smaller stable vocabulary before large-scale rewriting.

### Highest-risk modules

- `money`: 1,582 messages; highest financial precision and terminology risk.
- `plan`: 646 messages; highest implementation-language and product-model risk.
- `inbox`: 155 messages; cross-module handoffs and action ownership are easy to
  misunderstand.
- `together`: 181 messages; ownership, access, role, and leaving consequences
  need precise, calm language.
- `health`: 56 messages; score confidence and partial-data semantics should not
  be hidden behind branded narrative.

### Recommended rewrite order

1. Global foundations: spelling, CTA rules, state-message structure, product
   noun policy, financial glossary, and formatter conventions.
2. Auth/system and onboarding.
3. Home and shared empty/status states.
4. Money in small financial flows: accounts/transfers, transactions, savings,
   loans/cards/debt, then investments.
5. Plan in small flows: jars, allocation, goals, recurring, Month Ritual and
   Monthly Review.
6. Inbox and cross-module handoffs.
7. Together/settings.
8. Health.
9. Final VI/EN parity and terminology pass.

## B. ViNha Voice & Tone

### Voice characteristics

ViNha should sound:

- clear enough to act on immediately;
- warm through respect and plain language, not encouragement;
- financially precise, especially when money can move, be locked, or be
  interpreted as a balance;
- modern and concise, with a Vietnamese-first surface;
- collaborative when a household decision is shared;
- transparent about limits, stale data, partial data, and read-only states;
- confident without sounding like a bank, coach, or wellness app.

The voice should prefer a concrete verb and a concrete consequence:
“Chọn hũ trước khi lưu” / “Choose a jar before saving” is stronger than a
metaphor about keeping rhythm.

### Tone by context

| Context             | Tone                        | Copy rule                                                                            |
| ------------------- | --------------------------- | ------------------------------------------------------------------------------------ |
| Normal navigation   | Neutral and compact         | Name the destination; avoid slogans in labels.                                       |
| Money movement      | Factual and explicit        | State source, destination, amount effect, and whether it is income/expense/transfer. |
| Warning             | Calm, direct, consequential | Say what may happen and what choice avoids it.                                       |
| Error               | Respectful and actionable   | Say what failed, whether anything changed, and the next safe action.                 |
| Destructive action  | Plain and unambiguous       | Name the record, permanence, access, or settlement consequence.                      |
| Success             | Brief and evidential        | Confirm what changed; do not celebrate a financial outcome that did not happen.      |
| Onboarding          | Welcoming and practical     | Explain the next decision; avoid “journey” language.                                 |
| Financial education | Patient and exact           | Define a concept once, then use the canonical term.                                  |
| Empty state         | Useful and honest           | Say what will appear and the one relevant next action.                               |

### Do / do not examples from the current system

| Current pattern                                                                   | Assessment                                                          | Preferred direction                                                   |
| --------------------------------------------------------------------------------- | ------------------------------------------------------------------- | --------------------------------------------------------------------- |
| `common.tagline`: `Tiền chung, giữ bình yên.`                                     | Over-branded; “bình yên” does not explain the product.              | Use a concrete promise about shared money or decisions.               |
| `home.header.headline.starting`: `Một nơi êm để bắt đầu`                          | Warm but vague and repeated with other calm metaphors.              | Say what the user can see or do first.                                |
| `inbox.header.supporting.clear`: `Hộp thư sạch bong. Giữ nhịp nhẹ nhàng này nhé.` | Cute and motivational for a financial queue.                        | Confirm that there are no open decisions.                             |
| `plan.teaching.body`: `Hũ là phong bì ý định...`                                  | Useful metaphor, but it must not be repeated in every Plan surface. | Explain the Plan/real-money distinction once, then use short labels.  |
| `health.insights.items.ai_guardrail.body`: `...không có đường rõ ràng.`           | Guardrail is important; “đường” is an internal metaphor.            | State the explicit user-visible rule: AI can explain, not move money. |
| `money.captureForm.jarHintExpense`: `...gửi ReviewItem vào Inbox.`                | Implementation type leaks into a form.                              | Say that the transaction will need review in Hộp thư.                 |
| `plan.stub.jarsBody`: `...ở story Plan tiếp theo.`                                | Product roadmap/engineering language in primary UI.                 | Describe availability or the next user action without “story”.        |
| `together.overviewDescription`: `Con người, quyền truy cập và cấu hình chung...`  | Literal translation; “con người” is unnatural here.                 | Use “Thành viên, quyền truy cập và thiết lập chung...”.               |

## C. Vietnamese Writing Principles

### Pronouns and address

- Use no pronoun in compact labels where the action is obvious.
- Use `bạn` in instructions, errors, and confirmations; do not alternate with
  `mình`, `chúng ta`, and `người dùng` without a reason.
- Use `hộ gia đình` on first mention when ownership or membership matters; use
  `hộ` in compact follow-up copy only when the scope is unambiguous.
- Use `đối tác` for the product relationship and `thành viên` for the
  membership/accountability concept. Do not use English `partner` in VI.

### Sentence and punctuation rules

- Prefer one action or one consequence per sentence.
- Keep helper text to one or two short sentences; move detailed explanation to
  secondary information where possible.
- Use sentence case, not title case. Keep branded product names capitalized
  only when the noun policy says they are product names.
- Use Vietnamese punctuation consistently: `…` rather than `...`; use an
  em-dash only when it clarifies a contrast; do not use a dash to simulate a
  brand voice.
- Standardize spelling to `Hủy`, `tùy chọn`, `Sức khỏe`, `khóa`, and
  `xóa`. The current mixed spellings are a copy defect, not a tone choice.

### English loanwords

Keep established technical/financial terms that users may recognize: `email`,
`ETF`, `NAV`, `CCQ`, `BTC`, `USDT`, and provider names. Localize ordinary
workflow words: `partner` → `đối tác`, `admin` → `Quản trị`, `active` →
`đang hoạt động`, `review` → `xem lại` or `tổng kết` depending on the
product concept, `snapshot` → `số liệu chốt của kỳ` when shown to consumers.

Do not mix `Plan`, `Money`, `Inbox`, `Together`, `Active`, `Suggest`,
`Reversed`, `realloc`, `ReviewItem`, and `Auth` into Vietnamese sentences
unless the term is explicitly a retained product/status name.

### Financial terminology

Preserve established terms such as `dư nợ`, `hạn mức`, `sao kê`, `tất toán`,
`lãi suất`, `giá vốn`, `lãi/lỗ`, `NAV`, `CCQ`, `gốc`, `lãi`, `phí`,
`thuế`, and `kỳ hạn`. Explain them where needed; do not replace them with
vague words such as “số tiền”, “khoản còn lại”, or “lợi ích”.

### CTA, helper text, and dialogs

- Use a verb first: `Lưu`, `Hủy`, `Xác nhận`, `Thử lại`, `Quay lại`.
- Use `Xem lại` for a review step, not for a completed action.
- Use `Hoàn tất` only when a flow is actually complete; use `Xong` for a
  receipt/dismissal only if there is no further destination implied.
- Confirmation body must state the effect, not only “Bạn chắc chắn?”.
- Destructive confirmation must name permanence, access loss, or settlement
  effect explicitly.

### Numbers, currency, dates, percentages, abbreviations

- Keep domain values numeric and format them through the shared locale
  formatter; never embed a display-formatted amount in a message key.
- Do not mix `$0.00`, `VND`, `đ`, and `đồng` in one surface. The current
  `plan.jars.reallocate.virtualBannerBody` uses `$0.00` in both locales even
  though the product is Vietnamese-first and the household currency is
  configurable; this needs a later formatter/content decision.
- Use locale-aware dates and state the relevant date meaning: transaction date,
  due date, maturity date, or target date.
- Keep `%` attached to the number in Vietnamese (`10%`) and preserve the
  interpolation token.
- Keep `NAV`, `CCQ`, and `ETF` when financially correct; expand once in
  helper text only when the audience may not know the term.

## D. English Writing Principles

- Use natural consumer English, not API or database English.
- Prefer `You are offline` / `Nothing was saved` over “mutations are blocked”
  in primary UI. Reserve “mutation” for developer documentation.
- Use sentence case and consistent verbs: `Save`, `Cancel`, `Confirm`,
  `Continue`, `Review`, `Done`, `Back`, `Try again`.
- Keep `Money`, `Plan`, `Inbox`, `Together`, `Jar`, and `Month Ritual`
  as product terms only where the product-noun decision requires them; do not
  capitalize ordinary uses such as “money” or “plan” by accident.
- Prefer “real balance”, “account balance”, or “recorded transaction” over
  `Real Ledger` in primary consumer copy unless the distinction from a Plan
  intention is the actual subject of the screen.
- Use `read-only` for a user-visible capability, not `immutable` or “state
  machine”.
- Use “source account” and “funding source” distinctly: an account is where a
  movement can occur; a funding source may be a savings product, investment,
  debt, or account used to explain goal progress.
- Preserve financial distinctions: principal is not total payment, interest is
  not fee, a transfer is not income/expense, and planned allocation is not a
  bank balance.
- Avoid “quiet”, “calm”, “pulse”, “rhythm”, “journey”, and “momentum” except in
  a small number of brand-level surfaces.
- Do not describe a future implementation slice as a `story` in user-facing
  copy.

## E. Canonical Terminology Glossary

These are the 18 terminology conflict families found across the message
system. “Current variants” are observed variants, not all necessarily wrong.

| Concept              | Current variants                                              | Recommended VI                                                                                     | Recommended EN                                                                           | Context notes                                                                  | Must remain financially precise?      |
| -------------------- | ------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ | ------------------------------------- |
| Household            | `hộ gia đình`, `hộ`, `gia đình`, `household`                  | `hộ gia đình`; compact `hộ`                                                                        | `household`                                                                              | Use one scope term for ownership and membership.                               | Yes when ownership/access is involved |
| Member               | `thành viên`, `đối tác`, `partner`, `member`                  | `thành viên` for membership; `đối tác` for relationship                                            | `member` for account/access; `partner` for relationship                                  | Do not call every member a partner in permissions copy.                        | Yes for access/roles                  |
| Money product        | `Money`, `Tiền`, `tiền thật`, `Real Ledger`                   | Product label `Tiền`; body `tiền`, `số dư tài khoản`, `giao dịch thực`                             | Product label `Money`; body `money`, `account balance`, `recorded transaction`           | Keep product label separate from the ordinary noun.                            | Yes                                   |
| Plan product         | `Plan`, `Kế hoạch`, `planned`, `allocation`                   | Product label `Kế hoạch`; body `kế hoạch`                                                          | Product label `Plan`; body `plan`                                                        | Do not let Plan imply money has moved.                                         | Yes                                   |
| Inbox product        | `Inbox`, `Hộp thư`, `queue`, `review item`                    | Product label `Hộp thư`; body `mục cần xem`                                                        | Product label `Inbox`; body `review item`                                                | `ReviewItem` is implementation language and must not surface.                  | No, but action state is precise       |
| Together product     | `Together`, `Cùng nhau`, `hộ gia đình`                        | Retain `Together` only as the branded navigation label; explain as `Hộ gia đình` on page           | `Together`                                                                               | Do not use `Together` as a Vietnamese grammatical noun.                        | Access consequences are precise       |
| Jar                  | `hũ`, `Jar`, `phong bì`                                       | `hũ`                                                                                               | `Jar`                                                                                    | “Phong bì” is an explanatory metaphor, not the canonical noun.                 | Yes when allocation is involved       |
| Allocation           | `phân bổ`, `gán`, `đặt`, `placement`, `realloc`               | `phân bổ`; `chuyển phần ngân sách` for a capacity movement                                         | `allocation`; `reallocate budget` where user-visible                                     | `realloc` is not consumer copy.                                                | Yes                                   |
| Budget               | `ngân sách`, `kế hoạch`, `số kế hoạch`                        | `ngân sách` for spend limit; `kế hoạch` for intent                                                 | `budget` for spend limit; `plan` for intent                                              | Never use “budget” to mean account balance.                                    | Yes                                   |
| Capacity             | `sức chứa`, `năng lực`, `sức chứa ảo`, `capacity`             | `phần ngân sách có thể chuyển` where behavior permits; otherwise `sức chứa` with explanation       | `available budget to move` where behavior permits; otherwise `capacity` with explanation | This term needs product/UX validation before rewriting.                        | Yes                                   |
| Real position        | `vị thế thật`, `tiền thật`, `sổ cái thật`, `Real Ledger`      | `số dư và giao dịch thực` in primary UI                                                            | `real balances and recorded transactions` in primary UI                                  | Keep “sổ cái” only in audit/history contexts.                                  | Yes                                   |
| Account/source       | `tài khoản`, `nguồn`, `nguồn tài chính`, `funding source`     | `tài khoản nguồn` for movement; `nguồn tài chính` for goal backing                                 | `source account` for movement; `funding source` for goal backing                         | Do not collapse both into `nguồn`.                                             | Yes                                   |
| Transaction/activity | `giao dịch`, `hoạt động`, `movement`, `activity`, `capture`   | `giao dịch`; `hoạt động` only for a mixed activity feed                                            | `transaction`; `activity` only for a mixed feed                                          | `capture` should be `ghi nhận giao dịch`.                                      | Yes                                   |
| Goal/progress        | `mục tiêu`, `tiến độ`, `đích ý định`, `Goal`                  | `mục tiêu`, `tiến độ`; explain that progress is not money moved                                    | `Goal`, `progress`                                                                       | Do not call intention progress “funded” unless backed by a real source.        | Yes                                   |
| Recurring            | `định kỳ`, `lặp lại`, `nhịp kỳ vọng`, `schedule`              | `định kỳ` for recurring rule; `lịch` for dates                                                     | `recurring` for rule; `schedule` for dates                                               | “Nhịp” is brand language, not the term of record.                              | Context-dependent                     |
| Review/Ritual        | `Review`, `Tổng kết tháng`, `Nghi thức tháng`, `xem lại`      | `Xem lại` for a step; `Tổng kết tháng` for the report; `Nghi thức tháng` only for the locking flow | `Review` for a step/report; `Month Ritual` only for the locking flow                     | These are different interactions and should not be interchangeable.            | Yes because lock semantics differ     |
| Savings/deposit      | `tiết kiệm`, `sản phẩm`, `gói`, `saving`                      | `khoản tiết kiệm`; `gói tiết kiệm` for provider product                                            | `saving`; `savings product` / `package`                                                  | Preserve maturity, renewal, rate, principal, and settlement distinctions.      | Yes                                   |
| Debt/loan/liability  | `nợ`, `khoản vay`, `nghĩa vụ nợ`, `debt`, `loan`, `liability` | `nợ` for debt relationship; `khoản vay` for borrowed loan; `nghĩa vụ nợ` for a liability record    | `debt`, `loan`, `liability` by domain meaning                                            | Do not use “khoản vay” for a credit-card liability without checking the model. | Yes                                   |

## F. Product noun decisions

| Name     | Decision for Vietnamese UI                                                                                                                  | Reasoning                                                                                                                                                                         |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Money    | Localize the navigation/product label to `Tiền`; use `Money` only if a future brand decision explicitly treats it as a proper product name. | `Tiền` is immediately understood by the target audience. Current mixing (`Tiền`, `Money`, `tiền thật`, `Real Ledger`) creates more confusion than brand value.                    |
| Plan     | Localize to `Kế hoạch` in VI UI; retain `Plan` in EN.                                                                                       | `Kế hoạch` is natural and already used in navigation and many explanations. The financial distinction can be preserved through helper copy.                                       |
| Inbox    | Localize to `Hộp thư` in VI UI; retain `Inbox` in EN.                                                                                       | The screen is a decision queue, but `Hộp thư` is the clearest compact noun for Vietnamese users. Explain “mục cần xem” in body copy.                                              |
| Together | Retain `Together` as the branded navigation label; use `Hộ gia đình` as the functional page noun.                                           | `Cùng nhau` is a weak navigation label and `Hộ gia đình` is more precise. Keeping the brand name is acceptable if it is not inserted into Vietnamese sentences as a generic noun. |
| Jar      | Localize to `hũ` in VI UI; retain `Jar` in EN.                                                                                              | “Hũ” is short, understandable, and already established in the product model. `phong bì` is explanatory only.                                                                      |

These are recommendations for the next content implementation, not production
changes in this audit.

## G. Financial terminology glossary

| Term                             | Classification                       | Why                                                                                                          |
| -------------------------------- | ------------------------------------ | ------------------------------------------------------------------------------------------------------------ |
| Dư nợ / outstanding balance      | Keep precise                         | It is the amount still owed; “số tiền còn lại” can hide debt meaning.                                        |
| Hạn mức / credit limit           | Keep precise                         | It is a cap, not the available balance.                                                                      |
| Sao kê / statement               | Keep precise                         | It identifies a lender/card statement and its period.                                                        |
| Tất toán / settle or pay off     | Keep precise                         | It means closing a financial obligation/product, not merely “xong”.                                          |
| Lãi suất / interest rate         | Keep precise                         | Rate and interest amount are different concepts.                                                             |
| Giá vốn / cost basis             | Keep precise                         | Needed for investment P&L; “giá mua” is not always the same basis.                                           |
| Lãi/lỗ / gain/loss               | Keep precise                         | Must distinguish realized and unrealized where applicable.                                                   |
| NAV / CCQ                        | Keep precise                         | Established investment terms; expand once if education is needed.                                            |
| Gốc / principal                  | Keep precise                         | Principal is not interest, fee, or total payment.                                                            |
| Lãi / interest                   | Keep precise                         | Do not merge with fees or total return.                                                                      |
| Phí / fee                        | Keep precise                         | A fee should remain separately classified in payment splits.                                                 |
| Thuế / tax                       | Keep precise                         | “Chi phí” is too broad when tax treatment matters.                                                           |
| Kỳ hạn / term                    | Keep precise                         | It determines maturity and early-withdrawal behavior.                                                        |
| Rút trước hạn / early withdrawal | Keep precise                         | The timing can change interest/penalty consequences.                                                         |
| Gia hạn / renew or rollover      | Context-dependent                    | “Renew” can mean principal plus interest, principal only, or a new package.                                  |
| Số dư / balance                  | Context-dependent                    | Say account balance, jar budget, or outstanding balance; never leave the object ambiguous in a money action. |
| Giao dịch / transaction          | Context-dependent                    | A transfer is not income/expense; a payment can create a linked transaction.                                 |
| Phân bổ / allocation             | Context-dependent                    | In Plan it is intention; in a completed money movement it may describe a separate financial act.             |
| Ngân sách / budget               | Context-dependent                    | A planned spending amount is not cash held in an account.                                                    |
| Tiến độ mục tiêu / goal progress | Safe to simplify only with guardrail | It may be an intention-only value; do not label it “funded” without a real backing source.                   |
| Lợi nhuận / return               | Context-dependent                    | Do not use it where the value is only a planning estimate or gross interest.                                 |

Potentially dangerous simplifications include:

- `tất toán` → `hoàn tất`: loses the financial closing action;
- `dư nợ` → `còn lại`: loses the debt relationship;
- `lãi suất` → `lãi`: confuses a rate with an amount;
- `gốc` → `số tiền`: loses the principal/interest split;
- `phân bổ` → `chuyển tiền`: falsely implies a real movement;
- `tiến độ` → `đã tiết kiệm`: falsely implies money exists;
- `số dư` → `giá trị`: loses the account or obligation context.

## H. Problem pattern inventory

### Literal or unnatural translation

- `together.overviewDescription`: `Con người, quyền truy cập và cấu hình chung của hộ gia đình này.`
- `plan.recurring.body`: `Nhịp kỳ vọng nuôi kế hoạch.`
- `plan.jars.reallocate.receiptTitle`: `Đã chuyển năng lực.`
- `inbox.maturitySourceBody`: `Xác nhận, đổi hoặc rút chạy qua hành động Savings.`
- `inbox.maturityHint`: `Savings thực hiện kết quả tiền; Inbox chỉ ghi nhận quyết định.`

These need native Vietnamese rewriting, not word substitution.

### Implementation language in primary UI

- `home.status.stale.description`: `...mở module nguồn...` / `...open the source module...`
- `money.captureForm.jarHintExpense`: `...ReviewItem vào Inbox.`
- `auth.login.errors.unconfigured`: `...cấu hình Auth.`
- `plan.goals.fundingDeferredHint`: `Mot so du lieu Money da lien ket can duoc kiem tra truoc khi gia tri day du`
- `plan.jars.categoryForm.errors.immutable`: `...sửa giao dịch tại chỗ...` is understandable, but `immutable` is exposed in the underlying pattern and the recommended action wording is not stable.
- `plan.stub.*Body` and `money.captureSoonBody`: `story` is product-development vocabulary.
- `system.offline.escalate` EN: `Why mutations are blocked` is engineering terminology.

Classification:

- Keep: ownership, read-only, principal, maturity, and source distinctions when
  the user needs the consequence.
- Simplify: module, source context, snapshot, capacity, Auth, and Real Ledger.
- Remove from primary UI: ReviewItem, story, legacy implementation labels, and
  mutation.
- UX issue: repeated “not a balance” explanations where the screen structure
  itself does not make the distinction visible.

### Mixed-language UI

Representative keys include:

- `plan.jars.categoryForm.errors.month_locked`: `Mở Month Ritual để chỉnh.`
- `plan.jars.reallocate.warnBody`: `Realloc này...`
- `plan.jars.incomeModeHint`: `Partner ...`
- `inbox.why.income_suggest`: `...Suggest... Active...`
- `money.correctForm.confirmBody`: `...trạng thái Reversed...`
- `money.captureForm.jarHintExpense`: `ReviewItem ... Inbox`
- `together.title`, `together.membersDescription`, and navigation labels
  where English product nouns are mixed into otherwise Vietnamese sentences.

### Missing or inconsistent Vietnamese diacritics and orthography

- Entire block under `plan.goals.backing`, `plan.goals.fundingGroup`,
  `plan.goals.fundingValueQuality`, and `plan.goals.fundingDeferredHint` is
  unaccented, for example `Da lien ket nguon that`.
- `Huỷ` and `Hủy` coexist across 33 observed messages.
- `tuỳ` and `tùy` coexist across 36 observed messages.
- `Sức khoẻ` and `Sức khỏe` coexist.
- `khoá` and `khóa` coexist.
- `offline` appears once in VI where the rest of the app uses `ngoại tuyến`.
- `Xoá` and `Xóa` also coexist in destructive actions.

### Excessive explanation

The Plan and Health surfaces repeat variants of “not a bank balance”, “real
money unchanged”, “not invented”, and “intention only”. The distinction is
financially important, but the copy should be consolidated into:

1. one stable teaching explanation;
2. one concise inline qualifier on an intention value;
3. one explicit receipt statement after an action.

### AI-like or over-branded tone

Representative VI keys:

- `common.tagline`: `Tiền chung, giữ bình yên.`
- `emptyStates.homeLead`: `Nơi yên tĩnh cho những gì quan trọng hôm nay.`
- `home.header.headline.starting`: `Một nơi êm để bắt đầu.`
- `home.planPulse.hint`: `Một kế hoạch nhẹ nhàng cho từng khoản tiền.`
- `inbox.header.supporting.clear`: `Hộp thư sạch bong. Giữ nhịp nhẹ nhàng này nhé.`
- `health.narratives.*`, `health.insights.sectionScenarios`, and
  `health.insights.scenarios.*`.

Representative EN keys use the same pattern: `quiet`, `calm`, `pulse`,
`rhythm`, `momentum`, `intention`, and “invented balance”. Keep a small
number of brand-level metaphors; remove them from status, error, and financial
receipt copy.

### CTA inconsistency

- Cancel: VI has both `Hủy` and `Huỷ`; EN is stable as `Cancel`.
- Back: VI alternates `Quay lại`, `Về ...`, and `Vào Home`; EN alternates
  `Back`, `Back to ...`, and `Go to Home`.
- Completion: `Xong`, `Hoàn tất`, `Đã hoàn tất`, `Đã xong`, and `Về ...`
  appear for different final states without a documented rule.
- Review: `Xem lại`, `Xem xét`, `Mở`, and English `Review` overlap.
- Retry: `Thử lại`, `Thử tải lại`, and `Thử lại khi có mạng` are all valid but
  need context rules.

### Product noun inconsistency

- `Tiền` and `Money` both name the Money module in VI.
- `Kế hoạch` and `Plan` both name Plan in VI.
- `Hộp thư` and `Inbox` both name Inbox in VI.
- `Together` is retained in Vietnamese back links and sentences without a
  functional Vietnamese noun.
- `hũ`, `Jar`, `phong bì`, and `sức chứa` are used at different
  abstraction levels.

### Duplicate terminology

- `hoạt động` means both “activity feed” and “active state”.
- `nguồn`, `tài khoản nguồn`, `nguồn tài chính`, and `funding source` are not
  consistently scoped.
- `sức chứa` and `năng lực` both represent virtual budget movement.
- `tổng kết`, `xem lại`, `Review`, and `Nghi thức tháng` are not clearly
  separated as review report, review step, and locking ritual.

### Semantic parity risks

1. `health.insights.items.activity.body`: EN says `cleared moves`; VI says
   `giao dịch sổ cái`, which loses the cleared/recorded status.
2. `system.offline.escalate`: EN says `mutations are blocked`; VI says
   `không ghi được`. The VI is more natural, but the future rewrite must
   preserve that the restriction is on writes, not reading.
3. `plan.jars.reallocate.receiptTitle`: VI `Đã chuyển năng lực` and EN
   `Capacity moved` preserve the broad effect but use an unstable Vietnamese
   noun; the rewrite must retain that only virtual allocation capacity moved,
   not cash.

## I. Module audit

Priority numbers are the recommended rewrite order; P1 is foundational.

| Namespace     | Message count | Content quality | Terminology risk | UX dependency | Priority | Reason                                                                                     |
| ------------- | ------------: | --------------- | ---------------- | ------------- | -------- | ------------------------------------------------------------------------------------------ |
| `common`      |             4 | Needs rewrite   | Medium           | Low           | P1       | Brand tagline and empty/count language set the tone globally.                              |
| `navigation`  |             6 | Needs polish    | High             | Medium        | P1       | Product noun policy is not settled in VI.                                                  |
| `buttons`     |             5 | Needs polish    | Medium           | Low           | P1       | CTA baseline is simple but conflicts with local spellings.                                 |
| `forms`       |             2 | Good            | Low              | Low           | P1       | Small stable foundation.                                                                   |
| `dialogs`     |             2 | Good            | Low              | Medium        | P1       | Generic confirmation is safe only when callers add consequences.                           |
| `validation`  |             7 | Good            | Low              | Low           | P1       | Natural and concise; keep token contracts.                                                 |
| `errors`      |             3 | Good            | Low              | Low           | P1       | Good global fallback; align with system errors later.                                      |
| `toast`       |             2 | Needs polish    | Low              | Medium        | P1       | Success/error distinction is too generic for financial actions.                            |
| `a11y`        |             5 | Good            | Low              | Medium        | P1       | Good baseline; verify labels after noun decisions.                                         |
| `metadata`    |             2 | Good            | Low              | Low           | P1       | Brand/title surface only.                                                                  |
| `system`      |            18 | Needs polish    | High             | High          | P1       | Offline, permission, maintenance, and mutation language need a stable state model.         |
| `auth`        |           102 | Needs polish    | High             | Medium        | P2       | Good flow coverage; `Auth`, account lifecycle, and error precision leak internals.         |
| `onboard`     |            27 | Needs polish    | High             | High          | P2       | Mixed product nouns, `Home`, `Together`, and “seeds”/“hạt giống” framing.                  |
| `emptyStates` |            13 | Needs rewrite   | Medium           | Medium        | P3       | Repeated poetic calm language and weak next actions.                                       |
| `home`        |            87 | Needs rewrite   | High             | High          | P3       | Tone density, module language, and dashboard status semantics.                             |
| `money`       |         1,582 | High risk       | High             | High          | P4       | Largest namespace; financial terms, cross-module ownership, and implementation vocabulary. |
| `plan`        |           646 | High risk       | High             | High          | P5       | Intention vs real money is correct but over-explained and inconsistently named.            |
| `inbox`       |           155 | Needs rewrite   | High             | High          | P6       | Queue, ownership, decision, and Money/Savings/Plan handoffs are interdependent.            |
| `together`    |           181 | Needs polish    | High             | High          | P7       | Role, access, ownership, leaving, and policy semantics need exact language.                |
| `settings`    |            26 | Needs polish    | Medium           | Medium        | P7       | `tùy chọn`, product back links, and account lifecycle wording.                             |
| `health`      |            56 | Needs rewrite   | High             | High          | P8       | Score/partial-data semantics are mixed with repeated metaphor and AI guardrails.           |
| `catalog`     |            14 | Needs polish    | Medium           | Low           | P1       | Small taxonomy; `Sức khoẻ` spelling and noun alignment.                                    |

## J. UX-content issues

These are intentionally not proposed as copy-only fixes.

1. **`home.status.stale.description`** — Source:
   `app/[locale]/(product)/home/home-status-lane.tsx`. The status lane renders a
   stale-data alert and retry action, with copy telling users to pull to refresh
   or open the source module. Copy alone cannot answer whether data is cached,
   which facts are stale, or whether opening the source actually refreshes it.
   **UX question:** What data is stale, what timestamp is available, and what
   exact action refreshes it on desktop as well as touch screens?
2. **`home.status.partial.description`** — The screen reports partial data but
   does not name the missing source in the message contract. **UX question:**
   Should the status lane list missing modules and link directly to each one?
3. **`money.captureSoonBody`** — The current UI explicitly tells users that
   transaction capture will arrive in a future “Money story”. This is a product
   availability/roadmap state, not merely bad prose. **UX question:** Should the
   surface be hidden, replaced with an available action, or labeled as a real
   product limitation?
4. **`plan.stub.jarsBody`, `plan.stub.goalsBody`, `plan.stub.recurringBody`,
   `plan.stub.ritualBody`** — `PlanDestinationStub` renders these as info
   alerts with a back link. The user is seeing implementation sequencing. **UX
   question:** Are these destinations intentionally public, and what is the
   useful fallback action while unavailable?
5. **`inbox.detailSubtitle`, `inbox.resolve`, and
   `inbox.dismissConfirmBody`** — `InboxDecisionPanel` supports resolve,
   dismiss, and typed Savings actions. Copy must explain whether the decision
   changes a transaction, only assigns a jar, or hands off to Savings. **UX
   question:** Should each action show an effect preview before the confirmation,
   rather than relying on prose?
6. **`inbox.maturityHint` and `inbox.earlyWithdrawalHint`** — The source code
   routes actions from Inbox into Savings commands. The handoff is a product
   ownership rule. **UX question:** Which screen owns the confirmation, receipt,
   and error, and how is that ownership shown to the user?
7. **`system.offline.*` and module offline messages** — The app fails closed for
   writes, while reading may continue. **UX question:** Can the UI show last
   synced time and distinguish unavailable, stale, and read-only data without
   making users infer it from “offline writes”?
8. **`together.members.leaveConfirmBody`, `removeConfirmBody`, and
   `impactSummary`** — Leaving/removing affects access while personal records
   remain read-only in the household. **UX question:** Does the confirmation
   need a structured impact summary, separate from the destructive decision, so
   the user can understand what remains and what stops?
9. **`health.states.partialBody` and `health.states.noVisibleFactsBody`** —
   `HealthPage` renders a score only when data state permits, but the copy also
   discusses assessment and risk. **UX question:** Should the UI show coverage,
   confidence, and missing inputs as structured metadata rather than a sentence?
10. **`money.loanDetail.confirm.repaymentHint` and card/settlement receipts** —
    The domain distinguishes one real-money movement, principal, interest, and
    fee. **UX question:** Is the confirmation layout itself explicit enough to
    prevent a user from reading the payment as a single undifferentiated debt
    reduction?

## K. Hardcoded string inventory

### Counted candidates

**71 counted occurrences**, grouped as follows:

| File                                               | Count | Candidate strings                                                                                                                                                                          | Assessment                                                                                         |
| -------------------------------------------------- | ----: | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------- |
| `modules/investments/application/investment-ux.ts` |    68 | Asset-class titles, descriptions, field labels, action labels, units, and entry-mode labels such as `Theo dõi tài sản Spot và giá vốn.`, `NAV / CCQ`, `Mua thêm`, `Tôi đã sở hữu từ trước` | User-facing and Vietnamese-only; must enter the i18n system before a full locale rewrite.          |
| `shared/ui/form/auth-text-field.tsx`               |     2 | `Show password`, `Hide password`                                                                                                                                                           | English fallbacks can appear when callers omit labels; localize or require caller-provided labels. |
| `shared/patterns/error-state.tsx`                  |     1 | `Something went wrong`                                                                                                                                                                     | English default can appear outside a provider or when a caller omits the title.                    |

### Intentionally excluded from the count

- `shared/patterns/brand-mark.tsx` contains the brand-only accessible title
  `ViNha`; this is not a locale defect.
- Developer logs, thrown error messages, Supabase configuration messages, error
  codes, type literals, internal operation labels, and tests were excluded.
- `modules/investments/domain/investment-domain.ts` contains English event-label
  constants such as `Allocate units` and `Historical import`, but repository
  search found no current UI caller of those labels. They should be monitored
  if an activity screen starts consuming them; they are not counted as current
  UI candidates.
- No direct Vietnamese JSX text node was found outside the i18n system. One
  source scan found only a non-user-facing conditional expression in JSX.

The investment registry is the meaningful gap: it is a presentation API being
used by forms and pages, so moving only obvious buttons is insufficient. The
whole registry needs locale-aware labels while preserving asset-class and
financial meaning.

## L. Rewrite roadmap

### Batch 1 — Global foundations

1. Decide VI product nouns: `Tiền`, `Kế hoạch`, `Hộp thư`, `Together`, `hũ`.
2. Normalize spelling: `Hủy`, `tùy`, `Sức khỏe`, `khóa`, `xóa`.
3. Define CTA/state templates and financial glossary.
4. Replace hardcoded investment presentation strings with localized message
   keys; preserve asset-class-specific terminology.
5. Define the primary wording for real balances/transactions versus Plan
   intentions. Do not delete guardrails before the wording is approved.

### Batch 2 — Auth and system

- Auth entry, registration, password reset, confirmation, account deletion.
- Replace `Auth`/configuration wording in user-facing messages with a useful
  availability message; keep technical detail only for support diagnostics.
- Normalize offline, permission, maintenance, generic error, retry, and
  read-only states.

### Batch 3 — Onboarding

- Household creation and partner invitation.
- First cash account and starter jars.
- Remove `Home`, `Together`, “seeds”, and mixed English unless product-noun
  decisions explicitly retain them.

### Batch 4 — Home and shared states

- Home headings, dashboard summaries, empty states, status lane, and day-zero
  actions.
- Keep financial pulse only if it is the actual product metric; remove repeated
  rhythm/calm metaphors from operational states.

### Batch 5 — Money, split into safe financial slices

1. Accounts, ownership badges, balances, and transfers.
2. Transactions: capture, categorization, tags, correction, refund.
3. Savings: product, maturity, settlement, renewal, and early withdrawal.
4. Loans, credit cards, debt, principal/interest/fee, and payoff.
5. Investments: asset classes, cost basis, NAV/CCQ, realized/unrealized P&L,
   valuation, fees, tax, and hardcoded registry migration.

Each slice must preserve the exact financial effect and receipt semantics.

### Batch 6 — Plan, split by model boundary

1. Jars and states: active/paused/archived, budget, rollover.
2. Allocation and virtual capacity movement.
3. Goals and funding-source links; clearly distinguish intention progress from
   real funding.
4. Recurring rules and calendar.
5. Month Ritual and locking/correction path.
6. Monthly Review and recommendation language.

### Batch 7 — Inbox

- Queue states and filters.
- Jar resolution/dismissal.
- Savings maturity and early withdrawal handoffs.
- EMI/debt completion and emergency declaration.
- Receipts that state exactly what changed and what did not.

### Batch 8 — Together and settings

- Members, roles, invitations, leaving/removal, ownership persistence,
  policies, preferences, and account lifecycle.
- Use structured impact copy where the interaction supports it; do not hide
  access consequences in a long paragraph.

### Batch 9 — Health

- Score states, partial coverage, factors, insights, scenarios, and AI
  guardrails.
- Keep financial facts above narrative tone. Remove “light”, “pulse”, and
  “invented cash” repetition where it does not add a user decision.

### Batch 10 — Cross-app consistency pass

- Search every locale and source file again.
- Compare product nouns, CTA verbs, error structures, financial terms,
  interpolation tokens, number/date/currency presentation, and VI/EN meaning.

## M. Acceptance criteria for future rewrites

Every future content implementation prompt should require:

- preserve the existing key structure unless a key change is explicitly
  approved;
- preserve every interpolation variable exactly, including ICU plural/select
  syntax and rich-text tags;
- preserve VI/EN semantic parity, while allowing each locale to use native
  sentence structure;
- do not change business logic, calculations, routing, state transitions,
  ownership rules, permissions, or database behavior;
- do not invent financial claims, balances, rates, returns, penalties, or
  settlement outcomes;
- do not remove legally or financially relevant warnings;
- do not replace a financial term with a vague friendly word when the meaning
  would change;
- do not expose implementation names such as `ReviewItem`, `Auth`, `RPC`,
  `mutation`, `snapshot`, or `story` in primary UI unless an explicit
  product decision requires it;
- keep all user-facing strings in the i18n system; no new literal UI copy in
  components or application presentation registries;
- use the canonical financial formatter for amounts, percentages, dates, and
  currencies; never persist localized display strings;
- use the CTA/state conventions from this report;
- keep product nouns consistent within a locale and across navigation,
  headings, helper text, dialogs, and receipts;
- run locale JSON parsing, key parity, ICU argument parity, hardcoded-string
  search, and targeted UI verification after each implementation batch;
- for risky financial flows, verify copy against the actual receipt/effect and
  confirm what changed, what did not change, and what remains actionable.

## Validation summary

- VI namespaces inspected: 22 — `a11y`, `auth`, `buttons`, `catalog`, `common`,
  `dialogs`, `emptyStates`, `errors`, `forms`, `health`, `home`, `inbox`,
  `metadata`, `money`, `navigation`, `onboard`, `plan`, `settings`,
  `system`, `toast`, `together`, `validation`.
- EN namespaces inspected: the same 22.
- Total messages: VI 2,945; EN 2,945.
- Locale key parity: pass — 0 VI-only keys, 0 EN-only keys.
- ICU argument parity: pass — 0 mismatches across 2,945 paired messages.
- Malformed JSON: 0 files; all 44 files parsed successfully.
- Hardcoded-string candidates: 71 counted occurrences; 70 localization-risk
  occurrences after excluding the brand-only `ViNha` title.
- Terminology conflicts: 18 conflict families.
- UX-content issues: 10 items requiring later interaction/product review.
- Recommended next implementation batch: **Batch 1 — global foundations**,
  beginning with product-noun policy, Vietnamese orthography, CTA/state rules,
  financial glossary, and the investment presentation registry.
