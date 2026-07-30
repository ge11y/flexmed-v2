import { inflateSync } from 'node:zlib'

export interface ShippingLabelExtraction {
  carrier?: string
  trackingNumber?: string
  packageDetails?: string
  recipientName?: string
  recipientAddress?: {
    address1?: string
    address2?: string
    city?: string
    state?: string
    postalCode?: string
    country?: string
    raw?: string
    source?: 'label' | 'order'
  }
  confidence: 'low' | 'medium' | 'high'
  rawTextPreview?: string
  extractedAt: string
}

function normalizeText(text: string) {
  return text.replace(/\0/g, ' ').replace(/\s+/g, ' ').trim()
}

function cleanTextPart(value: string) {
  return value.replace(/\s+/g, ' ').replace(/^[,:\-\s]+|[,:\-\s]+$/g, '').trim()
}

function toTitleCase(value: string) {
  return cleanTextPart(value)
    .toLowerCase()
    .replace(/\b[a-z]/g, (character) => character.toUpperCase())
}

function isReadableTextChunk(value: string) {
  const normalized = normalizeText(value)
  if (normalized.length < 2) return false

  const chars = [...normalized]
  const printableCount = chars.filter((character) => {
    const code = character.charCodeAt(0)
    return code === 9 || code === 10 || code === 13 || (code >= 32 && code <= 126)
  }).length
  const alphaNumericCount = chars.filter((character) => /[A-Za-z0-9]/.test(character)).length

  return printableCount / chars.length >= 0.85 && alphaNumericCount >= 2
}

function decodeUtf8(bytes: Uint8Array) {
  return new TextDecoder('utf-8', { fatal: false }).decode(bytes)
}

function decodeLatin1(bytes: Uint8Array) {
  return new TextDecoder('latin1').decode(bytes)
}

function bytesFromBinaryString(value: string) {
  const bytes = new Uint8Array(value.length)
  for (let index = 0; index < value.length; index += 1) {
    bytes[index] = value.charCodeAt(index) & 0xff
  }
  return bytes
}

function decodePdfLiteralString(value: string) {
  let output = ''
  let escaping = false

  for (let index = 0; index < value.length; index += 1) {
    const character = value[index]

    if (escaping) {
      if (character === 'n') output += '\n'
      else if (character === 'r') output += '\r'
      else if (character === 't') output += '\t'
      else if (character === 'b') output += '\b'
      else if (character === 'f') output += '\f'
      else if (/[0-7]/.test(character)) {
        const octal = value.slice(index, index + 3).match(/^[0-7]{1,3}/)?.[0] ?? character
        output += String.fromCharCode(Number.parseInt(octal, 8))
        index += octal.length - 1
      } else {
        output += character
      }
      escaping = false
      continue
    }

    if (character === '\\') {
      escaping = true
      continue
    }

    output += character
  }

  return output
}

function collectPdfLiteralStrings(text: string) {
  const strings: string[] = []

  for (let index = 0; index < text.length; index += 1) {
    if (text[index] !== '(') continue

    let depth = 1
    let cursor = index + 1
    let escaped = false
    let value = ''

    while (cursor < text.length && depth > 0) {
      const character = text[cursor]

      if (escaped) {
        value += `\\${character}`
        escaped = false
        cursor += 1
        continue
      }

      if (character === '\\') {
        escaped = true
        cursor += 1
        continue
      }

      if (character === '(') {
        depth += 1
        value += character
        cursor += 1
        continue
      }

      if (character === ')') {
        depth -= 1
        if (depth > 0) value += character
        cursor += 1
        continue
      }

      value += character
      cursor += 1
    }

    const decoded = decodePdfLiteralString(value)
    if (isReadableTextChunk(decoded)) strings.push(decoded)
    index = cursor
  }

  return strings
}

function decodePdfHexString(hex: string) {
  const normalized = hex.replace(/\s+/g, '')
  if (normalized.length < 4 || normalized.length % 2 !== 0) return ''

  const bytes = normalized.match(/.{2}/g)?.map((pair) => Number.parseInt(pair, 16)) ?? []
  if (bytes.some((byte) => !Number.isFinite(byte))) return ''

  const hasUtf16Pattern = bytes.length >= 4 && (bytes[0] === 0xfe || bytes[0] === 0x00 || bytes.some((byte, index) => index % 2 === 0 && byte === 0x00))
  if (hasUtf16Pattern) {
    let start = bytes[0] === 0xfe && bytes[1] === 0xff ? 2 : 0
    let output = ''
    for (; start + 1 < bytes.length; start += 2) {
      output += String.fromCharCode((bytes[start] << 8) + bytes[start + 1])
    }
    return output
  }

  return String.fromCharCode(...bytes)
}

function collectPdfHexStrings(text: string) {
  return [...text.matchAll(/<([0-9a-fA-F\s]{8,})>/g)]
    .map((match) => decodePdfHexString(match[1]))
    .filter(isReadableTextChunk)
}

function collectAsciiRuns(text: string) {
  return [...text.matchAll(/[A-Za-z0-9][A-Za-z0-9 .,:;#/\-]{3,}/g)]
    .map((match) => match[0])
    .filter(isReadableTextChunk)
}

function getInflatedPdfStreams(text: string) {
  const streams: string[] = []

  for (const match of text.matchAll(/stream\r?\n?([\s\S]*?)\r?\n?endstream/g)) {
    const dictionaryStart = Math.max(0, match.index - 600)
    const dictionary = text.slice(dictionaryStart, match.index)
    if (!dictionary.includes('FlateDecode')) continue

    try {
      const inflated = inflateSync(bytesFromBinaryString(match[1]))
      streams.push(decodeLatin1(inflated))
      streams.push(decodeUtf8(inflated))
    } catch {
      // Some PDF streams are image data or use unsupported filters. Ignore those and keep scanning.
    }
  }

  return streams
}

function looksLikePdf(mimeType: string, bytes: Uint8Array) {
  return mimeType.toLowerCase().includes('pdf') || decodeLatin1(bytes.slice(0, 5)) === '%PDF-'
}

function extractPdfText(fileBytes: Uint8Array) {
  const rawPdf = decodeLatin1(fileBytes)
  const sourceTexts = [rawPdf, ...getInflatedPdfStreams(rawPdf)]
  const chunks: string[] = []

  for (const sourceText of sourceTexts) {
    chunks.push(...collectPdfLiteralStrings(sourceText))
    chunks.push(...collectPdfHexStrings(sourceText))
    chunks.push(...collectAsciiRuns(sourceText))
  }

  return chunks.join('\n')
}

function extractCarrier(text: string) {
  const upper = text.toUpperCase()
  if (upper.includes('UPS')) return 'UPS'
  if (upper.includes('FEDEX') || upper.includes('FED EX')) return 'FedEx'
  if (upper.includes('USPS') || upper.includes('UNITED STATES POSTAL SERVICE')) return 'USPS'
  if (upper.includes('DHL')) return 'DHL'
  return undefined
}

function findTrackingCandidates(text: string) {
  const candidates = new Set<string>()
  const upper = text.toUpperCase()

  for (const match of upper.matchAll(/\b1Z[0-9A-Z]{16}\b/g)) candidates.add(match[0])
  for (const match of upper.matchAll(/\b\d{12,22}\b/g)) candidates.add(match[0])
  for (const match of upper.matchAll(/\b[A-Z]{2}\d{9}[A-Z]{2}\b/g)) candidates.add(match[0])

  for (const match of upper.matchAll(/\b1Z(?:[\s-]*[0-9A-Z]){16}\b/g)) {
    candidates.add(match[0].replace(/[\s-]/g, ''))
  }

  for (const match of upper.matchAll(/\b(?:\d[\s-]*){12,30}\b/g)) {
    const compact = match[0].replace(/\D/g, '')
    if (compact.length >= 12 && compact.length <= 22) candidates.add(compact)
  }

  for (const match of upper.matchAll(/\b[A-Z]{2}(?:[\s-]*\d){9}[\s-]*[A-Z]{2}\b/g)) {
    candidates.add(match[0].replace(/[\s-]/g, ''))
  }

  return [...candidates]
}

function pickTrackingNumber(candidates: string[], carrier?: string) {
  if (candidates.length === 0) return undefined
  if (carrier === 'UPS') return candidates.find((candidate) => candidate.startsWith('1Z')) ?? candidates[0]
  if (carrier === 'FedEx') return candidates.find((candidate) => /^\d{12,22}$/.test(candidate)) ?? candidates[0]
  if (carrier === 'USPS') return candidates.find((candidate) => /^\d{20,22}$/.test(candidate) || /^[A-Z]{2}\d{9}[A-Z]{2}$/.test(candidate)) ?? candidates[0]
  return candidates[0]
}

function inferCarrierFromTrackingNumber(trackingNumber?: string) {
  if (!trackingNumber) return undefined
  if (/^1Z[0-9A-Z]{16}$/i.test(trackingNumber)) return 'UPS'
  if (/^[A-Z]{2}\d{9}[A-Z]{2}$/i.test(trackingNumber)) return 'USPS'
  if (/^\d{20,22}$/.test(trackingNumber)) return 'USPS'
  if (/^\d{12,19}$/.test(trackingNumber)) return 'FedEx'
  return undefined
}

function extractPackageDetails(text: string) {
  const upper = text.toUpperCase()
  if (upper.includes('PADDED ENVELOPE')) return 'Padded envelope'
  if (upper.includes('BUBBLE MAILER')) return 'Bubble mailer'
  if (upper.includes('SMALL BOX')) return 'Small box'
  if (upper.includes('MEDIUM BOX')) return 'Medium box'
  if (upper.includes('LARGE BOX')) return 'Large box'
  return undefined
}

function extractRecipientNameFromFileName(fileName: string) {
  const baseName = fileName.replace(/\.[^.]+$/, '')
  const parts = baseName
    .split(/---|--|__+/)
    .map((part) => cleanTextPart(part.replace(/[_-]+/g, ' ')))
    .filter(Boolean)

  for (const part of parts) {
    if (/^\d{4}\s+\d{2}\s+\d{2}$/.test(part)) continue
    if (/^\d{4}-\d{2}-\d{2}$/.test(part)) continue
    if (findTrackingCandidates(part).length > 0) continue
    if (!/[A-Za-z]/.test(part)) continue
    return toTitleCase(part)
  }

  return undefined
}

function extractRecipientAddress(text: string): ShippingLabelExtraction['recipientAddress'] {
  const normalized = normalizeText(text)
  const addressPattern =
    /\b(\d{1,6}\s+[A-Za-z0-9 .#'/-]{2,90}?(?:STREET|ST|AVENUE|AVE|ROAD|RD|DRIVE|DR|LANE|LN|BOULEVARD|BLVD|WAY|COURT|CT|PLACE|PL|PARKWAY|PKWY|HIGHWAY|HWY|CIRCLE|CIR|TERRACE|TER|TRAIL|TRL|LOOP)[A-Za-z0-9 .#'/-]{0,70})\s+([A-Za-z .'-]{2,50}),?\s+([A-Z]{2})\s+(\d{5}(?:-\d{4})?)\b/i
  const match = normalized.match(addressPattern)
  if (!match) return undefined

  const address1 = cleanTextPart(match[1])
  const city = toTitleCase(match[2])
  const state = match[3].toUpperCase()
  const postalCode = match[4]
  const raw = `${address1}\n${city}, ${state} ${postalCode}`
  const country = /\b(UNITED STATES|USA|U\.S\.A\.|US)\b/i.test(normalized) ? 'United States' : undefined

  return {
    address1,
    city,
    state,
    postalCode,
    country,
    raw,
    source: 'label',
  }
}

function extractRecipientName(text: string, fileName: string, recipientAddress?: ShippingLabelExtraction['recipientAddress']) {
  const fromFileName = extractRecipientNameFromFileName(fileName)
  if (fromFileName) return fromFileName

  if (!recipientAddress?.address1) return undefined
  const lines = text
    .split(/\r?\n/)
    .map(cleanTextPart)
    .filter(Boolean)
  const addressIndex = lines.findIndex((line) => normalizeText(line).toLowerCase().includes(recipientAddress.address1?.toLowerCase() ?? ''))
  if (addressIndex <= 0) return undefined

  for (let index = addressIndex - 1; index >= Math.max(0, addressIndex - 3); index -= 1) {
    const line = lines[index]
    if (!/[A-Za-z]/.test(line)) continue
    if (/\d/.test(line)) continue
    if (/^(ship|to|from|sender|recipient|tracking|ups|fedex|usps|dhl)$/i.test(line)) continue
    return toTitleCase(line)
  }

  return undefined
}

export function extractShippingLabelDetails(params: {
  fileName: string
  mimeType: string
  fileBytes: Uint8Array
}) {
  const isPdf = looksLikePdf(params.mimeType, params.fileBytes)
  const pdfText = isPdf ? extractPdfText(params.fileBytes) : ''
  const hasUsefulPdfPreview = /\b(UPS|FEDEX|FED EX|USPS|DHL|TRACK|TRACKING|1Z[0-9A-Z]{4,})\b/i.test(pdfText)
  const decodedText = normalizeText(
    isPdf
      ? `${params.fileName} ${pdfText}`
      : `${params.fileName} ${decodeUtf8(params.fileBytes)} ${decodeLatin1(params.fileBytes)}`,
  )
  const previewText = normalizeText(isPdf ? `${params.fileName} ${hasUsefulPdfPreview ? pdfText : ''}` : decodedText)
  const detectedCarrier = extractCarrier(decodedText)
  const trackingNumber = pickTrackingNumber(findTrackingCandidates(decodedText), detectedCarrier)
  const carrier = detectedCarrier ?? inferCarrierFromTrackingNumber(trackingNumber)
  const packageDetails = extractPackageDetails(decodedText)
  const recipientAddress = extractRecipientAddress(decodedText)
  const recipientName = extractRecipientName(decodedText, params.fileName, recipientAddress)

  const confidence: ShippingLabelExtraction['confidence'] =
    carrier && trackingNumber ? 'high' : carrier || trackingNumber ? 'medium' : 'low'

  return {
    carrier,
    trackingNumber,
    packageDetails,
    recipientName,
    recipientAddress,
    confidence,
    rawTextPreview: previewText.slice(0, 260) || undefined,
    extractedAt: new Date().toISOString(),
  } satisfies ShippingLabelExtraction
}
