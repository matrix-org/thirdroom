import { OverlayWindow, SidebarTabs, useStore } from "../../../hooks/useStore";
import AddIC from "../../../../../res/ic/add.svg";
import { Text } from "../../../atoms/text/Text";
import "./RoomListHeader.css";
import { IconButton } from "../../../atoms/button/IconButton";
import { DmDialog } from "../dialogs/DmDialog";
import { JoinWithAliasDialog } from "../dialogs/JoinWithAliasDialog";
import { DropdownMenu } from "../../../atoms/menu/DropdownMenu";
import { DropdownMenuItem } from "../../../atoms/menu/DropdownMenuItem";
import { useDialog } from "../../../hooks/useDialog";
import { Dialog } from "../../../atoms/dialog/Dialog";

export function RoomListHeader() {
  const { selectedSidebarTab } = useStore((state) => state.overlaySidebar);
  const { selectWindow } = useStore((state) => state.overlayWindow);
  const { open, setOpen, openDialog, closeDialog } = useDialog(false);
  const {
    open: openJoin,
    setOpen: setJoinOpen,
    openDialog: openJoinDialog,
    closeDialog: closeJoinDialog,
  } = useDialog(false);

  return (
    <header className="RoomListHeader shrink-0 flex items-center gap-xs">
      {selectedSidebarTab === SidebarTabs.Home && (
        <>
          <Text className="grow truncate" variant="s2" weight="semi-bold">
            Home
          </Text>
          <Dialog open={openJoin} onOpenChange={setJoinOpen}>
            <JoinWithAliasDialog requestClose={closeJoinDialog} />
          </Dialog>
          <DropdownMenu
            content={
              <>
                <DropdownMenuItem onSelect={() => selectWindow(OverlayWindow.CreateWorld)}>
                  Create World
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={openJoinDialog}>Join with Alias</DropdownMenuItem>
              </>
            }
          >
            <IconButton label="Add" iconSrc={AddIC} />
          </DropdownMenu>
        </>
      )}
      {selectedSidebarTab === SidebarTabs.Friends && (
        <>
          <Text className="grow truncate" variant="s2" weight="semi-bold">
            Friends
          </Text>
          <Dialog open={open} onOpenChange={setOpen}>
            <DmDialog requestClose={closeDialog} />
          </Dialog>
          <IconButton onClick={openDialog} label="Direct Message" iconSrc={AddIC} />
        </>
      )}
      {selectedSidebarTab === SidebarTabs.Notifications && (
        <>
          <Text className="grow truncate" variant="s2" weight="semi-bold">
            Notifications
          </Text>
        </>
      )}
    </header>
  );
}
