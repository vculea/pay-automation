import { Locator, Page } from "@playwright/test";

export class ReactDatePicker {
  readonly page: Page;
  readonly input: Locator;

  constructor(page: Page, input: Locator) {
    this.page = page;
    this.input = input;
  }

  async selectDate(date: string): Promise<void> {
    const parsed = this.parseDate(date);
    if (!parsed) {
      throw new Error(`Format invalid pentru data contractului: "${date}". Folosește zz.ll.aaaa`);
    }

    await this.input.click();
    const calendar = this.page.locator('.react-datepicker[role="dialog"]');
    await calendar.waitFor({ state: "visible", timeout: 5000 });

    await this.navigateToMonth(calendar, parsed.month, parsed.year);

    const dayClass = `.react-datepicker__day--${String(parsed.day).padStart(3, "0")}`;
    const dayCell = calendar.locator(`${dayClass}:not(.react-datepicker__day--outside-month)`).first();

    await dayCell.click();
    await this.input.waitFor({ state: "visible" });
  }

  private async navigateToMonth(calendar: Locator, targetMonth: number, targetYear: number): Promise<void> {
    const previousButton = calendar.locator(".react-datepicker__navigation--previous");
    const nextButton = calendar.locator(".react-datepicker__navigation--next");
    const monthTitle = calendar.locator(".react-datepicker__current-month");

    for (let attempts = 0; attempts < 240; attempts++) {
      const currentLabel = (await monthTitle.textContent())?.trim() ?? "";
      const current = this.parseMonthLabel(currentLabel);

      if (!current) {
        throw new Error(`Nu pot citi luna curentă din calendar: "${currentLabel}"`);
      }

      const monthDiff = (targetYear - current.year) * 12 + (targetMonth - current.month);
      if (monthDiff === 0) {
        return;
      }

      if (monthDiff > 0) {
        await nextButton.click();
      } else {
        await previousButton.click();
      }
    }

    throw new Error("Nu am putut naviga la luna dorită în DatePicker.");
  }

  private parseDate(date: string): { day: number; month: number; year: number } | null {
    const match = date.match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
    if (!match) {
      return null;
    }

    const day = Number(match[1]);
    const month = Number(match[2]);
    const year = Number(match[3]);

    if (month < 1 || month > 12 || day < 1 || day > 31) {
      return null;
    }

    return { day, month, year };
  }

  private parseMonthLabel(label: string): { month: number; year: number } | null {
    const match = label.match(/^([^\s]+)\s+(\d{4})$/);
    if (!match) {
      return null;
    }

    const monthName = match[1].toLowerCase();
    const year = Number(match[2]);
    const monthMap: Record<string, number> = {
      january: 1,
      february: 2,
      march: 3,
      april: 4,
      may: 5,
      june: 6,
      july: 7,
      august: 8,
      september: 9,
      october: 10,
      november: 11,
      december: 12,
      ianuarie: 1,
      februarie: 2,
      martie: 3,
      aprilie: 4,
      mai: 5,
      iunie: 6,
      iulie: 7,
      septembrie: 9,
      octombrie: 10,
      noiembrie: 11,
      decembrie: 12
    };

    const month = monthMap[monthName];
    if (!month || Number.isNaN(year)) {
      return null;
    }

    return { month, year };
  }
}
