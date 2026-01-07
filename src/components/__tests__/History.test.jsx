import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import History from "../History";

describe("History", () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  test("renders history records from API", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => [
        {
          id: 1,
          input_text: "EPS grew 15%",
          phrases: ["EPS", "15%"],
          created_at: new Date().toISOString(),
        },
      ],
    });

    render(<History />);

    await waitFor(() => {
      expect(screen.getByText(/eps grew 15%/i)).toBeInTheDocument();
      expect(screen.getByText("EPS")).toBeInTheDocument();
      expect(screen.getByText("15%")).toBeInTheDocument();
    });
  });

  test("handles unexpected API response gracefully", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ id: 999 }), // invalid shape
    });

    render(<History />);

    await waitFor(() => {
      expect(screen.getByText(/no matching records/i)).toBeInTheDocument();
    });
  });
});
