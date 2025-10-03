// TODO 타입 지정 및 타입 폴더 분리 필요

import { Info, Settings } from "lucide-react";
import Image from "next/image";
import ScheduleItem from "./ScheduleItem";
import Link from "next/link";

export default function MedicineCard({
  id,
  name,
  imageUrl,
  description,
  schedules,
}) {
  return (
    <>
      <div className="border border-pilltime-teal rounded-md !px-4 !py-8 flex flex-col gap-4">
        <div className="flex items-center gap-4 w-full">
          <div>
            <Image
              src={imageUrl}
              // src={"/fallback-medicine.png"}
              alt="fallback-medicine"
              width={100}
              height={100}
            />
          </div>
          <div className="grow">
            <ul className="flex items-center gap-2">
              <li className="font-bold ">{name}</li>
              <li>
                <Info size={20} />
              </li>
            </ul>
          </div>

          <div className="self-start">
            <Link href={`/medicines/${id}/edit`}>
              <Settings size={20} className="cursor-pointer" />
            </Link>
          </div>
        </div>
        <div className="!py-4 !px-2">
          <ul className="flex flex-col gap-4">
            {schedules.map((schedule) => (
              <li key={schedule?.id}>
                <ScheduleItem schedule={schedule} />
              </li>
            ))}
          </ul>
        </div>
      </div>
    </>
  );
}
