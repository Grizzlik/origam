import { QuestionSaveData } from "gui/Components/Dialogs/QuestionSaveData";
import { action, computed } from "mobx";
import { processActionResult } from "model/actions/Actions/processActionResult";
import { closeForm } from "model/actions/closeForm";
import { processCRUDResult } from "model/actions/DataLoading/processCRUDResult";
import { IAction } from "model/entities/types/IAction";
import { getBindingParametersFromParent } from "model/selectors/DataView/getBindingParametersFromParent";
import { getColumnNamesToLoad } from "model/selectors/DataView/getColumnNamesToLoad";
import { getDataStructureEntityId } from "model/selectors/DataView/getDataStructureEntityId";
import { getDataViewByGridId } from "model/selectors/DataView/getDataViewByGridId";
import { getDataViewsByEntity } from "model/selectors/DataView/getDataViewsByEntity";
import { getDataViewList } from "model/selectors/FormScreen/getDataViewList";
import { getDialogStack } from "model/selectors/getDialogStack";
import { getMenuItemType } from "model/selectors/getMenuItemType";
import React from "react";
import { map2obj } from "utils/objects";
import { interpretScreenXml } from "xmlInterpreters/screenXml";
import { getFormScreen } from "../../selectors/FormScreen/getFormScreen";
import { getScreenParameters } from "../../selectors/FormScreen/getScreenParameters";
import { getApi } from "../../selectors/getApi";
import { getMenuItemId } from "../../selectors/getMenuItemId";
import { getOpenedScreen } from "../../selectors/getOpenedScreen";
import { getSessionId } from "../../selectors/getSessionId";
import { IFormScreenLifecycle02 } from "../types/IFormScreenLifecycle";

enum IQuestionSaveDataAnswer {
  Cancel = 0,
  NoSave = 1,
  Save = 2
}

export class FormScreenLifecycle02 implements IFormScreenLifecycle02 {
  $type_IFormScreenLifecycle: 1 = 1;

  @computed get isWorking() {
    return false;
  }

  *onFlushData(): Generator<unknown, any, unknown> {
    yield* this.flushData();
  }

  *onCreateRow(
    entity: string,
    gridId: string
  ): Generator<unknown, any, unknown> {
    yield* this.createRow(entity, gridId);
  }

  *onDeleteRow(
    entity: string,
    rowId: string
  ): Generator<unknown, any, unknown> {
    yield* this.deleteRow(entity, rowId);
  }

  *onSaveSession(): Generator<unknown, any, unknown> {
    yield* this.saveSession();
  }

  *onExecuteAction(
    gridId: string,
    entity: string,
    action: IAction,
    selectedItems: string[]
  ): Generator<unknown, any, unknown> {
    yield* this.executeAction(gridId, entity, action, selectedItems);
  }

  *onRequestScreenClose(): Generator<unknown, any, unknown> {
    switch (yield this.questionSaveData()) {
      case IQuestionSaveDataAnswer.Cancel:
        return;
      case IQuestionSaveDataAnswer.Save:
        yield* this.saveSession();
        yield* this.closeForm();
        return;
      case IQuestionSaveDataAnswer.NoSave:
        yield* this.closeForm();
        return;
    }
  }

  *onRequestScreenReload(): Generator<unknown, any, unknown> {
    switch (yield this.questionSaveData()) {
      case IQuestionSaveDataAnswer.Cancel:
        return;
      case IQuestionSaveDataAnswer.Save:
        yield* this.saveSession();
        yield* this.refreshSession();
        return;
      case IQuestionSaveDataAnswer.NoSave:
        yield* this.refreshSession();
        return;
    }
  }

  *start(): Generator {
    yield* this.initUI();
    if (!this.isReadData) {
      yield* this.loadData();
    }
  }

  *initUI() {
    try {
      const api = getApi(this);
      const openedScreen = getOpenedScreen(this);
      const menuItemId = getMenuItemId(this);
      const menuItemType = getMenuItemType(this);
      const parameters = getScreenParameters(this);
      const initUIResult = yield api.initUI({
        Type: menuItemType,
        ObjectId: menuItemId,
        FormSessionId: undefined,
        IsNewSession: true,
        RegisterSession: true,
        DataRequested: !openedScreen.dontRequestData,
        Parameters: parameters
      });
      console.log(initUIResult);
      yield* this.applyInitUIResult({ initUIResult });
    } catch (error) {
      console.error(error);
      // TODO: Error handling !
    }
  }

  *destroyUI() {
    try {
      const api = getApi(this);
      yield api.destroyUI({ FormSessionId: getSessionId(this) });
    } catch (error) {
      // TODO: Handle error
    }
  }

  *applyInitUIResult(args: { initUIResult: any }) {
    const openedScreen = getOpenedScreen(this);
    const screenXmlObj = args.initUIResult.formDefinition;
    const screen = interpretScreenXml(
      screenXmlObj,
      this,
      args.initUIResult.sessionId
    );
    openedScreen.content.setFormScreen(screen);
    screen.printMasterDetailTree();
    yield* this.applyData(args.initUIResult.data);
    getDataViewList(this).forEach(dv => dv.start());
  }

  *loadData() {
    try {
      const api = getApi(this);
      const formScreen = getFormScreen(this);
      for (let rootDataView of formScreen.rootDataViews) {
        const loadedData = yield api.getRows({
          MenuId: getMenuItemId(rootDataView),
          DataStructureEntityId: getDataStructureEntityId(rootDataView),
          Filter: "",
          Ordering: [],
          RowLimit: 999999,
          ColumnNames: getColumnNamesToLoad(rootDataView),
          MasterRowId: undefined
        });
        rootDataView.dataTable.clear();
        rootDataView.dataTable.setRecords(loadedData);
        rootDataView.selectFirstRow();
      }
    } catch (error) {
      console.error(error);
      // TODO: Error handling
    }
  }

  *flushData() {
    try {
      const api = getApi(this);
      for (let dataView of getFormScreen(this).dataViews) {
        for (let row of dataView.dataTable.getDirtyValueRows()) {
          const updateObjectResult = yield api.updateObject({
            SessionFormIdentifier: getSessionId(this),
            Entity: dataView.entity,
            Id: dataView.dataTable.getRowId(row),
            Values: map2obj(dataView.dataTable.getDirtyValues(row))
          });
          console.log(updateObjectResult);
          yield* processCRUDResult(dataView, updateObjectResult);
        }
      }
    } catch (error) {
      console.error(error);
      // TODO: Error handling
    }
  }

  *createRow(entity: string, gridId: string) {
    try {
      const api = getApi(this);
      const targetDataView = getDataViewByGridId(this, gridId)!;
      const createObjectResult = yield api.createObject({
        SessionFormIdentifier: getSessionId(this),
        Entity: entity,
        RequestingGridId: gridId,
        Values: {},
        Parameters: { ...getBindingParametersFromParent(targetDataView) }
      });
      console.log(createObjectResult);
      yield* processCRUDResult(targetDataView, createObjectResult);
    } catch (error) {
      console.error(error);
      // TODO: Error handling
    }
  }

  *deleteRow(entity: string, rowId: string) {
    try {
      const api = getApi(this);
      const deleteObjectResult = yield api.deleteObject({
        SessionFormIdentifier: getSessionId(this),
        Entity: entity,
        Id: rowId
      });
      console.log(deleteObjectResult);
      yield* processCRUDResult(this, deleteObjectResult);
    } catch (error) {
      console.error(error);
      // TODO: Error handling
    }
  }

  *saveSession() {
    try {
      const api = getApi(this);
      yield api.saveSessionQuery(getSessionId(this));
      const result = yield api.saveSession(getSessionId(this));
      yield* processCRUDResult(this, result);
    } catch (error) {
      console.error(error);
      // TODO: Error handling
    }
  }

  *refreshSession() {
    // TODO: Refresh lookups and rowstates !!!
    try {
      if (this.isReadData) {
        const api = getApi(this);
        const result = yield api.refreshSession(getSessionId(this));
        yield* this.applyData(result);
        getFormScreen(this).setDirty(false);
      } else {
        yield* this.loadData();
      }
    } catch (error) {
      console.error(error);
      // TODO: Error handling
    }
  }

  *executeAction(
    gridId: string,
    entity: string,
    action: IAction,
    selectedItems: string[]
  ) {
    try {
      const parameters: { [key: string]: any } = {};
      for (let parameter of action.parameters) {
        parameters[parameter.name] = parameter.fieldName;
      }
      const api = getApi(this);
      const queryResult = yield api.executeActionQuery({
        SessionFormIdentifier: getSessionId(this),
        Entity: entity,
        ActionType: action.type,
        ActionId: action.id,
        ParameterMappings: parameters,
        SelectedItems: selectedItems,
        InputParameters: {}
      });
      console.log("EAQ", queryResult);

      const result = yield api.executeAction({
        SessionFormIdentifier: getSessionId(this),
        Entity: entity,
        ActionType: action.type,
        ActionId: action.id,
        ParameterMappings: parameters,
        SelectedItems: selectedItems,
        InputParameters: {},
        RequestingGrid: gridId
      });
      console.log("EA", result);

      yield* processActionResult(action)(result);
    } catch (error) {
      console.error(error);
      // TODO: Error handling
    }
  }

  *closeForm() {
    yield* this.destroyUI();
    yield* closeForm(this)();
  }

  questionSaveData() {
    return new Promise(
      action((resolve: (value: IQuestionSaveDataAnswer) => void) => {
        const closeDialog = getDialogStack(this).pushDialog(
          "",
          <QuestionSaveData
            screenTitle={getOpenedScreen(this).title}
            onSaveClick={() => {
              closeDialog();
              resolve(IQuestionSaveDataAnswer.Save);
            }}
            onDontSaveClick={() => {
              closeDialog();
              resolve(IQuestionSaveDataAnswer.NoSave);
            }}
            onCancelClick={() => {
              closeDialog();
              resolve(IQuestionSaveDataAnswer.Cancel);
            }}
          />
        );
      })
    );
  }

  *applyData(data: any): Generator {
    for (let [entityKey, entityValue] of Object.entries(data)) {
      console.log(entityKey, entityValue);
      const dataViews = getDataViewsByEntity(this, entityKey);
      for (let dataView of dataViews) {
        dataView.dataTable.clear();
        dataView.dataTable.setRecords((entityValue as any).data);
        dataView.selectFirstRow();
      }
    }
  }

  get isReadData() {
    return !getOpenedScreen(this).dontRequestData;
  }

  parent?: any;
}