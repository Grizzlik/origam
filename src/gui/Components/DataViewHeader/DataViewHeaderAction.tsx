import React from "react";
import S from "gui/Components/DataViewHeader/DataViewHeaderAction.module.scss";
import cx from "classnames";

export const DataViewHeaderAction: React.FC<{
  onMouseDown?(event: any): void;
  onClick?(event: any): void;
  className?: string;
  isActive?: boolean;
  isDisabled? : boolean;
  refDom?: any;
}> = function(props){

  function onMouseDown(event: any){
    if(!props.isDisabled && props.onMouseDown){
      props.onMouseDown(event);
    }
  }

  function onClick(event: any){
    if(!props.isDisabled && props.onClick){
      props.onClick(event);
    }
  }

  return (
    <div
      className={cx(S.root, props.className, { isActive: props.isActive }, props.isDisabled ? S.isDisabled : "")}
      onMouseDown={onMouseDown}
      onClick={onClick}
      ref={props.refDom}
    >
      {props.children}
    </div>
  );
}
    
