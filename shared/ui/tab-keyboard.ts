import type { KeyboardEvent } from "react";

type TabKeyItem = { id: string; disabled?: boolean };

export function handleTabKeyDown<T extends TabKeyItem>(
  event: KeyboardEvent<HTMLButtonElement>,
  items: readonly T[],
  groupDisabled: boolean,
  onChange: (id: T["id"]) => void,
) {
  const enabledItems = items.filter((item) => !groupDisabled && !item.disabled);
  if (enabledItems.length < 2) return;

  const currentIndex = enabledItems.findIndex(
    (item) => item.id === event.currentTarget.dataset.tabId,
  );
  if (currentIndex < 0) return;

  let nextIndex: number;
  switch (event.key) {
    case "ArrowRight":
      nextIndex = (currentIndex + 1) % enabledItems.length;
      break;
    case "ArrowLeft":
      nextIndex =
        (currentIndex - 1 + enabledItems.length) % enabledItems.length;
      break;
    case "Home":
      nextIndex = 0;
      break;
    case "End":
      nextIndex = enabledItems.length - 1;
      break;
    default:
      return;
  }

  event.preventDefault();
  const nextItem = enabledItems[nextIndex];
  const tabList = event.currentTarget.closest<HTMLElement>('[role="tablist"]');
  const nextButton = Array.from(
    tabList?.querySelectorAll<HTMLButtonElement>('[role="tab"]') ?? [],
  ).find((button) => button.dataset.tabId === nextItem.id);
  nextButton?.focus();
  onChange(nextItem.id);
}
