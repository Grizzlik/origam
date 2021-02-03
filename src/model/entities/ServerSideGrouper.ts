import { getGroupingConfiguration } from "model/selectors/TablePanelView/getGroupingConfiguration";
import { getFormScreenLifecycle } from "model/selectors/FormScreen/getFormScreenLifecycle";
import { getDataView } from "model/selectors/DataView/getDataView";
import { IGrouper } from "./types/IGrouper";
import { IReactionDisposer, observable, reaction, comparer, flow} from "mobx";
import { ICellOffset, IGroupTreeNode } from "gui/Components/ScreenElements/Table/TableRendering/types";
import { ServerSideGroupItem } from "gui/Components/ScreenElements/Table/TableRendering/GroupItem";
import { getDataTable } from "model/selectors/DataView/getDataTable";
import { getTablePanelView } from "model/selectors/TablePanelView/getTablePanelView";
import { getOrderingConfiguration } from "model/selectors/DataView/getOrderingConfiguration";
import { joinWithAND, joinWithOR, toFilterItem } from "./OrigamApiHelpers";
import { parseAggregations } from "./Aggregatioins";
import { getUserFilters } from "model/selectors/DataView/getUserFilters";
import { getFilterConfiguration } from "model/selectors/DataView/getFilterConfiguration";
import { IProperty } from "./types/IProperty";
import { getAllLoadedValuesOfProp, getCellOffset, getNextRowId, getPreviousRowId, getRowById, getRowIndex } from "./GrouperCommon";
import _ from "lodash";

export class ServerSideGrouper implements IGrouper {
  @observable.shallow topLevelGroups: IGroupTreeNode[] = [];
  parent?: any = null;
  disposers: IReactionDisposer[] = [];
  groupDisposers: Map<IGroupTreeNode, IReactionDisposer> =  new Map<IGroupTreeNode, IReactionDisposer>()
  @observable refreshTrigger = 0;
  
  start() {
    this.disposers.push(
      reaction(
        () => [
          Array.from(getGroupingConfiguration(this).groupingSettings.values()),
          Array.from(getGroupingConfiguration(this).groupingSettings.keys()),
          this.refreshTrigger],
          () => this.loadGroupsDebounced(),
          {fireImmediately: true, equals: comparer.structural,delay: 50})
          );
        }
        
  get allGroups(){
    return this.topLevelGroups.flatMap(group => [group, ...group.allChildGroups]);
  } 

  loadGroupsDebounced =  _.debounce(this.loadGroupsImm, 10);

  loadGroupsImm(){
    const self = this;
    flow(function* () {yield* self.loadGroups()})();
  }
        
  private *loadGroups() {
    const firstGroupingColumn = getGroupingConfiguration(this).firstGroupingColumn;
    if (!firstGroupingColumn) {
      this.topLevelGroups.length = 0;
      return;
    }
    const expandedGroupDisplayValues = this.allGroups
    .filter(group => group.isExpanded)
    .map(group => group.columnDisplayValue)
    const dataView = getDataView(this);
    const property = getDataTable(this).getPropertyById(firstGroupingColumn);
    const lookupId = property && property.lookup && property.lookup.lookupId;
    const aggregations = getTablePanelView(this).aggregations.aggregationList;
    const  groupData = yield getFormScreenLifecycle(this).loadGroups(dataView, firstGroupingColumn, lookupId, aggregations)
    this.topLevelGroups = this.group(groupData, firstGroupingColumn, undefined);
    yield* this.loadAndExpandChildren(this.topLevelGroups, expandedGroupDisplayValues);
  }
      
  private *loadAndExpandChildren(childGroups: IGroupTreeNode[], expandedGroupDisplayValues: string[]): Generator {
    for (const group of childGroups) {
      if( expandedGroupDisplayValues.includes(group.columnDisplayValue)){
        group.isExpanded = true;
        yield* this.loadChildren(group);
        yield* this.loadAndExpandChildren(group.childGroups, expandedGroupDisplayValues)
      }
    }
  }

  substituteRecord(row: any[]): void{
    this.allGroups.map(group => group.substituteRecord(row))
  }
  
  refresh() {
    this.refreshTrigger++;
  }

  getRowIndex(rowId: string): number | undefined {
    return getRowIndex(this, rowId);
  }
  
  getRowById(id: string): any[] | undefined {
    return getRowById(this, id);
  }

  getTotalRowCount(rowId: string): number | undefined{
    return this.allGroups
      .find(group => group.getRowById(rowId))?.rowCount;
  }

  getCellOffset(rowId: string): ICellOffset {
    return getCellOffset(this, rowId);
   }

  getNextRowId(rowId: string): string {
    return getNextRowId(this, rowId);
  }

  getPreviousRowId(rowId: string): string {
    return getPreviousRowId(this, rowId);
  }

  notifyGroupClosed(group: IGroupTreeNode){
    if(this.groupDisposers.has(group)){
      this.groupDisposers.get(group)!();
      this.groupDisposers.delete(group);
    }
  }
  
  *loadChildren(groupHeader: IGroupTreeNode) {
    if(this.groupDisposers.has(groupHeader)){
      this.groupDisposers.get(groupHeader)!();
    }
    this.groupDisposers.set(
      groupHeader,
      reaction(
        ()=> [
          getGroupingConfiguration(this).nextColumnToGroupBy(groupHeader.columnId),
          this.composeFinalFilter(groupHeader),
          [ ...getFilterConfiguration(this).activeFilters],
          [ ...getTablePanelView(this).aggregations.aggregationList],
          getOrderingConfiguration(this).groupChildrenOrdering
        ], 
        ()=> this.loadChildrenReactionDebounced(groupHeader),
      )
    );
    yield* this.reload(groupHeader);
  }
  
  loadChildrenReactionDebounced = _.debounce(this.loadChildrenReaction, 10);

  private loadChildrenReaction(group: IGroupTreeNode){
    flow(() => this.reload(group))();
  }
  
  private *reload(group: IGroupTreeNode) {
    const groupingConfiguration = getGroupingConfiguration(this);
    const nextColumnName = groupingConfiguration.nextColumnToGroupBy(group.columnId);
    const dataView = getDataView(this);
    const filter = this.composeFinalFilter(group);
    const lifeCycle = getFormScreenLifecycle(this);
    const aggregations = getTablePanelView(this).aggregations.aggregationList;
    const orderingConfiguration = getOrderingConfiguration(this);
    if (nextColumnName) {
      const property = getDataTable(this).getPropertyById(nextColumnName);
      const lookupId = property && property.lookup && property.lookup.lookupId;
      const groupData = yield lifeCycle.loadChildGroups(dataView, filter, nextColumnName, aggregations, lookupId)
      group.childGroups = this.group(groupData, nextColumnName, group);
    } else {
      const rows = yield lifeCycle.loadChildRows(dataView, filter, orderingConfiguration.groupChildrenOrdering)
      group.childRows = rows;
    }
  }


  composeFinalFilter(rowGroup: IGroupTreeNode){
    const groupingFilter = rowGroup.composeGroupingFilter();
    const userFilters = getUserFilters(this);

    return userFilters 
      ? joinWithAND([groupingFilter, userFilters])
      : groupingFilter;
  }


  group(groupData: any[], columnId: string, parent: IGroupTreeNode | undefined): IGroupTreeNode[] {
    const groupingConfiguration = getGroupingConfiguration(this);
    const level = groupingConfiguration.groupingSettings.get(columnId)?.groupIndex;

    if (!level) {
      throw new Error("Cannot find grouping index for column: " + columnId);
    }

    let dataTable = getDataTable(this);
    const property = dataTable.getPropertyById(columnId);

    return groupData.map((groupDataItem) => {
      return new ServerSideGroupItem({
        childGroups: [] as IGroupTreeNode[],
        childRows: [] as any[][],
        columnId: columnId,
        groupLabel: property!.name,
        rowCount: groupDataItem["groupCount"] as number,
        parent: parent,
        columnValue: groupDataItem[columnId],
        columnDisplayValue: groupDataItem["groupCaption"] || groupDataItem[columnId],
        aggregations: parseAggregations(groupDataItem["aggregations"]),
        grouper: this,
      });
    });
  }

  async getAllValuesOfProp(property: IProperty): Promise<Set<any>>{
    const openGroups = this.allGroups
      .filter(group => group.isExpanded && group.childRows.length );
    const infinitelyScrolledGroups = openGroups.filter(group => group.isInfinitelyScrolled);

    let values = await this.getPropValuesFromInfinitelyScrolledGroups(infinitelyScrolledGroups, property);
    return new Set([...getAllLoadedValuesOfProp(property, this), ...values]);
  }

  private async getPropValuesFromInfinitelyScrolledGroups(groups: IGroupTreeNode[], property: IProperty){
    if(groups.length === 0){
      return [];
    }
    const filter = joinWithOR(groups.map(group => this.composeFinalFilter(group)))

    const dataView = getDataView(this);
    const lifeCycle = getFormScreenLifecycle(this);
    const aggregations = getTablePanelView(this).aggregations.aggregationList;

    const lookupId = property && property.lookup && property.lookup.lookupId;
    const groupList = await lifeCycle.loadChildGroups(dataView, filter, property.id, aggregations, lookupId)
    return groupList.map(group => group[property.id]).filter(group => group);
  }

  dispose() {
    for (let disposer of this.disposers) {
      disposer();
    }
    this.allGroups.forEach(group => group.dispose())
  }
}
