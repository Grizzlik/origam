import { IDockType, IProperty, IPropertyData } from "./types/IProperty";
import { ICaptionPosition } from "./types/ICaptionPosition";
import { IPropertyColumn } from "./types/IPropertyColumn";
import { action, computed, observable } from "mobx";

import { ILookup } from "./types/ILookup";
import { getDataSourceFieldByName } from "model/selectors/DataSources/getDataSourceFieldByName";
import { IDataSourceField } from "./types/IDataSourceField";
import { LookupResolver } from "modules/Lookup/LookupResolver";
import { LookupLabelsCleanerReloader } from "modules/Lookup/LookupCleanerLoader";
import {getDataTable} from "model/selectors/DataView/getDataTable";

export class Property implements IProperty {
  $type_IProperty: 1 = 1;

  constructor(data: IPropertyData) {
    Object.assign(this, data);
    if (this.lookup) {
      this.lookup.parent = this;
    }
  }

  autoSort: boolean = false;
  id: string = "";
  tabIndex: string | undefined;
  modelInstanceId: string = "";
  name: string = "";
  nameOverride: string | null | undefined = null;
  readOnly: boolean = false;
  x: number = 0;
  y: number = 0;
  width: number = 0;
  height: number = 0;
  captionLength: number = 0;
  captionPosition?: ICaptionPosition;
  entity: string = "";
  column: IPropertyColumn = IPropertyColumn.Text;
  dock?: IDockType | undefined;
  multiline: boolean = false;
  isPassword: boolean = false;
  isRichText: boolean = false;
  maxLength: number = 0;
  allowReturnToForm?: boolean | undefined;
  isTree?: boolean | undefined;
  formatterPattern: string = "";
  customNumericFormat: string = "";
  gridColumnWidth: number = 100;
  @observable columnWidth: number = 100;
  identifier?: string;
  lookup?: ILookup;
  lookupId?: string;
  lookupEngine?: ILookupIndividualEngine = null as any;
  childProperties: IProperty[] = [];
  isAggregatedColumn: boolean = false;
  isLookupColumn: boolean = false;
  style: any;
  controlPropertyId?: string;
  toolTip: string = null as any;
  suppressEmptyColumns: boolean = false;
  supportsServerSideSorting: boolean = false;

  linkToMenuId?: string = undefined;
  linkDependsOnValue: boolean = false;

  isFormField: boolean = false;

  get isLookup() {
    return !!this.lookup;
  }

  get isLink() {
    return !!this.linkToMenuId || this.linkDependsOnValue;
  }

  @action.bound setColumnWidth(width: number) {
    this.columnWidth = width;
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

  @action.bound
  stop() {
    
  }

  parent: any;
  xmlNode = undefined;

  getPolymophicProperty(row: any[]): IProperty {
    const dataSourceField = getDataSourceFieldByName(this, this.controlPropertyId!)!;
    const controlPropertyValue = getDataTable(this)
      .getCellValueByDataSourceField(row, dataSourceField);
    return this.childProperties
      .find(prop => prop.controlPropertyValue === controlPropertyValue)
      ?? this;
  }
}


export interface ILookupIndividualEngine {
  lookupResolver: LookupResolver;
  lookupCleanerReloader: LookupLabelsCleanerReloader;
  startup(): void;
  teardown(): void;
  cleanAndReload(): void;
};