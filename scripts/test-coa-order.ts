import assert from 'node:assert/strict'
import {
  getNextCoAPageNumber,
  parseCoAPageNumber,
  sortCoAObjectEntriesNewestFirst,
} from '../lib/catalog-assets'

function entry(name: string, createdAt?: string) {
  return { name, createdAt }
}

assert.equal(parseCoAPageNumber('page-01.pdf'), 1)
assert.equal(parseCoAPageNumber('page-12.png'), 12)
assert.equal(parseCoAPageNumber('coa.pdf'), 0)
assert.equal(getNextCoAPageNumber(['page-01.pdf', 'page-02.pdf']), 3)
assert.equal(getNextCoAPageNumber(['coa.pdf']), 1)
assert.equal(getNextCoAPageNumber([]), 1)

// Debbie's case: separate CoAs over time — newest file first.
assert.deepEqual(
  sortCoAObjectEntriesNewestFirst([
    entry('page-01.pdf', '2026-08-01T10:00:00Z'),
    entry('page-02.pdf', '2026-09-01T10:00:00Z'),
    entry('page-03.pdf', '2026-09-10T14:00:00Z'),
  ]),
  ['page-03.pdf', 'page-02.pdf', 'page-01.pdf'],
)

// A later single-file CoA sits above an earlier multi-page upload, which stays in reading order.
assert.deepEqual(
  sortCoAObjectEntriesNewestFirst([
    entry('page-01.pdf', '2026-08-01T10:00:00.000Z'),
    entry('page-02.pdf', '2026-08-01T10:00:08.000Z'),
    entry('page-03.pdf', '2026-08-01T10:00:16.000Z'),
    entry('page-04.pdf', '2026-09-10T14:00:00.000Z'),
  ]),
  ['page-04.pdf', 'page-01.pdf', 'page-02.pdf', 'page-03.pdf'],
)

// Multi-file upload of one CoA stays 1, 2, 3 even though those files are the newest.
assert.deepEqual(
  sortCoAObjectEntriesNewestFirst([
    entry('page-01.jpg', '2026-07-01T00:00:00Z'),
    entry('page-02.pdf', '2026-09-10T15:00:00.000Z'),
    entry('page-03.pdf', '2026-09-10T15:00:05.000Z'),
  ]),
  ['page-02.pdf', 'page-03.pdf', 'page-01.jpg'],
)

// Without timestamps, higher page numbers are treated as newer.
assert.deepEqual(
  sortCoAObjectEntriesNewestFirst([entry('page-01.pdf'), entry('page-03.pdf'), entry('page-02.pdf')]),
  ['page-03.pdf', 'page-02.pdf', 'page-01.pdf'],
)

// Legacy coa.pdf is the oldest object and sorts last.
assert.deepEqual(
  sortCoAObjectEntriesNewestFirst([
    entry('coa.pdf', '2026-01-01T00:00:00Z'),
    entry('page-01.pdf', '2026-09-10T00:00:00Z'),
  ]),
  ['page-01.pdf', 'coa.pdf'],
)

const newestFirst = sortCoAObjectEntriesNewestFirst([
  entry('page-01.pdf', '2026-08-01T10:00:00Z'),
  entry('page-02.pdf', '2026-09-10T10:00:00Z'),
])
assert.equal(newestFirst[0], 'page-02.pdf')

console.log('coa order: all assertions passed')
