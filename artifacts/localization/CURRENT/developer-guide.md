# Developer Guide

## Server Components

```tsx
import { getTranslations } from 'next-intl/server';
import { setLocale } from '@/i18n/set-locale';

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setLocale(locale);
  const t = await getTranslations('emptyStates');
  return <p>{t('homeTitle')}</p>;
}
```

Metadata:

```tsx
const t = await getTranslations({ locale, namespace: 'metadata' });
return { title: t('title') };
```

## Client Components

```tsx
'use client';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';

export function NavItem() {
  const t = useTranslations('navigation');
  return <Link href="/home">{t('home')}</Link>;
}
```

## Hooks

- `useTranslations(namespace)`
- `useLocale()`
- `useAppFormatter()` from `@/shared/i18n/use-app-formatter`

## Shared UI / patterns

- Pass already-translated strings into presentational patterns (`EmptyState`, `ProductStub`) from pages
- Patterns that own default copy (`ErrorState`, `LoadingState`, `TopAppBar` back label) call `useTranslations` internally

## Features (Sprint 1+)

1. Add keys to the correct namespace (en + vi)
2. Use `@/i18n/navigation` for links/routing
3. Use `validation` namespace + `createZodErrorMap` / `createSampleEmailSchema` patterns for forms:

```ts
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { createSampleEmailSchema } from '@/shared/i18n/zod';

const t = useTranslations('validation');
const schema = createSampleEmailSchema(t);
// useForm({ resolver: zodResolver(schema) })
```

## Type safety

`global.ts` augments `use-intl` / `next-intl` `AppConfig.Messages` from English JSON modules. Invalid keys fail `tsc`.

## Do not

- Import `next/link` or `next/navigation` for localized app routes
- Hardcode user-facing strings in feature modules
- Put business copy in `common` — use domain namespaces
