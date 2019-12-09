import { getFormScreen } from "./getFormScreen";
import { getOpenedScreen } from "../getOpenedScreen";

export function getIsFormScreenDirty(ctx: any) {
  const openedScreen = getOpenedScreen(ctx);
  if (openedScreen.content && !openedScreen.content.isLoading) {
    return openedScreen.content.formScreen!.isDirty;
  } else {
    return false;
  }
}