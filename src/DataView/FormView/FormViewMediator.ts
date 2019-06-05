import { IPropReorder } from "../types/IPropReorder";
import { IPropCursor } from "../types/IPropCursor";
import { IFormViewMachine } from "./types";
import { IProperties } from "../types/IProperties";
import { IRecords } from "../types/IRecords";
import { IRecCursor } from "../types/IRecCursor";
import { IEditing } from "../types/IEditing";
import { IAvailViews } from "../types/IAvailViews";
import { IForm } from "../types/IForm";
import { IDataTable } from "../types/IDataTable";
import { IDataViewMediator02 } from "../DataViewMediator02";
import { IASelPrevProp } from "../types/IASelPrevProp";
import { IASelNextProp } from "../types/IASelNextProp";
import { IASelProp } from "../types/IASelProp";
import { IAActivateView } from "../types/IAActivateView";
import { IADeactivateView } from "../types/IADeactivateView";
import { IViewType } from "../types/IViewType";
import { IAStartEditing } from "../types/IAStartEditing";
import { IAFinishEditing } from "../types/IAFinishEditing";
import { IASelCell } from "../types/IASelCell";
import { Machine } from "xstate";
import { IDispatcher } from "../../utils/mediator";
import { action, computed } from "mobx";
import { START_DATA_VIEWS, STOP_DATA_VIEWS } from "../DataViewActions";
import * as FormViewActions from "./FormViewActions";
import { ISelection } from "../Selection";
import { IASelPrevRec } from "../types/IASelPrevRec";
import { IASelNextRec } from "../types/IASelNextRec";
import { IASelRec } from "../types/IASelRec";
import { IAFocusEditor } from "../types/IAFocusEditor";

export interface IParentMediator {
  properties: IProperties;
  records: IRecords;
  recCursor: IRecCursor;
  editing: IEditing;
  availViews: IAvailViews;
  form: IForm;
  dataTable: IDataTable;
}

export interface IFormViewMediator extends IDispatcher {
  type: IViewType.Form;

  isActive: boolean;
  initPropIds: string[] | undefined;
  propReorder: IPropReorder;
  propCursor: IPropCursor;
  machine: IFormViewMachine;
  selection: ISelection;

  properties: IProperties;
  records: IRecords;
  recCursor: IRecCursor;
  editing: IEditing;
  availViews: IAvailViews;
  form: IForm;
  dataTable: IDataTable;
  dataView: IDataViewMediator02;
  uiStructure: any[];

  aSelPrevProp: IASelPrevProp;
  aSelNextProp: IASelNextProp;
  aSelProp: IASelProp;
  aSelRec: IASelRec;
  aSelCell: IASelCell;
  aActivateView: IAActivateView;
  aDeactivateView: IADeactivateView;
  aStartEditing: IAStartEditing;
  aFinishEditing: IAFinishEditing;
  aFocusEditor: IAFocusEditor;
}

export class FormViewMediator implements IFormViewMediator {
  type: IViewType.Form = IViewType.Form;

  constructor(
    public P: {
      initPropIds: string[] | undefined;
      uiStructure: any[];
      parentMediator: IDataViewMediator02;
      propReorder: () => IPropReorder;
      propCursor: () => IPropCursor;
      selection: () => ISelection;
      machine: () => IFormViewMachine;
      aSelNextProp: () => IASelNextProp;
      aSelPrevProp: () => IASelPrevProp;
      aSelNextRec: () => IASelNextRec;
      aSelPrevRec: () => IASelPrevRec;
      aSelRec: () => IASelRec;
      aSelProp: () => IASelProp;
      aSelCell: () => IASelCell;
      aActivateView: () => IAActivateView;
      aDeactivateView: () => IADeactivateView;
    }
  ) {
    this.subscribeMediator();
  }

  subscribeMediator() {}

  getParent(): IDispatcher {
    return this.P.parentMediator;
  }

  @action.bound dispatch(event: any) {
    if (event.NS === FormViewActions.NS) {
      this.downstreamDispatch(event);
      return;
    }
    switch (event.type) {
      default:
        this.getParent().dispatch(event);
    }
  }

  listeners = new Map<number, (event: any) => void>();
  idgen = 0;
  @action.bound
  listen(cb: (event: any) => void): () => void {
    const myId = this.idgen++;
    this.listeners.set(myId, cb);
    return () => this.listeners.delete(myId);
  }

  downstreamDispatch(event: any): void {
    console.log("FormView received:", event);
    switch (event.type) {
      case START_DATA_VIEWS: {
        this.machine.start();
        break;
      }
      case STOP_DATA_VIEWS: {
        this.machine.stop();
        break;
      }
      case FormViewActions.SELECT_FIRST_CELL: {
        this.aSelCell.doSelFirst();
        break;
      }
      case FormViewActions.SELECT_NEXT_ROW: {
        this.aSelNextRec.do();
        break;
      }
      case FormViewActions.SELECT_PREV_ROW: {
        this.aSelPrevRec.do();
        break;
      }
      case FormViewActions.SELECT_FIELD_BY_PROP_ID: {
        this.aSelProp.do(event.propId);
        break;
      }
    }
    for (let l of this.listeners.values()) {
      l(event);
    }
    this.machine.send(event);
  }

  @computed
  get isActive(): boolean {
    return this.P.machine().isActive;
  }

  get propReorder(): IPropReorder {
    return this.P.propReorder();
  }

  get propCursor(): IPropCursor {
    return this.P.propCursor();
  }

  get machine(): IFormViewMachine {
    return this.P.machine();
  }

  get properties(): IProperties {
    return this.P.parentMediator.properties;
  }

  get records(): IRecords {
    return this.P.parentMediator.records;
  }

  get recCursor(): IRecCursor {
    return this.P.parentMediator.recCursor;
  }

  get editing(): IEditing {
    return this.P.parentMediator.editing;
  }

  get selection(): ISelection {
    return this.P.selection();
  }

  get availViews(): IAvailViews {
    return this.P.parentMediator.availViews;
  }

  get form(): IForm {
    return this.P.parentMediator.form;
  }

  get dataTable(): IDataTable {
    return this.P.parentMediator.dataTable;
  }

  get initPropIds(): string[] | undefined {
    return this.P.initPropIds;
  }

  get dataView(): IDataViewMediator02 {
    return this.P.parentMediator;
  }

  get uiStructure(): any[] {
    return this.P.uiStructure;
  }

  get aSelPrevProp(): IASelPrevProp {
    return this.P.aSelPrevProp();
  }

  get aSelNextProp(): IASelNextProp {
    return this.P.aSelNextProp();
  }

  get aSelPrevRec(): IASelPrevRec {
    return this.P.aSelPrevRec();
  }

  get aSelNextRec(): IASelNextRec {
    return this.P.aSelNextRec();
  }

  get aSelProp(): IASelProp {
    return this.P.aSelProp();
  }

  get aSelRec(): IASelRec {
    return this.P.aSelRec();
  }

  get aSelCell(): IASelCell {
    return this.P.aSelCell();
  }

  get aActivateView(): IAActivateView {
    return this.P.aActivateView();
  }

  get aFocusEditor(): IAFocusEditor {
    return this.P.parentMediator.aFocusEditor;
  }

  get aDeactivateView(): IADeactivateView {
    return this.P.aDeactivateView();
  }

  get aStartEditing(): IAStartEditing {
    return this.P.parentMediator.aStartEditing;
  }

  get aFinishEditing(): IAFinishEditing {
    return this.P.parentMediator.aFinishEditing;
  }
}