import assert from 'node:assert/strict'
import {
  isIndexableShopHost,
  normalizeHost,
  shopRobotsDirective,
} from '../lib/site-indexing'

assert.equal(normalizeHost('FlexMedPeptides.com:443'), 'flexmedpeptides.com')
assert.equal(normalizeHost('www.flexmedpeptides.com, flexmed-v2.vercel.app'), 'www.flexmedpeptides.com')

assert.equal(isIndexableShopHost('flexmedpeptides.com'), true)
assert.equal(isIndexableShopHost('www.flexmedpeptides.com'), true)
assert.equal(isIndexableShopHost('flexmed-v2.vercel.app'), false)
assert.equal(isIndexableShopHost('flexmed-v2-git-main-ge11ys-projects.vercel.app'), false)
assert.equal(isIndexableShopHost('flexmed-snowy.vercel.app'), false)
assert.equal(isIndexableShopHost('localhost:3000'), false)
assert.equal(isIndexableShopHost(null), false)

assert.deepEqual(shopRobotsDirective('flexmedpeptides.com'), { index: true, follow: true })
assert.deepEqual(shopRobotsDirective('www.flexmedpeptides.com'), { index: true, follow: true })
assert.deepEqual(shopRobotsDirective('flexmed-v2.vercel.app'), { index: false, follow: false })
assert.deepEqual(shopRobotsDirective('flexmed-snowy.vercel.app'), { index: false, follow: false })

console.log('site-indexing host split ok')
