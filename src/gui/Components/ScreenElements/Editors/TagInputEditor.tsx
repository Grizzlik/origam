import React from "react";
import { Tooltip } from "react-tippy";

import CS from "./CommonStyle.module.css";
import S from "./TagInputEditor.module.css";

import { TagInput, TagInputItem } from "gui/Components/TagInput/TagInput";
import { observer } from "mobx-react";
import { inject } from "mobx-react";
import { IProperty } from "model/entities/types/IProperty";
import { getDataTable } from "model/selectors/DataView/getDataTable";

@inject(({ property }: { property: IProperty }, { value }) => {
  const dataTable = getDataTable(property);
  const lookup = property.lookup!;
  return {
    textualValue: dataTable.resolveCellText(property, value)
  };
})
@observer
export class TagInputEditor extends React.Component<{
  value: string[];
  textualValue?: string[];
  isReadOnly: boolean;
  isInvalid: boolean;
  invalidMessage?: string;
  isFocused: boolean;
  backgroundColor?: string;
  foregroundColor?: string;
  refocuser?: (cb: () => void) => () => void;
  onChange?(event: any, value: string): void;
  onKeyDown?(event: any): void;
  onClick?(event: any): void;
  onEditorBlur?(event: any): void;
}> {
  render() {
    return (
      // TODO: Proper keys for tag input items...?
      <div className={CS.editorContainer}>
        <TagInput className={S.tagInput}>
          {this.props.value
            ? this.props.value.map((valueItem, idx) => (
                <TagInputItem key={valueItem}>
                  {this.props.textualValue![idx] || ""}
                </TagInputItem>
              ))
            : null}
        </TagInput>
        {/* <input
          style={{
            color: this.props.foregroundColor,
            backgroundColor: this.props.backgroundColor
          }}
          className={CS.editor}
          type="text"
          value={this.props.value || ""}
          readOnly={true || this.props.isReadOnly}
          // ref={this.refInput}
          onChange={(event: any) =>
            this.props.onChange &&
            this.props.onChange(event, event.target.value)
          }
          onKeyDown={this.props.onKeyDown}
          onClick={this.props.onClick}
          onBlur={this.props.onEditorBlur}
          // onFocus={this.handleFocus}
        />*/}
        {this.props.isInvalid && (
          <div className={CS.notification}>
            <Tooltip html={this.props.invalidMessage} arrow={true}>
              <i className="fas fa-exclamation-circle red" />
            </Tooltip>
          </div>
        )}
      </div>
    );
  }
}