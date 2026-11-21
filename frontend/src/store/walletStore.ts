import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ActiveRole = 'client' | 'freelancer';

export interface OrgWalletAccount {
  id: string;
  label: string;
  address: string;
  walletName?: string;
  isPrimary?: boolean;
  addedAt: string;
}

export interface WalletState {
  address: string | null;
  walletName: string | null;
  activeRole: ActiveRole;
  isClient: boolean;
  isFreelancer: boolean;
  token: string | null;
  orgAccounts: OrgWalletAccount[];
  activeOrgAccountId: string | null;
  setActiveRole: (role: ActiveRole) => void;
  setWalletInfo: (
    address: string,
    isClient?: boolean,
    isFreelancer?: boolean,
    walletName?: string,
    token?: string | null
  ) => void;
  addOrgAccount: (account: { label: string; address: string; walletName?: string }) => void;
  removeOrgAccount: (id: string) => void;
  setActiveOrgAccount: (id: string | null) => void;
  disconnect: () => void;
}

function primaryOrgAccountId(address: string) {
  return `primary:${address}`;
}

export const useWalletStore = create<WalletState>()(
  persist(
    (set) => ({
      address: null,
      walletName: null,
      activeRole: 'client',
      isClient: true,
      isFreelancer: true,
      token: null,
      orgAccounts: [],
      activeOrgAccountId: null,
      setActiveRole: (activeRole) => set({ activeRole }),
      setWalletInfo: (address, isClient = true, isFreelancer = true, walletName = 'Freighter', token = null) =>
        set((state) => {
          const id = primaryOrgAccountId(address);
          const existing = state.orgAccounts.find((account) => account.id === id);
          const primaryAccount: OrgWalletAccount = {
            id,
            label: existing?.label || walletName || 'Primary Wallet',
            address,
            walletName,
            isPrimary: true,
            addedAt: existing?.addedAt || new Date().toISOString(),
          };
          const orgAccounts = existing
            ? state.orgAccounts.map((account) => (account.id === id ? primaryAccount : account))
            : [primaryAccount, ...state.orgAccounts];

          return {
            address,
            isClient,
            isFreelancer,
            walletName,
            token,
            orgAccounts,
            activeOrgAccountId: id,
          };
        }),
      addOrgAccount: ({ label, address, walletName }) =>
        set((state) => {
          const trimmedLabel = label.trim() || 'Organization wallet';
          const existing = state.orgAccounts.find(
            (account) => account.address.toUpperCase() === address.toUpperCase()
          );
          if (existing) {
            return {
              orgAccounts: state.orgAccounts.map((account) =>
                account.id === existing.id ? { ...account, label: trimmedLabel, walletName } : account
              ),
              activeOrgAccountId: existing.id,
            };
          }
          const account: OrgWalletAccount = {
            id: `org-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            label: trimmedLabel,
            address,
            walletName,
            addedAt: new Date().toISOString(),
          };
          return { orgAccounts: [...state.orgAccounts, account], activeOrgAccountId: account.id };
        }),
      removeOrgAccount: (id) =>
        set((state) => ({
          orgAccounts: state.orgAccounts.filter((account) => account.id !== id),
          activeOrgAccountId: state.activeOrgAccountId === id ? null : state.activeOrgAccountId,
        })),
      setActiveOrgAccount: (activeOrgAccountId) => set({ activeOrgAccountId }),
      disconnect: () => {
        try {
          const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
          fetch(`${apiUrl}/api/auth/logout`, { method: 'POST', credentials: 'include' }).catch(() => {});
        } catch {
          // ignore network error on logout
        }
        set({
          address: null,
          walletName: null,
          activeRole: 'client',
          isClient: true,
          isFreelancer: true,
          token: null,
          orgAccounts: [],
          activeOrgAccountId: null,
        });
      },
    }),
    {
      name: 'trustpay-wallet-storage',
    }
  )
);

export function getActiveWalletAddress(state: WalletState): string | null {
  return state.orgAccounts.find((account) => account.id === state.activeOrgAccountId)?.address || state.address;
}

export function useActiveWalletAddress(): string | null {
  return useWalletStore((state) => getActiveWalletAddress(state));
}
