import React from "react";
import { action, computed } from "mobx";

import { getTablePanelView } from "../../selectors/TablePanelView/getTablePanelView";
import { getDialogStack } from "../../selectors/DialogStack/getDialogStack";
import { IColumnConfigurationDialog } from "./types/IColumnConfigurationDialog";
import { ColumnsDialog, ITableColumnsConf } from "gui/Components/Dialogs/ColumnsDialog";
import { onColumnConfigurationSubmit } from "model/actions-ui/ColumnConfigurationDialog/onColumnConfigurationSubmit";
import { getGroupingConfiguration } from "model/selectors/TablePanelView/getGroupingConfiguration";
import {isLazyLoading} from "model/selectors/isLazyLoading";
import {getFormScreenLifecycle} from "model/selectors/FormScreen/getFormScreenLifecycle";
import { GroupingUnit } from "../types/IGroupingConfiguration";

export class ColumnConfigurationDialog implements IColumnConfigurationDialog {
  @computed get columnsConfiguration() {
    const conf: ITableColumnsConf = {
      fixedColumnCount: this.tablePanelView.fixedColumnCount,
      columnConf: [],
    };
    const groupingConf = getGroupingConfiguration(this);
    const groupingOnClient = !isLazyLoading(this);
    for (let prop of this.tablePanelView.allTableProperties) {
      conf.columnConf.push({
        id: prop.id,
        name: prop.name,
        isVisible: !this.tablePanelView.hiddenPropertyIds.get(prop.id),
        groupingIndex: groupingConf.groupingSettings.get(prop.id)?.groupIndex || 0,
        aggregationType: this.tablePanelView.aggregations.getType(prop.id)!,
        entity: prop.entity,
        canGroup:
          groupingOnClient ||
          (!prop.isAggregatedColumn && !prop.isLookupColumn && prop.column !== "TagInput"),
        canAggregate:
          groupingOnClient ||
          (!prop.isAggregatedColumn && !prop.isLookupColumn && prop.column !== "TagInput"),
      });
    }
    return conf;
  }

  dialogKey = "";
  dialogId = 0;

  @action.bound
  onColumnConfClick(event: any): void {
    this.dialogKey = `ColumnConfigurationDialog@${this.dialogId++}`;
    getDialogStack(this).pushDialog(
      this.dialogKey,
      <ColumnsDialog
        configuration={this.columnsConfiguration}
        onCancelClick={this.onColumnConfCancel}
        onCloseClick={this.onColumnConfCancel}
        onOkClick={onColumnConfigurationSubmit(this.tablePanelView)}
      />
    );
  }

  @action.bound onColumnConfCancel(event: any): void {
    getDialogStack(this).closeDialog(this.dialogKey);
  }

  @action.bound onColumnConfSubmit(event: any, configuration: ITableColumnsConf): void {
    this.tablePanelView.fixedColumnCount = configuration.fixedColumnCount;
    this.tablePanelView.hiddenPropertyIds.clear();
    const groupingConf = getGroupingConfiguration(this);
    groupingConf.clearGrouping();
    for (let column of configuration.columnConf) {
      this.tablePanelView.hiddenPropertyIds.set(column.id, !column.isVisible);
      if (column.groupingIndex) {
        groupingConf.setGrouping(column.id, GroupingUnit.Month, column.groupingIndex);
      }
      this.tablePanelView.aggregations.setType(column.id, column.aggregationType);
    }
    getFormScreenLifecycle(this).loadInitialData();
    getDialogStack(this).closeDialog(this.dialogKey);
  }

  @computed get tablePanelView() {
    return getTablePanelView(this);
  }

  parent?: any;
}
