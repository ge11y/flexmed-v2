# FlexMed v2 — Missing Data Checklist

Master record of every `[REQUIRED]` and `[PENDING]` field across the data layer.
Work through this list to move from staging to launch-ready.

---

## Business Identity — `lib/data-site.ts`

| Field | Location | Current Value | Action Required |
|---|---|---|---|
| `institutionalEmail` | `data-site.ts` → `SITE_SETTINGS` | `[INSTITUTIONAL EMAIL REQUIRED]` | Replace with real contact email |
| `businessAddress` | `data-site.ts` → `SITE_SETTINGS` | `[BUSINESS ADDRESS REQUIRED]` | Replace with registered address |
| `companyRegistration` | `data-site.ts` → `SITE_SETTINGS` | `[COMPANY REGISTRATION REQUIRED]` | Replace with company registration number |
| `founded` | `data-site.ts` → `SITE_SETTINGS` | `[YEAR REQUIRED]` | Replace with founding year |

---

## Testing Lab — `lib/data-testing.ts`

| Field | Location | Current Value | Action Required |
|---|---|---|---|
| `TESTING_LABS.primary.name` | `data-testing.ts` | `[LAB NAME REQUIRED]` | Replace with full lab name |
| `TESTING_LABS.primary.accreditationBody` | `data-testing.ts` | `[ACCREDITATION BODY REQUIRED]` | e.g. "ISO/IEC 17025:2017" |
| `TESTING_LABS.primary.accreditationNumber` | `data-testing.ts` | `[ACCREDITATION NUMBER REQUIRED]` | Lab's accreditation cert number |
| `TESTING_LABS.primary.website` | `data-testing.ts` | `[LAB WEBSITE REQUIRED]` | Replace with real lab URL |

---

## Products — `lib/data-products.ts`

### Per-product required fields (all 16 confirmed products)

For each product in `PRODUCTS`, the following fields must be filled in before launch:

| Field | Where | Notes |
|---|---|---|
| `testingLab` | `PRODUCTS[slug].testingLab` | Same lab name for all products (from `data-testing.ts`) |
| `purityPercent` | `PRODUCTS[slug].purityPercent` | e.g. `"98.5%"` — from batch CoA |
| `batchNumber` | `PRODUCTS[slug].batchNumber` | Already set for most products — verify |
| `coaUrl` | `PRODUCTS[slug].coaUrl` | Set to `''` until CoA is published |
| `coaStatus` | `PRODUCTS[slug].coaStatus` | Change to `'available'` only after CoA is live |
| `verificationUrl` | `PRODUCTS[slug].verificationUrl` | Optional — link to external batch verification if lab provides one |

### Product image files — `public/products/[slug]/`

> **Style guide below** — follow the product render spec in `PRODUCT_RENDER_SPEC.md`.

For each product, produce:
1. `front.png` — Front view (required for card + detail page)
2. `back.png` — Back view with label (required for detail page)
3. `side.png` — Side view (optional)
4. `hover/` directory — 12 frames for hover-spin animation

| Slug | front.png | back.png | hover/ |
|---|---|---|---|
| `cjc-ipa-10mg` | [REQUIRED] | [REQUIRED] | [OPTIONAL] |
| `cagri-5mg` | [REQUIRED] | [REQUIRED] | [OPTIONAL] |
| `dsip-5mg` | [REQUIRED] | [REQUIRED] | [OPTIONAL] |
| `epithalon-10mg` | [REQUIRED] | [REQUIRED] | [OPTIONAL] |
| `glutathione-600` | [REQUIRED] | [REQUIRED] | [OPTIONAL] |
| `glutathione-1200` | [REQUIRED] | [REQUIRED] | [OPTIONAL] |
| `kpv-10mg` | [REQUIRED] | [REQUIRED] | [OPTIONAL] |
| `mots-c-40mg` | [REQUIRED] | [REQUIRED] | [OPTIONAL] |
| `nad-plus-500` | [REQUIRED] | [REQUIRED] | [OPTIONAL] |
| `pnc-27-5mg` | [REQUIRED] | [REQUIRED] | [OPTIONAL] |
| `pt-141-10mg` | [REQUIRED] | [REQUIRED] | [OPTIONAL] |
| `snap-8-10mg` | [REQUIRED] | [REQUIRED] | [OPTIONAL] |
| `ss-31-50mg` | [REQUIRED] | [REQUIRED] | [OPTIONAL] |
| `thy-a1-10mg` | [REQUIRED] | [REQUIRED] | [OPTIONAL] |
| `tirz-15mg` | [REQUIRED] | [REQUIRED] | [OPTIONAL] |
| `tirz-30mg` | [REQUIRED] | [REQUIRED] | [OPTIONAL] |

### Pending Confirmation Products — `lib/data-products.ts`

**Do not publish these to the public catalog until the following are resolved:**

| Slug | Missing |
|---|---|
| `aodc-5mg` | batchNumber, testingLab, purityPercent, coaUrl, founder label approval |
| `mel-2-10mg` | batchNumber, testingLab, purityPercent, coaUrl, founder label approval |
| `pe-22-28-wwb-10mg` | batchNumber, testingLab, purityPercent, coaUrl, founder label approval |
| `reta-20mg` | batchNumber, testingLab, purityPercent, coaUrl, founder label approval |
| `reta-30mg` | batchNumber, testingLab, purityPercent, coaUrl, founder label approval |

To publish: change `publishStatus` from `'needs_confirmation'` to `'confirmed'`, fill all missing fields.

### On-Hold Products — NOT in codebase

These 3 compounds are intentionally excluded. Do not add to `PRODUCTS` until founder resolves the hold:

- HGH36 UTH
- SLU-PP-5
- WOLVERINE-20

---

## Legal Pages — `lib/data-legal.ts`

| Page | Current Status | Action Required |
|---|---|---|
| `disclaimer` | Has placeholder content | Replace with final legal disclaimer text |
| `privacy` | Has placeholder content | Replace with final privacy policy |
| `terms` | Has placeholder content | Replace with final terms of service |

---

## Homepage — `app/page.tsx`

| Field | Location | Current Value | Action Required |
|---|---|---|---|
| Hero — tagline | Hardcoded in `page.tsx` | Replace with final tagline if different |
| Hero — sub-copy | Hardcoded in `page.tsx` | Replace with final hero sub-copy if different |

---

## Contact Page — `app/contact/page.tsx`

| Field | Location | Current Value | Action Required |
|---|---|---|---|
| All contact info | Pulls from `data-site.ts` | See Business Identity section above |

---

## Footer — `components/Footer.tsx`

| Field | Location | Current Value | Action Required |
|---|---|---|---|
| Footer — company name | `data-site.ts` → `SITE_SETTINGS.companyName` | Verify `FlexMed` is correct |
| Footer — tagline | `data-site.ts` → `SITE_SETTINGS.tagline` | Verify or update |
| Footer — institutional email | `data-site.ts` → `SITE_SETTINGS.institutionalEmail` | See Business Identity section |
| Footer — business address | `data-site.ts` → `SITE_SETTINGS.businessAddress` | See Business Identity section |

---

## How to Update

1. Fill in `lib/data-site.ts` with real business details — this cascades to footer, contact, and legal pages automatically.
2. Fill in `lib/data-testing.ts` with real lab credentials — this applies to all products.
3. For each product, update `testingLab`, `purityPercent`, and `batchNumber` in `lib/data-products.ts`.
4. Upload product images to `public/products/[slug]/front.png` and `public/products/[slug]/back.png` following `PRODUCT_RENDER_SPEC.md`.
5. For CoA availability: set `coaStatus` to `'available'` and populate `coaUrl` with the live CoA PDF URL.
6. For pending-confirmation products: resolve the checklist above, then change `publishStatus` to `'confirmed'`.

**No redesign needed** — all strings are centralized. One file change = one site-wide update.
