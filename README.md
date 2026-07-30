This is a [Next.js](https://nextjs.org) storefront for FlexMed.

## Manual order sheet integration

The current manual-order workflow can forward submitted orders to a shared Google Sheet through a webhook.

- Environment variable: `MANUAL_ORDER_WEBHOOK_URL`
- Setup guide: [/Users/goobbotv3/flexmed-v2/docs/google-sheets-manual-orders.md](/Users/goobbotv3/flexmed-v2/docs/google-sheets-manual-orders.md)

## Catalog dashboard sync

The admin inventory dashboard can also sync the product list to a shared Google Sheet.

- Environment variable: `CATALOG_SYNC_WEBHOOK_URL`
- Environment variable: `CATALOG_SOURCE_URL`
- Setup guide: [/Users/goobbotv3/flexmed-v2/docs/google-sheets-catalog-sync.md](/Users/goobbotv3/flexmed-v2/docs/google-sheets-catalog-sync.md)

## Supabase admin architecture

The intended long-term admin system is Supabase-backed so founder and employees can manage:

- catalog prices
- inventory and low-stock status
- promos
- manual orders
- payment proof review

Docs:

- Architecture: [/Users/goobbotv3/flexmed-v2/docs/supabase-admin-architecture.md](/Users/goobbotv3/flexmed-v2/docs/supabase-admin-architecture.md)
- Starter schema: [/Users/goobbotv3/flexmed-v2/docs/supabase-schema.sql](/Users/goobbotv3/flexmed-v2/docs/supabase-schema.sql)

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
