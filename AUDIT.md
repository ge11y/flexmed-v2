# FlexMed v2 — Content & QA Audit

**Date:** 2026-04-17
**Live:** https://flexmed-v2.vercel.app
**Repo:** https://github.com/ge11y/flexmed-v2
**Confirmed products:** 16 (public) | **Pending confirmation:** 5 (admin only)

---

## Page Audit Summary

### ✅ Homepage (`/`)
- Hero, trust strip, featured products — all populated
- **Issue:** Testing section shows batch cards with `[LAB DATA REQUIRED]` placeholders
- **Issue:** Footer has `[INSTITUTIONAL EMAIL REQUIRED]`, `[BUSINESS ADDRESS REQUIRED]`, `[COMPANY REGISTRATION REQUIRED]`
- **Issue:** All featured products show "COA PENDING" badge — no CoAs uploaded yet

### ✅ Catalog (`/products`)
- 16 confirmed products visible, 5 pending-confirmation excluded (verified)
- All 18 assets mapped and deployed (front.png per product)
- SNAP-8 and SS-31 images confirmed fixed
- Category filter buttons use pastel sky blue — visible but subtle

### ✅ Product Detail Pages (`/products/[slug]`)
- `generateStaticParams` now limits to 16 confirmed slugs only
- `needs_confirmation` products cannot be visited via direct URL
- **Issue:** Every product has `[REQUIRED]` in: batchNumber, testingLab, purityPercent, coaUrl
- **Issue:** Testing records section shows `[COA DOCUMENT REQUIRED]` per batch

### ✅ Testing Standards (`/testing`)
- Lab section shows `[TESTING LAB NAME REQUIRED]`, `[ACCREDITATION BODY REQUIRED]`, etc.
- Batch records table has `[TESTING LAB REQUIRED]`, `[DATE]`, `[PURITY REQUIRED]` per row
- Methodology (HPLC + MS) cards are populated — good

### ✅ About (`/about`)
- All company positioning text is written and live
- **Issue:** Team section: `[FOUNDER OR TEAM DETAILS REQUIRED]` + `[TITLE REQUIRED]`

### ✅ Contact (`/contact`)
- Form labels populated, form is functional-looking
- **Issue:** Info panel: `[INSTITUTIONAL EMAIL REQUIRED]`, `[BUSINESS ADDRESS REQUIRED]`, `[COMPANY REGISTRATION REQUIRED]`

### ✅ Legal Pages (`/terms`, `/privacy`, `/disclaimer`)
- All three exist and render (not audited for legal sufficiency)

### ✅ Admin Catalog (`/admin/catalog`)
- Shows all 21 non-on_hold products (16 confirmed + 5 pending-confirmation)
- "Pending Confirmation — Action Required" section visible
- **Issue:** All CoAs show as "Pending" — no real batch data

---

## Privacy / Visibility Controls — Verified ✅

| Mechanism | Status |
|---|---|
| `needs_confirmation` products excluded from `/products` listing | ✅ Verified |
| `needs_confirmation` products excluded from homepage featured | ✅ Verified |
| `needs_confirmation` products excluded from `generateStaticParams` | ✅ Fixed (was generating all 21) |
| `needs_confirmation` products accessible via direct URL if URL is known | ⚠️ Page renders with warning banner but no 404 |
| `on_hold` products excluded from everywhere | ✅ |

**Note:** `needs_confirmation` slugs still render a page (with prominent warning banner) if someone navigates directly. If hard 404 is preferred, add `notFound()` check in the detail page for those slugs.

---

## Data Layer Status

### `lib/data-products.ts`
- 16 confirmed products: all slugs, names, descriptions, categories, features, accent colors populated
- **Missing per product:** `batchNumber`, `testingLab`, `coaStatus`, `coaUrl`
- `PRODUCT_IMAGES` map: fully populated with front.png for all 18 assets

### `lib/data-testing.ts`
- `TESTING_LAB` constant: all fields are `[REQUIRED]` placeholders
- `BATCH_RECORDS`: 4 batches with `[REQUIRED]` lab/purity/date/CoA fields

### `lib/data-site.ts`
- **Missing:** `companyEmail`, `companyAddress`, `companyRegistration`
- Everything else (hero, nav, footer, trust signals) is populated

### `lib/data-legal.ts`
- Legal text is written (not audited for accuracy/completeness)

---

## Asset System — Ready for Hover-Spin

The centralized `PRODUCT_IMAGES` map in `data-products.ts` supports `hoverSpinFrames: string[]` per product. Currently:
- No products have hover-spin frames populated
- To add: copy additional angle images to `public/products/[slug]/`, then add paths to `hoverSpinFrames[]` in `PRODUCT_IMAGES`

No refactoring needed — `ProductImage.tsx` reads `hoverSpinFrames` directly.

---

## Remaining Work (Founder to Complete)

### Must fill before launch
1. `data-site.ts`: company email, address, registration number
2. `data-testing.ts`: testing lab name, accreditation, website + all batch CoA URLs
3. `data-products.ts`: batch numbers per product (e.g., `FM-CJC-IPA-001`)
4. COA PDFs: upload to `public/coa/` or hosted URL, then populate `coaUrl` per batch

### Nice to have
- Team section on About page (name, title, bio)
- Actual pricing or removal of pricing from any remaining spots
- FAQ entries — currently empty
- Hover-spin frames for any products with multi-angle photography

---

## Color System Reference

```
--text-primary:   #EEECE8   (main text)
--text-secondary: #C4BEB6   (descriptions, secondary info)
--text-muted:     #7A746E   (labels, metadata — 3.3:1 on black)
--text-placeholder:#C4A882  (amber, [REQUIRED] markers — 4.8:1)
--pastel-lavender: #B8A8E8
--pastel-mint:     #8ED0A8   (category labels on cards)
--pastel-peach:    #E8B090   (chemical names on cards)
--pastel-sky:      #88BCE8   (filter button inactive text)
--pastel-rose:     #E8A8A8
```
