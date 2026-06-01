export type ExtensionLifecycleState = "installed" | "enabled" | "disabled" | "uninstalled";

export function transitionExtension(state: ExtensionLifecycleState, next: ExtensionLifecycleState) {
  if (state === "uninstalled" && next !== "installed") return state;
  return next;
}
