/*
  Warnings:

  - The `employmentType` column on the `FinancialProfile` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Added the required column `p10Value` to the `SimulationResult` table without a default value. This is not possible if the table is not empty.
  - Added the required column `p90Value` to the `SimulationResult` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "EmploymentType" AS ENUM ('SALARIED', 'GIG', 'SELF_EMPLOYED', 'FARMER', 'DAILY_WAGE', 'UNEMPLOYED');

-- CreateEnum
CREATE TYPE "RiskAppetite" AS ENUM ('CONSERVATIVE', 'MODERATE', 'AGGRESSIVE');

-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('MALE', 'FEMALE', 'OTHER');

-- CreateEnum
CREATE TYPE "CasteCategory" AS ENUM ('GENERAL', 'OBC', 'SC', 'ST');

-- AlterTable
ALTER TABLE "FinancialProfile" ADD COLUMN     "age" INTEGER,
ADD COLUMN     "businessType" TEXT,
ADD COLUMN     "casteCategory" "CasteCategory",
ADD COLUMN     "credibilityFlags" TEXT[],
ADD COLUMN     "credibilityScore" DOUBLE PRECISION,
ADD COLUMN     "gender" "Gender",
ADD COLUMN     "hasBankAccount" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "hasHealthInsurance" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "hasInsurance" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isRural" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "landHoldingAcres" DECIMAL(65,30),
ADD COLUMN     "monthlyEmi" DECIMAL(65,30) NOT NULL DEFAULT 0,
ADD COLUMN     "riskAppetite" "RiskAppetite" NOT NULL DEFAULT 'MODERATE',
ADD COLUMN     "state" TEXT,
DROP COLUMN "employmentType",
ADD COLUMN     "employmentType" "EmploymentType" NOT NULL DEFAULT 'SALARIED';

-- AlterTable
ALTER TABLE "Goal" ADD COLUMN     "horizonMonths" INTEGER;

-- AlterTable
ALTER TABLE "RiskAssessment" ADD COLUMN     "healthSummary" TEXT;

-- AlterTable
ALTER TABLE "ScamAlert" ADD COLUMN     "scamType" TEXT;

-- AlterTable
ALTER TABLE "SchemeMatch" ADD COLUMN     "annualBenefit" DECIMAL(65,30),
ADD COLUMN     "howToApply" TEXT;

-- AlterTable
ALTER TABLE "SimulationResult" ADD COLUMN     "p10Value" DECIMAL(65,30) NOT NULL,
ADD COLUMN     "p90Value" DECIMAL(65,30) NOT NULL;
