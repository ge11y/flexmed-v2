# FlexMed v2 — Product Render Specification

Exact specifications for product vial imagery to match the site visual style.
Follow this guide when commissioning or producing product images.

---

## Visual Style

The product render style must match the site aesthetic:
- **Background:** Matches the site card background (`#111318` or `var(--bg-card)`)
- **Lighting:** Soft studio lighting — not harsh or specular. Think product photography on a clean matte surface.
- **Perspective:** Slight isometric or front-facing tilt. Not flat flat — a subtle 3D feel.
- **Label:** Clean, minimal text. No promotional language.
- **Overall feel:** Premium, scientific, institutional — not consumer retail.

---

## Vial/Container

All compounds use a **universal container format** — same physical container shape across all products. Only the label and accent color differentiate them.

### Container Shape
- 10mL clear glass Boston Round vial with screw cap
- Approx. 50mm tall × 20mm diameter (proportions, not exact)
- Slight amber-tinted glass or neutral clear glass
- Matte white screw cap

### Label
- White or off-white label
- Text in `font-mono` style — clean monospace, small caps feel
- Required label content (per compound):

```
[COMPOUND DISPLAY NAME]    ← e.g. "CJC/Ipa 10mg"
[FULL COMPOUND NAME]       ← e.g. "CJC-1295 + Ipamorelin"
[FORMAT / STRENGTH]       ← e.g. "10mg / Vial"
Lot: [BATCH NUMBER]        ← e.g. "Lot: FM-CJC-IPA-001"
[STORAGE CONDITIONS]       ← e.g. "Store: 2-8°C"
Research Use Only          ← mandatory
```

---

## Image Files Per Product

```
public/products/[slug]/
├── front.png          ← REQUIRED — front-facing product render
├── back.png           ← REQUIRED — back view showing full label
├── side.png            ← OPTIONAL — side profile
└── hover/
    ├── frame-00.png    ← OPTIONAL — frame 1 of 12 for spin animation
    ├── frame-01.png
    ├── ...
    └── frame-11.png    ← OPTIONAL — frame 12
```

---

## Image Specs

| Property | Value |
|---|---|
| Format | PNG |
| Color space | sRGB |
| Background | `#111318` (matches `var(--bg-card)`) |
| Dimensions | 600 × 600 px minimum |
| Resolution | 72–150 ppi (screen-optimized) |
| Padding | 60px minimum around vial on all sides |
| Output | Lossless or high-quality PNG-24 |

---

## Naming Convention

- File slug = product slug from `data-products.ts`
- `front.png`, `back.png`, `side.png`
- Hover frames: `frame-00.png` through `frame-11.png`

---

## Accent Color Per Product

Use this hex value for the accent bar on the product card and any label accents:

| Slug | Accent Color | Hex |
|---|---|---|
| `cjc-ipa-10mg` | cool cyan-blue | `#6B9FBF` |
| `cagri-5mg` | warm amber | `#C4976A` |
| `dsip-5mg` | soft indigo | `#8B8FC7` |
| `epithalon-10mg` | muted silver | `#9EAAB4` |
| `glutathione-600` | sage green | `#7A9E7E` |
| `glutathione-1200` | sage green | `#7A9E7E` |
| `kpv-10mg` | cool slate | `#7A8FA0` |
| `mots-c-40mg` | deep teal | `#4A7A7A` |
| `nad-plus-500` | warm ivory | `#C4B89A` |
| `pnc-27-5mg` | rose taupe | `#B08080` |
| `pt-141-10mg` | deep burgundy | `#8B4A5A` |
| `snap-8-10mg` | soft lavender | `#9A8FC4` |
| `ss-31-50mg` | forest teal | `#3A6A6A` |
| `thy-a1-10mg` | pearl white | `#C8C4BC` |
| `tirz-15mg` | cool cyan-blue | `#4A8FC4` |
| `tirz-30mg` | cool cyan-blue | `#4A8FC4` |

---

## Hover-Spin Animation

If producing hover-spin frames for the product detail page:

1. Create 12 frames at 30° intervals (360° / 12 = 30° per frame)
2. Uniform lighting across all frames — no flicker
3. Output as `frame-00.png` through `frame-11.png`
4. Place in `public/products/[slug]/hover/`
5. Set `hoverSpinFrames` in `lib/data-products.ts`:
   ```ts
   hoverSpinFrames: [
     '/products/cjc-ipa-10mg/hover/frame-00.png',
     '/products/cjc-ipa-10mg/hover/frame-01.png',
     // ... through frame-11
   ]
   ```
6. The product detail page detects non-empty `hoverSpinFrames` and plays the animation on hover

**For confirmed products without renders yet:** leave `hoverSpinFrames: []` and the detail page will show the `front.png` static image with a subtle CSS hover scale instead.

---

## Example Label Layout

```
┌─────────────────────────────────────┐
│  CJC/Ipa 10mg                       │  ← displayName, accent color or bold
│  CJC-1295 + Ipamorelin              │  ← fullName, smaller
│  10mg / Vial                        │  ← strength + format
│  ──────────────────────────────     │
│  Lot: FM-CJC-IPA-001                │
│  Store: 2-8°C                       │
│                                     │
│  FOR LABORATORY RESEARCH USE ONLY   │  ← mandatory, all caps, small
└─────────────────────────────────────┘
```

---

## What NOT to Include

- No dosage information
- No "maximum result" or efficacy claims
- No administration instructions
- No references to human use
- No promotional language ("premium", "best", "advanced formula")
- No batch-specific purity in the label (that goes on the CoA, not the vial)
