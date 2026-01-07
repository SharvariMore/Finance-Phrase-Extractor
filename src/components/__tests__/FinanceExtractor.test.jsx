import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import FinanceExtractor from "../FinanceExtractor";

// Mock heavy export deps
jest.mock("jspdf");
jest.mock("file-saver");
jest.mock("xlsx");

function mockFetch(payload, ok = true, status = 200) {
  global.fetch = jest.fn().mockResolvedValue({
    ok,
    status,
    json: async () => payload,
  });
}

describe("FinanceExtractor", () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  test("shows validation error when input is empty", async () => {
    render(<FinanceExtractor />);

    await userEvent.click(screen.getByTestId("extract-btn"));

    expect(screen.getByTestId("error-msg")).toHaveTextContent(
      /please enter some text/i
    );
  });

  test("renders phrases returned by webhook", async () => {
    mockFetch({ phrases: ["EPS", "YoY growth", "operating margin"] });

    render(<FinanceExtractor />);

    await userEvent.type(
      screen.getByTestId("finance-input"),
      "EPS rose 12% YoY with margin expansion."
    );

    await userEvent.click(screen.getByTestId("extract-btn"));

    await waitFor(() => {
      expect(screen.getByTestId("phrases-list")).toBeInTheDocument();
    });

    expect(screen.getByText("EPS")).toBeInTheDocument();
    expect(screen.getByText("YoY growth")).toBeInTheDocument();
    expect(screen.getByText("operating margin")).toBeInTheDocument();
  });

  test("export button disabled when no phrases, enabled after extraction", async () => {
    mockFetch({ phrases: ["EPS"] });

    render(<FinanceExtractor />);

    expect(screen.getByTestId("export-btn")).toBeDisabled();

    await userEvent.type(screen.getByTestId("finance-input"), "EPS grew");
    await userEvent.click(screen.getByTestId("extract-btn"));

    await waitFor(() => {
      expect(screen.getByTestId("export-btn")).not.toBeDisabled();
    });
  });

  test("shows error message when API fails", async () => {
    // silence console.error ONLY for this test
    const spy = jest.spyOn(console, "error").mockImplementation(() => {});

    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({}),
    });

    render(<FinanceExtractor />);

    await userEvent.type(screen.getByTestId("finance-input"), "test");
    await userEvent.click(screen.getByTestId("extract-btn"));

    await waitFor(() => {
      expect(screen.getByTestId("error-msg")).toHaveTextContent(
        /unable to extract phrases/i
      );
    });

    // restore console.error after this test
    spy.mockRestore();
  });
});
