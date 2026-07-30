# FlexMed Manual Orders -> Google Sheets

This is the quickest way to give founder a shared order queue without waiting on a high-risk processor.

## What this setup does

- FlexMed checkout creates a manual order submission
- The app POSTs that order to a webhook URL
- A Google Apps Script web app receives it
- The script writes one row into a Google Sheet
- Founder can open the sheet, track statuses, and mark orders complete

## 1. Create the sheet

Create a Google Sheet with a tab named `Orders`.

Use this header row:

```text
order_id,created_at,status,payment_method,payment_proof_status,customer_name,email,phone,shipping_address,shipping_city,shipping_state,shipping_postal,shipping_country,billing_address,billing_city,billing_state,billing_postal,billing_country,items_summary,item_count,subtotal,total,notes,order_json
```

## 2. Add this Apps Script

Open `Extensions -> Apps Script` and paste:

```javascript
function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Orders');

    if (!sheet) {
      throw new Error('Orders sheet not found');
    }

    var lines = (data.order && data.order.lines ? data.order.lines : []).map(function(line) {
      return line.displayName + ' (' + (line.strengthLabel || '') + ', ' + line.formatType + ') x ' + line.quantity;
    }).join(' | ');

    sheet.appendRow([
      data.id,
      data.createdAt,
      data.status,
      data.paymentMethod,
      data.paymentProofStatus,
      [data.customer.firstName, data.customer.lastName].join(' ').trim(),
      data.customer.email,
      data.customer.phone,
      data.shippingAddress.address1 + (data.shippingAddress.address2 ? ' ' + data.shippingAddress.address2 : ''),
      data.shippingAddress.city,
      data.shippingAddress.state,
      data.shippingAddress.postalCode,
      data.shippingAddress.country,
      data.billingAddress.address1 + (data.billingAddress.address2 ? ' ' + data.billingAddress.address2 : ''),
      data.billingAddress.city,
      data.billingAddress.state,
      data.billingAddress.postalCode,
      data.billingAddress.country,
      lines,
      data.order.totals.itemCount,
      data.order.totals.subtotal,
      data.order.totals.total,
      data.notes || '',
      JSON.stringify(data)
    ]);

    return ContentService
      .createTextOutput(JSON.stringify({ ok: true }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({ ok: false, error: String(error) }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
```

## 3. Deploy the script

- Click `Deploy -> New deployment`
- Type: `Web app`
- Execute as: `Me`
- Who has access: `Anyone`

Copy the deployed web app URL.

## 4. Add the webhook to FlexMed

Set this environment variable:

```text
MANUAL_ORDER_WEBHOOK_URL=https://script.google.com/macros/s/your-script-id/exec
```

## 5. Recommended founder workflow inside the sheet

Add data validation to the `status` column with:

- submitted
- payment_pending
- proof_received
- ready_to_fulfill
- fulfilled

Add data validation to the `payment_proof_status` column with:

- not_received
- received

## 6. Why this is a good interim setup

- founder gets one shared place to review orders
- status updates happen in a familiar spreadsheet
- every order keeps the full JSON payload for traceability
- we can later swap the webhook target from Google Sheets to a real database without changing the checkout shape
