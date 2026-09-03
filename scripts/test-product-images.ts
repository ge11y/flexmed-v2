import assert from 'node:assert/strict'
import {
  PLACEHOLDER_PRODUCT_IMAGE,
  PRODUCTS,
  getProductAssetOwnerSlug,
  getProductImageSrc,
  isOwnProductAsset,
} from '../lib/data-products'

// Asset ownership is read off the path.
assert.equal(getProductAssetOwnerSlug('/api/catalog-assets/image/tirz-10mg?v=2026'), 'tirz-10mg')
assert.equal(getProductAssetOwnerSlug('/products/tirz-30mg/front.png'), 'tirz-30mg')
assert.equal(getProductAssetOwnerSlug(PLACEHOLDER_PRODUCT_IMAGE), null)
assert.equal(isOwnProductAsset('/api/catalog-assets/image/tirz-10mg', 'tirz-30mg'), false)
assert.equal(isOwnProductAsset('/api/catalog-assets/image/tirz-30mg', 'tirz-30mg'), true)
assert.equal(isOwnProductAsset(PLACEHOLDER_PRODUCT_IMAGE, 'tirz-30mg'), true)

const tirz30 = PRODUCTS['tirz-30mg']
assert.ok(tirz30, 'tirz-30mg exists in the static catalog')

// A sibling's uploaded photo never leaks through the resolver: the variant's own render wins.
assert.equal(getProductImageSrc({ ...tirz30, image: '/api/catalog-assets/image/tirz-10mg' }), '/products/tirz-30mg/front.png')
// The variant's own upload wins over its render.
assert.equal(getProductImageSrc({ ...tirz30, image: '/api/catalog-assets/image/tirz-30mg?v=2' }), '/api/catalog-assets/image/tirz-30mg?v=2')

// A static map entry that points at a sibling render is ignored; the product falls to the placeholder.
const tirz20 = PRODUCTS['tirz-20mg']
if (tirz20) {
  assert.equal(getProductImageSrc({ ...tirz20, image: '/products/tirz-10mg/front.png' }), PLACEHOLDER_PRODUCT_IMAGE)
}

// Every static product resolves to its own asset or the shared placeholder.
for (const product of Object.values(PRODUCTS)) {
  const src = getProductImageSrc(product)
  assert.ok(isOwnProductAsset(src, product.slug), `${product.slug} resolves to ${src}`)
}

console.log(`product image guard: all assertions passed (${Object.keys(PRODUCTS).length} static products checked)`)
