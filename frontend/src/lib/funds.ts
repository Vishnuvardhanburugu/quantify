/**
 * User-specific funds management via localStorage.
 * Each user gets their own funds key so different accounts don't share balances.
 * New users start with ₹0.
 */

function getUserEmail(): string {
  try {
    const stored = localStorage.getItem("user");
    if (stored) {
      const user = JSON.parse(stored);
      return user.email || "default";
    }
  } catch {}
  return "default";
}

function fundsKey(): string {
  return `userFunds_${getUserEmail()}`;
}

export function getFunds(): number {
  const stored = localStorage.getItem(fundsKey());
  return stored ? Number(stored) : 0;
}

export function setFunds(amount: number): void {
  localStorage.setItem(fundsKey(), String(amount));
  window.dispatchEvent(new Event("fundsUpdated"));
}

export function onFundsChange(callback: () => void): () => void {
  window.addEventListener("fundsUpdated", callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener("fundsUpdated", callback);
    window.removeEventListener("storage", callback);
  };
}
