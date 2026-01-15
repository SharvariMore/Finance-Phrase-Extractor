import React from "react";
import { render, screen } from "@testing-library/react";
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

    // ✅ single async wait signal
    const inputTextCell = await screen.findByText(/eps grew 15%/i);
    expect(inputTextCell).toBeInTheDocument();

    // ✅ assertions outside async wait
    expect(screen.getByText("EPS")).toBeInTheDocument();
    expect(screen.getByText("15%")).toBeInTheDocument();
  });

  test("handles unexpected API response gracefully", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ id: 999 }), // invalid shape
    });

    render(<History />);

    // ✅ single async wait signal
    const emptyRowText = await screen.findByText(/no matching records found/i);
    expect(emptyRowText).toBeInTheDocument();
  });
});
