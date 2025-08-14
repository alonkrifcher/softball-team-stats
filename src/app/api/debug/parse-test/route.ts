import { NextRequest, NextResponse } from 'next/server';

interface PlayerGameRow {
  Year: number;
  Game: number;
  Date: string;
  Opponent: string;
  Result: string;
  'UHJ Runs': number | null;
  'Opp Runs': number | null;
  Name: string;
  Gender: string;
  Avg: number;
  AB: number;
  R: number;
  H: number;
  '1B': number;
  '2B': number;
  '3B': number;
  HR: number;
  XBH: number;
  TB: number;
  RBI: number;
  Sac: number;
  BB: number;
  K: number;
  SLG: number;
  OBP: number;
  OPS: number;
  EqA: number;
  On_base_num: number;
  On_base_denom: number;
}

function parseCSVRow(line: string): PlayerGameRow | null {
  // Split by comma (your format is comma-delimited)
  const values = line.split(',');
  
  console.log(`Parsing line with ${values.length} values:`, values);
  
  // Your CSV has 29 columns based on the sample
  if (values.length < 29) {
    console.log(`Skipping line - only ${values.length} values (need 29)`);
    return null;
  }
  
  // Helper function to handle empty values
  const parseIntOrNull = (value: string) => {
    const trimmed = (value || '').trim();
    if (!trimmed) return null;
    const parsed = parseInt(trimmed);
    return isNaN(parsed) ? null : parsed;
  };
  
  const parseIntOrZero = (value: string) => {
    const trimmed = (value || '').trim();
    if (!trimmed) return 0;
    const parsed = parseInt(trimmed);
    return isNaN(parsed) ? 0 : parsed;
  };
  
  const parseFloatOrZero = (value: string) => {
    const trimmed = (value || '').trim();
    if (!trimmed) return 0;
    const parsed = parseFloat(trimmed);
    return isNaN(parsed) ? 0 : parsed;
  };
  
  try {
    const result = {
      Year: parseIntOrZero(values[0]),
      Game: parseIntOrZero(values[1]),
      Date: (values[2] || '').trim(),
      Opponent: (values[3] || 'Unknown').trim(),
      Result: (values[4] || '').trim(),
      'UHJ Runs': parseIntOrNull(values[5]),
      'Opp Runs': parseIntOrNull(values[6]),
      Name: (values[7] || '').trim(),
      Gender: (values[8] || '').trim(),
      Avg: parseFloatOrZero(values[9]),
      AB: parseIntOrZero(values[10]),
      R: parseIntOrZero(values[11]),
      H: parseIntOrZero(values[12]),
      '1B': parseIntOrZero(values[13]),
      '2B': parseIntOrZero(values[14]),
      '3B': parseIntOrZero(values[15]),
      HR: parseIntOrZero(values[16]),
      XBH: parseIntOrZero(values[17]),
      TB: parseIntOrZero(values[18]),
      RBI: parseIntOrZero(values[19]),
      Sac: parseIntOrZero(values[20]),
      BB: parseIntOrZero(values[21]),
      K: parseIntOrZero(values[22]),
      SLG: parseFloatOrZero(values[23]),
      OBP: parseFloatOrZero(values[24]),
      OPS: parseFloatOrZero(values[25]),
      EqA: parseFloatOrZero(values[26]),
      On_base_num: parseIntOrZero(values[27]),
      On_base_denom: parseIntOrZero(values[28]),
    };
    
    console.log('Parsed result:', { 
      name: result.Name, 
      year: result.Year, 
      game: result.Game,
      ab: result.AB,
      h: result.H 
    });
    
    return result;
  } catch (error) {
    console.error('Error parsing row:', line, error);
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const ethanRow = "2025,2,4/29/2025,Debevoise & Plimpton,W,11,10,Ethan Fedida,M,.750,4,2,3,1,1,,1,2,7,2,,,,1.750,.750,2.500,10.000,3,4";
    
    console.log('Testing Ethan row:', ethanRow);
    console.log('Row length:', ethanRow.length);
    console.log('Split values:', ethanRow.split(','));
    console.log('Split count:', ethanRow.split(',').length);
    
    const parsed = parseCSVRow(ethanRow);
    
    return NextResponse.json({
      originalRow: ethanRow,
      splitValues: ethanRow.split(','),
      valueCount: ethanRow.split(',').length,
      parsedResult: parsed,
      shouldPass: parsed !== null
    });

  } catch (error) {
    console.error('Parse test error:', error);
    return NextResponse.json(
      { error: 'Parse test failed', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}