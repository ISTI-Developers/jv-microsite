export type AccountTitle = {
  account_no: string;
  account_title: string;
  is_enabled: 0 | 1 | boolean;
  saved: boolean;
};

export type AccountTitlesResponse = {
  success: boolean;
  data: AccountTitle[];
  error?: string;
  message?: string;
};

export type SaveAccountTitlesRequest = {
  account_titles: Array<{
    account_no: string;
    account_title: string;
  }>;
};

export type AccountTitleColumnsProps = {
  currentEnabledByAccountNo: Record<string, boolean>;
  setAccountEnabled: (accountNo: string, enabled: boolean) => void;
  isSaving: boolean;
};
