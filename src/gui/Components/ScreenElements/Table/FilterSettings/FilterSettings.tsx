import React, { useContext } from "react";
import { FilterSettingsBoolean } from "./HeaderControls/FilterSettingsBoolean";
import { IProperty } from "model/entities/types/IProperty";
import { FilterSettingsString } from "./HeaderControls/FilterSettingsString";
import { FilterSettingsDate } from "./HeaderControls/FilterSettingsDate";
import { observer } from "mobx-react-lite";
import { FilterSettingsNumber } from "./HeaderControls/FilterSettingsNumber";
import { FilterSettingsLookup, LookupFilterSetting } from "./HeaderControls/FilterSettingsLookup";
import { flow } from "mobx";
import { MobXProviderContext } from "mobx-react";
import { onApplyFilterSetting } from "model/actions-ui/DataView/TableView/onApplyFilterSetting";
import { getFilterSettingByProperty } from "model/selectors/DataView/getFilterSettingByProperty";
import { getDataTable } from "model/selectors/DataView/getDataTable";
import { getDataView } from "model/selectors/DataView/getDataView";
import { IFilterSetting } from "model/entities/types/IFilterSetting";
import { getAllLookupIds } from "model/entities/getAllLookupIds";
import {FilterSettingsTagInput} from "gui/Components/ScreenElements/Table/FilterSettings/HeaderControls/FilterSettingsTagInput";

export const FilterSettings: React.FC = observer((props) => {
  const property = useContext(MobXProviderContext).property as IProperty;

  function getSettings(defaultValue: IFilterSetting) {
    let setting = getFilterSettingByProperty(property, property.id);
    if (!setting) {
      setting = defaultValue;
      onApplyFilterSetting(property)(setting);
    }
    return setting;
  }

  switch (property.column) {
    case "Text":
      return <FilterSettingsString setting={getSettings(FilterSettingsString.defaultSettings)} />;
    case "CheckBox":
      return <FilterSettingsBoolean setting={getSettings(FilterSettingsBoolean.defaultSettings)} />;
    case "Date":
      return <FilterSettingsDate setting={getSettings(FilterSettingsDate.defaultSettings)} />;
    case "Number":
      return <FilterSettingsNumber setting={getSettings(FilterSettingsNumber.defaultSettings)} />;
    case "ComboBox":
      const setting = getSettings(FilterSettingsLookup.defaultSettings);
      setting.lookupId = property.lookupId;
      return (
        <FilterSettingsLookup
          setting={setting}
          property={property}
          lookup={property.lookup!}
          getOptions={flow(function* (searchTerm: string) {
            let allLookupIds = yield* getAllLookupIds(property);
            const lookupMap = yield property.lookupEngine?.lookupResolver.resolveList(allLookupIds);

            return Array.from(allLookupIds.values())
              .map((id) => [id, lookupMap.get(id)])
              .filter
              (
                (array) =>
                  array[1] &&
                  array[1].toLocaleLowerCase().includes((searchTerm || "").toLocaleLowerCase())
              );
          })}
        />
      );
    case "TagInput":
      return (
        <FilterSettingsTagInput
          setting={getSettings(FilterSettingsTagInput.defaultSettings)}
          property={property}
          lookup={property.lookup!}
          getOptions={flow(function* (searchTerm: string) {
            let allLookupIds = yield* getAllLookupIds(property);
            const lookupMap: Map<any, any> =
              yield property.lookupEngine?.lookupResolver.resolveList(allLookupIds);
            return Array.from(lookupMap.entries())
              .filter
              (
                (array) =>
                  array[1] &&
                  array[1].toLocaleLowerCase().includes((searchTerm || "").toLocaleLowerCase())
              )
              .sort((x,y) => x[1] > y[1] ? 1 : -1);
          })}
        />
      );
    default:
      return <>{property.column}</>;
  }
});
