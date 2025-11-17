-- CreateEnum
CREATE TYPE "ParticipantType" AS ENUM ('NEW', 'OLD');

-- AlterTable
ALTER TABLE "Participant" ADD COLUMN     "participantType" "ParticipantType" NOT NULL DEFAULT 'NEW';

-- CreateIndex
CREATE INDEX "Event_preRegLink_idx" ON "Event"("preRegLink");

-- CreateIndex
CREATE INDEX "Participant_email_idx" ON "Participant"("email");
