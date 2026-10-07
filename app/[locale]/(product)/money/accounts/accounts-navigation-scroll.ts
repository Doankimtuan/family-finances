export type AccountsNavigationScrollPosition = {
  left: number;
  top: number;
};

export type AccountsNavigationApi = {
  currentEntry: { index: number; key: string } | null;
  activation?: { entry: { key: string } } | null;
  entries(): Array<{
    key?: string;
    url?: string | null;
    sameDocument?: boolean;
  }>;
  addEventListener(
    type: "currententrychange",
    listener: () => void,
    options?: { once?: boolean },
  ): void;
};

export type WindowWithAccountsNavigation = Window & {
  navigation?: AccountsNavigationApi;
};

const positionsByEntryKey = new Map<string, AccountsNavigationScrollPosition>();

export function rememberAccountsScrollPosition(
  entryKey: string,
  position: AccountsNavigationScrollPosition,
) {
  positionsByEntryKey.set(entryKey, { ...position });
}

export function getAccountsScrollPosition(entryKey: string) {
  return positionsByEntryKey.get(entryKey);
}
