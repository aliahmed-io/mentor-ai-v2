import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/server/auth";
import { db } from "@/server/db";

export async function POST(request: NextRequest) {
  try {
    const { quizSetId, userAnswers } = await request.json();
    if (!quizSetId || !Array.isArray(userAnswers)) {
      return NextResponse.json({ error: "invalid payload" }, { status: 400 });
    }

    const quizSet = await db.quizSet.findUnique({
      where: { id: quizSetId },
      select: { questions: true },
    });
    if (!quizSet || !Array.isArray(quizSet.questions)) {
      return NextResponse.json({ error: "Quiz not found" }, { status: 404 });
    }

    const questions = quizSet.questions as Array<any>;
    const total = questions.length;
    let correct = 0;
    let incorrect = 0;
    let unanswered = 0;

    const answerMap = new Map<string, number>(userAnswers);

    for (const q of questions) {
      const userAnswer = answerMap.get(q.id);
      if (userAnswer === undefined || userAnswer === null) {
        unanswered++;
      } else if (userAnswer === q.correctAnswer) {
        correct++;
      } else {
        incorrect++;
      }
    }

    const percentage = total > 0 ? (correct / total) * 100 : 0;

    const session = await auth();
    const rec = await db.quizScore.create({
      data: {
        userId: session?.user?.id ?? null,
        quizSetId,
        percentage: Math.round(percentage),
        correct,
        incorrect,
        unanswered,
        total,
      },
    });
    return NextResponse.json({ id: rec.id });
  } catch (e: any) {
    return NextResponse.json(
      { error: e.message || "Failed to save score" },
      { status: 500 },
    );
  }
}
