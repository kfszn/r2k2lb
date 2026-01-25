'use server';

export async function fetchGiveawayTotal() {
  try {
    const SHEET_ID = '10EgU6DCEYVorur1snG3YLNqQf0AAAcTQoHcBUr4VDQY';
    const GID = '624457277'; // 4th sheet
    
    // CSV export URL for public Google Sheets - fetched server-side to avoid CORS
    const csvUrl = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=${GID}`;
    
    const response = await fetch(csvUrl, {
      next: { revalidate: 5 } // Cache for 5 seconds
    });
    
    if (!response.ok) {
      console.error('[v0] Google Sheets fetch failed:', response.status);
      return '$0';
    }
    
    const csv = await response.text();
    const rows = csv.split('\n').filter(row => row.trim());
    
    // Parse CSV - C7 means row 7, column C (column index 2)
    if (rows.length > 6) {
      const rowData = rows[6].split(',');
      if (rowData.length > 2) {
        const value = rowData[2].trim().replace(/"/g, '');
        console.log('[v0] Fetched giveaway total from server:', value);
        return value || '$0';
      }
    }
    
    return '$0';
  } catch (error) {
    console.error('[v0] Error fetching giveaway total on server:', error);
    return '$0';
  }
}
