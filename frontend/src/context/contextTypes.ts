import { IAccount } from "../types/account";

export type AppContextType = {
  account: IAccount | null;
  login: () => void;
  checkForCachedUser: () => void;
};

export const initailCotext: AppContextType = {
  account: null,
  login: () => {},
  checkForCachedUser: () => {}
};
