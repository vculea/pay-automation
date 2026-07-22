import { Page, Locator } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { ReactDatePicker } from "./datePicker";

export class ANAFPage {
  readonly page: Page;
  readonly nameEl: Locator;
  readonly prenumEl: Locator;
  readonly cnpEl: Locator;
  readonly bonificatieToggle: Locator;
  readonly cassOptiuneToggle: Locator;
  readonly casOrCass: Locator;
  readonly selectVenitEl: Locator;
  readonly addButton: Locator;
  readonly typeSelect: Locator;
  readonly nrContract: Locator;
  readonly dataContract: Locator;
  readonly description: Locator;
  readonly venitBrut: Locator;
  readonly datePicker: ReactDatePicker;
  readonly dataInceputContract: Locator;
  readonly datePickerInceput: ReactDatePicker;
  readonly dataSfarsitContract: Locator;
  readonly datePickerSfarsit: ReactDatePicker;
  readonly generatePdfButton: Locator;
  readonly generatePdfNoZipButton: Locator;
  readonly descarcaPdfButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.nameEl = page.locator("#nume_c");
    this.prenumEl = page.getByLabel("Prenume");
    this.cnpEl = page.getByLabel("Cod de identificare fiscală");
    this.bonificatieToggle = page.locator("#toggle-bonificatie");
    this.cassOptiuneToggle = page.locator("#toggle-optiune-cass");
    this.casOrCass = page.locator("#pensionar");
    this.selectVenitEl = page.locator("#A_categ_venit_0");
    this.addButton = page.getByRole("button", { name: "Adaugă venit România +" });
    this.typeSelect = page.getByRole("combobox").filter({ hasText: "Alege tipul" }).first();
    this.nrContract = page.getByLabel("Număr contract închiriere").first();
    this.dataContract = page.getByLabel("Data contractului").first();
    this.datePicker = new ReactDatePicker(page, this.dataContract);
    this.dataInceputContract = page.getByLabel("Data început contract").first();
    this.datePickerInceput = new ReactDatePicker(page, this.dataInceputContract);
    this.dataSfarsitContract = page.getByLabel("Data sfârșit contract").first();
    this.datePickerSfarsit = new ReactDatePicker(page, this.dataSfarsitContract);
    this.generatePdfButton = page.getByRole("button", { name: "Generează fișier PDF pentru depunere" });
    this.generatePdfNoZipButton = page.getByRole("button", { name: "Generează PDF fără ZIP" });
    this.descarcaPdfButton = page.getByRole("button", { name: "Descarcă PDF" });

    this.description = page.getByLabel("Datele de identificare a bunului pentru care se cedează folosința").first();
    this.venitBrut = page.getByLabel("Venit brut").first();
  }

  async goto() {
    await this.page.goto("https://www.anaf.ro/declaratii/duf");
  }

  async fill(persona: any) {
    await this.nameEl.fill(persona.name);
    await this.prenumEl.fill(persona.prenume);
    await this.cnpEl.fill(persona.cnp);

    if (persona.bonificatie) {
      await this.bonificatieToggle.scrollIntoViewIfNeeded();
      if (!(await this.bonificatieToggle.isChecked())) {
        await this.bonificatieToggle.check();
      }
    }

    if (persona.cass) {
      await this.cassOptiuneToggle.scrollIntoViewIfNeeded();
      if (!(await this.cassOptiuneToggle.isChecked())) {
        await this.cassOptiuneToggle.check();
      }
    }

    await this.casOrCass.selectOption({ value: "4" });

    for (const item of persona.items) {
      let elementVisible;
      do {
        await this.addButton.scrollIntoViewIfNeeded();
        await this.addButton.click();
        await this.selectVenitEl.scrollIntoViewIfNeeded();
        await this.selectVenitEl.waitFor({ state: "visible", timeout: 2000 });
        let cls = await this.selectVenitEl.getAttribute("class");
        elementVisible = cls !== null && !cls.includes("cursor-not-allowed");
      } while (!elementVisible);
      await this.selectVenitEl.click();
      await this.selectVenitEl.selectOption({ value: item.category });
      await this.typeSelect.selectOption({ label: item.type });
      await this.nrContract.fill(item.contract);
      await this.datePicker.selectDate(item.data);
      if (item.dataStart && item.dataStart.length !== 0) {
        await this.datePickerInceput.selectDate(item.dataStart);
      }
      if (item.dataEnd && item.dataEnd.length !== 0) {
        await this.datePickerSfarsit.selectDate(item.dataEnd);
      }
      await this.description.fill(item.description);
      await this.description.press("Enter");
      await this.venitBrut.fill(item.venit);
      await this.venitBrut.press("Enter");
      console.log("Verify...");
    }
  }

  async downloadPDF() {
    await this.generatePdfButton.click();
    await this.generatePdfNoZipButton.click();
    const [download] = await Promise.all([this.page.waitForEvent("download"), this.descarcaPdfButton.click()]);
    const downloadsDir = path.resolve(process.cwd(), "downloads");
    await mkdir(downloadsDir, { recursive: true });
    const savePath = path.join(downloadsDir, download.suggestedFilename());
    await download.saveAs(savePath);
    console.log(`PDF descărcat la: ${savePath}`);
  }
}
