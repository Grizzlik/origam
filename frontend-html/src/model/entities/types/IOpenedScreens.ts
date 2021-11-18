import {IOpenedScreen} from "./IOpenedScreen";
import {IAction} from "./IAction";

export interface IOpenedScreensData {}

export interface IOpenedScreens extends IOpenedScreensData {
  $type_IOpenedScreens: 1;

  items: Array<IOpenedScreen>;
  activeItem: IOpenedScreen | undefined;

  activeScreenActions: Array<{
    section: string;
    actions: IAction[];
  }>;

  isShown(openedScreen: IOpenedScreen): boolean;
  pushItem(item: IOpenedScreen): void;
  deleteItem(menuItemId: string, order: number): void;
  activateItem(menuItemId: string, order: number): void;
  findLastExistingTabItem(menuItemId: string): IOpenedScreen | undefined;
  findTopmostItemExcept(menuItemId: string, order: number): IOpenedScreen | undefined;

  parent?: any;
}

export const isIOpenedScreens = (o: any): o is IOpenedScreens =>
  o.$type_IOpenedScreens;
