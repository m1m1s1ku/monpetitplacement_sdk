import { z } from 'zod';

export const UserKycsInput = z.object({
  userId: z.number(),
  token: z.string(),
});

export const UserKycsOutput = z.object({
  '@context': z.string(),
  '@id': z.string(),
  '@type': z.string(),
  'hydra:member': z.array(
    z.object({
      '@id': z.string(),
      '@type': z.string(),
      id: z.string(),
      status: z.string(),
      currentStep: z.string(),
      lastNode: z.string(),
      advice: z.object({
        '@id': z.string(),
        '@type': z.string(),
        id: z.string(),
        status: z.string(),
        language: z.array(z.unknown()),
        video: z.string(),
        generalAdvice: z.string(),
        buyAdvice: z.string(),
        sellAdvice: z.string(),
        dashboardAdvice: z.string(),
        inconsistent: z.boolean(),
        suggestedInvestmentAccountProvider: z.string(),
        suggestedAdvicePackage: z.string(),
        selectedAdvicePackage: z.string(),
        suggestedAdviceSubpackage: z.string(),
        selectedAdviceSubpackage: z.string(),
        uuid: z.string(),
        createdAt: z.string(),
        updatedAt: z.string(),
      }),
      investmentAccount: z.string(),
      user: z.string(),
      userKycAnswers: z.array(
        z.union([
          z.object({
            '@id': z.string(),
            '@type': z.string(),
            id: z.string(),
            valid: z.boolean(),
            question: z.string(),
            answer: z.string(),
            uuid: z.string(),
            createdAt: z.string(),
            updatedAt: z.string(),
          }),
          z.object({
            '@id': z.string(),
            '@type': z.string(),
            id: z.string(),
            value: z.string(),
            valid: z.boolean(),
            question: z.string(),
            uuid: z.string(),
            createdAt: z.string(),
            updatedAt: z.string(),
          }),
          z.object({
            '@id': z.string(),
            '@type': z.string(),
            id: z.string(),
            valid: z.boolean(),
            question: z.string(),
            uuid: z.string(),
            createdAt: z.string(),
            updatedAt: z.string(),
          }),
        ])
      ),
      universignTransactions: z.array(z.unknown()),
      personalizedVideoAdviceMandatory: z.boolean(),
      uuid: z.string(),
      createdAt: z.string(),
      updatedAt: z.string(),
      initialInvestmentFirst: z.number(),
      initialInvestmentMonthly: z.number(),
    })
  ),
  'hydra:totalItems': z.number(),
  'hydra:view': z.object({ '@id': z.string(), '@type': z.string() }).optional(),
});
