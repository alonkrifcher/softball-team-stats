#!/usr/bin/env python3
"""Extract canonical CSVs from the UHJ stats workbook into ./data/."""
import csv
import os
import sys
from datetime import datetime

try:
    import openpyxl
except ImportError:
    sys.stderr.write("openpyxl not installed. Run: pip install openpyxl\n")
    sys.exit(1)

XLSX = os.environ.get(
    "UHJ_XLSX",
    "/Users/alon/Downloads/UHJ Spring_Summer Softball Reference (Team Stats).xlsx",
)
OUT_DIR = "data"


def cell(c):
    if c is None:
        return ""
    if isinstance(c, datetime):
        return c.strftime("%Y-%m-%d")
    return str(c)


def write_sheet(ws, out_path, drop_empty_first_col=True, name_col=None):
    with open(out_path, "w", newline="") as f:
        w = csv.writer(f)
        for i, row in enumerate(ws.iter_rows(values_only=True)):
            if i == 0:
                w.writerow([cell(c) for c in row])
                continue
            if drop_empty_first_col and (not row or row[0] is None):
                continue
            if name_col is not None and (len(row) <= name_col or not row[name_col]):
                continue
            w.writerow([cell(c) for c in row])


def main():
    os.makedirs(OUT_DIR, exist_ok=True)
    wb = openpyxl.load_workbook(XLSX, data_only=True)

    write_sheet(wb["Player List"], os.path.join(OUT_DIR, "player_list.csv"))
    write_sheet(wb["Game DATA"], os.path.join(OUT_DIR, "game_data.csv"))
    write_sheet(wb["Player Data"], os.path.join(OUT_DIR, "player_data.csv"), name_col=7)

    print("Wrote: data/player_list.csv, data/game_data.csv, data/player_data.csv")


if __name__ == "__main__":
    main()
