import { scopeFor } from "dic/Container";
import { Dropdowner } from "gui/Components/Dropdowner/Dropdowner";
import {
  CtxDataViewHeaderExtension,
  DataViewHeaderExtension,
} from "gui/Components/ScreenElements/DataView";
import { DataViewHeader } from "gui02/components/DataViewHeader/DataViewHeader";
import { DataViewHeaderAction } from "gui02/components/DataViewHeader/DataViewHeaderAction";
import { DataViewHeaderButton } from "gui02/components/DataViewHeader/DataViewHeaderButton";
import { DataViewHeaderButtonGroup } from "gui02/components/DataViewHeader/DataViewHeaderButtonGroup";
import { DataViewHeaderDropDownItem } from "gui02/components/DataViewHeader/DataViewHeaderDropDownItem";
import { DataViewHeaderGroup } from "gui02/components/DataViewHeader/DataViewHeaderGroup";
import { Dropdown } from "gui02/components/Dropdown/Dropdown";
import { DropdownItem } from "gui02/components/Dropdown/DropdownItem";
import { Icon } from "gui02/components/Icon/Icon";
import { FilterDropDown } from "gui02/connections/FilterDropDown";
import { MobXProviderContext, Observer, observer } from "mobx-react";
import uiActions from "model/actions-ui-tree";
import { getIsRowMovingDisabled } from "model/actions-ui/DataView/getIsRowMovingDisabled";
import { onColumnConfigurationClick } from "model/actions-ui/DataView/onColumnConfigurationClick";
import { onCopyRowClick } from "model/actions-ui/DataView/onCopyRowClick";
import { onCreateRowClick } from "model/actions-ui/DataView/onCreateRowClick";
import { onDeleteRowClick } from "model/actions-ui/DataView/onDeleteRowClick";
import { onExportToExcelClick } from "model/actions-ui/DataView/onExportToExcelClick";
import { onFilterButtonClick } from "model/actions-ui/DataView/onFilterButtonClick";
import { onMoveRowDownClick } from "model/actions-ui/DataView/onMoveRowDownClick";
import { onMoveRowUpClick } from "model/actions-ui/DataView/onMoveRowUpClick";
import { onNextRowClick } from "model/actions-ui/DataView/onNextRowClick";
import { onPrevRowClick } from "model/actions-ui/DataView/onPrevRowClick";
import { onRecordAuditClick } from "model/actions-ui/RecordInfo/onRecordAuditClick";
import { onRecordInfoClick } from "model/actions-ui/RecordInfo/onRecordInfoClick";
import { IAction, IActionType } from "model/entities/types/IAction";
import { getIsEnabledAction } from "model/selectors/Actions/getIsEnabledAction";
import { getDataViewLabel } from "model/selectors/DataView/getDataViewLabel";
import { getExpandedGroupRowCount } from "model/selectors/DataView/getExpandedGroupRowCount";
import { getIsAddButtonVisible } from "model/selectors/DataView/getIsAddButtonVisible";
import { getIsCopyButtonVisible } from "model/selectors/DataView/getIsCopyButtonVisible";
import { getIsDelButtonVisible } from "model/selectors/DataView/getIsDelButtonVisible";
import { getIsMoveRowMenuVisible } from "model/selectors/DataView/getIsMoveRowMenuVisible";
import { getPanelViewActions } from "model/selectors/DataView/getPanelViewActions";
import { getSelectedRow } from "model/selectors/DataView/getSelectedRow";
import { getSelectedRowIndex } from "model/selectors/DataView/getSelectedRowIndex";
import { getTotalRowCount } from "model/selectors/DataView/getTotalGroupRowCount";
import { getIsFilterControlsDisplayed } from "model/selectors/TablePanelView/getIsFilterControlsDisplayed";
import { SectionViewSwitchers } from "modules/DataView/DataViewTypes";
import { IDataViewToolbarUI } from "modules/DataView/DataViewUI";
import React, { useContext } from "react";
import Measure from "react-measure";
import { onFirstRowClick } from "../../model/actions-ui/DataView/onFirstRowClick";
import { onLastRowClick } from "../../model/actions-ui/DataView/onLastRowClick";
import { T } from "../../utils/translation";

@observer
export class CDataViewHeaderInner extends React.Component<{
  isVisible: boolean;
  extension: DataViewHeaderExtension;
}> {
  static contextType = MobXProviderContext;

  get dataView() {
    return this.context.dataView;
  }

  state = {
    hiddenActionIds: new Set<string>(),
  };

  renderActions(actions: IAction[]) {
    return actions
      .filter((action) => !action.groupId)
      .map((action, idx) => this.renderAction(action, actions));
  }

  renderAction(action: IAction, actionsToRender: IAction[]) {
    if (action.type === IActionType.Dropdown) {
      const childActions = actionsToRender.filter(
        (otherAction) => otherAction.groupId === action.id
      );
      return (
        <Dropdowner
          style={{ width: "auto" }}
          trigger={({ refTrigger, setDropped }) => (
            <Observer key={action.id}>
              {() => (
                <DataViewHeaderButton
                  title={action.caption}
                  disabled={!getIsEnabledAction(action)}
                  onClick={() => setDropped(true)}
                  domRef={refTrigger}
                >
                  {action.caption}
                </DataViewHeaderButton>
              )}
            </Observer>
          )}
          content={() => (
            <Dropdown>
              {childActions.map((action) => (
                <Observer key={action.id}>
                  {() => (
                    <DropdownItem isDisabled={!getIsEnabledAction(action)}>
                      <DataViewHeaderDropDownItem
                        onClick={(event) => uiActions.actions.onActionClick(action)(event, action)}
                      >
                        {action.caption}
                      </DataViewHeaderDropDownItem>
                    </DropdownItem>
                  )}
                </Observer>
              ))}
            </Dropdown>
          )}
        />
      );
    }
    return (
      <Observer key={action.id}>
        {() => (
          <DataViewHeaderButton
            title={action.caption}
            onClick={(event) => uiActions.actions.onActionClick(action)(event, action)}
            disabled={!getIsEnabledAction(action)}
          >
            {action.caption}
          </DataViewHeaderButton>
        )}
      </Observer>
    );
  }

  renderRowCount(){
    const selectedRowIndex = getSelectedRowIndex(this.dataView);
    const totalRowCount = getTotalRowCount(this.dataView);
    const groupRowCount = getExpandedGroupRowCount(this.dataView);
    if(groupRowCount){
      return <>
      {selectedRowIndex !== undefined ? selectedRowIndex + 1 : " - "}
                              &nbsp;/&nbsp;
                              {groupRowCount}
                              {totalRowCount ? " (" + totalRowCount + ")" : ""}
      </>
    }
    else{
      return <>
      {selectedRowIndex !== undefined ? selectedRowIndex + 1 : " - "}
                              &nbsp;/&nbsp;
                              {totalRowCount}
      </>
    }
  }

  render() {
    const { dataView } = this;
    const label = getDataViewLabel(dataView);
    const isFilterSettingsVisible = getIsFilterControlsDisplayed(dataView);
    const actions = getPanelViewActions(dataView);
    const onColumnConfigurationClickEvt = onColumnConfigurationClick(dataView);
    const onExportToExcelClickEvt = onExportToExcelClick(dataView);
    const onDeleteRowClickEvt = onDeleteRowClick(dataView);
    const onCreateRowClickEvt = onCreateRowClick(dataView);
    const onMoveRowUpClickEvt = onMoveRowUpClick(dataView);
    const isRowMovingDisabled = getIsRowMovingDisabled(dataView);
    const onMoveRowDownClickEvt = onMoveRowDownClick(dataView);
    const onCopyRowClickEvt = onCopyRowClick(dataView);
    const onFilterButtonClickEvt = onFilterButtonClick(dataView);
    const onFirstRowClickEvt = onFirstRowClick(dataView);
    const onPrevRowClickEvt = onPrevRowClick(dataView);
    const onNextRowClickEvt = onNextRowClick(dataView);
    const onLastRowClickEvt = onLastRowClick(dataView);

    const isMoveRowMenuVisible = getIsMoveRowMenuVisible(dataView);

    const isAddButton = getIsAddButtonVisible(dataView);
    const isDelButton = getIsDelButtonVisible(dataView);
    const isCopyButton = getIsCopyButtonVisible(dataView);

    const $cont = scopeFor(dataView);
    const uiToolbar = $cont && $cont.resolve(IDataViewToolbarUI);
    const selectedRow = getSelectedRow(dataView);

    return (
      <Measure bounds={true}>
        {({ measureRef, contentRect }) => {
          const containerWidth = contentRect.bounds?.width || 0;
          const isBreak640 = containerWidth < 640;
          return (
            <Observer>
            {()=>
              <DataViewHeader domRef={measureRef} isVisible={this.props.isVisible}>
                {this.props.isVisible && (
                  <>
                    <span>
                      <h2 title={label}>{label}</h2>
                    </span>

                    <div className="fullspaceBlock">
                      {isMoveRowMenuVisible ? (
                        <DataViewHeaderGroup isHidden={false} noShrink={true}>
                          <DataViewHeaderAction
                            onMouseDown={onMoveRowUpClickEvt}
                            isDisabled={isRowMovingDisabled}
                          >
                            <Icon
                              src="./icons/move-up.svg"
                              tooltip={T("Move Up", "increase_tool_tip")}
                            />
                          </DataViewHeaderAction>
                          <DataViewHeaderAction
                            onMouseDown={onMoveRowDownClickEvt}
                            isDisabled={isRowMovingDisabled}
                          >
                            <Icon
                              src="./icons/move-down.svg"
                              tooltip={T("Move Down", "decrease_tool_tip")}
                            />
                          </DataViewHeaderAction>
                        </DataViewHeaderGroup>
                      ) : null}

                      <DataViewHeaderGroup noShrink={true}>
                        {isAddButton && (
                          <DataViewHeaderAction
                            className="isGreenHover"
                            onClick={onCreateRowClickEvt}
                          >
                            <Icon src="./icons/add.svg" tooltip={T("Add", "add_tool_tip")} />
                          </DataViewHeaderAction>
                        )}

                        {isDelButton && !!selectedRow && (
                          <DataViewHeaderAction
                            className="isRedHover"
                            onMouseDown={onDeleteRowClickEvt}
                          >
                            <Icon src="./icons/minus.svg" tooltip={T("Delete", "delete_tool_tip")} />
                          </DataViewHeaderAction>
                        )}

                        {isCopyButton && !!selectedRow && (
                          <DataViewHeaderAction
                            className="isOrangeHover"
                            onMouseDown={onCopyRowClickEvt}
                          >
                            <Icon
                              src="./icons/duplicate.svg"
                              tooltip={T("Duplicate", "add_duplicate_tool_tip")}
                            />
                          </DataViewHeaderAction>
                        )}
                      </DataViewHeaderGroup>

                      <DataViewHeaderGroup grovable={true}>
                        {this.props.extension.render("actions")}
                        <DataViewHeaderButtonGroup>
                          {this.renderActions(actions)}
                        </DataViewHeaderButtonGroup>
                      </DataViewHeaderGroup>

                      {!isBreak640 && (
                        <>
                          <DataViewHeaderGroup noShrink={true}>
                            <DataViewHeaderAction onMouseDown={onFirstRowClickEvt}>
                              <Icon
                                src="./icons/list-arrow-first.svg"
                                tooltip={T("First", "move_first_tool_tip")}
                              />
                            </DataViewHeaderAction>
                            <DataViewHeaderAction onMouseDown={onPrevRowClickEvt}>
                              <Icon
                                src="./icons/list-arrow-previous.svg"
                                tooltip={T("Previous", "move_prev_tool_tip")}
                              />
                            </DataViewHeaderAction>
                            <DataViewHeaderAction onMouseDown={onNextRowClickEvt}>
                              <Icon
                                src="./icons/list-arrow-next.svg"
                                tooltip={T("Next", "move_next_tool_tip")}
                              />
                            </DataViewHeaderAction>
                            <DataViewHeaderAction onMouseDown={onLastRowClickEvt}>
                              <Icon
                                src="./icons/list-arrow-last.svg"
                                tooltip={T("Last", "move_last_tool_tip")}
                              />
                            </DataViewHeaderAction>
                          </DataViewHeaderGroup>

                          <DataViewHeaderGroup noShrink={true}>
                            {this.renderRowCount()}
                          </DataViewHeaderGroup>
                        </>
                      )}

                      <DataViewHeaderGroup noShrink={true}>
                        {uiToolbar && uiToolbar.renderSection(SectionViewSwitchers)}
                      </DataViewHeaderGroup>

                      <DataViewHeaderGroup noShrink={true}>
                        <DataViewHeaderAction
                          onMouseDown={onFilterButtonClickEvt}
                          isActive={isFilterSettingsVisible}
                          className={"test-filter-button"}
                        >
                          <Icon
                            src="./icons/search-filter.svg"
                            tooltip={T("Filter", "filter_tool_tip")}
                          />
                        </DataViewHeaderAction>
                        <FilterDropDown ctx={dataView} />
                      </DataViewHeaderGroup>
                    </div>

                    <DataViewHeaderGroup noShrink={true}>
                      <Dropdowner
                        trigger={({ refTrigger, setDropped }) => (
                          <DataViewHeaderAction
                            refDom={refTrigger}
                            onMouseDown={() => setDropped(true)}
                            isActive={false}
                          >
                            <Icon src="./icons/dot-menu.svg" tooltip={""} />
                          </DataViewHeaderAction>
                        )}
                        content={({ setDropped }) => (
                          <Dropdown>
                            <DropdownItem
                              onClick={(event: any) => {
                                setDropped(false);
                                onExportToExcelClickEvt(event);
                              }}
                            >
                              {T("Export to Excel", "excel_tool_tip")}
                            </DropdownItem>
                            <DropdownItem
                              onClick={(event: any) => {
                                setDropped(false);
                                onColumnConfigurationClickEvt(event);
                              }}
                            >
                              {T("Column configuration", "column_config_tool_tip")}
                            </DropdownItem>
                            <DropdownItem
                              isDisabled={false}
                              onClick={(event: any) => {
                                setDropped(false);
                                onRecordAuditClick(dataView)(event);
                              }}
                            >
                              {T("Show audit", "audit_title")}
                            </DropdownItem>
                            <DropdownItem
                              isDisabled={false}
                              onClick={(event: any) => {
                                setDropped(false);
                                onRecordInfoClick(dataView)(event);
                              }}
                            >
                              {T("Show record information", "info_button_tool_tip")}
                            </DropdownItem>
                          </Dropdown>
                        )}
                      />
                    </DataViewHeaderGroup>
                  </>
                )}
              </DataViewHeader>
            }
            </Observer>
          );
        }}
      </Measure>
    );
  }
}


export function CDataViewHeader(props: { isVisible: boolean }) {
  const extension = useContext(CtxDataViewHeaderExtension);
  return <CDataViewHeaderInner isVisible={props.isVisible} extension={extension} />;
}
