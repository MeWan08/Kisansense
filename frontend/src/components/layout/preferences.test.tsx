import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useLocation } from "react-router-dom";
import { it, expect } from "vitest";
import { renderWorkspace } from "../../test/render";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { ThemeToggle } from "./ThemeToggle";
import i18n from "../../lib/i18n";
function Location() {
  return <output aria-label="route">{useLocation().pathname}</output>;
}
it("switches locale while retaining the current page", async () => {
  await i18n.changeLanguage("en");
  const user = userEvent.setup();
  renderWorkspace(
    <>
      <LanguageSwitcher />
      <Location />
    </>,
  );
  await user.selectOptions(screen.getByLabelText("Language"), "mr");
  expect(screen.getByLabelText("route")).toHaveTextContent("/mr/recommend");
  expect(localStorage.getItem("ks-locale")).toBe("mr");
});
it("persists theme preference and applies it to the root", async () => {
  await i18n.changeLanguage("en");
  const user = userEvent.setup();
  renderWorkspace(<ThemeToggle />);
  await user.selectOptions(screen.getByLabelText("Appearance"), "dark");
  await waitFor(() => expect(document.documentElement).toHaveClass("dark"));
  expect(localStorage.getItem("ks-theme")).toBe("dark");
  await user.selectOptions(screen.getByLabelText("Appearance"), "light");
  expect(document.documentElement).not.toHaveClass("dark");
});
