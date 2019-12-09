import React from "react";
import S from "./TagInput.module.scss";

export const TagInput: React.FC = props => (
  <div className={S.root}>{props.children}</div>
);

export const TagInputItem: React.FC = props => (
  <div className={S.item}>{props.children}</div>
);

export const TagInputPlus: React.FC<{
  domRef?: any;
  onClick?(event: any): void;
}> = props => (
  <div className={S.plus} ref={props.domRef} onClick={props.onClick}>
    <i className="fas fa-plus" />
  </div>
);

export const TagInputDeleteBtn: React.FC<{
  onClick?(event: any): void;
}> = props => (
  <div className={S.closeBtn} onClick={props.onClick}>
    <i className="fas fa-times" />
  </div>
);

export const TagInputEdit: React.FC<{
  value?: any;
  domRef?: any;
  onKeyDown?(event: any): void;
  onFocus?(event: any): void;
  onChange?(event: any): void;
}> = props => (
  <input
    ref={props.domRef}
    className={S.input}
    value={props.value}
    onKeyDown={props.onKeyDown}
    onFocus={props.onFocus}
    onChange={props.onChange}
  />
);

export const TagInputEditFake: React.FC<{
  domRef?: any;
  onKeyDown?(event: any): void;
}> = props => (
  <input
    className={S.fakeInput}
    onKeyDown={props.onKeyDown}
    ref={props.domRef}
  />
);