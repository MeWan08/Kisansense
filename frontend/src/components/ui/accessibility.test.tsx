import { useState } from "react";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { it, expect, vi } from "vitest";
import { renderWorkspace } from "../../test/render";
import { Modal } from "./Modal";
import { ErrorBoundary } from "../layout/ErrorBoundary";
import i18n from "../../lib/i18n";
function DialogExample() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button onClick={() => setOpen(true)}>Open profile</button>
      {open && (
        <Modal
          open
          onOpenChange={setOpen}
          title="Rice"
          description="Reference profile"
        >
          <p>Crop details</p>
        </Modal>
      )}
    </>
  );
}
it("dismisses the dialog with Escape and restores focus to the opener", async () => {
  await i18n.changeLanguage("en");
  const user = userEvent.setup();
  renderWorkspace(<DialogExample />);
  const opener = screen.getByRole("button", { name: "Open profile" });
  await user.click(opener);
  expect(screen.getByRole("dialog", { name: "Rice" })).toBeInTheDocument();
  await user.keyboard("{Escape}");
  await waitFor(() =>
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument(),
  );
  await waitFor(() => expect(opener).toHaveFocus());
});
function BrokenPage(): never {
  throw new Error("test render failure");
}
it("offers recovery when a page fails to render", async () => {
  await i18n.changeLanguage("en");
  const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
  const handleExpectedError = (event: ErrorEvent) => {
    if (event.error?.message === "test render failure") event.preventDefault();
  };
  window.addEventListener("error", handleExpectedError);
  try {
    renderWorkspace(
      <ErrorBoundary>
        <BrokenPage />
      </ErrorBoundary>,
    );
    expect(
      screen.getByRole("button", { name: "Reload page" }),
    ).toBeInTheDocument();
  } finally {
    window.removeEventListener("error", handleExpectedError);
    consoleError.mockRestore();
  }
});
