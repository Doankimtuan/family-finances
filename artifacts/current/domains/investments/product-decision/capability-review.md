# Capability Review

## Decision Matrix

| ID | Capability | Description | Business value | User value | Complexity | Risk | Decision | Reasoning |
|----|------------|-------------|----------------|------------|------------|------|----------|-----------|
| INV-PD-001 | Investment domain separation | Treat Investments as distinct from cash accounts, transactions, savings products, goals, and plans. | High | High | Low | Medium | APPROVED | Phase 1 and Phase 2 both validate that investment value is not cash, savings, or intention. |
| INV-PD-002 | Investment account recognition | Recognize where investment assets are held, such as broker, fund app, insurer, gold shop record, or family arrangement. | High | High | Medium | Medium | APPROVED WITH MODIFICATIONS | Keep as household recognition context; do not turn provider setup into required complexity. |
| INV-PD-003 | Holding identification | Identify the specific investment asset or position the household owns. | High | High | Medium | Medium | APPROVED | Without holding identity, users cannot understand what investment risk exists. |
| INV-PD-004 | Broad asset-class classification | Distinguish stocks, funds, bonds, gold, crypto, insurance-linked products, private investments, and other. | High | High | Medium | Medium | APPROVED WITH MODIFICATIONS | Keep broad and understandable; avoid deep taxonomies until user language is validated. |
| INV-PD-005 | Quantity or units | Track shares, fund units, bond units, gold units, or similar measurable ownership. | Medium | Medium | Medium | Medium | APPROVED WITH MODIFICATIONS | Valid for explainability; allow approximate/manual cases for gold and informal assets in future design. |
| INV-PD-006 | Contribution amount | Track how much household or personal cash was put in. | High | High | Low | Medium | APPROVED | Phase 2 shows users remember contribution first and use it to discuss trust and loss. |
| INV-PD-007 | Cost basis | Preserve acquisition cost for gain/loss interpretation. | Medium | Medium | Medium | Medium | APPROVED WITH MODIFICATIONS | Use as household-level cost context; defer complex tax-lot precision. |
| INV-PD-008 | Estimated current value | Represent current or last-known value of an investment holding. | High | High | Medium | High | APPROVED WITH MODIFICATIONS | Value is important but must be labeled as estimated/dated, not guaranteed cash. |
| INV-PD-009 | Valuation date | Know when the current value was observed. | High | High | Low | Medium | APPROVED | Phase 2 validates stale values as a major misunderstanding risk. |
| INV-PD-010 | Valuation source | Know whether value came from provider, statement, market data, receipt, family update, or manual entry. | High | Medium | Medium | Medium | APPROVED WITH MODIFICATIONS | Keep source simple and confidence-oriented; avoid overbuilding provenance. |
| INV-PD-011 | Unrealized gain/loss | Distinguish value change before sale. | High | High | Medium | High | APPROVED WITH MODIFICATIONS | Valid but must not be framed as spendable money or performance advice. |
| INV-PD-012 | Realized gain/loss | Distinguish gain/loss after sale, redemption, maturity, or write-off. | High | High | Medium | Medium | APPROVED | Needed to explain what actually happened after exit. |
| INV-PD-013 | Investment income | Recognize dividends, coupons, distributions, and similar investment income. | Medium | Medium | Medium | Medium | APPROVED WITH MODIFICATIONS | Valid only as investment context linked to real cash movement; avoid making it salary-like income. |
| INV-PD-014 | Cash movement distinction | Separate transfers, purchases, sales, redemptions, fees, and income from market value movement. | High | High | Medium | High | APPROVED | Essential financial safety and BR-01 protection. |
| INV-PD-015 | Liquidity distinction | Indicate whether investment value can realistically become cash soon. | High | High | Medium | High | APPROVED WITH MODIFICATIONS | Keep simple; avoid precise liquidity scoring or advice-like urgency. |
| INV-PD-016 | Ownership and household visibility | Identify whether an investment is household, personal, partner-managed, family-held, or unclear. | High | High | High | High | APPROVED WITH MODIFICATIONS | Behaviorally important but sensitive; requires privacy/trust validation before implementation. |
| INV-PD-017 | Historical preservation after exit | Preserve investment history after sale, redemption, closure, transfer, or write-off. | Medium | Medium | Low | Low | APPROVED | Household memory and trust need past investment context. |
| INV-PD-018 | Investment account cash | Distinguish broker/platform cash from bank cash and invested holdings. | Medium | Medium | Medium | Medium | DEFERRED | Financially valid but depends on provider detail and user comprehension research. |
| INV-PD-019 | Portfolio allocation by asset class | Show broad allocation across investment types. | Medium | Medium | Medium | Medium | DEFERRED | Useful later, but Phase 2 shows basic clarity matters before portfolio analysis. |
| INV-PD-020 | Provider price/NAV refresh | Refresh stock prices, fund NAV, or provider values. | High later | High later | High | High | DEFERRED | Provider reliability, consent, coverage, and data freshness need research. |
| INV-PD-021 | Provider statement import | Import broker, fund, insurer, or gold-provider statements. | Medium later | Medium later | High | High | DEFERRED | Valid but premature and maintenance-heavy. |
| INV-PD-022 | Manual valuation confidence | Indicate confidence or uncertainty for manual values. | Medium | High | Medium | Medium | APPROVED WITH MODIFICATIONS | Valid for family/gold/private assets; keep simple and non-alarming. |
| INV-PD-023 | Fee tracking | Track broker, fund, spread, surrender, redemption, or custody fees. | Medium | Medium | High | Medium | DEFERRED | Important for accuracy but too detailed before core user needs are validated. |
| INV-PD-024 | Tax tracking | Track or estimate investment taxes. | Medium later | Low now | High | High | DEFERRED | Requires jurisdiction precision and can become advice-like; not validated for ordinary household use. |
| INV-PD-025 | Corporate action tracking | Track splits, rights issues, mergers, delisting, tender offers, and similar events. | Medium later | Low now | High | High | DEFERRED | Real but too complex for young-household simple-first scope. |
| INV-PD-026 | Foreign currency investments | Represent non-VND holdings and currency movement. | Medium later | Medium later | High | High | DEFERRED | Future pressure only; Vietnam-first household validation is insufficient. |
| INV-PD-027 | Margin and leverage visibility | Identify borrowed money or leverage used for investments. | High risk-control | Medium | High | Critical | APPROVED WITH MODIFICATIONS | Only approve risk visibility; do not approve leverage tools, optimization, or encouragement. |
| INV-PD-028 | Risk labels | Provide simple risk context such as volatile, illiquid, guaranteed/not guaranteed, or unverifiable. | High | High | Medium | High | APPROVED WITH MODIFICATIONS | Must be descriptive and educational, not advisory or prescriptive. |
| INV-PD-029 | Volatility context | Explain or display price movement sensitivity. | Medium | Medium | Medium | Medium | DEFERRED | Valid but may create anxiety and over-focus on daily movement. |
| INV-PD-030 | Household purpose note | Record why the household holds an investment. | Medium | Medium | Low | Medium | APPROVED WITH MODIFICATIONS | Keep as optional context; do not blur with Goals or Planning ownership. |
| INV-PD-031 | Gifted or inherited investment distinction | Recognize assets received rather than purchased. | Medium | Medium | Medium | Medium | DEFERRED | Real but not common enough for initial scope decisions. |
| INV-PD-032 | Document attachment/reference | Reference receipts, confirmations, statements, or family agreements. | Medium | Medium | Medium | Medium | DEFERRED | Helpful for trust, but adds document-management burden. |
| INV-PD-033 | Broker or fund provider integrations | Connect to providers for read-only holdings, prices, or transactions. | High later | High later | High | High | DEFERRED | Requires provider research and reliability proof. |
| INV-PD-034 | Multi-currency performance reporting | Report returns across currencies. | Medium later | Low now | High | High | DEFERRED | Too complex before basic Vietnam-first investment tracking is validated. |
| INV-PD-035 | Performance analytics | Calculate money-weighted return, time-weighted return, charts, or advanced performance. | Medium later | Low now | High | High | DEFERRED | Power-user value but over-engineered for current household validation. |
| INV-PD-036 | Net-worth contribution | Let investment value contribute to household wealth picture. | High later | High later | Medium | High | DEFERRED | Valid but depends on Health/Wealth positioning and user comprehension of non-cash value. |
| INV-PD-037 | Diversification visibility | Show concentration or spread across asset types. | Medium later | Medium later | High | High | DEFERRED | Can become advice-like; needs research and governance. |
| INV-PD-038 | Retirement or education portfolio framing | Frame holdings toward long-term family outcomes. | Medium later | Medium later | Medium | Medium | DEFERRED | Goals can express intent; investment domain should not prematurely own outcome planning. |
| INV-PD-039 | Private/family investment tracking | Track informal business, family, private, or unverifiable investment claims. | Medium | Medium | High | High | APPROVED WITH MODIFICATIONS | Behaviorally real in Vietnam; scope must emphasize uncertainty and manual verification limits. |
| INV-PD-040 | Regulatory/tax document summaries | Summarize regulated documents for reporting. | Low now | Low now | High | High | DEFERRED | Not validated and likely maintenance-heavy. |
| INV-PD-041 | Investment health signals | Health reads investment exposure or liquidity risk. | Medium later | Medium later | High | High | APPROVED WITH MODIFICATIONS | Only read-only interpretation is acceptable; Health must not mutate or advise. |
| INV-PD-042 | Investment recommendations | Recommend what to buy, sell, hold, rebalance, or switch. | Low | Low | High | Critical | REJECTED | Conflicts with financial safety and crosses into regulated/advice-like behavior. |
| INV-PD-043 | Automated trading or rebalancing | Automatically buy, sell, rebalance, or move investment money. | Low | Low | High | Critical | REJECTED | Violates no unnecessary automation and household control. |
| INV-PD-044 | Treat unrealized value as spendable plan capacity | Allow plans/jars to use market value as available money by default. | Low | Low | Medium | Critical | REJECTED | Violates BR-01 and creates dangerous cash misunderstanding. |
| INV-PD-045 | Health write-back to investment data | Let Health change investment holdings, values, or decisions. | Low | Low | High | Critical | REJECTED | Violates BR-24 read-only principle. |
| INV-PD-046 | Gamified trading or market-timing prompts | Encourage checking, trading, streaks, predictions, or FOMO behavior. | Low | Low | Medium | Critical | REJECTED | Conflicts with household-first, long-term safety, and behavioral validation. |
| INV-PD-047 | Detailed tax optimization | Optimize tax lots, harvesting, or jurisdiction-specific tax strategy. | Low now | Low now | High | Critical | REJECTED | Too advice-like, complex, and outside ordinary household need. |
| INV-PD-048 | Crypto trading depth | Provide crypto-specific trading, DeFi, staking, or yield mechanics. | Low | Low | High | Critical | REJECTED | High risk, low household validation, and conflicts with simple-first financial safety. |

## Summary

- APPROVED: 7.
- APPROVED WITH MODIFICATIONS: 16.
- DEFERRED: 18.
- REJECTED: 7.
