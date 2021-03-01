import { IPanelViewType } from "./IPanelViewType";
import { IProperty } from "./IProperty";
import { IDataSource } from "./IDataSource";
import { IDataTable } from "./IDataTable";
import { IComponentBinding } from "./IComponentBinding";
import { IDataViewLifecycle } from "../DataViewLifecycle/types/IDataViewLifecycle";
import { ITablePanelView } from "../TablePanelView/types/ITablePanelView";
import { IFormPanelView } from "../FormPanelView/types/IFormPanelView";
import { IAction } from "./IAction";
import { ILookupLoader } from "./ILookupLoader";
import { ServerSideGrouper } from "../ServerSideGrouper";
import { ClientSideGrouper } from "../ClientSideGrouper";
import { IGridDimensions, IScrollState } from "../../../gui/Components/ScreenElements/Table/types";
import { ITableRow } from "../../../gui/Components/ScreenElements/Table/TableRendering/types";
import { BoundingRect } from "react-measure";
import { FocusManager } from "../FocusManager";
import { DataViewData } from "../../../modules/DataView/DataViewData";
import { DataViewAPI } from "../../../modules/DataView/DataViewAPI";
import { RowCursor } from "../../../modules/DataView/TableCursor";
import {IInfiniteScrollLoader} from "gui/Workbench/ScreenArea/TableView/InfiniteScrollLoader";

export interface IDataViewData {
  id: string;
  modelInstanceId: string;
  name: string;
  modelId: string;
  defaultPanelView: IPanelViewType;
  isHeadless: boolean;
  isMapSupported: boolean;
  disableActionButtons: boolean;
  showAddButton: boolean;
  showDeleteButton: boolean;
  showSelectionCheckboxesSetting: boolean;
  type: string;
  attributes: any;

  isGridHeightDynamic: boolean;
  selectionMember: string;
  orderMember: string;
  isDraggingEnabled: boolean;
  entity: string;
  dataMember: string;
  isRootGrid: boolean;
  isRootEntity: boolean;
  isPreloaded: boolean;
  requestDataAfterSelectionChange: boolean;
  confirmSelectionChange: boolean;
  properties: IProperty[];
  actions: IAction[];
  dataTable: IDataTable;
  formViewUI: any;
  activePanelView: IPanelViewType;
  tablePanelView: ITablePanelView;
  formPanelView: IFormPanelView;
  lifecycle: IDataViewLifecycle;
  lookupLoader: ILookupLoader;
  serverSideGrouper: ServerSideGrouper;
  clientSideGrouper: ClientSideGrouper;
  isFirst: boolean;
  newRecordView: string | undefined;

  dataViewRowCursor: RowCursor;
  dataViewApi: DataViewAPI;
  dataViewData: DataViewData;
}

export interface IDataView extends IDataViewData {
  $type_IDataView: 1;
  
  orderProperty: IProperty | undefined;
  isBindingRoot: boolean;
  isBindingParent: boolean;
  isAnyBindingAncestorWorking: boolean;
  isWorking: boolean;
  parentBindings: IComponentBinding[];
  childBindings: IComponentBinding[];
  bindingRoot: IDataView;
  bindingParent: IDataView | undefined;
  isValidRowSelection: boolean;
  selectedRowId: string | undefined;
  selectedRowIndex: number | undefined;
  totalRowCount: number | undefined;
  selectedRow: any[] | undefined;
  dataSource: IDataSource;
  bindingParametersFromParent: { [key: string]: string };
  showSelectionCheckboxes: boolean;
  panelViewActions: IAction[];
  toolbarActions: IAction[];
  dialogActions: IAction[];
  focusManager: FocusManager;
  firstEnabledDefaultAction: IAction | undefined;
  defaultActions: IAction[];

  isSelected(id: string): boolean;
  hasSelectedRowId(id: string): boolean;
  selectedRowIds: Set<string>;
  addSelectedRowId(id: string): void;
  removeSelectedRowId(id: string): void;
  setSelectedState(rowId: string, newState: boolean): void;

  selectNextRow(): void;
  selectPrevRow(): void;

  onFieldChange(event: any, row: any[], property: IProperty, value: any): void;
  selectFirstRow(): void;
  selectLastRow(): void;
  reselectOrSelectFirst(): void;
  selectRowById(id: string | undefined): void;
  selectRow(row: any[]): void;
  setSelectedRowId(id: string | undefined): void;
  setRecords(rows: any[][]): Promise<any>;
  appendRecords(rows: any[][]): void;
  substituteRecord(row: any[]): void;
  deleteRowAndSelectNext(row: any[]): void;
  clear(): void;

  navigateLookupLink(property: IProperty, row: any[]): Generator<any>;

  saveViewState(): void;
  restoreViewState(): void;

  start(): void;
  stop(): void;

  scrollState: IScrollState;
  tableRows: ITableRow[];
  onReload(): void;

  onPanelKeyDown(event: any): void;

  gridDimensions: IGridDimensions;
  contentBounds: BoundingRect | undefined;
  infiniteScrollLoader: IInfiniteScrollLoader | undefined;

  parent?: any;

  moveSelectedRowUp(): void;
  moveSelectedRowDown(): void;
  setRowCount(rowCount: number | undefined): void;

  isFormViewActive: () => boolean;
  activateFormView: ((args: {saveNewState: boolean})=> Promise<any>) | undefined;
  activateTableView: (()=> Promise<any>) | undefined;

  initializeNewScrollLoader(): void;
  exportToExcel(): void;
}

export const isIDataView = (o: any): o is IDataView => o.$type_IDataView;
