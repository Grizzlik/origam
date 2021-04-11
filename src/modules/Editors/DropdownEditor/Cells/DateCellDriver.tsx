import {
  DropdownDataTable,
  IBodyCellDriver,
} from "modules/Editors/DropdownEditor/DropdownTableModel";
import { DropdownEditorBehavior } from "modules/Editors/DropdownEditor/DropdownEditorBehavior";
import { bodyCellClass } from "modules/Editors/DropdownEditor/Cells/CellsCommon";
import React from "react";
import {TypeSymbol} from "dic/Container";
import {TextCellDriver} from "modules/Editors/DropdownEditor/Cells/TextCellDriver";
import moment from "moment";

export class DateCellDriver implements IBodyCellDriver {
  constructor(
    private dataIndex: number,
    private dataTable: DropdownDataTable,
    private behavior: DropdownEditorBehavior,
    private formatterPattern: string
  ) {}

  render(rowIndex: number) {
    const value = this.dataTable.getValue(rowIndex, this.dataIndex);
    const rowId = this.dataTable.getRowIdentifierByIndex(rowIndex);
    let momentValue = moment(value);
    const formattedValue = momentValue.isValid() ? momentValue.format(this.formatterPattern) : "";

    return (
      <div
        className={bodyCellClass(
          rowIndex,
          this.behavior.chosenRowId === rowId,
          this.behavior.cursorRowId === rowId
        )}
        onClick={(e) => {
          this.behavior.handleTableCellClicked(e, rowIndex);
        }}
      >
        {formattedValue}
      </div>
    );
  }
}

export const IDateCellDriver = TypeSymbol<TextCellDriver>("ITextCellDriver");
