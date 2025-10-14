import { Info, Settings } from "lucide-react";
// import Image from "next/image";
import ScheduleItem from "./ScheduleItem";
import Link from "next/link";
import { MedicineDetail } from "@/types/medicines";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { ZoomableImage } from "@/components/layout/ZoomableImage";
import { RenderTodaysMedicine } from "@/lib/medicine";

export default function MedicineCard(medicine: MedicineDetail) {
  const { id, name, imageUrl, description, schedules } = medicine;
  const isMedicineTakenToday = RenderTodaysMedicine(
    schedules[0]?.repeated_pattern
  );

  return (
    <>
      <div className="border-2 bg-white border-pilltime-blue/50 rounded-md !px-4 !py-8 flex flex-col gap-4 shadow-md">
        <div className="flex items-center gap-4 w-full relative">
          <div className="rounded-md overflow-hidden border border-pilltime-violet/50 shadow-sm">
            <ZoomableImage
              src={imageUrl}
              alt="fallback-medicine"
              width={120}
              height={120}
            />
            {/* <Image
              src={imageUrl}
              alt="fallback-medicine"
              width={120}
              height={120}
            /> */}
          </div>
          <div className="grow">
            <div className="flex flex-col items-center justify-center gap-2">
              <span className="font-bold !text-pilltime-grayDark">{name}</span>
            </div>
          </div>

          <div className="absolute -top-4 right-0">
            <div className="flex items-center justify-between gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Info
                    size={20}
                    className="cursor-pointer"
                    strokeWidth={2.5}
                    color="#F9731690"
                  />
                </PopoverTrigger>
                <PopoverContent
                  align="end"
                  sideOffset={4}
                  alignOffset={8}
                  className="max-w-60 min-w-24 border-2 bg-white rounded-md !py-3 !px-2 *:text-[16px] !border-[#F9731690] shadow-lg transition-opacity duration-150 "
                >
                  <ul className="flex flex-col gap-1 list-disc [&_>li]:!ml-4 w-full">
                    {description.map((text, i) => (
                      <li key={i}>{text}</li>
                    ))}
                  </ul>
                </PopoverContent>
              </Popover>

              <Link href={`/medicines/${id}/edit`}>
                <Settings
                  size={20}
                  className="cursor-pointer"
                  strokeWidth={2.5}
                  color="#F97316"
                />
              </Link>
            </div>
          </div>
        </div>
        <div className="!py-4 !px-2 relative">
          {!isMedicineTakenToday && (
            <div className="absolute top-0 left-0 bg-black/50 w-full h-full rounded-sm z-10 flex items-center justify-center backdrop-blur-xs">
              <span className="!text-pilltime-grayLight font-bold text-lg">
                오늘은 먹을 약이 없네요!
              </span>
            </div>
          )}
          <ul className={`flex flex-col gap-4`}>
            {schedules.map((schedule) => (
              <li key={schedule?.id}>
                <ScheduleItem {...schedule} />
              </li>
            ))}
          </ul>
        </div>
      </div>
    </>
  );
}
