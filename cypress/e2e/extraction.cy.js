describe("Finance Phrase Extraction - E2E", () => {
  it("extracts phrases and renders them", () => {
    cy.intercept("POST", "**/webhook/extract-finance*", {
      statusCode: 200,
      body: { phrases: ["EPS", "YoY growth"] },
    }).as("extract");

    cy.visit("/");

    cy.get('[data-testid="finance-input"]').type(
      "EPS rose 12% YoY with margin expansion."
    );

    cy.get('[data-testid="extract-btn"]').click();

    cy.wait("@extract");

    cy.contains("EPS").should("be.visible");
    cy.contains("YoY growth").should("be.visible");
  });

  it("shows error when input is empty", () => {
    cy.visit("/");
    cy.get('[data-testid="extract-btn"]').click();
    cy.get('[data-testid="error-msg"]').should(
      "contain",
      "Please enter some text"
    );
  });
});
