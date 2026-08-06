# Actors

## User

The person who records, reviews, or corrects category meaning for household money events.

Responsibilities:

- Choose a category for a transaction.
- Recognize unclear or wrong classifications.
- Maintain household vocabulary through normal use.
- Provide missing context from memory.

## Partner

The other household decision-maker who shares category meaning.

Responsibilities:

- Interpret categories consistently.
- Explain transactions they created.
- Challenge or correct category meaning when needed.
- Use categories during review and discussion.

## Household

The shared financial unit that owns category meaning.

Responsibilities:

- Maintain a stable vocabulary.
- Balance simplicity and detail.
- Preserve shared understanding across time.
- Avoid making categories personal-only when money is shared.

## Family

Relatives outside the household who may affect category interpretation.

Responsibilities:

- May receive or send transfers.
- May create recurring support obligations.
- May cause categories such as family support, gifts, Tet, medical help, or education support.

## Merchant

The seller or service provider involved in a transaction.

Responsibilities:

- Provides contextual clues through name, receipt, product type, or invoice.
- May sell multiple kinds of goods under one transaction.
- May be represented unclearly in bank or card statements.

## Bank

The account or transfer provider.

Responsibilities:

- Provides transaction records, descriptions, timestamps, and account context.
- May not provide household category meaning.
- May expose limited or inconsistent merchant descriptors.

## Fintech / Wallet

An e-wallet, payment app, BNPL provider, or payment intermediary.

Responsibilities:

- Provides payment records and merchant context.
- May classify merchants or billers.
- May obscure the underlying merchant through aggregator names.

## Card Network / Acquirer

The payment infrastructure that may assign merchant classification.

Responsibilities:

- Provides merchant-category codes or equivalent classification.
- Classifies merchant type, not necessarily purchase purpose.
- May classify the same real-world merchant differently across processors.

## System

The product environment that stores and presents categories.

Responsibilities:

- Preserve category definitions and assignments.
- Display category meaning consistently.
- Keep classification separate from money movement and planning ownership.
- Record unresolved or missing classification as uncertainty.

## Background Worker

A non-human process that may observe patterns or process provider data.

Responsibilities:

- May read transaction facts and category metadata.
- May identify uncategorized or unmapped items.
- May prepare read-only or reviewable evidence.
- Must not become the owner of household meaning.

## Third-Party Provider

Any external enrichment, banking, wallet, card, receipt, or data provider.

Responsibilities:

- Supplies outside classification hints or merchant data.
- May be incomplete, delayed, wrong, duplicated, or unavailable.
- Does not determine final household meaning.
