-- Add onboarding_completed field to profiles
ALTER TABLE "profiles" ADD COLUMN "onboarding_completed" BOOLEAN NOT NULL DEFAULT false;
