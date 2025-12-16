# pay-automation
Pay automatically for different sites

## Playwright Tests pentru Sencha ExtJS (TypeScript)

Acest proiect conține teste automatizate Playwright scrise în TypeScript pentru site-ul Sencha ExtJS Kitchen Sink, în special pentru componenta Array Grid.

### Instalare

1. Instalează dependințele:
```bash
npm install
```

2. Instalează browserele Playwright:
```bash
npx playwright install
```

### Rulare Teste

- Rulează toate testele:
```bash
npm test
```

- Rulează testele în mod vizual (headed):
```bash
npm run test:headed
```

- Rulează testele cu UI interactiv:
```bash
npm run test:ui
```

- Rulează testele în mod debug:
```bash
npm run test:debug
```

### Teste Disponibile

- **Sencha ExtJS Array Grid Tests** (`tests/sencha-array-grid.spec.ts`)
  - Verifică încărcarea paginii
  - Testează componenta Array Grid
  - Verifică header-ele grid-ului
  - Testează interacțiunea cu liniile din grid
  - Verifică meniul de navigare
  - Testează funcționalitatea de căutare (dacă este disponibilă)
  - Testează responsive design

### Tehnologii Folosite

- **TypeScript** - pentru tipizare statică și development experience îmbunătățit
- **Playwright** - pentru testarea automată a aplicațiilor web
- **Node.js** - runtime environment

### URL Testat

- https://examples.sencha.com/extjs/7.9.0/examples/kitchensink/?classic#array-grid

Testele sunt configurate să funcționeze cu iframe-ul din pagină și să identifice corect componentele ExtJS.
