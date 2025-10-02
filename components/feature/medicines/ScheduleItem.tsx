import { Switch } from "@/components/ui/switch";

export default function ScheduleItem() {
  return (
    <div className="flex items-center w-full justify-around gap-4 border-t border-t-pilltime-teal/50 !pt-4">
      <span>오전 08:00</span>
      <Switch />
    </div>
  );
}
