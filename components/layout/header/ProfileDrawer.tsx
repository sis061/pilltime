"use client";

import { SmartButtonGroup } from "./SmartButtons";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { UserCog } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  logout: () => Promise<void> | void;
  openNickname: () => void;
  buttons: any[];
  menuButtons: any[];
}

export default function ProfileDrawer({
  open,
  onOpenChange,
  logout,
  openNickname,
  buttons,
  menuButtons,
}: Props) {
  return (
    <Drawer
      open={open}
      onOpenChange={onOpenChange}
      direction="right"
      repositionInputs={false}
    >
      <DrawerContent className="!p-4 bg-slate-100 h-[100dvh] w-[180px] !ml-auto rounded-tr-none rounded-bl-[10px]">
        <DrawerHeader className="flex justify-end border-b border-pilltime-teal/50 h-13.5">
          <Button
            onClick={() => onOpenChange(false)}
            variant="ghost"
            className="!font-bold !text-pilltime-violet"
          >
            닫기
          </Button>
          <DrawerTitle className="hidden">메뉴 창</DrawerTitle>
        </DrawerHeader>

        <div className="!mt-2">
          <div className="font-bold !text-pilltime-blue text-sm !p-2 flex gap-2 [&_svg:not([class*='size-'])]:size-5">
            <UserCog className="!mr-2" color="#3B82F6" />
            프로필 관리
          </div>

          <div className="flex flex-col w-full items-start !pl-2">
            {menuButtons.map(({ key, label, iconLeft: Icon, onClick }) => (
              <Button
                key={key}
                variant="ghost"
                onClick={() => {
                  if (key === "edit") openNickname();
                  if (key === "logout") logout();
                  onOpenChange(false);
                }}
                className="font-bold cursor-pointer !text-pilltime-blue text-xs !p-2 h-8 flex"
              >
                {Icon ? (
                  <Icon className="!mr-1 h-5 w-5" color="#3B82F6" />
                ) : null}
                {label}
              </Button>
            ))}
          </div>
          <SmartButtonGroup
            items={buttons}
            // className="flex-col items-start pt-2"
          />
        </div>
      </DrawerContent>
    </Drawer>
  );
}
