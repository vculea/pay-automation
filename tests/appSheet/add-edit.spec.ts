import { test, expect } from "@playwright/test";
import { credentials } from "../../utils/configs";
import { AppSheetPage } from "../../views/appSheet/view";

const addData = [
  //   {
  //     name: "Rata August",
  //     categorie: "Cheltuieli",
  //     subcategory: "Rata",
  //     price: "1902.9",
  //     payment: "Card",
  //     date: "08/15/2026"
  //   },
  //   {
  //     name: "Rata Septembrie",
  //     categorie: "Cheltuieli",
  //     subcategory: "Rata",
  //     price: "1808.91",
  //     payment: "Card",
  //     date: "09/15/2026"
  //   },
  {
    name: "Rata Octombrie",
    categorie: "Cheltuieli",
    subcategory: "Rata",
    price: "1893.19",
    payment: "Card",
    date: "10/15/2026"
  },
  {
    name: "Rata Noiembrie",
    categorie: "Cheltuieli",
    subcategory: "Rata",
    price: "1859.39",
    payment: "Card",
    date: "11/15/2026"
  },
  {
    name: "Rata Decembrie",
    categorie: "Cheltuieli",
    subcategory: "Rata",
    price: "1859.39",
    payment: "Card",
    date: "12/15/2026"
  },
  //   {
  //     name: "Alocatie Iunie",
  //     categorie: "Venituri",
  //     subcategory: "Alocatie",
  //     price: "860",
  //     payment: "Card",
  //     date: "06/10/2026"
  //   },
  //   {
  //     name: "Alocatie Iulie",
  //     categorie: "Venituri",
  //     subcategory: "Alocatie",
  //     price: "860",
  //     payment: "Card",
  //     date: "07/10/2026"
  //   },
  //   {
  //     name: "Alocatie August",
  //     categorie: "Venituri",
  //     subcategory: "Alocatie",
  //     price: "860",
  //     payment: "Card",
  //     date: "08/10/2026"
  //   },
  {
    name: "Alocatie Septembrie",
    categorie: "Venituri",
    subcategory: "Alocatie",
    price: "860",
    payment: "Card",
    date: "09/10/2026"
  },
  {
    name: "Alocatie Octombrie",
    categorie: "Venituri",
    subcategory: "Alocatie",
    price: "860",
    payment: "Card",
    date: "10/10/2026"
  },
  {
    name: "Alocatie Noiembrie",
    categorie: "Venituri",
    subcategory: "Alocatie",
    price: "860",
    payment: "Card",
    date: "11/10/2026"
  },
  {
    name: "Alocatie Decembrie",
    categorie: "Venituri",
    subcategory: "Alocatie",
    price: "860",
    payment: "Card",
    date: "12/10/2026"
  },
  //   {
  //     name: "Chirie August",
  //     categorie: "Venituri",
  //     subcategory: "Chirie",
  //     price: "2525",
  //     payment: "Card",
  //     date: "08/15/2026"
  //   },
  //   {
  //     name: "Chirie Septembrie",
  //     categorie: "Venituri",
  //     subcategory: "Chirie",
  //     price: "2525",
  //     payment: "Card",
  //     date: "09/15/2026"
  //   },
  //   {
  //     name: "Chirie Octombrie",
  //     categorie: "Venituri",
  //     subcategory: "Chirie",
  //     price: "2525",
  //     payment: "Card",
  //     date: "10/15/2026"
  //   },
  {
    name: "Chirie Noiembrie",
    categorie: "Venituri",
    subcategory: "Chirie",
    price: "2525",
    payment: "Card",
    date: "11/15/2026"
  },
  {
    name: "Chirie Decembrie",
    categorie: "Venituri",
    subcategory: "Chirie",
    price: "2525",
    payment: "Card",
    date: "12/15/2026"
  }
];

test("AppSheet I add values", async ({ page }) => {
  const viewPage = new AppSheetPage(page);
  await viewPage.login(credentials.appSheet);

  console.log("Pregătesc să adaug items...");

  for (const item of addData) {
    await viewPage.addItem(item);
    await page.waitForTimeout(1000); // Pauză între adăugări
  }
  console.log("✅ Toate items adăugate cu succes!");
});

const editData = [
  {
    name: "Rata August",
    categorie: "Cheltuieli",
    subcategory: "Rata",
    price: "1857.21",
    payment: "Card",
    date: "08/15/2026"
  },
  {
    name: "Rata Septembrie",
    categorie: "Cheltuieli",
    subcategory: "Rata",
    price: "1852.72",
    payment: "Card",
    date: "09/15/2026"
  },
  {
    name: "Rata Octombrie",
    categorie: "Cheltuieli",
    subcategory: "Rata",
    price: "1820.23",
    payment: "Card",
    date: "10/15/2026"
  },
  {
    name: "Rata Noiembrie",
    categorie: "Cheltuieli",
    subcategory: "Rata",
    price: "1843.72",
    payment: "Card",
    date: "11/15/2026"
  },
  {
    name: "Rata Decembrie",
    categorie: "Cheltuieli",
    subcategory: "Rata",
    price: "1811.52",
    payment: "Card",
    date: "12/15/2026"
  }
];

test("AppSheet I edit values", async ({ page }) => {
  const viewPage = new AppSheetPage(page);
  await viewPage.login(credentials.appSheet);

  console.log("Pregătesc să editez items...");

  for (const item of editData) {
    await viewPage.editItem(item);
    await page.waitForTimeout(1000); // Pauză între adăugări
  }
  console.log("✅ Toate items editate cu succes!");
});
