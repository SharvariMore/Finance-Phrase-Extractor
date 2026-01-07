import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import Analytics from "../Analytics";

describe("Analytics", () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  test("renders KPI cards based on history data", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => [
        {
          id: 1,
          input_text: "EPS grew 15%",
          phrases: ["EPS", "15%"],
          created_at: new Date().toISOString(),
        },
        {
          id: 2,
          input_text: "revenue growth",
          phrases: ["revenue", "growth"],
          created_at: new Date().toISOString(),
        },
      ],
    });

    render(<Analytics />);

    await waitFor(() => {
      expect(screen.getByText(/analytics dashboard/i)).toBeInTheDocument();
      // KPI values are rendered as text
      expect(screen.getByText("2")).toBeInTheDocument(); // Total Extractions
    });
  });
});
