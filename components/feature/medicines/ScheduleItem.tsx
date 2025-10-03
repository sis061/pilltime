import { Switch } from "@/components/ui/switch";

function formatTime(time: string) {
  // time = "08:00"
  const [hours, minutes] = time.split(":").map(Number);
  const date = new Date();
  date.setHours(hours, minutes);

  return date.toLocaleTimeString("ko-KR", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true, // 오전/오후 표기
  });
}

export default function ScheduleItem({ schedule }) {
  return (
    <div className="flex items-center w-full justify-around gap-4 border-t border-t-pilltime-teal/50 !pt-4">
      <span>{formatTime(schedule?.time)}</span>
      <Switch />
    </div>
  );
}
