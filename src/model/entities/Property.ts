import { IPropertyData, IProperty } from "./types/IProperty";
import { ICaptionPosition } from "./types/ICaptionPosition";
import { IDropDownColumn } from "./types/IDropDownColumn";
import { IPropertyColumn } from "./types/IPropertyColumn";
import { observable, computed } from "mobx";

import { ILookup } from "./types/ILookup";
import { getDataSourceFieldIndexByName } from "../selectors/DataSources/getDataSourceFieldIndexByName";
import { getDataSourceFieldByName } from "model/selectors/DataSources/getDataSourceFieldByName";
import { IDataSource } from "./types/IDataSource";
import { IDataSourceField } from "./types/IDataSourceField";

export class Property implements IProperty {
  $type_IProperty: 1 = 1;

  constructor(data: IPropertyData) {
    Object.assign(this, data);
    if(this.lookup) {
      this.lookup.parent = this;
    }
  }

  id: string = "";
  modelInstanceId: string = "";
  name: string = "";
  readOnly: boolean = false;
  x: number = 0;
  y: number = 0;
  width: number = 0;
  height: number = 0;
  captionLength: number = 0;
  captionPosition?: ICaptionPosition;
  entity: string = "";
  column: IPropertyColumn = IPropertyColumn.Text;
  dock?: string | undefined;
  multiline: boolean = false;
  isPassword: boolean = false;
  isRichText: boolean = false;
  maxLength: number = 0;
  allowReturnToForm?: boolean | undefined;
  isTree?: boolean | undefined;
  formatterPattern: string = "";
  lookup?: ILookup;
  get isLookup() {
    return !!this.lookup;
  }
  

  @computed get dataSourceIndex(): number {
    return this.dataSourceField.index;
  }

  @computed get dataIndex() {
    return this.dataSourceIndex;
  }
  
  @computed get dataSourceField(): IDataSourceField {
    return getDataSourceFieldByName(this, this.id)!;
  }

  parent: any;
}