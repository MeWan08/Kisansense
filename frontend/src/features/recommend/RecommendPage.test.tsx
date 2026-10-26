import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, it, expect, vi } from "vitest";
import { renderWorkspace } from "../../test/render";
import RecommendPage from "./RecommendPage";
import { api } from "../../lib/api";
import i18n from "../../lib/i18n";
beforeEach(async () => {
  await i18n.changeLanguage("en");
  vi.spyOn(api, "health").mockResolvedValue({
    status: "ok",
    model_version: "v2",
  });
});
it("syncs presets, number inputs, sliders and rejects out-of-range values", async () => {
  const user = userEvent.setup();
  renderWorkspace(<RecommendPage />);
  await user.click(screen.getByRole("button", { name: "Highland coffee" }));
  const nitrogen = screen.getByRole("spinbutton", { name: "Nitrogen N" });
  expect(nitrogen).toHaveValue(101);
  expect(screen.getByRole("slider", { name: "Nitrogen" })).toHaveAttribute(
    "aria-valuenow",
    "101",
  );
  await user.clear(nitrogen);
  await user.type(nitrogen, "150");
  expect(
    await screen.findByText("Enter a number from 0 to 140."),
  ).toBeInTheDocument();
  expect(
    screen.getByRole("button", { name: "Find suitable crops" }),
  ).toBeDisabled();
  await user.clear(nitrogen);
  await user.type(nitrogen, "90");
  await waitFor(() =>
    expect(
      screen.getByRole("button", { name: "Find suitable crops" }),
    ).toBeEnabled(),
  );
});
it("renders recommendations, low-confidence advice and stale state", async () => {
  vi.spyOn(api, "predict").mockResolvedValue({
    model_version: "v2",
    recommendations: [
      { crop: "rice", confidence: 0.42 },
      { crop: "jute", confidence: 0.35 },
      { crop: "maize", confidence: 0.1 },
    ],
    advice: "Low confidence",
  });
  const user = userEvent.setup();
  renderWorkspace(<RecommendPage />);
  const submit = screen.getByRole("button", { name: "Find suitable crops" });
  await waitFor(() => expect(submit).toBeEnabled());
  await user.click(submit);
  expect(
    await screen.findByRole("heading", { name: "Rice" }),
  ).toBeInTheDocument();
  expect(
    screen.getByText(
      "Please consult your district agriculture officer before choosing a crop.",
    ),
  ).toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: "Temperate apple" }));
  expect(
    screen.getByText("Readings changed. Run again to update your results."),
  ).toBeInTheDocument();
  expect(api.predict).toHaveBeenCalledTimes(1);
});
