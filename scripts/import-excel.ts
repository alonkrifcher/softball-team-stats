#!/usr/bin/env tsx

import * as XLSX from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';

const EXCEL_FILE = '2025 STATS Underhand Jobs Spring_Summer.xlsx';

async function analyzeExcelFile() {
  try {
    console.log('📊 Analyzing Excel file:', EXCEL_FILE);
    
    // Read the Excel file
    const filePath = path.join(process.cwd(), EXCEL_FILE);
    if (!fs.existsSync(filePath)) {
      console.error('❌ Excel file not found:', filePath);
      process.exit(1);
    }

    const workbook = XLSX.readFile(filePath);
    console.log('📋 Sheet names found:', workbook.SheetNames);

    // Examine each sheet
    for (const sheetName of workbook.SheetNames) {
      console.log(`\n🔍 Examining sheet: "${sheetName}"`);
      const sheet = workbook.Sheets[sheetName];
      
      // Convert to JSON to see the data structure
      const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });
      
      if (data.length > 0) {
        console.log('📊 Row count:', data.length);
        console.log('📝 Headers (first row):', data[0]);
        
        if (data.length > 1) {
          console.log('📄 Sample data (second row):', data[1]);
        }
        
        // Also show as object format
        const objectData = XLSX.utils.sheet_to_json(sheet);
        if (objectData.length > 0) {
          console.log('🔑 Available columns:', Object.keys(objectData[0]));
          console.log('📋 Sample record:', objectData[0]);
        }
      } else {
        console.log('⚠️ Sheet is empty');
      }
    }

  } catch (error) {
    console.error('❌ Error analyzing Excel file:', error);
  }
}

// Run the analysis
analyzeExcelFile();