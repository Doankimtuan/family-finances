import type enCommon from "./messages/en/common.json";
import type enNavigation from "./messages/en/navigation.json";
import type enAuth from "./messages/en/auth.json";
import type enOnboard from "./messages/en/onboard.json";
import type enTogether from "./messages/en/together.json";
import type enMoney from "./messages/en/money.json";
import type enPlan from "./messages/en/plan.json";
import type enInbox from "./messages/en/inbox.json";
import type enHealth from "./messages/en/health.json";
import type enSettings from "./messages/en/settings.json";
import type enValidation from "./messages/en/validation.json";
import type enErrors from "./messages/en/errors.json";
import type enButtons from "./messages/en/buttons.json";
import type enDialogs from "./messages/en/dialogs.json";
import type enForms from "./messages/en/forms.json";
import type enEmptyStates from "./messages/en/emptyStates.json";
import type enToast from "./messages/en/toast.json";
import type enMetadata from "./messages/en/metadata.json";
import type enA11y from "./messages/en/a11y.json";
import type { routing } from "./i18n/routing";

/** Merged English messages — source of truth for typed keys */
export type AppMessages = {
  common: typeof enCommon;
  navigation: typeof enNavigation;
  auth: typeof enAuth;
  onboard: typeof enOnboard;
  together: typeof enTogether;
  money: typeof enMoney;
  plan: typeof enPlan;
  inbox: typeof enInbox;
  health: typeof enHealth;
  settings: typeof enSettings;
  validation: typeof enValidation;
  errors: typeof enErrors;
  buttons: typeof enButtons;
  dialogs: typeof enDialogs;
  forms: typeof enForms;
  emptyStates: typeof enEmptyStates;
  toast: typeof enToast;
  metadata: typeof enMetadata;
  a11y: typeof enA11y;
};

type AppLocale = (typeof routing.locales)[number];

declare module "use-intl" {
  interface AppConfig {
    Locale: AppLocale;
    Messages: AppMessages;
  }
}

declare module "next-intl" {
  interface AppConfig {
    Locale: AppLocale;
    Messages: AppMessages;
  }
}

export {};
