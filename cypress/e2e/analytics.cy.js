describe("Analytics - E2E", () => {
  it("renders KPIs and charts with mocked data", () => {
    cy.intercept("GET", "**/webhook/get-finance-history*", {
      statusCode: 200,
      body: [
        {
          id: 1,
          input_text: "EPS rose 12% YoY",
          phrases: ["EPS", "12% YoY", "margin expansion"],
          created_at: new Date().toISOString(),
        },
        {
          id: 2,
          input_text: "Revenue grew 20%",
          phrases: ["Revenue", "20%"],
          created_at: new Date().toISOString(),
        },
      ],
    }).as("history");

    cy.visit("/analytics");

    cy.wait("@history");

    cy.contains("Analytics Dashboard").should("be.visible");
    cy.contains("Total Extractions").should("be.visible");
    cy.contains("Unique Phrases").should("be.visible");
  });
});
