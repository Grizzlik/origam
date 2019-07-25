import { IOpenedScreen } from "./IOpenedScreen";

export enum IApplicationPage {
  Login = "Login",
  Workbench = "Workbench"
}

export interface IApplicationLifecycleData {}

export interface IApplicationLifecycle extends IApplicationLifecycleData {
  $type_IApplicationLifecycle: 1;

  parent?: any;
  shownPage: IApplicationPage;
  isWorking: boolean;

  loginPageMessage?: string;

  onLoginFormSubmit(args: {
    event: any;
    userName: string;
    password: string;
  }): void;
  onSignOutClick(args: { event: any }): void;

  onMainMenuItemClick(args: { event: any; item: any }): void;

  onScreenTabHandleClick(event: any, openedScreen: IOpenedScreen): void;
  onScreenTabCloseClick(event: any, openedScreen: IOpenedScreen): void;

  run(): void;

  setLoginPageMessage(msg: string): void;
  resetLoginPageMessage(): void;
}

export const isIApplicationLifecycle = (o: any): o is IApplicationLifecycle =>
  o.$type_IApplicationLifecycle;