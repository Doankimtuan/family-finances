"use client";

import { useState, type FormEvent } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import {
  MAX_TRANSACTION_TAGS,
  TRANSACTION_COMMON_FILTER_OPTIONS,
  TRANSACTION_SEARCH_MAX_LENGTH,
  TransactionFilterType,
  type TransactionCategoryFilterOption,
  type TransactionJarFilterOption,
  type TransactionTag,
} from "@/modules/ledger/application/client";
import { FilterChip } from "@/shared/patterns/filter-chip";
import { ActionSheetLayout } from "@/shared/patterns/action-sheet-layout";
import { Sheet, SheetActionFooter } from "@/shared/patterns";
import { Button, ButtonVariant } from "@/shared/ui/button";
import { AppIcon } from "@/shared/ui/app-icon";
import { ACTION_ICONS } from "@/shared/ui/icon-registry";
import { TextField } from "@/shared/ui/form";
import {
  CatalogGroup,
  localizeCatalogName,
} from "@/shared/i18n/localize-catalog-name";
import { transactionTagVisualFor } from "./transaction-tag-visuals";
import { transactionsListHref } from "./transactions-list-presentations";

type Props = {
  accountId?: string;
  type: TransactionFilterType;
  query: string;
  categoryIds: string[];
  jarIds: string[];
  selectedTagIds: string[];
  availableCategories: TransactionCategoryFilterOption[];
  availableJars: TransactionJarFilterOption[];
  availableTags: TransactionTag[];
};

export function TransactionsFilterBar({
  accountId,
  type,
  query,
  categoryIds,
  jarIds,
  selectedTagIds,
  availableCategories,
  availableJars,
  availableTags,
}: Props) {
  const t = useTranslations("money.transactionsPage");
  const tCatalog = useTranslations("catalog");
  const locale = useLocale();
  const router = useRouter();
  const [searchDraftState, setSearchDraftState] = useState(() => ({
    value: query,
    query,
  }));
  const searchDraft =
    searchDraftState.query === query ? searchDraftState.value : query;
  const [isOpen, setIsOpen] = useState(false);
  const [draftCategoryIds, setDraftCategoryIds] = useState(categoryIds);
  const [draftJarIds, setDraftJarIds] = useState(jarIds);
  const [draftTagIds, setDraftTagIds] = useState(selectedTagIds);
  const [categorySearch, setCategorySearch] = useState("");
  const [jarSearch, setJarSearch] = useState("");
  const [tagSearch, setTagSearch] = useState("");

  const apply = (
    nextType: TransactionFilterType,
    nextQuery: string,
    nextCategoryIds: string[],
    nextJarIds: string[],
    nextTagIds: string[],
  ) => {
    setIsOpen(false);
    router.push(
      transactionsListHref(nextType, nextTagIds, {
        q: nextQuery || undefined,
        categoryIds: nextCategoryIds,
        jarIds: nextJarIds,
        accountId,
      }),
    );
  };

  const openFilters = () => {
    setDraftCategoryIds(categoryIds);
    setDraftJarIds(jarIds);
    setCategorySearch("");
    setJarSearch("");
    setDraftTagIds(selectedTagIds);
    setTagSearch("");
    setIsOpen(true);
  };

  const submitSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    apply(type, searchDraft.trim(), categoryIds, jarIds, selectedTagIds);
  };

  const hasActiveFilter =
    Boolean(accountId) ||
    type !== TransactionFilterType.ALL ||
    Boolean(
      query || categoryIds.length || jarIds.length || selectedTagIds.length,
    );
  const advancedFilterCount =
    Number(categoryIds.length > 0) +
    Number(jarIds.length > 0) +
    Number(selectedTagIds.length > 0);
  const visibleCategories = availableCategories.filter((category) =>
    localizeCatalogName(tCatalog, CatalogGroup.TAGS, category.name)
      .toLocaleLowerCase(locale)
      .includes(categorySearch.trim().toLocaleLowerCase(locale)),
  );
  const visibleJars = availableJars.filter((jar) =>
    localizeCatalogName(tCatalog, CatalogGroup.JARS, jar.name)
      .toLocaleLowerCase(locale)
      .includes(jarSearch.trim().toLocaleLowerCase(locale)),
  );
  const visibleTags = availableTags.filter((tag) =>
    tag.name
      .toLocaleLowerCase(locale)
      .includes(tagSearch.trim().toLocaleLowerCase(locale)),
  );

  return (
    <div
      className="flex flex-col gap-(--space-3)"
      data-testid="transactions-filter"
    >
      <form className="flex items-end gap-(--space-2)" onSubmit={submitSearch}>
        <TextField
          id="transactions-note-search"
          label={t("noteSearchLabel")}
          type="search"
          maxLength={TRANSACTION_SEARCH_MAX_LENGTH}
          value={searchDraft}
          onChange={(event) =>
            setSearchDraftState({ value: event.target.value, query })
          }
          fieldClassName="min-w-0 flex-1"
          data-testid="transactions-note-search"
        />
        <Button
          type="submit"
          variant="secondary"
          className="shrink-0"
          data-testid="transactions-note-search-submit"
        >
          <AppIcon icon={ACTION_ICONS.search} size="sm" />
          {t("search")}
        </Button>
      </form>

      <div className="flex flex-wrap items-center gap-(--space-2)">
        <div
          className="flex max-w-full flex-wrap items-center gap-(--space-2)"
          role="group"
          aria-label={t("filterLabel")}
        >
          {TRANSACTION_COMMON_FILTER_OPTIONS.map((value) => (
            <FilterChip
              key={value}
              selected={type === value}
              onPress={() =>
                apply(value, query, categoryIds, jarIds, selectedTagIds)
              }
              data-testid={`transactions-filter-${value}`}
            >
              {t(`filters.${value}`)}
            </FilterChip>
          ))}
        </div>
        <Button
          type="button"
          variant="secondary"
          className="min-h-11"
          onPress={openFilters}
          aria-label={t("openFilters", { count: advancedFilterCount })}
          data-testid="transactions-open-filters"
        >
          <AppIcon icon={ACTION_ICONS.filter} size="sm" />
          {t("openFiltersLabel")}
          {advancedFilterCount > 0 ? (
            <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-primary-soft px-1.5 text-xs text-primary">
              {advancedFilterCount}
            </span>
          ) : null}
        </Button>
        {hasActiveFilter ? (
          <Button
            type="button"
            variant={ButtonVariant.GHOST}
            className="inline-flex min-h-11 items-center rounded-[var(--radius-control)] px-(--space-2) text-sm font-medium text-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring"
            onPress={() => apply(TransactionFilterType.ALL, "", [], [], [])}
            data-testid="transactions-clear-filters"
          >
            {t("clearFilters")}
          </Button>
        ) : null}
      </div>

      <Sheet isOpen={isOpen} onOpenChange={setIsOpen}>
        <ActionSheetLayout>
          <ActionSheetLayout.Header>
            <Sheet.Heading className="text-lg font-semibold tracking-tight text-text-primary">
              {t("filterSheetTitle")}
            </Sheet.Heading>
          </ActionSheetLayout.Header>
          <ActionSheetLayout.Body>
            <div className="flex flex-col gap-(--space-4)">
              <fieldset className="flex flex-col gap-(--space-3)">
                <legend className="text-sm font-medium text-text-primary">
                  {t("categoryFilterLabel")}
                </legend>
                <TextField
                  id="transactions-category-search"
                  label={
                    <span className="sr-only">{t("categorySearchLabel")}</span>
                  }
                  placeholder={t("categorySearchLabel")}
                  value={categorySearch}
                  onChange={(event) => setCategorySearch(event.target.value)}
                />
                <div className="flex flex-col gap-(--space-2)">
                  {visibleCategories.map((category) => {
                    const selected = draftCategoryIds.includes(category.id);
                    return (
                      <FilterChip
                        key={category.id}
                        selected={selected}
                        className="w-full justify-between rounded-[var(--radius-control)] border px-(--space-3) text-left"
                        data-testid={`transactions-category-option-${category.id}`}
                        onPress={() =>
                          setDraftCategoryIds((current) =>
                            current.includes(category.id)
                              ? current.filter((id) => id !== category.id)
                              : [...current, category.id],
                          )
                        }
                      >
                        <span className="min-w-0 flex-1 truncate">
                          {localizeCatalogName(
                            tCatalog,
                            CatalogGroup.TAGS,
                            category.name,
                          )}
                        </span>
                        {!category.isActive ? (
                          <span className="shrink-0 text-xs text-text-secondary">
                            {t("inactive")}
                          </span>
                        ) : null}
                        <span
                          aria-hidden
                          className="flex size-5 items-center justify-center rounded-full border border-current"
                        >
                          {selected ? (
                            <AppIcon icon={ACTION_ICONS.check} size="xs" />
                          ) : null}
                        </span>
                      </FilterChip>
                    );
                  })}
                  {visibleCategories.length === 0 ? (
                    <p className="text-sm text-text-secondary">
                      {t("noCategoriesMatch")}
                    </p>
                  ) : null}
                </div>
              </fieldset>
              <fieldset className="flex flex-col gap-(--space-3)">
                <legend className="text-sm font-medium text-text-primary">
                  {t("jarFilterLabel")}
                </legend>
                <TextField
                  id="transactions-jar-search"
                  label={<span className="sr-only">{t("jarSearchLabel")}</span>}
                  placeholder={t("jarSearchLabel")}
                  value={jarSearch}
                  onChange={(event) => setJarSearch(event.target.value)}
                />
                <div className="flex flex-col gap-(--space-2)">
                  {visibleJars.map((jar) => {
                    const selected = draftJarIds.includes(jar.id);
                    return (
                      <FilterChip
                        key={jar.id}
                        selected={selected}
                        className="w-full justify-between rounded-[var(--radius-control)] border px-(--space-3) text-left"
                        data-testid={`transactions-jar-option-${jar.id}`}
                        onPress={() =>
                          setDraftJarIds((current) =>
                            current.includes(jar.id)
                              ? current.filter((id) => id !== jar.id)
                              : [...current, jar.id],
                          )
                        }
                      >
                        <span className="min-w-0 flex-1 truncate">
                          {localizeCatalogName(
                            tCatalog,
                            CatalogGroup.JARS,
                            jar.name,
                          )}
                        </span>
                        {jar.isArchived ? (
                          <span className="shrink-0 text-xs text-text-secondary">
                            {t("archived")}
                          </span>
                        ) : jar.isPaused ? (
                          <span className="shrink-0 text-xs text-text-secondary">
                            {t("paused")}
                          </span>
                        ) : null}
                        <span
                          aria-hidden
                          className="flex size-5 items-center justify-center rounded-full border border-current"
                        >
                          {selected ? (
                            <AppIcon icon={ACTION_ICONS.check} size="xs" />
                          ) : null}
                        </span>
                      </FilterChip>
                    );
                  })}
                  {visibleJars.length === 0 ? (
                    <p className="text-sm text-text-secondary">
                      {t("noJarsMatch")}
                    </p>
                  ) : null}
                </div>
              </fieldset>
              <fieldset className="flex flex-col gap-(--space-3)">
                <legend className="text-sm font-medium text-text-primary">
                  {t("tagFilterLabel")}
                </legend>
                <TextField
                  id="transactions-tag-search"
                  label={<span className="sr-only">{t("tagSearchLabel")}</span>}
                  placeholder={t("tagSearchLabel")}
                  value={tagSearch}
                  onChange={(event) => setTagSearch(event.target.value)}
                />
                <div className="flex flex-col gap-(--space-2)">
                  {visibleTags.map((tag) => {
                    const selected = draftTagIds.includes(tag.id);
                    const visual = transactionTagVisualFor(tag);
                    return (
                      <Button
                        key={tag.id}
                        type="button"
                        variant={ButtonVariant.GHOST}
                        aria-pressed={selected}
                        isDisabled={Boolean(tag.archivedAt) && !selected}
                        className={`flex min-h-11 w-full min-w-0 items-center justify-start gap-(--space-3) rounded-[var(--radius-control)] border px-(--space-3) text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus-ring ${selected ? `${visual.color.surface} ${visual.color.border}` : "border-border-subtle bg-surface hover:bg-surface-hover"} ${tag.archivedAt && !selected ? "cursor-not-allowed opacity-45" : ""}`}
                        onPress={() => {
                          setDraftTagIds(
                            selected
                              ? draftTagIds.filter((id) => id !== tag.id)
                              : draftTagIds.length < MAX_TRANSACTION_TAGS
                                ? [...draftTagIds, tag.id]
                                : draftTagIds,
                          );
                        }}
                      >
                        <span
                          className={`flex size-8 shrink-0 items-center justify-center rounded-[var(--radius-control)] ${visual.color.surface} ${visual.color.text}`}
                        >
                          <AppIcon icon={visual.icon} size="sm" />
                        </span>
                        <span className="min-w-0 flex-1 truncate text-sm font-medium text-text-primary">
                          {tag.name}
                        </span>
                        {tag.archivedAt ? (
                          <span className="text-xs text-text-secondary">
                            {t("archived")}
                          </span>
                        ) : null}
                        <span
                          aria-hidden
                          className={`flex size-5 items-center justify-center rounded-full border text-xs ${selected ? "border-accent bg-accent text-accent-fg" : "border-border-strong"}`}
                        >
                          {selected ? (
                            <AppIcon icon={ACTION_ICONS.check} size="xs" />
                          ) : null}
                        </span>
                      </Button>
                    );
                  })}
                  {visibleTags.length === 0 ? (
                    <p className="text-sm text-text-secondary">
                      {t("noTagsMatch")}
                    </p>
                  ) : null}
                </div>
              </fieldset>
            </div>
          </ActionSheetLayout.Body>
          <SheetActionFooter
            secondaryLabel={t("cancel")}
            primaryLabel={t("applyFilters")}
            onSecondary={() => setIsOpen(false)}
            onPrimary={() =>
              apply(type, query, draftCategoryIds, draftJarIds, draftTagIds)
            }
            primaryTestId="transactions-apply-filters"
          />
        </ActionSheetLayout>
      </Sheet>
    </div>
  );
}
