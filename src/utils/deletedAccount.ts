const DELETED_ACCOUNTS_STORAGE_KEY = "pyrosfit_deleted_accounts";

interface DeletedAccountEntry {
  id?: number;
  userName?: string;
  email?: string;
}

const getStoredDeletedAccounts = (): DeletedAccountEntry[] => {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(DELETED_ACCOUNTS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

export const markAccountAsDeleted = (entry: DeletedAccountEntry): void => {
  if (typeof window === "undefined") return;
  try {
    const list = getStoredDeletedAccounts();
    const normalizedUserName = entry.userName?.trim().toLowerCase();
    const normalizedEmail = entry.email?.trim().toLowerCase();

    const exists = list.some(
      (item) =>
        (entry.id && item.id === entry.id) ||
        (normalizedUserName && item.userName?.toLowerCase() === normalizedUserName) ||
        (normalizedEmail && item.email?.toLowerCase() === normalizedEmail)
    );

    if (!exists) {
      list.push({
        id: entry.id,
        userName: normalizedUserName,
        email: normalizedEmail,
      });
      localStorage.setItem(DELETED_ACCOUNTS_STORAGE_KEY, JSON.stringify(list));
    }
  } catch {
    // Ignore storage errors
  }
};

export const isAccountDeletedLocally = (entry: DeletedAccountEntry): boolean => {
  const list = getStoredDeletedAccounts();
  if (list.length === 0) return false;

  const normalizedUserName = entry.userName?.trim().toLowerCase();
  const normalizedEmail = entry.email?.trim().toLowerCase();

  return list.some(
    (item) =>
      (entry.id && item.id === entry.id) ||
      (normalizedUserName && item.userName?.toLowerCase() === normalizedUserName) ||
      (normalizedEmail && item.email?.toLowerCase() === normalizedEmail)
  );
};

export const isUserDeactivated = (
  loginData?: { deletedDate?: string | null; status?: boolean } | null,
  userData?: { deletedDate?: string | null; status?: boolean; email?: string; userName?: string } | null,
  fallback?: DeletedAccountEntry
): boolean => {
  if (loginData?.deletedDate || loginData?.status === false) return true;
  if (userData?.deletedDate || userData?.status === false) return true;

  return isAccountDeletedLocally({
    id: fallback?.id,
    userName: fallback?.userName || userData?.userName,
    email: fallback?.email || userData?.email,
  });
};

