# FlexMed Catalog Dashboard -> Google Sheets

This is the shared-source version of the catalog dashboard.

## Goal

Founder and employees should be able to:

- view all products in one sheet
- change price
- change stock status
- track inventory count
- define the low-stock threshold
- create a promo label and promo detail
- control whether a product is publicly visible

Then the site can treat that sheet as the live operational source.

## 1. Create the sheet

Create a Google Sheet with a tab named `Catalog`.

Use this header row:

```text
slug,display_name,full_name,collection,research_category,format_type,public_visible,status,inventory_on_hand,low_stock_threshold,price_vial,promo_label,promo_detail
```

## 2. Apps Script webhook

Use this in `Extensions -> Apps Script`:

```javascript
function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Catalog');
    if (!sheet) throw new Error('Catalog sheet not found');

    var records = data.records || [];
    sheet.clearContents();
    sheet.appendRow([
      'slug',
      'display_name',
      'full_name',
      'collection',
      'research_category',
      'format_type',
      'public_visible',
      'status',
      'inventory_on_hand',
      'low_stock_threshold',
      'price_vial',
      'promo_label',
      'promo_detail'
    ]);

    records.forEach(function(record) {
      sheet.appendRow([
        record.slug,
        record.displayName,
        record.fullName,
        record.collection,
        record.researchCategory,
        record.formatType,
        record.publicVisible ? 'yes' : 'no',
        record.status,
        record.inventoryOnHand === null ? '' : record.inventoryOnHand,
        record.lowStockThreshold === null ? '' : record.lowStockThreshold,
        record.priceVial,
        record.promoLabel || '',
        record.promoDetail || ''
      ]);
    });

    return ContentService
      .createTextOutput(JSON.stringify({ ok: true, rows: records.length }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({ ok: false, error: String(error) }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet() {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Catalog');
    if (!sheet) throw new Error('Catalog sheet not found');

    var rows = sheet.getDataRange().getValues();
    if (rows.length < 2) {
      return ContentService
        .createTextOutput(JSON.stringify({ ok: true, records: [] }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    var headers = rows[0];
    var records = rows.slice(1).filter(function(row) {
      return row[0];
    }).map(function(row) {
      var record = {};
      headers.forEach(function(header, index) {
        record[header] = row[index];
      });
      return record;
    });

    return ContentService
      .createTextOutput(JSON.stringify({ ok: true, records: records }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({ ok: false, error: String(error) }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
```

## 3. Deploy it

- `Deploy -> New deployment`
- Type: `Web app`
- Execute as: `Me`
- Who has access: `Anyone`

Copy the URL.

## 4. Add to Vercel

Set:

```text
CATALOG_SYNC_WEBHOOK_URL=https://script.google.com/macros/s/your-script-id/exec
CATALOG_SOURCE_URL=https://script.google.com/macros/s/your-script-id/exec
```

## 5. Current status

Right now the admin inventory page can:

- load the shared catalog source
- edit a local draft in-browser
- export a CSV
- POST the entire catalog to a shared webhook

That means the sheet can become the first shared operations source, and the public storefront can read from the same sheet for live price, visibility, inventory, low-stock, and promo state.
