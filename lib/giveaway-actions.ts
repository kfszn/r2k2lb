'use server';

export async function fetchGiveawayTotal() {
  try {
    const SHEET_ID = '10EgU6DCEYVorur1snG3YLNqQf0AAAcTQoHcBUr4VDQY';
    const GID = '624457277'; // 4th sheet
    const CELL = 'C7';
    
    // Use the JSON API which is more reliable for public sheets
    const jsonUrl = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}/values/${CELL}?key=AIzaSyAvHJrF7q5oFvevGQRpQR_OQx8K7HqnWP0`;
    
    console.log('[v0] Fetching from:', jsonUrl);
    
    const response = await fetch(jsonUrl, {
      next: { revalidate: 5 } // Cache for 5 seconds
    });
    
    if (!response.ok) {
      console.error('[v0] Google Sheets API fetch failed:', response.status);
      // Fallback to CSV method
      return await fetchViaCsv(SHEET_ID, GID);
    }
    
    const data = await response.json();
    const value = data.values?.[0]?.[0] || '$0';
    console.log('[v0] Fetched giveaway total from server:', value);
    return String(value);
  } catch (error) {
    console.error('[v0] Error fetching giveaway total on server:', error);
    return '$0';
  }
}

async function fetchViaCsv(sheetId: string, gid: string) {
  try {
    // Fallback: CSV export URL for public Google Sheets
    const csvUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=${gid}`;
    
    const response = await fetch(csvUrl);
    
    if (!response.ok) {
      console.error('[v0] CSV export fetch failed:', response.status);
      return '$0';
    }
    
    const csv = await response.text();
    console.log('[v0] CSV fetched, first 200 chars:', csv.substring(0, 200));
    
    const rows = csv.split('\n').filter(row => row.trim());
    
    // Parse CSV - C7 means row 7, column C (column index 2)
    if (rows.length > 6) {
      const rowData = rows[6].split(',');
      console.log('[v0] Row 7 data:', rowData);
      
      if (rowData.length > 2) {
        const value = rowData[2].trim().replace(/"/g, '');
        console.log('[v0] Extracted value from CSV:', value);
        return value || '$0';
      }
    }
    
    return '$0';
  } catch (error) {
    console.error('[v0] Error in CSV fallback:', error);
    return '$0';
  }
}
