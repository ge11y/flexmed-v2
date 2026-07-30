# Founder Test Queue

Use this checklist for the next founder testing round. The goal is to confirm the real daily workflows and collect exact product/order names for anything still off.

Live site: https://flexmed-v2.vercel.app

## 1. Product Image Update Test

1. Open Admin -> Inventory.
2. Pick one product family with multiple strengths.
3. Open `Info`.
4. Upload a new image to one strength.
5. Wait for the success message.
6. Hard refresh Admin -> Inventory.
7. Open the public product page for that family.
8. Hard refresh the public product page.

Expected:
- The newest uploaded image should show in Inventory for that family.
- The newest uploaded image should show on the public product family page.
- Newly added strengths should inherit the family image/CoA.

Report if failed:
- product family name
- exact strength edited
- whether the image looked updated in admin
- whether the image looked updated on the public product page

## 2. CoA Upload Test

1. Open Admin -> Inventory.
2. Pick a product with a known CoA.
3. Open `Info`.
4. Upload one or more CoA pages.
5. Click `View CoA`.
6. Open the public product page and click `CoA Available`.

Expected:
- CoA should open through `/coa/[slug]`.
- Multiple uploaded pages should display in order.
- The public product page should not show a print button.

Report if failed:
- product family name
- exact strength edited
- file type uploaded: PDF, PNG, JPG, or WEBP
- whether admin could view the CoA
- whether public product page could view the CoA

## 3. Multi-Strength Product Test

Check these families first:
- HGH
- 5 Amino 1
- BAC Water
- Glutathione
- TIRZ

Expected:
- one product family page
- all live strengths visible
- each strength shows its own price
- each strength shows its own inventory state
- out-of-stock strengths remain visible

Report if failed:
- product family name
- missing strength
- wrong price
- wrong inventory count
- wrong image or CoA

## 4. Supply Order Test

1. Pick a product/strength with `0` inventory.
2. Create a supply order for that exact product/strength.
3. Confirm it shows `Incoming`.
4. Mark the supply order `Arrived`.

Expected:
- `Incoming` appears only while inventory is `0` and an open supply order exists.
- `Mark Arrived` adds inventory.
- Kit math applies as `1 kit = 10 vials` unless changed.

Report if failed:
- product family
- strength
- vendor
- vial quantity
- kit quantity
- before/after inventory count

## 5. Order Completion Test

1. Place a test order.
2. Confirm payment/proof as usual.
3. Move the order through fulfillment.
4. Mark it `Complete`.
5. Check Inventory for the exact product/strength.

Expected:
- completing the order deducts the ordered quantity from inventory.
- if stock hits `0`, it shows `Out of Stock` unless there is an open supply order.
- if stock hits `0` and there is an open supply order, it shows `Incoming`.

Report if failed:
- order ID
- product family
- strength
- quantity ordered
- before/after inventory count

## 6. Shipping Label Extraction Test

Needs a real founder label sample.

Expected:
- label upload saves to the order
- carrier/tracking extraction appears as a review step
- founder can apply extracted details to fulfillment fields

Report if failed:
- order ID
- label file type
- carrier
- whether upload failed, extraction failed, or apply failed
