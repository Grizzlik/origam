import { ITableRow, IGroupRow } from "../types";
import { currentRow } from "../currentCell";
import {
  selectionCheckboxCellsWidths,
  selectionCheckboxEmptyCellsWidths,
  selectionCheckboxEmptyCellsDraws,
} from "../cells/selectionCheckboxCell";
import { groupRowContentCellsWidths, groupRowContentCellsDraws } from "../cells/groupCell";

export function groupRowCellsWidths() {
  return [...selectionCheckboxEmptyCellsWidths(), ...groupRowContentCellsWidths()];
}

export function groupRowCellsDraws() {
  return [...selectionCheckboxEmptyCellsDraws(), ...groupRowContentCellsDraws()];
}

export function isGroupRow(row: ITableRow): row is IGroupRow {
  return (row as any).groupLevel !== undefined;
}

export function isCurrentGroupRow() {
  return isGroupRow(currentRow());
}