import MedicineCard from "@/components/feature/medicines/MedicineCard";

const medicines = [
  {
    id: "1",
    name: "혈압약",
    imageUrl: "",
    description: ["주 1회", "아침 저녁"],
    schedules: [
      {
        time: "08:00",
      },
      {
        time: "15:00",
      },
    ],
  },
  {
    id: "2",
    name: "비타민D",
    imageUrl: "",
    description: ["주 1회", "아침 점심 저녁"],
    schedules: [
      {
        time: "08:00",
      },
      {
        time: "15:00",
      },
      {
        time: "19:00",
      },
    ],
  },
];

export default function Home() {
  return (
    <section className="inner !text-pilltime-blue text-3xl !mx-auto !w-full h-full !mt-12 !p-2">
      <div>
        {new Date().getMonth() + 1}월 {new Date().getDate()}일 수요일
      </div>
      {medicines.map((m) => (
        <MedicineCard key={m.id} {...m} />
      ))}
    </section>
  );
}
