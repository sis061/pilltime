import fallbackImg from "@/public/fallback-medicine.webp";
import { useState, type JSX } from "react";

// ---- NEXT
import Image from "next/image";
import { useRouter } from "next/navigation";

// ---- UI
import {
  AlarmClock,
  Check,
  CirclePlus,
  Info,
  Menu,
  PinOff,
  Redo2,
  Settings,
  Share,
  SquarePlus,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

// ---- UTIL
import { StepId } from "@/lib/guideImages";
import { guidePath } from "@/lib/imageWarm";

type GuideImgProps = {
  folder: string;
  file: string;
  alt: string;
  w: number;
  h: number;
  caption?: string;
  eager?: boolean;
  maxW?: number; // 레이아웃 기준 폭
};

export function GuideImg({
  folder,
  file,
  alt,
  w,
  h,
  caption,
  eager = false,
  maxW = 900,
}: GuideImgProps) {
  const [loaded, setLoaded] = useState(false);
  const [useFallback, setUseFallback] = useState(false);

  const displayW = Math.min(maxW, w);
  const displayH = Math.round((displayW * h) / w);

  const src = useFallback ? (fallbackImg as any) : guidePath(folder, file);

  return (
    <figure className="rounded-xl border overflow-hidden shadow-md bg-white">
      <div className="relative" style={{ width: "100%", height: "auto" }}>
        <Image
          src={src}
          alt={alt}
          width={displayW}
          height={displayH}
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 80vw, 900px"
          priority={eager}
          fetchPriority={eager ? "high" : "auto"}
          className={
            loaded ? "opacity-100 transition-opacity duration-300" : "opacity-0"
          }
          style={{ width: "100%", height: "auto", display: "block" }}
          onLoad={() => setLoaded(true)}
          onError={() => {
            if (!useFallback) {
              setUseFallback(true);
              setLoaded(false);
            }
          }}
        />
        {!loaded && (
          <Skeleton className="absolute inset-0 h-full w-full bg-[#2D383E]" />
        )}
      </div>
      {caption && (
        <figcaption className="px-3 py-2 text-xs text-gray-600">
          {caption}
        </figcaption>
      )}
    </figure>
  );
}

/* ------------
 * 1. 약 정보 추가
 * ------------ */

const NewStep = () => (
  <div className="!space-y-4">
    <p className="text-base font-bold text-pilltime-grayDark/75">
      1. 등록하러 가기
    </p>
    <GuideImg
      folder="new"
      file="01.webp"
      alt="새로운 약 등록"
      w={860}
      h={1864}
      eager
    />
    <p className="text-sm text-pilltime-grayDark/75">
      &apos;아맞다약!&apos;이 처음이라면{" "}
      <CirclePlus
        strokeWidth={2}
        size={16}
        color="#3b82f6"
        className="inline-block"
      />{" "}
      을 눌러서 약을 등록해 주세요.
    </p>
    <GuideImg
      folder="new"
      file="02.webp"
      alt="새로운 약 등록"
      w={860}
      h={1864}
      eager
    />
    <GuideImg
      folder="new"
      file="03.webp"
      alt="새로운 약 등록"
      w={1272}
      h={160}
    />
    <p className="text-sm text-pilltime-grayDark/75">
      모바일에선 <Menu strokeWidth={2} size={16} className="inline-block" />{" "}
      &gt; <strong>새로운 약 등록</strong>을, 기타 환경에선 화면 상단{" "}
      <strong>새로운 약 등록</strong>을 눌러주세요.
    </p>
    <p className="text-base font-bold text-pilltime-grayDark/75">
      2. 약 이름 등록하기
    </p>
    <GuideImg
      folder="new"
      file="04.webp"
      alt="새로운 약 등록"
      w={832}
      h={1810}
    />
    <p className="text-base font-bold text-pilltime-grayDark/75">
      3. 상세정보 등록하기
    </p>
    <GuideImg
      folder="new"
      file="05.webp"
      alt="새로운 약 등록"
      w={832}
      h={1808}
    />
    <p className="text-sm text-pilltime-grayDark/75">
      필요한 경우, 약과 관련된 짧은 정보를 한줄 씩 기록하세요.
    </p>
    <GuideImg
      folder="new"
      file="06.webp"
      alt="새로운 약 등록"
      w={832}
      h={1808}
    />
    <p className="text-sm text-pilltime-grayDark/75">
      <strong>추가</strong>를 눌러 자유롭게 상세 내용을 더 입력하세요. 원치 않을
      경우에는 <strong>삭제</strong>를 눌러 해당 정보를 지우세요.
    </p>
    <p className="text-base font-bold text-pilltime-grayDark/75">
      4. 일정 등록하기
    </p>
    <GuideImg
      folder="new"
      file="07.webp"
      alt="새로운 약 등록"
      w={832}
      h={1806}
    />
    <p className="text-sm text-pilltime-grayDark/75">
      약을 언제 먹을지 복용 주기와 시간을 입력하세요.
    </p>
    <GuideImg
      folder="new"
      file="09.webp"
      alt="새로운 약 등록"
      w={832}
      h={624}
    />
    <GuideImg
      folder="new"
      file="10.webp"
      alt="새로운 약 등록"
      w={834}
      h={626}
    />
    <p className="text-sm text-pilltime-grayDark/75">
      <strong>복용 주기</strong>를 먼저 선택하세요. 기본값은 매일입니다. 매주
      특정 요일, 매달 특정일에 먹어야 할 경우 해당 값을 선택해주세요. 매주 &gt;
      요일과 매달 &gt; 날짜는 중복으로 선택할 수 있습니다.
    </p>
    <GuideImg
      folder="new"
      file="08.webp"
      alt="새로운 약 등록"
      w={834}
      h={1808}
    />
    <p className="text-sm text-pilltime-grayDark/75">
      이어서 <strong>복용 시간</strong>을 선택하세요. <strong>추가</strong>를
      눌러 하루에 먹어야 하는 횟수 만큼 시간을 입력하세요.
    </p>
    <p className="text-sm text-pilltime-grayDark/75">
      예를 들어 <i>하루 세 번 아침 - 점심 - 저녁</i> 에 약을 먹어야 한다면,{" "}
      <i>오전 7시 - 오후 12시 30분 - 오후 6시</i> 처럼 약 먹을 시간을 각각
      입력하세요.
    </p>
    <p className="text-sm text-pilltime-grayDark/75">
      원치 않을 경우에는 <strong>삭제</strong>를 눌러 해당 시간을 지우세요. 복용
      시간은 <strong>5분 간격</strong>으로 지정할 수 있습니다.
    </p>
    <p className="text-base font-bold text-pilltime-grayDark/75">
      5. 이미지 등록하기
    </p>
    <GuideImg
      folder="new"
      file="11.webp"
      alt="새로운 약 등록"
      w={834}
      h={1808}
    />
    <p className="text-sm text-pilltime-grayDark/75">
      필요한 경우, 약과 관련된 이미지를 추가하세요. <strong>추가</strong> 혹은
      바로 위 <strong>기본 이미지</strong>를 눌러 사진을 불러오세요.
    </p>
    <GuideImg
      folder="new"
      file="12.webp"
      alt="새로운 약 등록"
      w={832}
      h={1810}
    />
    <p className="text-sm text-pilltime-grayDark/75">
      선택된 이미지를 편집하세요. 비율은 정방형 (1X1) 고정입니다.
    </p>
    <GuideImg
      folder="new"
      file="13.webp"
      alt="새로운 약 등록"
      w={832}
      h={1808}
    />
    <p className="text-sm text-pilltime-grayDark/75">
      편집된 이미지를 확인하세요.
    </p>
    <p className="text-base font-bold text-pilltime-grayDark/75">
      6. 확인 후 저장하기
    </p>
    <GuideImg
      folder="new"
      file="14.webp"
      alt="새로운 약 등록"
      w={834}
      h={1810}
    />
    <p className="text-sm text-pilltime-grayDark/75">
      마지막으로 입력한 정보를 확인하세요. 고쳐야 할 정보가 있다면 각 순서
      오른쪽의 <strong>수정</strong>을 눌러 돌아가세요. 정보가 정확하다면 우측
      상단에서 <strong>저장</strong>을 눌러 마무리하세요.
    </p>
  </div>
);

/* ------------
 * 2. 약 정보 확인하기
 * ------------ */

const CardStep = () => {
  const router = useRouter();
  return (
    <div className="!space-y-4">
      <GuideImg
        folder="card"
        file="01.webp"
        alt="약 정보 카드"
        w={860}
        h={1167}
        eager
      />
      <p className="text-sm text-pilltime-grayDark/75">
        약이 등록되면 카드 형식으로 표시됩니다. 카드 상단에서 약과 관련된 정보를
        확인할 수 있습니다.
      </p>
      <GuideImg
        folder="card"
        file="02.webp"
        alt="약 정보 카드"
        w={860}
        h={1167}
        eager
      />
      <p className="text-sm text-pilltime-grayDark/75">
        이미지와 약 이름을 확인하세요. 이미지를 누르면 전체 화면으로 볼 수
        있습니다.
      </p>
      <GuideImg
        folder="card"
        file="03.webp"
        alt="약 정보 카드"
        w={860}
        h={1167}
      />
      <p className="text-sm text-pilltime-grayDark/75">
        <AlarmClock
          strokeWidth={2}
          size={16}
          color="#3B82F6"
          className="inline-block"
        />{" "}
        을 눌러 약의 알림을 켜거나 끌 수 있습니다. 전체 알림이 꺼져있을 경우
        해당 버튼은 자동으로 꺼짐 상태가 되며 개별 약의 알림을 켤 수 없습니다.
        <br /> -&gt;{" "}
        <span
          className="font-bold text-pilltime-violet"
          onClick={() => router.push("/guide?step=settings")}
        >
          6. 사용자 수정
        </span>
        에서 자세히 확인하기
      </p>
      <p className="text-sm text-pilltime-grayDark/75">
        <Settings
          strokeWidth={2}
          size={16}
          color="#F97316"
          className="inline-block"
        />{" "}
        을 눌러 약과 관련된 정보를 수정하거나, 약 정보를 삭제할 수 있습니다.{" "}
        <br /> -&gt;{" "}
        <span
          className="font-bold text-pilltime-violet"
          onClick={() => router.push("/guide?step=edit")}
        >
          4. 약 정보 수정
        </span>
        에서 자세히 확인하기
      </p>
      <GuideImg
        folder="card"
        file="04.webp"
        alt="약 정보 카드"
        w={860}
        h={1167}
      />
      <p className="text-sm text-pilltime-grayDark/75">
        <Info
          strokeWidth={2}
          size={16}
          color="#F9731690"
          className="inline-block"
        />{" "}
        을 눌러 약과 관련된 상세 정보를 확인할 수 있습니다.
      </p>
      <GuideImg
        folder="card"
        file="05.webp"
        alt="약 정보 카드"
        w={860}
        h={1167}
      />
      <p className="text-sm text-pilltime-grayDark/75">
        그래프를 통해 오늘 하루 약을 얼마나 먹었는지 한 눈에 확인할 수 있습니다.
      </p>
      <GuideImg
        folder="card"
        file="06.webp"
        alt="약 정보 카드"
        w={836}
        h={758}
      />
      <p className="text-sm text-pilltime-grayDark/75">
        오늘 약을 먹을 일정이 없거나 상세 정보가 없을 경우, 위와 같이
        표시됩니다.
      </p>
    </div>
  );
};

/* ------------
 * 3. 복용 기록 추가하기
 * ------------ */

const IntakeStep = () => (
  <div className="!space-y-4">
    <GuideImg
      folder="intake"
      file="01.webp"
      alt="약 정보 카드"
      w={860}
      h={1167}
      eager
    />
    <p className="text-sm text-pilltime-grayDark/75">
      약이 등록되면 카드 형식으로 표시됩니다. 카드 하단에서 오늘의 복용 기록을
      추가하고 확인할 수 있습니다.
    </p>
    <p className="text-base font-bold text-pilltime-grayDark/75">
      1. 복용 기록하기
    </p>
    <GuideImg
      folder="intake"
      file="02.webp"
      alt="약 정보 카드"
      w={773}
      h={141}
      eager
    />
    <p className="text-sm text-pilltime-grayDark/75">
      왼쪽 해당 시간을 확인하고 기록하세요. 약을 먹었다면{" "}
      <Check strokeWidth={2} size={16} className="inline-block" />
      를, 이번엔 약을 먹지 않기로 했다면{" "}
      <PinOff strokeWidth={2} size={16} className="inline-block" />를 누르세요.
    </p>
    <p className="text-base font-bold text-pilltime-grayDark/75">2. 복용</p>
    <GuideImg
      folder="intake"
      file="03.webp"
      alt="약 정보 카드"
      w={773}
      h={169}
    />
    <p className="text-sm text-pilltime-grayDark/75">
      <Check strokeWidth={2} size={16} className="inline-block" />를 누른 경우의{" "}
      <strong>복용</strong> 상태를 보여줍니다. 기록을 취소하고 싶다면 왼쪽의
      <Redo2 strokeWidth={2} size={16} className="inline-block" />
      를, 건너뜀으로 바꾸고 싶다면 오른쪽의{" "}
      <PinOff strokeWidth={2} size={16} className="inline-block" />를 누르세요.
    </p>
    <p className="text-base font-bold text-pilltime-grayDark/75">3. 건너뜀</p>
    <GuideImg
      folder="intake"
      file="04.webp"
      alt="약 정보 카드"
      w={773}
      h={168}
    />
    <p className="text-sm text-pilltime-grayDark/75">
      <PinOff strokeWidth={2} size={16} className="inline-block" />를 누른
      경우의 <strong>건너뜀</strong> 상태를 보여줍니다. 기록을 취소하고 싶다면
      가장 왼쪽의
      <Redo2 strokeWidth={2} size={16} className="inline-block" />
      를, 복용으로 바꾸고 싶다면 왼쪽의{" "}
      <Check strokeWidth={2} size={16} className="inline-block" />를 누르세요.
    </p>
    <p className="text-base font-bold text-pilltime-grayDark/75">4. 미복용</p>
    <GuideImg
      folder="intake"
      file="05.webp"
      alt="약 정보 카드"
      w={773}
      h={164}
    />
    <p className="text-sm text-pilltime-grayDark/75">
      예정 시간에서 <strong>30분</strong>을 넘기게 되면 자동으로 기록되는{" "}
      <strong>미복용</strong> 상태를 보여줍니다. 미복용 상태에서도 이후 약을
      먹었다면 <Check strokeWidth={2} size={16} className="inline-block" />
      를, 약을 먹지 않기로 했다면{" "}
      <PinOff strokeWidth={2} size={16} className="inline-block" />를 눌러
      기록할 수 있습니다.
    </p>
    <p className="text-sm text-pilltime-grayDark/75">
      예정 시간에서 <strong>30분</strong>이 지난 경우{" "}
      <Redo2 strokeWidth={2} size={16} className="inline-block" />를 눌러 기록을
      취소하면 다시 <strong>미복용</strong>으로 자동 기록됩니다.
    </p>
  </div>
);

/* ------------
 * 4. 약 정보 수정
 * ------------ */

const EditStep = () => (
  <div className="!space-y-4">
    <GuideImg
      folder="edit"
      file="01.webp"
      alt="약 정보 카드"
      w={860}
      h={1167}
      eager
    />
    <p className="text-sm text-pilltime-grayDark/75">
      우측 상단{" "}
      <Settings
        strokeWidth={2}
        size={16}
        color="#F97316"
        className="inline-block"
      />{" "}
      을 눌러 약과 관련된 정보를 수정하거나, 약 정보를 삭제할 수 있습니다.
    </p>
    <GuideImg
      folder="edit"
      file="02.webp"
      alt="약 정보 카드"
      w={834}
      h={1808}
      eager
    />
    <GuideImg
      folder="edit"
      file="03.webp"
      alt="약 정보 카드"
      w={832}
      h={1806}
    />
    <p className="text-sm text-pilltime-grayDark/75">
      위아래로 움직여 현재 약 정보를 확인할 수 있습니다. 각 영역에서 정보를 직접
      수정한 후 우측 상단 <strong>저장</strong> 버튼을 눌러주세요.
    </p>
    <GuideImg
      folder="edit"
      file="04.webp"
      alt="약 정보 카드"
      w={836}
      h={1818}
    />
    <p className="text-sm text-pilltime-grayDark/75">
      하단의 <strong>약 삭제</strong> 버튼을 누르면 확인 상자가 나옵니다. 삭제를
      원할 경우 <strong>삭제</strong> 버튼을 눌러주세요. 삭제 시 과거 복용
      기록을 제외한 약과 관련된 모든 정보가 지워집니다. 이 동작은 되돌릴 수
      없습니다.
    </p>
  </div>
);

/* ------------
 * 5. 지난 기록 보기
 * ------------ */

const CalendarStep = () => (
  <div className="!space-y-4">
    <GuideImg
      folder="calendar"
      file="02.webp"
      alt="새로운 약 등록"
      w={860}
      h={1864}
      eager
    />
    <GuideImg
      folder="calendar"
      file="03.webp"
      alt="새로운 약 등록"
      w={1272}
      h={160}
      eager
    />
    <p className="text-sm text-pilltime-grayDark/75">
      모바일에선 <Menu strokeWidth={2} size={16} className="inline-block" />{" "}
      &gt; <strong>지난 기록 보기</strong>를, 기타 환경에선 화면 상단{" "}
      <strong>지난 기록 보기</strong>를 눌러주세요.
    </p>
    <GuideImg
      folder="calendar"
      file="01.webp"
      alt="새로운 약 등록"
      w={860}
      h={1864}
    />
    <p className="text-sm text-pilltime-grayDark/75">
      또한 화면 중앙의 오늘 날짜를 눌러 지난 기록을 빠르게 확인할 수 있습니다.
    </p>
    <GuideImg
      folder="calendar"
      file="04.webp"
      alt="새로운 약 등록"
      w={834}
      h={1810}
    />
    <p className="text-sm text-pilltime-grayDark/75">
      복용 기록을 한 눈에 확인할 수 있습니다.
    </p>
    <GuideImg
      folder="calendar"
      file="05.webp"
      alt="새로운 약 등록"
      w={860}
      h={1864}
    />
    <p className="text-sm text-pilltime-grayDark/75">
      상단 달력을 통해 선택된 날짜에서 각각 약의 요약된 기록를{" "}
      <strong>색깔 태그</strong>를 통해 바로 볼 수 있습니다. 기록의 우선도는{" "}
      <span className="inline-flex items-center justify-center bg-red-700 h-1 w-4 rounded-full !mb-[3px]" />{" "}
      미복용 -&gt;{" "}
      <span className="inline-flex items-center justify-center bg-pilltime-yellow h-1 w-4 rounded-full !mb-[3px]" />{" "}
      건너뜀 -&gt;{" "}
      <span className="inline-flex items-center justify-center bg-pilltime-blue h-1 w-4 rounded-full !mb-[3px]" />{" "}
      복용 -&gt;{" "}
      <span className="inline-flex items-center justify-center bg-gray-400 h-1 w-4 rounded-full !mb-[3px]" />{" "}
      예정 순입니다.
    </p>
    <p className="text-sm text-pilltime-grayDark/75">
      예를 들어{" "}
      <i>
        하루 일정 중 A 약을 <strong>한 번이라도 미복용</strong>
      </i>{" "}
      했다면,{" "}
      <span className="inline-flex items-center justify-center bg-red-700 h-1 w-4 rounded-full !mb-[3px]" />{" "}
      으로 기록됩니다.{" "}
      <i>
        하루 일정 중 B 약의 미복용이 없지만{" "}
        <strong>한 번이라도 건너뛰었다</strong>{" "}
      </i>{" "}
      면,{" "}
      <span className="inline-flex items-center justify-center bg-pilltime-yellow h-1 w-4 rounded-full !mb-[3px]" />{" "}
      으로 기록됩니다.{" "}
      <i>
        C 약을 빠짐없이 <strong>모두 복용</strong>
      </i>{" "}
      했다면,{" "}
      <span className="inline-flex items-center justify-center bg-pilltime-blue h-1 w-4 rounded-full !mb-[3px]" />{" "}
      으로 기록됩니다. <i>아직 복용 기록이 없다</i> 면,{" "}
      <span className="inline-flex items-center justify-center bg-gray-400 h-1 w-4 rounded-full !mb-[3px]" />{" "}
      으로 기록됩니다.
    </p>
    <p className="text-sm text-pilltime-grayDark/75">
      달력 상단 양 끝 &lt; &gt; 버튼을 통해 이전 달, 다음 달로 이동할 수
      있습니다. 예정된 일정은 오늘로부터 <strong>최대 일주일</strong> 내로만
      확인할 수 있습니다.
    </p>
    <GuideImg
      folder="calendar"
      file="06.webp"
      alt="새로운 약 등록"
      w={860}
      h={1864}
    />
    <p className="text-sm text-pilltime-grayDark/75">
      달력에서 날짜를 누른 후, 아래에서 상세 기록을 확인할 수 있습니다. 해당
      날짜에 먹은 약 전체를 확인하세요. 각 약의 복용 시간과 시간 별 복용 기록을{" "}
      <strong>색깔 태그</strong>로 확인하세요. 왼쪽에서{" "}
      <strong>한 줄 요약</strong>으로 빠르게 복용 기록을 톺아볼 수 있습니다.
    </p>
  </div>
);

/* ------------
 * 6. 사용자 설정
 * ------------ */

const SettingsStep = () => (
  <div className="!space-y-4">
    <GuideImg
      folder="settings"
      file="01.webp"
      alt="새로운 약 등록"
      w={860}
      h={1864}
      eager
    />
    <GuideImg
      folder="settings"
      file="02.webp"
      alt="새로운 약 등록"
      w={1272}
      h={160}
    />
    <GuideImg
      folder="settings"
      file="03.webp"
      alt="새로운 약 등록"
      w={530}
      h={502}
    />
    <p className="text-sm text-pilltime-grayDark/75">
      모바일에선 <Menu strokeWidth={2} size={16} className="inline-block" />{" "}
      &gt; <strong>사용자 설정</strong>을, 기타 환경에선 화면 상단{" "}
      <strong>사용자 설정</strong>을 눌러 목록을 확인해 주세요.
    </p>
    <p className="text-base font-bold text-pilltime-grayDark/75">
      1. 프로필 편집
    </p>
    <GuideImg
      folder="settings"
      file="04.webp"
      alt="새로운 약 등록"
      w={860}
      h={1864}
    />
    <p className="text-sm text-pilltime-grayDark/75">
      사용자 설정의 <strong>프로필 편집</strong>을 눌러주세요.
    </p>
    <GuideImg
      folder="settings"
      file="05.webp"
      alt="새로운 약 등록"
      w={832}
      h={1804}
    />
    <p className="text-sm text-pilltime-grayDark/75">
      별명을 편집할 수 있습니다. 글자 수 제한은 없지만 <strong>2-3글자</strong>
      를 추천합니다.
    </p>
    <p className="text-base font-bold text-pilltime-grayDark/75">
      2. 앱 알림 관리
    </p>
    <GuideImg
      folder="settings"
      file="07.webp"
      alt="새로운 약 등록"
      w={860}
      h={1864}
    />
    <p className="text-sm text-pilltime-grayDark/75">
      앱 전체 알림을 켜거나 끌 수 있습니다. 초기 접속이거나 알림 권한이 없을
      경우 <strong>알림 비활성화됨</strong>으로 표시됩니다.
    </p>
    <p className="text-sm text-pilltime-grayDark/75">
      &apos;아맞다약!&apos;은 은 정시 알림을 먼저 보내드린 후 30분이 지나도 먹지
      않으면 알림을 다시 보내드립니다. <strong>알림 비활성화됨</strong> 버튼을
      눌러 꼭 알림을 허용해주세요.
    </p>
    <p className="text-sm text-pilltime-grayDark/75">
      알림이 <strong>차단</strong>되어 있을 경우, 브라우저 주소창의 사이트
      설정에서 알림을 <strong>허용</strong>으로 변경한 뒤 다시 시도해 주세요.
    </p>
    <p className="text-sm text-pilltime-grayDark/75">
      * iOS Safari에서는 <strong>홈 화면에 추가</strong> 후에만 알림이
      동작합니다. 아래 순서를 따라주세요.
    </p>

    <p className="text-sm text-pilltime-grayDark/75 tracking-wide leading-relaxed !px-1">
      1. 브라우저에서{" "}
      <Share strokeWidth={2} size={16} className="inline-block" />
      을 누르세요.
      <br />
      2. 공유 목록이 뜨면 아래에서 <strong>홈 화면에 추가</strong>{" "}
      <SquarePlus strokeWidth={2} size={16} className="inline-block" /> 버튼을
      눌러주세요.
      <br />
      3. 우측 상단에서 <strong>추가</strong> 버튼을 눌러 홈 화면에 아이콘을
      추가하세요.
      <br />
      4. 아이콘을 눌러 앱에 접속하세요.
      <br />
      5. <Menu strokeWidth={2} size={16} className="inline-block" /> &gt;{" "}
      <strong>사용자 설정</strong> &gt; <strong>알림 비활성화됨</strong> 을 눌러
      알림을 허용해주세요.
      <br />
      6. <strong>모든 알림 켜짐</strong>을 확인 후 좌측 상단{" "}
      <strong>알약 로고</strong>를 가볍게 눌러주세요.
    </p>
    <GuideImg
      folder="settings"
      file="06.webp"
      alt="새로운 약 등록"
      w={860}
      h={1864}
    />
    <p className="text-sm text-pilltime-grayDark/75">
      알림이 활성화된 후 전체 알림을 끄고 싶다면 <strong>모든 알림 켜짐</strong>{" "}
      버튼을 누르세요. 다시 전체 알림을 켜고 싶다면 표시된{" "}
      <strong>모든 알림 꺼짐</strong> 버튼을 누르세요. 전체 알림이 켜져 있다면
      개별 약의 알림을 켜고 끌 수 있습니다.
    </p>
    <p className="text-base font-bold text-pilltime-grayDark/75">3. 로그아웃</p>
    <GuideImg
      folder="settings"
      file="08.webp"
      alt="새로운 약 등록"
      w={860}
      h={1864}
    />
    <p className="text-sm text-pilltime-grayDark/75">
      사용자 설정의 <strong>로그아웃</strong>을 눌러 로그아웃하세요. 로그아웃 후
      알림이 울리지 않을 수 있습니다.
    </p>
  </div>
);

export const STEP_CONTENT: Record<StepId, () => JSX.Element> = {
  new: NewStep,
  card: CardStep,
  intake: IntakeStep,
  edit: EditStep,
  calendar: CalendarStep,
  settings: SettingsStep,
};
