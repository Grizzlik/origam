import { IGrouper } from "./types/IGrouper";
import { getDataTable } from "model/selectors/DataView/getDataTable";
import { getGroupingConfiguration } from "model/selectors/TablePanelView/getGroupingConfiguration";
import { IGroupTreeNode } from "gui/Components/ScreenElements/Table/TableRendering/types";
import { ClientSideGroupItem } from "gui/Components/ScreenElements/Table/TableRendering/GroupItem";
import { getTablePanelView } from "../selectors/TablePanelView/getTablePanelView";
import { IAggregationInfo } from "./types/IAggregationInfo";
import { computed } from "mobx";
import { AggregationType } from "./types/AggregationType";
import { getLocaleFromCookie } from "utils/cookies";
import { IProperty } from "./types/IProperty";
import { getAllLoadedValuesOfProp, getMaxRowCountSeen, getRowById, getRowIndex } from "./GrouperCommon";

export class ClientSideGrouper implements IGrouper {
  parent?: any = null;
  expandedGroupDisplayValues: string[] = [];

  @computed
  get topLevelGroups(){
    const firstGroupingColumn = getGroupingConfiguration(this).firstGroupingColumn;
    if (firstGroupingColumn === undefined) {
      return [];
    }
    const dataTable = getDataTable(this);
    const groups = this.makeGroups(dataTable.rows, firstGroupingColumn);
    this.loadRecursively(groups);
    console.log("topLevelGroups: "+groups.length);
    return groups;
  }
  
  get allGroups(){
    return this.topLevelGroups.flatMap(group => [group, ...group.allChildGroups]);
  }

  getRowAndColumnOffsets(rowId: string) {
    let rowOffset = 0;
    for (const group of this.allGroups) {
      rowOffset++;
      if(group.getRowById(rowId)){
        const columnOffset = group.level + 1;
        return [rowOffset, columnOffset]
      }
      if(group.isExpanded){
        rowOffset += group.childRows.length;
      }
    }
    return [0,0]
  }
  
  getRowIndex(rowId: string): number | undefined {
    return getRowIndex(this, rowId);
  }

  getRowById(id: string): any[] | undefined {
    return getRowById(this, id);
  }

  getMaxRowCountSeen(rowId: string): number {
    return getMaxRowCountSeen(this, rowId);
  }
  
  getAllValuesOfProp(property: IProperty): Promise<Set<any>> {
    return Promise.resolve(getAllLoadedValuesOfProp(property, this));
  }

  loadRecursively(groups: IGroupTreeNode[]) {
    for (let group of groups) {
      if(this.expandedGroupDisplayValues.includes(group.columnDisplayValue)){
        group.isExpanded = true;
        this.loadChildrenInternal(group);
        this.loadRecursively(group.childGroups);
      }
    }
  }

  expansionListener(item: ClientSideGroupItem){
    if(item.isExpanded){
      this.expandedGroupDisplayValues.push(item.columnDisplayValue);
    }
    else
    {
      this.expandedGroupDisplayValues.remove(item.columnDisplayValue);
    }
  }

  makeGroups(rows: any[][], groupingColumn: string): IGroupTreeNode[] {
    const groupMap = this.makeGroupMap(groupingColumn, rows);

    const dataTable = getDataTable(this);
    const property = dataTable.getPropertyById(groupingColumn);

    return Array.from(groupMap.entries())
      .map((entry) => {
        const groupName = entry[0];
        const rows = entry[1];
        return new ClientSideGroupItem({
          childGroups: [] as IGroupTreeNode[],
          childRows: rows,
          columnId: groupingColumn,
          groupLabel: property!.name,
          rowCount: rows.length,
          parent: undefined,
          columnValue: groupName,
          columnDisplayValue: property ? dataTable.resolveCellText(property, groupName) : groupName,
          aggregations: this.calcAggregations(rows),
          grouper: this,
          expansionListener: this.expansionListener.bind(this)
        });
      })
      .sort((a, b) => {
        if (a.columnDisplayValue && b.columnDisplayValue) {
          return a.columnDisplayValue.localeCompare(b.columnDisplayValue, getLocaleFromCookie());
        } else if (!a.columnDisplayValue) {
          return -1;
        } else {
          return 1;
        }
      });
  }

  private makeGroupMap(groupingColumn: string | undefined, rows: any[][]) {
    if (!groupingColumn) {
      return new Map<string, any[][]>();
    }
    const index = this.findDataIndex(groupingColumn);
    const groupMap = new Map<string, any[][]>();
    for (let row of rows) {
      const groupName = row[index];
      if (!groupMap.has(groupName)) {
        groupMap.set(groupName, []);
      }
      groupMap.get(groupName)!.push(row);
    }
    return groupMap;
  }

  calcAggregations(rows: any[][]) {
    return getTablePanelView(this).aggregations.aggregationList.map((aggregationInfo) => {
      return {
        columnId: aggregationInfo.ColumnName,
        type: aggregationInfo.AggregationType,
        value: this.calcAggregation(aggregationInfo, rows),
      };
    });
  }

  private calcAggregation(aggregationInfo: IAggregationInfo, rows: any[][]) {
    const index = this.findDataIndex(aggregationInfo.ColumnName);
    const valuesToAggregate = rows.map((row) => row[index]);

    switch (aggregationInfo.AggregationType) {
      case AggregationType.SUM:
        return valuesToAggregate.reduce((a, b) => a + b, 0);
      case AggregationType.AVG:
        return valuesToAggregate.reduce((a, b) => a + b, 0) / rows.length;
      case AggregationType.MIN:
        return Math.min(...valuesToAggregate);
      case AggregationType.MAX:
        return Math.max(...valuesToAggregate);
      default:
        throw new Error("Aggregation type not implemented: " + aggregationInfo.AggregationType);
    }
  }

  findDataIndex(columnName: string) {
    const dataTable = getDataTable(this);
    const property = dataTable.getPropertyById(columnName);
    if (!property) {
      return 0;
    }
    return property.dataIndex;
  }

  *loadChildren(group: IGroupTreeNode) {
   this.loadChildrenInternal(group);
  }

  loadChildrenInternal(group: IGroupTreeNode){
    const groupingConfiguration = getGroupingConfiguration(this);
    const nextColumnName = groupingConfiguration.nextColumnToGroupBy(group.columnId);

    if (nextColumnName) {
      group.childGroups = this.makeGroups(group.childRows, nextColumnName);
    }
  }


  notifyGroupClosed(group: IGroupTreeNode){
  }

  start(): void {}
}
