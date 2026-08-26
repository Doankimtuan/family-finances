"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { MARKET_CATALOG_QUERY_LIMIT } from "@/modules/investments/application/investment-constants";
import type { MarketInstrument } from "@/modules/investments/application/investment-types";
import type { InvestmentUxType } from "@/modules/investments/application/investment-ux";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Text } from "@/shared/ui/text";
import { FieldSelect } from "@/shared/ui/form";
import { ActionSheetLayout } from "@/shared/patterns/action-sheet-layout";
import { Sheet } from "@/shared/patterns/sheet";
import { listMarketInstrumentsAction } from "./market-instrument-actions";

type Props = {
  assetClass: InvestmentUxType;
  selected: MarketInstrument | null;
  onSelect: (instrument: MarketInstrument | null) => void;
};

const SEARCH_DEBOUNCE_MS = 250;

export function InstrumentPickerSheet({
  assetClass,
  selected,
  onSelect,
}: Props) {
  const t = useTranslations("money.investments.opening");
  const [isOpen, setIsOpen] = useState(false);
  const [isOpening, setIsOpening] = useState(false);
  const [query, setQuery] = useState("");
  const [instruments, setInstruments] = useState<MarketInstrument[]>([]);
  const [loadError, setLoadError] = useState(false);
  const [pending, startTransition] = useTransition();
  const requestId = useRef(0);
  const skipNextEmptySearch = useRef(false);

  const load = useCallback(
    (nextQuery: string, onSettled?: () => void) => {
      const currentRequest = ++requestId.current;
      setLoadError(false);
      startTransition(async () => {
        const result = await listMarketInstrumentsAction({
          query: nextQuery || undefined,
          assetClass,
          limit: MARKET_CATALOG_QUERY_LIMIT.DEFAULT,
        });
        if (currentRequest !== requestId.current) return;
        if (!result.ok) {
          setInstruments([]);
          setLoadError(true);
          onSettled?.();
          return;
        }
        setInstruments(result.instruments);
        onSettled?.();
      });
    },
    [assetClass],
  );

  useEffect(() => {
    if (!isOpen) return;
    if (!query.trim() && skipNextEmptySearch.current) {
      skipNextEmptySearch.current = false;
      return;
    }
    const timer = window.setTimeout(() => load(query), SEARCH_DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [isOpen, load, query]);

  const open = () => {
    if (isOpening) return;
    setIsOpening(true);
    setQuery("");
    load("", () => {
      skipNextEmptySearch.current = true;
      setIsOpening(false);
      setIsOpen(true);
    });
  };

  const choose = (instrument: MarketInstrument | null) => {
    onSelect(instrument);
    setIsOpen(false);
  };

  return (
    <>
      <FieldSelect
        id="investment-tracked-asset"
        label={t("trackedAsset")}
        value={
          selected
            ? `${selected.symbol} — ${selected.name}`
            : t("picker.manualSelected")
        }
        isDisabled={isOpening}
        onPress={open}
        data-testid="investment-instrument-picker-trigger"
      />
      <Sheet
        isOpen={isOpen}
        onOpenChange={setIsOpen}
        data-testid="investment-instrument-picker"
      >
        <ActionSheetLayout>
          <ActionSheetLayout.Header>
            <Sheet.Heading className="text-lg font-semibold tracking-tight text-text-primary">
              {t("picker.title")}
            </Sheet.Heading>
            <Text size="sm" tone="secondary" className="mt-(--space-1)">
              {t("picker.description")}
            </Text>
          </ActionSheetLayout.Header>
          <ActionSheetLayout.Body className="flex flex-col gap-(--space-3)">
            <label htmlFor="investment-instrument-search" className="sr-only">
              {t("picker.searchLabel")}
            </label>
            <Input
              id="investment-instrument-search"
              type="search"
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
              }}
              placeholder={t("picker.searchPlaceholder")}
              autoFocus
              aria-controls="investment-instrument-results"
              data-testid="investment-instrument-search"
            />
            {pending ? (
              <Text size="sm" tone="secondary" aria-live="polite">
                {t("picker.loading")}
              </Text>
            ) : null}
            {loadError ? (
              <Text size="sm" tone="danger" role="alert">
                {t("picker.loadError")}
              </Text>
            ) : null}
            {!pending && !loadError && instruments.length === 0 ? (
              <div className="flex flex-col gap-(--space-3) rounded-(--radius-control) bg-surface-muted p-(--space-3)">
                <Text size="sm" tone="secondary">
                  {t("picker.empty")}
                </Text>
                <Button
                  type="button"
                  variant="secondary"
                  onPress={() => choose(null)}
                  data-testid="investment-instrument-manual"
                >
                  {t("picker.manualAction")}
                </Button>
              </div>
            ) : null}
            <div
              id="investment-instrument-results"
              role="listbox"
              aria-label={t("picker.resultsLabel")}
              className="flex flex-col divide-y divide-border-subtle/70"
            >
              {instruments.map((instrument) => (
                <button
                  key={instrument.id}
                  type="button"
                  role="option"
                  aria-selected={selected?.id === instrument.id}
                  onClick={() => choose(instrument)}
                  className="flex min-h-11 w-full items-center justify-between gap-(--space-3) px-0 py-(--space-3) text-left transition-[background-color] duration-(--duration-fast) ease-(--ease-standard) hover:bg-surface-hover focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-focus-ring motion-reduce:transition-none"
                  data-testid={`investment-instrument-${instrument.symbol}`}
                >
                  <span className="min-w-0">
                    <Text weight="semibold" className="truncate">
                      {instrument.symbol}
                    </Text>
                    <Text size="sm" tone="secondary" className="truncate">
                      {instrument.name}
                    </Text>
                  </span>
                  {instrument.exchange ? (
                    <Text size="xs" tone="muted" className="shrink-0">
                      {instrument.exchange}
                    </Text>
                  ) : null}
                </button>
              ))}
            </div>
            {!pending && (loadError || instruments.length > 0) ? (
              <div className="border-t border-border-subtle pt-(--space-2)">
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full justify-start px-0"
                  onPress={() => choose(null)}
                >
                  {t("picker.manualAction")}
                </Button>
              </div>
            ) : null}
          </ActionSheetLayout.Body>
        </ActionSheetLayout>
      </Sheet>
    </>
  );
}
