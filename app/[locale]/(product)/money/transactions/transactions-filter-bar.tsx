"use client";

import { Suspense, use, useState, type FormEvent } from "react";
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
import { IconContainer } from "@/shared/ui/icon-container";
import { TransactionFilterOption } from "./transaction-filter-option";
import { categoryVisualFor, PLAN_ICONS } from "@/shared/ui/icon-registry";
import { ACTION_ICONS } from "@/shared/ui/icon-registry";
import { IconButton } from "@/shared/ui/icon-button";
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
  filterOptionsPromise: Promise<{
    categories: TransactionCategoryFilterOption[];
    jars: TransactionJarFilterOption[];
  } | null>;
  transactionTagsPromise: Promise<TransactionTag[] | null>;
};

export function TransactionsFilterBar(props: Props) {
  const {
    accountId,
    type,
    query,
    categoryIds,
    jarIds,
    selectedTagIds,
    filterOptionsPromise,
    transactionTagsPromise,
  } = props;
  const t = useTranslations("money.transactionsPage");
  const router = useRouter();
  const [searchDraftState, setSearchDraftState] = useState(() => ({
    value: query,
    query,
  }));
  const searchDraft =
    searchDraftState.query === query ? searchDraftState.value : query;
  const apply = (
    nextType: TransactionFilterType,
    nextQuery: string,
    nextCategoryIds: string[],
    nextJarIds: string[],
    nextTagIds: string[],
  ) => {
    router.push(
      transactionsListHref(nextType, nextTagIds, {
        q: nextQuery || undefined,
        categoryIds: nextCategoryIds,
        jarIds: nextJarIds,
        accountId,
      }),
    );
  };

  const submitSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    apply(type, searchDraft.trim(), categoryIds, jarIds, selectedTagIds);
  };

  const advancedFilterCount =
    Number(categoryIds.length > 0) +
    Number(jarIds.length > 0) +
    Number(selectedTagIds.length > 0);
  return (
    <div
      className="flex flex-col gap-(--space-3)"
      data-testid="transactions-filter"
    >
      <form className="flex items-end gap-(--space-2)" onSubmit={submitSearch}>
        <TextField
          id="transactions-note-search"
          label={<span className="sr-only">{t("noteSearchLabel")}</span>}
          placeholder={t("noteSearchPlaceholder")}
          leadingIcon={<AppIcon icon={ACTION_ICONS.search} size="sm" />}
          trailingElement={
            <IconButton
              aria-label={t("clearSearch")}
              onPress={() => {
                setSearchDraftState({ value: "", query });
                if (query) apply(type, "", categoryIds, jarIds, selectedTagIds);
              }}
              data-testid="transactions-clear-search"
            >
              <AppIcon icon={ACTION_ICONS.close} size="sm" />
            </IconButton>
          }
          type="search"
          maxLength={TRANSACTION_SEARCH_MAX_LENGTH}
          value={searchDraft}
          onChange={(event) =>
            setSearchDraftState({ value: event.target.value, query })
          }
          fieldClassName="min-w-0 flex-1"
          data-testid="transactions-note-search"
        />
        <button
          type="submit"
          className="sr-only"
          tabIndex={-1}
          data-testid="transactions-note-search-submit"
        >
          {t("search")}
        </button>
      </form>

      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-(--space-2) gap-y-(--space-2)">
        <div
          className="col-start-1 row-start-1 flex min-w-0 items-center gap-(--space-2) overflow-x-auto"
          role="group"
          aria-label={t("filterLabel")}
        >
          {TRANSACTION_COMMON_FILTER_OPTIONS.map((value) => (
            <FilterChip
              key={value}
              selected={type === value}
              className="px-(--space-3)"
              onPress={() =>
                apply(value, query, categoryIds, jarIds, selectedTagIds)
              }
              data-testid={`transactions-filter-${value}`}
            >
              {t(`filters.${value}`)}
            </FilterChip>
          ))}
        </div>
        <Suspense
          fallback={
            <TransactionAdvancedFilterLoading
              advancedFilterCount={advancedFilterCount}
            />
          }
        >
          <TransactionAdvancedFilterControls
            {...{
              type,
              query,
              categoryIds,
              jarIds,
              selectedTagIds,
              filterOptionsPromise,
              transactionTagsPromise,
            }}
            advancedFilterCount={advancedFilterCount}
            hasActiveFilter={
              Boolean(accountId) ||
              type !== TransactionFilterType.ALL ||
              Boolean(
                query ||
                categoryIds.length ||
                jarIds.length ||
                selectedTagIds.length,
              )
            }
            onApply={apply}
          />
        </Suspense>
      </div>
    </div>
  );
}

function TransactionAdvancedFilterLoading({
  advancedFilterCount,
}: {
  advancedFilterCount: number;
}) {
  const t = useTranslations("money.transactionsPage");

  return (
    <Button
      type="button"
      variant={ButtonVariant.OUTLINED}
      className="col-start-2 row-start-1 min-h-11 shrink-0 rounded-full gap-(--space-2) px-(--space-3) text-xs"
      disabled
      aria-busy="true"
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
  );
}

type AdvancedFilterProps = Omit<Props, "accountId"> & {
  advancedFilterCount: number;
  hasActiveFilter: boolean;
  onApply: (
    type: TransactionFilterType,
    query: string,
    categoryIds: string[],
    jarIds: string[],
    selectedTagIds: string[],
  ) => void;
};

function TransactionAdvancedFilterControls({
  type,
  query,
  categoryIds,
  jarIds,
  selectedTagIds,
  filterOptionsPromise,
  transactionTagsPromise,
  advancedFilterCount,
  hasActiveFilter,
  onApply,
}: AdvancedFilterProps) {
  const filterOptions = use(filterOptionsPromise);
  const availableTags = use(transactionTagsPromise) ?? [];
  const availableCategories = filterOptions?.categories ?? [];
  const availableJars = filterOptions?.jars ?? [];
  const t = useTranslations("money.transactionsPage");
  const tCatalog = useTranslations("catalog");
  const locale = useLocale();
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
    onApply(nextType, nextQuery, nextCategoryIds, nextJarIds, nextTagIds);
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
    <>
      <Button
        type="button"
        variant={ButtonVariant.OUTLINED}
        className="col-start-2 row-start-1 min-h-11 shrink-0 rounded-full gap-(--space-2) px-(--space-3) text-xs"
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
        <div className="col-span-2 row-start-2 flex flex-wrap items-center gap-(--space-2) text-xs text-text-secondary">
          <span>{t("activeFilters")}</span>
          {categoryIds.map((id) => {
            const category = availableCategories.find((item) => item.id === id);
            if (!category) return null;
            const name = localizeCatalogName(
              tCatalog,
              CatalogGroup.TAGS,
              category.name,
            );
            return (
              <Button
                key={id}
                variant={ButtonVariant.TONAL}
                aria-label={t("removeFilter", { name })}
                className="gap-(--space-1) px-(--space-2) text-xs"
                onPress={() =>
                  apply(
                    type,
                    query,
                    categoryIds.filter((value) => value !== id),
                    jarIds,
                    selectedTagIds,
                  )
                }
              >
                {name}
                <AppIcon icon={ACTION_ICONS.close} size="xs" />
              </Button>
            );
          })}
          {jarIds.map((id) => {
            const jar = availableJars.find((item) => item.id === id);
            if (!jar) return null;
            const name = localizeCatalogName(
              tCatalog,
              CatalogGroup.JARS,
              jar.name,
            );
            return (
              <Button
                key={id}
                variant={ButtonVariant.OUTLINED}
                aria-label={t("removeFilter", { name })}
                className="gap-(--space-1) px-(--space-2) text-xs"
                onPress={() =>
                  apply(
                    type,
                    query,
                    categoryIds,
                    jarIds.filter((value) => value !== id),
                    selectedTagIds,
                  )
                }
              >
                {name}
                <AppIcon icon={ACTION_ICONS.close} size="xs" />
              </Button>
            );
          })}
          {selectedTagIds.map((id) => {
            const tag = availableTags.find((item) => item.id === id);
            if (!tag) return null;
            return (
              <Button
                key={id}
                variant={ButtonVariant.OUTLINED}
                aria-label={t("removeFilter", { name: tag.name })}
                className="gap-(--space-1) px-(--space-2) text-xs"
                onPress={() =>
                  apply(
                    type,
                    query,
                    categoryIds,
                    jarIds,
                    selectedTagIds.filter((value) => value !== id),
                  )
                }
              >
                {tag.name}
                <AppIcon icon={ACTION_ICONS.close} size="xs" />
              </Button>
            );
          })}
          <Button
            type="button"
            variant={ButtonVariant.GHOST}
            className="px-(--space-2) text-xs"
            onPress={() => apply(TransactionFilterType.ALL, "", [], [], [])}
            data-testid="transactions-clear-filters"
          >
            {t("clearFilters")}
          </Button>
        </div>
      ) : null}
      <Sheet isOpen={isOpen} onOpenChange={setIsOpen}>
        <ActionSheetLayout className="px-0 pb-0 pt-(--space-4)">
          <ActionSheetLayout.Header>
            <Sheet.Heading className="text-lg font-semibold tracking-tight text-text-primary">
              {t("filterSheetTitle")}
            </Sheet.Heading>
          </ActionSheetLayout.Header>
          <ActionSheetLayout.Body>
            <div className="flex flex-col gap-(--space-6)">
              <fieldset className="flex flex-col gap-(--space-3)">
                <legend className="mb-(--space-3) text-sm font-semibold text-text-primary">
                  {t("categoryFilterLabel")}
                </legend>
                <TextField
                  id="transactions-category-search"
                  label={
                    <span className="sr-only">{t("categorySearchLabel")}</span>
                  }
                  placeholder={t("categorySearchLabel")}
                  leadingIcon={<AppIcon icon={ACTION_ICONS.search} size="sm" />}
                  value={categorySearch}
                  onChange={(event) => setCategorySearch(event.target.value)}
                />
                <div className="flex flex-col gap-(--space-2)">
                  {visibleCategories.map((category) => {
                    const selected = draftCategoryIds.includes(category.id);
                    return (
                      <TransactionFilterOption
                        key={category.id}
                        label={localizeCatalogName(
                          tCatalog,
                          CatalogGroup.TAGS,
                          category.name,
                        )}
                        icon={
                          <IconContainer size="sm" tone="neutral">
                            <AppIcon
                              icon={
                                categoryVisualFor({
                                  categoryId: category.id,
                                  categoryName: category.name,
                                }).icon
                              }
                              size="sm"
                            />
                          </IconContainer>
                        }
                        status={!category.isActive ? t("inactive") : undefined}
                        selected={selected}

                        testId={`transactions-category-option-${category.id}`}
                        onPress={() =>
                          setDraftCategoryIds((current) =>
                            current.includes(category.id)
                              ? current.filter((id) => id !== category.id)
                              : [...current, category.id],
                          )
                        }
                      />
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
                <legend className="mb-(--space-3) text-sm font-semibold text-text-primary">
                  {t("jarFilterLabel")}
                </legend>
                <TextField
                  id="transactions-jar-search"
                  label={<span className="sr-only">{t("jarSearchLabel")}</span>}
                  placeholder={t("jarSearchLabel")}
                  leadingIcon={<AppIcon icon={ACTION_ICONS.search} size="sm" />}
                  value={jarSearch}
                  onChange={(event) => setJarSearch(event.target.value)}
                />
                <div className="flex flex-col gap-(--space-2)">
                  {visibleJars.map((jar) => {
                    const selected = draftJarIds.includes(jar.id);
                    return (
                      <TransactionFilterOption
                        key={jar.id}
                        label={localizeCatalogName(
                          tCatalog,
                          CatalogGroup.JARS,
                          jar.name,
                        )}
                        icon={
                          <IconContainer size="sm" tone="primary">
                            <AppIcon icon={PLAN_ICONS.jar} size="sm" />
                          </IconContainer>
                        }
                        status={
                          jar.isArchived
                            ? t("archived")
                            : jar.isPaused
                              ? t("paused")
                              : undefined
                        }
                        selected={selected}

                        testId={`transactions-jar-option-${jar.id}`}
                        onPress={() =>
                          setDraftJarIds((current) =>
                            current.includes(jar.id)
                              ? current.filter((id) => id !== jar.id)
                              : [...current, jar.id],
                          )
                        }
                      />
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
                <legend className="mb-(--space-3) text-sm font-semibold text-text-primary">
                  {t("tagFilterLabel")}
                </legend>
                <TextField
                  id="transactions-tag-search"
                  label={<span className="sr-only">{t("tagSearchLabel")}</span>}
                  placeholder={t("tagSearchLabel")}
                  leadingIcon={<AppIcon icon={ACTION_ICONS.search} size="sm" />}
                  value={tagSearch}
                  onChange={(event) => setTagSearch(event.target.value)}
                />
                <div className="flex flex-col gap-(--space-2)">
                  {visibleTags.map((tag) => {
                    const selected = draftTagIds.includes(tag.id);
                    const visual = transactionTagVisualFor(tag);
                    return (
                      <TransactionFilterOption
                        key={tag.id}
                        label={tag.name}
                        icon={
                          <span
                            className={`flex size-8 shrink-0 items-center justify-center rounded-(--radius-control) ${visual.color.surface} ${visual.color.text}`}
                          >
                            <AppIcon icon={visual.icon} size="sm" />
                          </span>
                        }
                        status={tag.archivedAt ? t("archived") : undefined}
                        selected={selected}
                        isDisabled={Boolean(tag.archivedAt) && !selected}
                        testId={`transactions-tag-option-${tag.id}`}
                        onPress={() => {
                          setDraftTagIds(
                            selected
                              ? draftTagIds.filter((id) => id !== tag.id)
                              : draftTagIds.length < MAX_TRANSACTION_TAGS
                                ? [...draftTagIds, tag.id]
                                : draftTagIds,
                          );
                        }}
                      />
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
    </>
  );
}
