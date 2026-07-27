/**
 * Parses tab-separated (Excel/Google Sheets clipboard) or comma-separated text
 * into a { columns, data } shape matching the app's dataset format.
 * First row is treated as the header.
 */
export function parseDelimitedText(text) {
  const lines = text.replace(/\r\n?/g, '\n').split('\n').filter(l => l.trim() !== '')
  if (!lines.length) return { columns: [], data: [] }

  const delimiter = lines[0].includes('\t') ? '\t' : ','
  const rows = lines.map(line => line.split(delimiter).map(cell => cell.trim()))

  const rawHeader = rows[0]
  const columns = rawHeader.map((name, idx) => name || `Oszlop ${idx + 1}`)

  const data = rows.slice(1).map(cells => {
    const row = {}
    columns.forEach((col, idx) => { row[col] = cells[idx] ?? '' })
    return row
  })

  return { columns, data }
}
