import React from "react";
import { IWorkbench } from "model/entities/types/IWorkbench";
import { MobXProviderContext, observer } from "mobx-react";
import { WorkQueuesItem } from "gui/Components/WorkQueues/WorkQueuesItem";
import { flow } from "mobx";
import { Icon } from "gui/Components/Icon/Icon";
import { getActiveScreen } from "model/selectors/getActiveScreen";
import { getChatrooms } from "model/selectors/Chatrooms/getChatrooms";
import { onChatroomsListItemClick } from "model/actions/Chatrooms/onChatroomsListItemClick";
import { openNewUrl } from "model/actions/Workbench/openNewUrl";
import { IUrlUpenMethod } from "model/entities/types/IUrlOpenMethod";
import { T } from "utils/translation";

@observer
export class CChatSection extends React.Component {
  static contextType = MobXProviderContext;

  get workbench(): IWorkbench {
    return this.context.workbench;
  }

  get sortedItems() {
    return getChatrooms(this.workbench).items;
  }

  render() {
    return (
      <>
        <WorkQueuesItem
          isEmphasized={false}
          isOpenedScreen={false}
          isActiveScreen={false}
          icon={<Icon src="./icons/add.svg" tooltip={T("New Chat", "new_chat")} />}
          label={<>{T("New Chat", "new_chat")}</>}
          onClick={(event) => {
            const self = this;
            flow(function* () {
              yield* openNewUrl(self.workbench)(
                `chatrooms/index.html#/chatroom`,
                IUrlUpenMethod.OrigamTab,
                "New Chat"
              );
            })();
          }}
        />
        {this.sortedItems.map((item) => {
          const activeScreen = getActiveScreen(this.workbench);
          const activeMenuItemId = activeScreen ? activeScreen.menuItemId : undefined;
          return (
            <WorkQueuesItem
              isEmphasized={item.unreadMessageCount > 0}
              isOpenedScreen={this.workbench.openedScreenIdSet.has(item.id)}
              isActiveScreen={activeMenuItemId === item.id}
              icon={<Icon src="./icons/chat.svg" tooltip={item.topic} />}
              label={
                <>
                  {item.topic}
                  {item.unreadMessageCount > 0 && <> ({item.unreadMessageCount})</>}
                </>
              }
              onClick={(event) => onChatroomsListItemClick(this.workbench)(event, item)}
              id={item.id}
            />
          );
        })}
      </>
    );
  }
}
