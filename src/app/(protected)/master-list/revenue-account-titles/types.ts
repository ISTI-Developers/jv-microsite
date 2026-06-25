export type RevenueAccountTitle = {
  account_no: string;
  account_title: string;
  is_enabled: 0 | 1 | boolean;
  saved: boolean;
};

export type RevenueAccountTitlesResponse = {
  success: boolean;
  data: RevenueAccountTitle[];
  error?: string;
  message?: string;
};

export type SaveRevenueAccountTitlesRequest = {
  account_titles: Array<{
    account_no: string;
    account_title: string;
  }>;
};

export type RevenueAccountTitleColumnsProps = {
  currentEnabledByAccountNo: Record<string, boolean>;
  setAccountEnabled: (accountNo: string, enabled: boolean) => void;
  isSaving: boolean;
};
