import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import type { Product } from '@/lib/types'

function parseCSV(csv: string): Product[] {
  const lines = csv.trim().split('\n')
  if (lines.length < 2) return []

  const headers = lines[0].split(',').map((h) => h.trim())
  const results: Product[] = []

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue

    // Handle quoted CSV fields
    const values: string[] = []
    let current = ''
    let inQuotes = false
    for (const char of line) {
      if (char === '"') { inQuotes = !inQuotes }
      else if (char === ',' && !inQuotes) { values.push(current.trim()); current = '' }
      else { current += char }
    }
    values.push(current.trim())

    if (values.length < headers.length) continue

    const row = Object.fromEntries(headers.map((h, idx) => [h, values[idx] ?? '']))
    results.push({
      id: String(row.id),
      name: row.name,
      description: row.description,
      price: parseInt(row.price) || 0,
      image: row.image,
      stock: parseInt(row.stock) || 0,
      category: row.category ?? 'Streaming',
    })
  }

  return results
}

export async function GET() {
  try {
    const csvPath = path.join(process.cwd(), 'data', 'products.csv')
    const csv = fs.readFileSync(csvPath, 'utf-8')
    const products = parseCSV(csv)
    return NextResponse.json({ products })
  } catch {
    return NextResponse.json({ products: [] }, { status: 500 })
  }
}
