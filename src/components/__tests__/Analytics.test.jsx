import React from "react";
import { render, screen } from "@testing-library/react";
import Analytics from "../Analytics";

// Mock heavy deps
jest.mock("jspdf");
jest.mock("html2canvas", () =>
  jest.fn(() => Promise.resolve({ toDataURL: () => "" }))
);
jest.mock("file-saver");
jest.mock("xlsx");

function mockFetch(payload, ok = true, status = 200) {
  global.fetch = jest.fn().mockResolvedValue({
    ok,
    status,
    json: async () => payload,
  });
}

describe("Analytics", () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  test("renders KPIs and charts with mocked data", async () => {
    mockFetch([
      {
        id: 1,
        input_text: "EPS rose",
        phrases: ["EPS", "YoY"],
        created_at: new Date().toISOString(),
      },
      {
        id: 2,
        input_text: "Margin expanded",
        phrases: ["margin"],
        created_at: new Date().toISOString(),
      },
    ]);

    render(<Analytics />);

    // Wait for a single, stable signal that data loaded
    await screen.findByTestId("kpi-total");

    // Assertions outside of waitFor
    expect(screen.getByTestId("kpi-total")).toBeInTheDocument();
    expect(screen.getByTestId("kpi-unique")).toBeInTheDocument();
    expect(screen.getByTestId("chart-frequency")).toBeInTheDocument();
    expect(screen.getByTestId("chart-trend")).toBeInTheDocument();
  });
});
