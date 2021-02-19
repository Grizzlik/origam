import { FormScreenBuilder } from "gui/Workbench/ScreenArea/FormScreenBuilder";
import { observer, Provider } from "mobx-react";
import { IOpenedScreen } from "model/entities/types/IOpenedScreen";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Screen } from "gui/Components/Screen/Screen";
import { CtxPanelVisibility } from "gui/contexts/GUIContexts";
import { WebScreen } from "gui/Components/WebScreen/WebScreen";
import { IWebScreen } from "model/entities/types/IWebScreen";
import { getIsTopmostNonDialogScreen } from "model/selectors/getIsTopmostNonDialogScreen";
import { ErrorBoundary, ErrorBoundaryEncapsulated } from "gui/Components/Utilities/ErrorBoundary";
import { IFormScreenEnvelope } from "model/entities/types/IFormScreen";
import { onIFrameClick } from "model/actions/WebScreen/onIFrameClick";

const WebScreenComposite: React.FC<{ openedScreen: IOpenedScreen }> = observer((props) => {
  const { openedScreen } = props;
  const [isLoading, setLoading] = useState(false);
  const refIFrame = useRef<any>(null);
  useEffect(() => {
    if (openedScreen.screenUrl) {
      setLoading(true);
    }
  }, []);
  useEffect(() => {
    const handle = setInterval(() => {
      setTabTitleFromIFrame();
    }, 10000);
    return () => clearTimeout(handle);
  }, []);

  useEffect(() => {
    const frameWindow = refIFrame.current;
    const contentDocument = frameWindow?.contentDocument;

    if (contentDocument) {
      const mo = new MutationObserver(() => {
        setTabTitleFromIFrame();
      });
      mo.observe(contentDocument.querySelector("head")!, {
        subtree: true,
        characterData: true,
        childList: true,
      });
      return () => mo.disconnect();
    }
  });
  const setTabTitleFromIFrame = useMemo(
    () => () => {
      const frameWindow = refIFrame.current;
      const contentDocument = frameWindow?.contentDocument;
      if (contentDocument?.title) {
        ((openedScreen as unknown) as IWebScreen).setTitle(contentDocument.title);
      }
    },
    []
  );

  const initIFrame = useMemo(
    () => () => {
      const frameWindow = refIFrame.current;
      const contentDocument = frameWindow?.contentDocument;

      if (contentDocument) {
        contentDocument.addEventListener(
          "click",
          (event: any) => {
            onIFrameClick(openedScreen)(event);
          },
          true
        );
      }
    },
    []
  );
  return (
    <Screen isHidden={!getIsTopmostNonDialogScreen(openedScreen)}>
      <WebScreen
        url={openedScreen.screenUrl || ""}
        isLoading={isLoading}
        onLoad={(event: any) => {
          event.persist();
          setTabTitleFromIFrame();
          initIFrame();
          setLoading(false);
        }}
        refIFrame={(elm: any) => {
          refIFrame.current = elm;
          ((openedScreen as unknown) as IWebScreen).setReloader(
            elm
              ? {
                  reload: () => {
                    setLoading(true);
                    elm.contentWindow.location.reload();
                  },
                }
              : null
          );
        }}
      />
    </Screen>
  );
});

@observer
export class CScreen extends React.Component<{
  openedScreen: IOpenedScreen;
}> {
  render() {
    const { openedScreen } = this.props;
    if (openedScreen.screenUrl) {
      return (
        <ErrorBoundaryEncapsulated ctx={openedScreen}>
          <WebScreenComposite openedScreen={openedScreen} />
        </ErrorBoundaryEncapsulated>
      );
    }
    if (!openedScreen.content) return null;
    const formScreen = openedScreen.content;
    return !formScreen.isLoading ? (
      <Provider key={formScreen.formScreen!.screenUI.$iid} formScreen={formScreen}>
        <ErrorBoundaryEncapsulated ctx={openedScreen}>
          <CScreenInner openedScreen={openedScreen} formScreen={formScreen} />
        </ErrorBoundaryEncapsulated>
      </Provider>
    ) : null;
  }
}

@observer
class CScreenInner extends React.Component<{
  openedScreen: IOpenedScreen;
  formScreen: IFormScreenEnvelope;
}> {
  render() {
    const { openedScreen, formScreen } = this.props;
    return (
      <Screen isHidden={!getIsTopmostNonDialogScreen(openedScreen)}>
        <CtxPanelVisibility.Provider
          value={{ isVisible: getIsTopmostNonDialogScreen(openedScreen) }}
        >
          <FormScreenBuilder xmlWindowObject={formScreen.formScreen!.screenUI} />
        </CtxPanelVisibility.Provider>
      </Screen>
    );
  }
}