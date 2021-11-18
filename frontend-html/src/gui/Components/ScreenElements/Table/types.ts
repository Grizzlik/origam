import {PubSub} from "../../../../utils/events";
import {IHeaderContainer} from "gui/Workbench/ScreenArea/TableView/TableView";
import {ITableRow} from "./TableRendering/types";
import {BoundingRect} from "react-measure";
import {ITablePanelView} from "../../../../model/entities/TablePanelView/types/ITablePanelView";
import { ICellRectangle } from "model/entities/TablePanelView/types/ICellRectangle";

export type ICellType =
  | "Text"
  | "ComboBox"
  | "Date"
  | "Number"
  | "CheckBox"
  | "TagInput"
  | "Checklist"
  | "Image"
  | "Blob";

export interface ITableProps {
  gridDimensions: IGridDimensions;
  scrollState: IScrollState;

  tableRows:  ITableRow[]
  editingRowIndex?: number;
  editingColumnIndex?: number;
  isEditorMounted: boolean;
  fixedColumnCount: number;
  isLoading?: boolean;

  headerContainers: IHeaderContainer[];

  renderEditor?: IRenderEditor;

  listenForScrollToCell?: IListenForScrollToCell;
  onOutsideTableClick?(event: any): void;
  onNoCellClick?(event: any): void;
  onKeyDown?(event: any): void;
  refCanvasMovingComponent?(elm: IGridCanvas | null): void;
  onContentBoundsChanged(bounds: BoundingRect): void;
  onFocus: ()=>void;
}

export type IRenderHeader = (args: { columnIndex: number; columnWidth: number }) => React.ReactNode;

export type IRenderEditor = () => React.ReactNode;

export interface IGridDimensions {
  rowCount: number;
  defaultRowHeight: number;
  rowHeight: number;
  columnCount: number;
  contentWidth: number;
  contentHeight: number;
  getColumnLeft(dataColumnIndex: number): number;
  getColumnRight(dataColumnIndex: number): number;
  getRowTop(rowIndex: number): number;
  getRowHeight(rowIndex: number): number;
  getRowBottom(rowIndex: number): number;
  columnWidths: Map<string, number>;
  displayedColumnDimensionsCom: {left: number, width: number, right: number}[]
}

export type IListenForScrollToCell = (cb: (rowIdx: number, colIdx: number) => void) => () => void;

export interface IScrollState extends IScrollOffsetSource, IScrollOffsetTarget {
  scrollToFunction: ((coords: { scrollLeft?: number; scrollTop?: number }) => void) | undefined;
  scrollTo(coords: { scrollLeft?: number; scrollTop?: number }): void;
}

export interface IScrollOffsetSource {
  scrollTop: number;
  scrollLeft: number;
}

export interface IScrollOffsetTarget {
  setScrollOffset(event: any, scrollTop: number, scrollLeft: number): void;
}

export interface IGridCanvas {
  firstVisibleRowIndex: number;
  lastVisibleRowIndex: number;
}

export interface IGridCanvasProps {
  // How big is the canvas (CSS units)
  width: number;
  height: number;

  contentWidth: number;
  contentHeight: number;

  // For fixed columns - Which column index is the first one for this canvas.
  columnStartIndex: number;
  // For fixed columns - By how many pixel should be the content shifted to the right side.
  leftOffset: number;
  // For fixced columns - Should be the horizontal shift controlled by scroll source?
  isHorizontalScroll: boolean;

  // Drawing offset
  scrollOffsetSource: IScrollOffsetSource;

  gridDimensions: IGridDimensions;


  onBeforeRender?(): void;
  onAfterRender?(): void;
  onVisibleDataChanged?(
    firstVisibleColumnIndex: number,
    lastVisibleColumnIndex: number,
    firstVisibleRowIndex: number,
    lastVisibleRowIndex: number
  ): void;
  onNoCellClick?(event: any): void;
}

export interface IPositionedFieldProps {
  rowIndex: number;
  columnIndex: number;
  fixedColumnsCount: number;

  scrollOffsetSource: IScrollOffsetSource;
  worldBounds: {
    width: number;
    height: number;
    top: number;
    left: number;
    bottom: number;
    right: number;
  };
  cellRectangle: ICellRectangle;
  onMouseEnter?: (event: any) => void;
}

export interface IScrollerProps {
  width: number | string;
  height: number | string;
  isVisible: boolean;
  contentWidth: number;
  contentHeight: number;
  scrollingDisabled: boolean;
  // scrollOffsetTarget: IScrollOffsetTarget;
  onScroll: (event: any, scrollLeft: number, scrollTop: number) => void;
  onClick?: (event: any, contentLeft: number, contentTop: number) => void;
  onMouseOver: (event: any, boundingRectangle: DOMRect) => void;
  onMouseLeave: (event: any) => void;
  onMouseMove?: (event: any, contentLeft: number, contentTop: number) => void;
  onOutsideClick?: (event: any) => void;
  onKeyDown?: (event: any) => void;
  onFocus: ()=>void;
}

export interface IScrolleeProps {
  width?: number | string;
  height?: number | string;
  fixedHoriz?: boolean;
  fixedVert?: boolean;
  zIndex?: number | undefined;
  scrollOffsetSource: IScrollOffsetSource;
  offsetLeft?: number;
  offsetTop?: number;
}

export interface IHeaderRowProps {
  zIndex?: number | undefined;
  headerElements: JSX.Element[];
}

export interface IRenderedCell {
  isCellCursor: boolean;
  isRowCursor: boolean;
  isColumnOrderChangeSource: boolean;
  isColumnOrderChangeTarget: boolean;
  isLoading: boolean;
  isInvalid: boolean;
  isHidden: boolean;
  isPassword?: boolean;
  isLink: boolean;
  formatterPattern: string;
  type: ICellType;
  value: any;
  text: any;
  foregroundColor?: string;
  backgroundColor?: string;
}
