'use server';

export async function fetchGiveawayTotal() {
  try {
    const SHEET_ID = '10EgU6DCEYVorur1snG3YLNqQf0AAAcTQoHcBUr4VDQY';
    const GID = '624457277'; // 4th sheet
    
    // CSV export URL for public Google Sheets
    const csvUrl = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=${GID}`;
    
    console.log('[v0] Fetching giveaway total from CSV export');
    
    const response = await fetch(csvUrl, {
      next: { revalidate: 5 }, // Cache for 5 seconds
      headers: {
        'Accept': 'text/csv',
      }
    });
    
    if (!response.ok) {
      console.error('[v0] CSV export fetch failed with status:', response.status);
      return '$0';
    }
    
    const csv = await response.text();
    console.log('[v0] CSV fetched successfully');
    
    // Split by newlines and filter empty rows
    const rows = csv.split('\n').map(row => row.trim()).filter(row => row.length > 0);
    
    console.log('[v0] Total rows:', rows.length);
    
    // Row 7 = index 6 (0-indexed), Column C = index 2
    if (rows.length > 6) {
      // Handle CSV with proper quote parsing
      const row = rows[6];
      const cells = parseCSVRow(row);
      
      console.log('[v0] Row 7 cells:', cells);
      
      if (cells.length > 2) {
        const value = cells[2];
        console.log('[v0] Cell C7 value:', value);
        return value && value.trim() ? value.trim() : '$0';
      }
    }
    
    console.log('[v0] Could not find value at C7, returning $0');
    return '$0';
  } catch (error) {
    console.error('[v0] Error fetching giveaway total:', error);
    return '$0';
  }
}

// Helper function to parse CSV row properly
function parseCSVRow(row: string): string[] {
  const result: string[] = [];
  let current = '';
  let insideQuotes = false;
  
  for (let i = 0; i < row.length; i++) {
    const char = row[i];
    
    if (char === '"') {
      if (insideQuotes && row[i + 1] === '"') {
        // Escaped quote
        current += '"';
        i++;
      } else {
        // Toggle quote state
        insideQuotes = !insideQuotes;
      }
    } else if (char === ',' && !insideQuotes) {
      // End of cell
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  
  // Add last cell
  result.push(current);
  
  return result;
}
