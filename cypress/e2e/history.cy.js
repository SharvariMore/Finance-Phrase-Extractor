describe("History - E2E", () => {
  it("loads and displays history table/cards", () => {
    cy.intercept("GET", "**/webhook/get-finance-history*", {
      statusCode: 200,
      body: [
        {
          id: 1,
          input_text: "EPS rose 12% YoY",
          phrases: ["EPS", "12% YoY"],
          created_at: "2025-12-02T04:14:10.357Z",
        },
      ],
    }).as("history");

    cy.visit("/history");

    cy.wait("@history");

    cy.contains("Extraction History").should("be.visible");
    cy.contains("EPS rose 12% YoY").should("be.visible");
    cy.contains("EPS").should("be.visible");
  });
});
