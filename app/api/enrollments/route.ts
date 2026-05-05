import { NextResponse } from "next/server";

export const revalidate = 21600;

const enrollmentUrls = [
  "https://us-central1-vizuara-ai-labs.cloudfunctions.net/getActiveEnrollmentCount?courseId=course_20004941",
  "https://us-central1-videsh-a52fb.cloudfunctions.net/getActiveEnrollmentCount?courseId=course_20000765",
  "https://us-central1-videsh-a52fb.cloudfunctions.net/getActiveEnrollmentCount?courseId=course_20000302",
  "https://us-central1-videsh-a52fb.cloudfunctions.net/getActiveEnrollmentCount?courseId=course_20000236",
  "https://us-central1-vizuara-ai-labs.cloudfunctions.net/getActiveEnrollmentCount?courseId=course_20000408",
  "https://us-central1-vizuara-ai-labs.cloudfunctions.net/getActiveEnrollmentCount?courseId=course_20005408",
];

export async function GET() {
  const entries = await Promise.all(
    enrollmentUrls.map(async (url, index) => {
      try {
        const res = await fetch(url, {
          next: { revalidate },
        });
        if (!res.ok) return null;

        const data = await res.json();
        if (data.success && typeof data.count === "number") {
          return [index, data.count] as const;
        }
      } catch {}

      return null;
    })
  );

  const counts = Object.fromEntries(entries.filter((entry) => entry !== null));

  return NextResponse.json(
    { counts },
    {
      headers: {
        "Cache-Control": "public, max-age=21600, s-maxage=21600, stale-while-revalidate=86400",
      },
    }
  );
}
