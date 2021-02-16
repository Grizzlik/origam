import React from "react";
import S from "gui/Components/Screen/Screen.module.scss";
import cx from "classnames";

export const Screen: React.FC<{ isHidden?: boolean }> = props => (
  <div className={cx(S.root, { isHidden: props.isHidden })}>
    {props.children}
  </div>
);
