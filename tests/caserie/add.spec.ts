import { test } from "../../setup/caserieTest";
import { CaseriePage } from "../../pages/caserie/CaseriePage";

const addData = [
  {
    type: "Cheltuială",
    cont: "Cont (RON)",
    price: "583.80",
    date: "12/11/2026",
    category: "MomCo",
    contact: "",
    description: "Carti",
    typeDocument: "Factură",
    factura: "Factura259.pdf"
  }

  // {
  //   type: "Venit",
  //   cont: "Venituri",
  //   price: "860",
  //   date: "10/10/2026",
  //   category: "Alocatie",
  //   payment: "",
  //   description: ""
  // }
];

test("Caserie adds an expense with its invoice", async ({ page }) => {
  const viewPage = new CaseriePage(page);
  await viewPage.login();

  for (const data of addData) {
    await viewPage.addEntry(data);
  }
});
