import ExcelJS from "exceljs";
import type { DraftDay } from "@/lib/constants";
import { t, type Lang } from "@/lib/i18n";
import { kgToDisplay, type WeightUnit } from "@/lib/units";

type ExerciseLib = {
  id: string;
  nameEn: string;
  nameEs: string;
  muscle: string;
  videoUrl?: string | null;
};

const ORANGE = "FFFF9900";
const GOLD = "FFF1C232";
const GREEN = "FF00FF00";
const YELLOW = "FFFFFF00";
const WEEKS = [1, 2, 3, 4];
const COLS_PER_WEEK = 3; // P, R, S
const FIRST_WEEK_COL = 4; // column D

function weekCol(week: number, offset: 0 | 1 | 2) {
  return FIRST_WEEK_COL + (week - 1) * COLS_PER_WEEK + offset;
}

async function triggerBrowserDownload(workbook: ExcelJS.Workbook, filename: string) {
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

export async function exportPlanToXlsx(
  client: { name: string; week: number; goal: string; target: string },
  currentDays: DraftDay[],
  libById: Record<string, ExerciseLib>,
  lang: Lang,
  allWeeks: Record<number, DraftDay[]>,
  unit: WeightUnit
) {
  const weeksData: Record<number, DraftDay[]> = { ...allWeeks, [client.week]: currentDays };
  const lastCol = weekCol(WEEKS[WEEKS.length - 1], 2) + 2; // last week's S column, + warm-up ES/EN
  const notesCol = lastCol + 1;

  const workbook = new ExcelJS.Workbook();
  const ws = workbook.addWorksheet(t(lang, "export.week"));

  ws.columns = [
    { width: 5 }, // A day
    { width: 34 }, // B exercise ES
    { width: 30 }, // C exercise EN
    ...WEEKS.flatMap(() => [{ width: 7 }, { width: 7 }, { width: 7 }]),
    { width: 26 }, // warm-up ES
    { width: 26 }, // warm-up EN
    { width: 30 }, // notes
  ];

  function mergeRow(row: number, fromCol: number, toCol: number, value: string) {
    ws.mergeCells(row, fromCol, row, toCol);
    const cell = ws.getCell(row, fromCol);
    cell.value = value;
    cell.font = { bold: true };
  }

  mergeRow(1, 1, 5, `${t(lang, "export.name")}: ${client.name}`);
  mergeRow(1, 6, lastCol, `${t(lang, "export.trainer")}: ${t(lang, "export.trainerName")}`);
  mergeRow(2, 1, lastCol, `${t(lang, "export.objective")}: ${t(lang, `goal.${client.goal}`)}`);
  mergeRow(3, 1, lastCol, `${t(lang, "export.observations")}: ${client.target}`);

  WEEKS.forEach((week) => {
    const from = weekCol(week, 0);
    const to = weekCol(week, 2);
    ws.mergeCells(4, from, 4, to);
    const cell = ws.getCell(4, from);
    cell.value = `${t(lang, "export.week")} ${week}`;
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: YELLOW } };
    cell.alignment = { horizontal: "center" };
  });

  const headerRow = 5;
  function headerCell(col: number, value: string) {
    const cell = ws.getCell(headerRow, col);
    cell.value = value;
    cell.font = { bold: true };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: GREEN } };
    cell.alignment = { horizontal: "center" };
  }
  headerCell(1, "D");
  headerCell(2, "EJERCICIOS");
  headerCell(3, "EXERCISE");
  WEEKS.forEach((week) => {
    headerCell(weekCol(week, 0), `P (${unit.toUpperCase()})`);
    headerCell(weekCol(week, 1), "R");
    headerCell(weekCol(week, 2), "S");
  });
  ws.mergeCells(headerRow, lastCol - 1, headerRow, lastCol);
  headerCell(lastCol - 1, t(lang, "export.warmup"));
  headerCell(notesCol, t(lang, "builder.colNotes"));

  let row = 6;
  currentDays.forEach((day, dayIdx) => {
    const startRow = row;

    day.rows.forEach((currentRow) => {
      const ex = libById[currentRow.exerciseId];
      const dayCell = ws.getCell(row, 1);
      dayCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: ORANGE } };
      dayCell.font = { bold: true };
      dayCell.alignment = { horizontal: "right" };

      const nameEsCell = ws.getCell(row, 2);
      nameEsCell.value = ex?.nameEs ?? currentRow.exerciseId;
      nameEsCell.font = { bold: true };
      nameEsCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: ORANGE } };
      nameEsCell.alignment = { horizontal: "center" };

      const nameEnCell = ws.getCell(row, 3);
      nameEnCell.value = ex?.nameEn ?? "";
      nameEnCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: GOLD } };
      nameEnCell.alignment = { horizontal: "center" };

      if (ex?.videoUrl) {
        nameEsCell.value = { text: String(nameEsCell.value), hyperlink: ex.videoUrl, tooltip: "Watch demo" };
        nameEnCell.value = { text: String(nameEnCell.value), hyperlink: ex.videoUrl, tooltip: "Watch demo" };
      }

      WEEKS.forEach((week) => {
        const weekDay = weeksData[week]?.[dayIdx];
        const weekRow = weekDay?.rows.find((r) => r.exerciseId === currentRow.exerciseId);
        const pCell = ws.getCell(row, weekCol(week, 0));
        const rCell = ws.getCell(row, weekCol(week, 1));
        const sCell = ws.getCell(row, weekCol(week, 2));
        if (weekRow) {
          pCell.value = weekRow.weight == null ? t(lang, "builder.weightUnitBW") : kgToDisplay(weekRow.weight, unit);
          rCell.value = weekRow.reps;
          sCell.value = weekRow.sets;
        }
        [pCell, rCell, sCell].forEach((c) => (c.alignment = { horizontal: "center" }));
      });

      const notesCell = ws.getCell(row, notesCol);
      notesCell.value = currentRow.notes ?? "";
      notesCell.alignment = { horizontal: "left", wrapText: true };

      row++;
    });

    if (row - 1 >= startRow) {
      ws.mergeCells(startRow, 1, row - 1, 1);
      const dayCell = ws.getCell(startRow, 1);
      dayCell.value = String(dayIdx + 1);
    }

    row++; // blank separator row between days
  });

  const filename = `${client.name}-Week${client.week}-Plan-${lang}.xlsx`;
  await triggerBrowserDownload(workbook, filename);
}
