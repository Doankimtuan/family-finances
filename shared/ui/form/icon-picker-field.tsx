"use client";

import { useState, type ReactNode } from "react";
import type { IconSvgElement } from "@hugeicons/react";
import { AppIcon } from "@/shared/ui/app-icon";
import { Text } from "@/shared/ui/text";
import { ChoiceTile, ChoiceTileGroup } from "@/shared/patterns/choice-tile";
import { FieldSelect } from "./field-select";
import { TextField } from "./text-field";

export type IconPickerOption<Key extends string> = {
  key: Key;
  label: string;
  icon: IconSvgElement;
};

export type IconPickerFieldProps<Key extends string> = {
  id: string;
  label: string;
  value: Key;
  onChange: (key: Key) => void;
  options: readonly IconPickerOption<Key>[];
  searchLabel: string;
  emptyLabel: string;
  description?: ReactNode;
  error?: ReactNode;
  isDisabled?: boolean;
  "data-testid"?: string;
};

/** Searchable icon selection within its parent form or Sheet. */
export function IconPickerField<Key extends string>({
  id,
  label,
  value,
  onChange,
  options,
  searchLabel,
  emptyLabel,
  description,
  error,
  isDisabled,
  "data-testid": testId,
}: IconPickerFieldProps<Key>) {
  const [expanded, setExpanded] = useState(false);
  const [search, setSearch] = useState("");
  const selected = options.find((option) => option.key === value);
  const filter = search.trim().toLocaleLowerCase();
  const visible = filter
    ? options.filter((option) =>
        `${option.label} ${option.key}`.toLocaleLowerCase().includes(filter),
      )
    : options;
  const choicesId = `${id}-choices`;

  return (
    <div className="flex min-w-0 flex-col gap-(--space-2)">
      <FieldSelect
        id={id}
        label={label}
        value={
          selected ? (
            <span className="flex items-center gap-(--space-2)">
              <AppIcon icon={selected.icon} size="sm" />
              <span className="truncate">{selected.label}</span>
            </span>
          ) : (
            emptyLabel
          )
        }
        description={description}
        error={error}
        isDisabled={isDisabled}
        onPress={() => setExpanded((current) => !current)}
        aria-expanded={expanded}
        aria-controls={choicesId}
        data-testid={testId}
      />
      {expanded ? (
        <div
          id={choicesId}
          className="max-h-[min(18rem,50dvh)] overflow-y-auto rounded-(--radius-control) border border-border-subtle bg-surface p-(--space-2)"
        >
          <TextField
            id={`${id}-search`}
            label={searchLabel}
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            autoComplete="off"
          />
          {visible.length === 0 ? (
            <Text size="sm" tone="secondary" className="p-(--space-3)">
              {emptyLabel}
            </Text>
          ) : (
            <div role="group" aria-label={label} className="mt-(--space-2)">
              <ChoiceTileGroup>
                {visible.map((option) => (
                  <ChoiceTile
                    key={option.key}
                    label={option.label}
                    icon={<AppIcon icon={option.icon} size="sm" />}
                    selected={option.key === value}
                    onPress={() => {
                      onChange(option.key);
                      setExpanded(false);
                      setSearch("");
                    }}
                  />
                ))}
              </ChoiceTileGroup>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
