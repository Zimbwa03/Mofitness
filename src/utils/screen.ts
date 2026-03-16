import { layout, spacing } from "../theme";

export function getScreenTopPadding(topInset: number, extra: number = spacing.lg) {
  return Math.max(topInset, extra);
}

export function getScreenBottomPadding(bottomInset: number, extra: number = spacing.lg) {
  return bottomInset + extra;
}

export function getTabScreenBottomPadding(bottomInset: number, extra: number = spacing.lg) {
  return layout.tab_height + bottomInset + extra;
}

export function getFooterBottomPadding(bottomInset: number, extra: number = spacing.md) {
  return Math.max(bottomInset, extra);
}
