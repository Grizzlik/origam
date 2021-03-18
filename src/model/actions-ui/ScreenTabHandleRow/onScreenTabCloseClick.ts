import { flow } from "mobx";
import { closeForm } from "model/actions/closeForm";
import { getFormScreenLifecycle } from "model/selectors/FormScreen/getFormScreenLifecycle";
import { getOpenedScreen } from "model/selectors/getOpenedScreen";
import { handleError } from "model/actions/handleError";
import { closingScreens } from "model/entities/FormScreenLifecycle/FormScreenLifecycle";

export function onScreenTabCloseMouseDown(ctx: any) {
  return function (event: any) {
    // OMG, how ugly is this...
    const openedScreen = getOpenedScreen(ctx);
    if(openedScreen) {
      openedScreen.isBeingClosed = true;
    }
  };
}


export function onScreenTabCloseClick(ctx: any) {
  return flow(function* onFormTabCloseClick(event: any, isDueToError?: boolean) {
    const openedScreen = getOpenedScreen(ctx);
    try {
      event?.stopPropagation?.();
      // TODO: Wait for other async operation to finish?
      if (closingScreens.has(openedScreen)) return;
      closingScreens.add(openedScreen);
      // TODO: Better lifecycle handling
      if (openedScreen.content && !openedScreen.content.isLoading) {
        const lifecycle = getFormScreenLifecycle(openedScreen.content.formScreen!);
        yield* lifecycle.onRequestScreenClose(isDueToError);
      } else {
        yield* closeForm(ctx)();
      }
    } catch (e) {
      yield* handleError(ctx)(e);
      throw e;
    } finally {
      closingScreens.delete(openedScreen);
    }
  });
}
