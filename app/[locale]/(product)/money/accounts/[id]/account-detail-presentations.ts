export type AccountIdentityPresentation = {
  name: string;
  typeLabel: string | null;
};

/** Avoid repeating a localized type when it already matches the account name. */
export function resolveAccountIdentity(
  name: string,
  typeLabel: string,
): AccountIdentityPresentation {
  return {
    name,
    typeLabel: name === typeLabel ? null : typeLabel,
  };
}
