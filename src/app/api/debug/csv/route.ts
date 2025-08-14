import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { csvData } = await request.json();
    
    if (!csvData) {
      return NextResponse.json({ error: 'No CSV data provided' });
    }

    const lines = csvData.split('\n');
    const headerLine = lines[0];
    const dataLines = lines.slice(1).filter((line: string) => line.trim());
    
    // Try different delimiters
    const tabDelimited = headerLine.split('\t');
    const commaDelimited = headerLine.split(',');
    const pipeDelimited = headerLine.split('|');
    
    return NextResponse.json({
      totalLines: lines.length,
      dataLines: dataLines.length,
      headerLine,
      tabColumns: tabDelimited.length,
      commaColumns: commaDelimited.length,
      pipeColumns: pipeDelimited.length,
      sampleDataLines: dataLines.slice(0, 3),
      firstDataLineParsed: {
        tab: dataLines[0]?.split('\t').length,
        comma: dataLines[0]?.split(',').length,
        pipe: dataLines[0]?.split('|').length,
      }
    });

  } catch (error) {
    return NextResponse.json({ 
      error: 'Debug failed', 
      details: error instanceof Error ? error.message : String(error) 
    });
  }
}