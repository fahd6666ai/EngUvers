-- CreateTable
CREATE TABLE "exams" (
    "id" TEXT NOT NULL,
    "titleAr" TEXT NOT NULL,
    "titleEn" TEXT NOT NULL,
    "descriptionAr" TEXT NOT NULL,
    "descriptionEn" TEXT NOT NULL,
    "disciplineTag" TEXT NOT NULL,
    "published" BOOLEAN NOT NULL DEFAULT false,
    "authorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "exams_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exam_questions" (
    "id" TEXT NOT NULL,
    "examId" TEXT NOT NULL,
    "textAr" TEXT NOT NULL,
    "textEn" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "points" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "exam_questions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exam_answer_options" (
    "id" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "textAr" TEXT NOT NULL,
    "textEn" TEXT NOT NULL,
    "isCorrect" BOOLEAN NOT NULL DEFAULT false,
    "order" INTEGER NOT NULL,

    CONSTRAINT "exam_answer_options_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exam_attempts" (
    "id" TEXT NOT NULL,
    "examId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "submittedAt" TIMESTAMP(3),
    "score" INTEGER,
    "totalPoints" INTEGER NOT NULL,

    CONSTRAINT "exam_attempts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exam_attempt_answers" (
    "id" TEXT NOT NULL,
    "attemptId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "selectedOptionId" TEXT,
    "isCorrect" BOOLEAN NOT NULL,

    CONSTRAINT "exam_attempt_answers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "exams_published_disciplineTag_idx" ON "exams"("published", "disciplineTag");

-- CreateIndex
CREATE UNIQUE INDEX "exam_questions_examId_order_key" ON "exam_questions"("examId", "order");

-- CreateIndex
CREATE UNIQUE INDEX "exam_answer_options_questionId_order_key" ON "exam_answer_options"("questionId", "order");

-- CreateIndex
CREATE INDEX "exam_attempts_userId_idx" ON "exam_attempts"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "exam_attempt_answers_attemptId_questionId_key" ON "exam_attempt_answers"("attemptId", "questionId");

-- AddForeignKey
ALTER TABLE "exams" ADD CONSTRAINT "exams_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exam_questions" ADD CONSTRAINT "exam_questions_examId_fkey" FOREIGN KEY ("examId") REFERENCES "exams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exam_answer_options" ADD CONSTRAINT "exam_answer_options_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "exam_questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exam_attempts" ADD CONSTRAINT "exam_attempts_examId_fkey" FOREIGN KEY ("examId") REFERENCES "exams"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exam_attempts" ADD CONSTRAINT "exam_attempts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exam_attempt_answers" ADD CONSTRAINT "exam_attempt_answers_attemptId_fkey" FOREIGN KEY ("attemptId") REFERENCES "exam_attempts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exam_attempt_answers" ADD CONSTRAINT "exam_attempt_answers_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "exam_questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exam_attempt_answers" ADD CONSTRAINT "exam_attempt_answers_selectedOptionId_fkey" FOREIGN KEY ("selectedOptionId") REFERENCES "exam_answer_options"("id") ON DELETE SET NULL ON UPDATE CASCADE;

