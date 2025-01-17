import { faker } from '@faker-js/faker';
import { MockAgent, setGlobalDispatcher } from 'undici';
import { z } from 'zod';
import { Api, baseURLForFacade, RemoteError } from './api';
import { UserKycsInput, UserKycsOutput } from './schema/v1/user_kycs';
import {
  AdviceInput,
  AdviceOutput,
  AdviceWaitingVideoInput,
  AdviceWaitingVideoOutput,
} from './schema/v1/advice';
import {
  InvestProfileCategoriesInput,
  InvestProfileCategoriesOutput,
} from './schema/v1/invest_profile_categories';
import { InvestProfilesInput, InvestProfilesOutput } from './schema/v1/invest_profiles';
import { UserCouponsInput, UserCouponsOutput } from './schema/v1/user_coupons';
import {
  UserFinancialCapitalInput,
  UserFinancialCapitalOutput,
} from './schema/v1/user_financial_capital';
import { CouponsInput, CouponsOutput } from './schema/v1/coupons';
import {
  UserInvestmentAccountProductsInput,
  UserInvestmentAccountProductsOutput,
} from './schema/v1/user_investment_account_products';
import { AvailableProductsInput, AvailableProductsOutput } from './schema/v1/available_products';
import {
  UserInvestmentValuesInput,
  UserInvestmentValuesOutput,
} from './schema/v1/user_investment_values';
import { MeInput, MeOutput } from './schema/v1/me';
import { AuthenticationTokenOutput } from './schema/authentication-token';
import { MPPTwitchInput, MPPTwitchOutput } from './schema/v1/twitch';
import {
  UserAdviceDTOInput,
  UserAdviceDTOOutput,
} from './schema/v1/user_investment_account_advice_dto';
import { UserKycCategoryInput, UserKycCategoryOutput } from './schema/v1/user_kyc_categories';
import {
  UserInvestmentAccountProvidersInput,
  UserInvestmentAccountProvidersOutput,
} from './schema/v1/user_investment_account_providers';
import { UserKycQuestionsInput, UserKycQuestionsOutput } from './schema/v1/user_kyc_questions';
import {
  UserInvestmentAccountInput,
  UserInvestmentAccountOutput,
} from './schema/v1/user_investment_account';
import {
  GetConsultingAnalaysisOutput,
  GetConsultingAnalysisInput,
} from './schema/v1/consulting_analysis';
import { GetInvestProfileInput, GetInvestProfileOutput } from './schema/v1/public_invest_profile';
import { isExternalError, isGatewayError } from './errors';

const mockAgent: MockAgent = new MockAgent({});
setGlobalDispatcher(mockAgent);
let mockPool = mockAgent.get(baseURLForFacade('sso'));

describe('Api', () => {
  it('throws a ZodError in case the output does not match the expected interface', async () => {
    const sdk = new Api();
    mockPool.intercept({
      path: 'auth/realms/mpp-prod/protocol/openid-connect/token',
      method: 'POST',
    });

    const loginError = await sdk.login({ username: '', password: '' });

    expect(loginError).toHaveProperty('error');
    expect(loginError).toHaveProperty('error_description');
  });

  describe('login', () => {
    it('calls the api with the right parameters', async () => {
      const sdk = new Api();

      const creds = {
        username: faker.internet.email(),
        password: faker.internet.password(),
      };
      const data = new URLSearchParams();
      data.set('grant_type', 'password');
      data.set('client_id', 'mpp-app');
      data.set('username', creds.username);
      data.set('password', creds.password);

      const mockedResponse: Partial<z.infer<typeof AuthenticationTokenOutput> | RemoteError> = {
        access_token: faker.datatype.string(100),
        expires_in: 300,
        'not-before-policy': 0,
        refresh_expires_in: 3600,
        refresh_token: faker.datatype.string(100),
        scope: 'email profile',
        session_state: faker.datatype.uuid(),
        token_type: 'Bearer',
      };

      mockPool
        .intercept({
          path: 'auth/realms/mpp-prod/protocol/openid-connect/token',
          method: 'POST',
        })
        .reply(200, mockedResponse);

      const response = await sdk.login(creds);

      if (isExternalError(response)) {
        expect(response).toHaveProperty('error');
        expect(response).toHaveProperty('error_description');
      } else {
        expect(response).toHaveProperty('access_token');
      }
    });
  });

  mockPool = mockAgent.get(baseURLForFacade('api'));

  describe('getMe', () => {
    it('calls the api with the right parameters', async () => {
      const sdk = new Api();

      const input: z.infer<typeof MeInput> = {
        token: faker.datatype.string(100),
      };
      const userId = faker.datatype.number({ min: 1 });
      const mockedResponse: z.infer<typeof MeOutput> = {
        '@context': '/v1/contexts/User',
        '@id': `/v1/users/${userId}`,
        '@type': 'User',
        id: userId,
        username: faker.internet.email(),
        email: faker.internet.email(),
        isTest: faker.datatype.boolean(),
        lastLogin: faker.date.recent().toISOString(),
        roles: [],
        firstname: faker.name.firstName(),
        lastname: faker.name.lastName(),
        gender: faker.helpers.arrayElement(['man', 'woman']),
        phone: faker.phone.number(),
        cgvAccepted: faker.datatype.boolean(),
        validatedAt: faker.date.past().toISOString(),
        birthdate: faker.date.past().toISOString(),
        nationality: faker.address.countryCode(),
        registrationReason: {
          '@type': 'RegistrationReason',
          '@id': faker.datatype.number().toString(),
          id: faker.helpers.arrayElement(['want-to-invest-with-you']),
          message: faker.lorem.lines(),
          persona: faker.helpers.arrayElement(['investir']),
        },
        registrationReasonDetail: faker.lorem.lines(),
        affiliateProvider: {
          '@id': `/v1/affiliate_providers/${faker.datatype.number().toString()}`,
          '@type': 'AffiliateProviders',
          id: faker.datatype.number().toString(),
          name: faker.datatype.string(),
          slug: faker.datatype.string(),
          createdAt: faker.date.past().toISOString(),
          updatedAt: faker.date.recent().toISOString(),
        },
        origin: faker.helpers.arrayElement(['Par la presse']),
        viewPreference: faker.helpers.arrayElement(['invest-profile']),
        investmentAccounts: [],
        universignCertifiedAt: faker.date.past().toISOString(),
        crispId: faker.datatype.uuid(),
        crispSegments: [],
        uuid: faker.datatype.uuid(),
        createdAt: faker.date.past().toISOString(),
        updatedAt: faker.date.recent().toISOString(),
        affiliationLevel: faker.helpers.arrayElement(['Beginner']),
        affiliationAlreadyClientUserCount: faker.datatype.number(),
        affiliationTotalUserCount: faker.datatype.number(),
        affiliationSavingsPercent: faker.datatype.number(),
        affiliationSavingPercentWithoutGodChilds: faker.datatype.number(),
        userSensibleData: ['/v1/user_sensible_datas/24743'],
      };

      mockPool
        .intercept({
          path: 'v1/me',
          method: 'GET',
        })
        .reply(200, mockedResponse);

      const response = await sdk.getMe(input);
      if (isExternalError(response)) {
        expect(response).toHaveProperty('detail');
        expect(response).toHaveProperty('title');
        expect(response).toHaveProperty('type');
      } else {
        expect(response).toHaveProperty('username');
      }
    });
  });

  describe('getUserKycs', () => {
    it('calls the api with the right parameters', async () => {
      const sdk = new Api();

      const input: z.infer<typeof UserKycsInput> = {
        token: faker.datatype.string(100),
        userId: faker.datatype.number(),
      };
      const mockedResponse: z.infer<typeof UserKycsOutput> = {
        '@context': '/v1/contexts/UserKycs',
        '@id': '/v1/users/32036/user_kycs',
        '@type': 'hydra:Collection',
        'hydra:member': [],
        'hydra:totalItems': 1,
      };

      mockPool
        .intercept({
          path: `v1/users/${input.userId}/user_kycs`,
          method: 'GET',
        })
        .reply(200, mockedResponse);

      const response = await sdk.getUserKycs(input);
      if (isExternalError(response)) {
        expect(response).toHaveProperty('detail');
        expect(response).toHaveProperty('title');
        expect(response).toHaveProperty('type');
      } else {
        expect(response).toHaveProperty('hydra:member');
      }
    });
  });

  describe('getUserCoupons', () => {
    it('calls the api with the right parameters', async () => {
      const sdk = new Api();

      const input: z.infer<typeof UserCouponsInput> = {
        token: faker.datatype.string(100),
        userId: faker.datatype.number(),
      };
      const mockedResponse: z.infer<typeof UserCouponsOutput> = {
        '@context': '/v1/contexts/UserCoupons',
        '@id': `/v1/users/${input.userId}/user_coupons`,
        '@type': 'hydra:Collection',
        'hydra:member': [],
        'hydra:totalItems': 0,
        'hydra:view': {
          '@id': `/v1/users/${input.userId}/user_coupons?cache-version=0`,
          '@type': 'hydra:PartialCollectionView',
        },
      };

      mockPool
        .intercept({
          path: `v1/users/${input.userId}/user_coupons`,
          method: 'GET',
        })
        .reply(200, mockedResponse);

      const response = await sdk.getUserCoupons(input);
      if (isExternalError(response)) {
        expect(response).toHaveProperty('detail');
        expect(response).toHaveProperty('title');
        expect(response).toHaveProperty('type');
      } else {
        expect(response).toHaveProperty('hydra:member');
      }
    });
  });

  describe('getCoupons', () => {
    it('calls the api with the right parameters', async () => {
      const sdk = new Api();

      const input: z.infer<typeof CouponsInput> = {
        token: faker.datatype.string(100),
        userId: faker.datatype.number(),
      };
      const mockedResponse: z.infer<typeof CouponsOutput> = {
        '@context': '/v1/contexts/Coupons',
        '@id': `/v1/users/${input.userId}/coupons`,
        '@type': 'hydra:Collection',
        'hydra:member': [],
        'hydra:totalItems': 0,
        'hydra:view': {
          '@id': `/v1/users/${input.userId}/coupons?cache-version=0`,
          '@type': 'hydra:PartialCollectionView',
        },
      };
      mockPool
        .intercept({
          path: `v1/users/${input.userId}/coupons`,
          method: 'GET',
        })
        .reply(200, mockedResponse);

      const response = await sdk.getCoupons(input);
      if (isExternalError(response)) {
        expect(response).toHaveProperty('detail');
        expect(response).toHaveProperty('title');
        expect(response).toHaveProperty('type');
      } else {
        expect(response).toHaveProperty('hydra:member');
      }
    });
  });

  describe('getAdvice', () => {
    it('calls the api with the right parameters', async () => {
      const sdk = new Api();

      const input: z.infer<typeof AdviceInput> = {
        token: faker.datatype.string(100),
        adviceId: faker.datatype.number(),
      };
      const mockedResponse: z.infer<typeof AdviceOutput> = {
        '@context': '/v1/contexts/Advice',
        '@id': `/v1/advice/${input.adviceId}`,
        '@type': 'Advice',
        id: `${input.adviceId}`,
        status: faker.helpers.arrayElement(['pending']),
        advisor: {
          '@id': `/v1/users/${faker.datatype.number()}`,
          '@type': 'User',
          id: faker.datatype.number(),
          firstname: faker.name.firstName(),
          gender: faker.helpers.arrayElement(['man', 'woman']),
          picture: faker.internet.url(),
          calendlyCalendarUrl: faker.internet.url(),
        },
        video: faker.datatype.string(),
        inconsistent: faker.datatype.boolean(),
        suggestedInvestmentAccountProvider: faker.datatype.string(),
        uuid: faker.datatype.uuid(),
        createdAt: faker.date.past().toISOString(),
        updatedAt: faker.date.past().toISOString(),
      };
      mockPool
        .intercept({
          path: `v1/advice/${input.adviceId}`,
          method: 'GET',
        })
        .reply(200, mockedResponse);

      const response = await sdk.getAdvice(input);

      if (isExternalError(response)) {
        expect(response).toHaveProperty('detail');
        expect(response).toHaveProperty('title');
        expect(response).toHaveProperty('type');
      } else {
        expect(response).toHaveProperty('advisor');
      }
    });
  });

  describe('getInvestProfileCategories', () => {
    it('calls the api with the right parameters', async () => {
      const sdk = new Api();
      const input: z.infer<typeof InvestProfileCategoriesInput> = {
        token: faker.datatype.string(100),
      };
      const mockedResponse: z.infer<typeof InvestProfileCategoriesOutput> = {
        '@context': '/v1/contexts/InvestProfileCategory',
        '@id': '/v1/invest_profile_categories',
        '@type': 'hydra:Collection',
        'hydra:member': [],
        'hydra:totalItems': 0,
        'hydra:view': {
          '@id': '/v1/invest_profile_categories?cache-version=0',
          '@type': 'hydra:PartialCollectionView',
        },
      };
      mockPool
        .intercept({
          path: `v1/invest_profile_categories`,
          method: 'GET',
          headers: expect.objectContaining({ Authorization: `Bearer ${input.token}` }),
        })
        .reply(200, mockedResponse);

      const response = await sdk.getInvestProfileCategories(input);
      if (isExternalError(response)) {
        expect(response).toHaveProperty('detail');
        expect(response).toHaveProperty('title');
        expect(response).toHaveProperty('type');
      } else {
        expect(response).toHaveProperty('hydra:member');
      }
    });
  });

  describe('getInvestProfiles', () => {
    it('calls the api with the right parameters', async () => {
      const sdk = new Api();
      const input: z.infer<typeof InvestProfilesInput> = {
        token: faker.datatype.string(100),
      };
      const mockedResponse: z.infer<typeof InvestProfilesOutput> = {
        '@context': '/v1/contexts/InvestProfile',
        '@id': '/v1/invest_profiles',
        '@type': 'hydra:Collection',
        'hydra:member': [],
        'hydra:totalItems': 0,
        'hydra:view': {
          '@id': '/v1/invest_profiles?cache-version=0',
          '@type': 'hydra:PartialCollectionView',
        },
      };
      mockPool
        .intercept({
          path: `v1/invest_profiles`,
          method: 'GET',
          headers: expect.objectContaining({ Authorization: `Bearer ${input.token}` }),
        })
        .reply(200, mockedResponse);

      const response = await sdk.getInvestProfiles(input);
      if (isExternalError(response)) {
        expect(response).toHaveProperty('detail');
        expect(response).toHaveProperty('title');
        expect(response).toHaveProperty('type');
      } else {
        expect(response).toHaveProperty('hydra:member');
      }
    });
  });

  describe('getUserFinancialCapital', () => {
    it('calls the api with the right parameters', async () => {
      const sdk = new Api();
      const input: z.infer<typeof UserFinancialCapitalInput> = {
        token: faker.datatype.string(100),
        userInvestmentAccountId: faker.datatype.number(),
      };
      const mockedResponse: z.infer<typeof UserFinancialCapitalOutput> = {
        '@context': '/v1/contexts/UserFinancialCapital',
        '@id': `/v1/user_financial_capitals/${input.userInvestmentAccountId}`,
        '@type': 'UserFinancialCapital',
        id: `${input.userInvestmentAccountId}`,
        amount: faker.datatype.number(),
        performance: faker.datatype.number(),
        numberPendingOperations: faker.datatype.number(),
        buyAmount: faker.datatype.number(),
        sellAmount: faker.datatype.number(),
        exchangeAmount: faker.datatype.number(),
        effectiveDate: faker.date.recent().toISOString(),
        totalInvestAmount: faker.datatype.number(),
        initialInvestmentPending: faker.datatype.boolean(),
        operationValuatedAt: null,
        isBeingDailyProcessed: faker.datatype.boolean(),
      };
      mockPool
        .intercept({
          path: `v1/user_investment_accounts/${input.userInvestmentAccountId}/user_financial_capital`,
          method: 'GET',
          headers: expect.objectContaining({ Authorization: `Bearer ${input.token}` }),
        })
        .reply(200, mockedResponse);

      const response = await sdk.getUserFinancialCapital(input);
      if (isExternalError(response)) {
        expect(response).toHaveProperty('detail');
        expect(response).toHaveProperty('title');
        expect(response).toHaveProperty('type');
      } else {
        expect(response).toHaveProperty('amount');
        expect(response).toHaveProperty('performance');
        expect(response).toHaveProperty('numberPendingOperations');
      }
    });
  });

  describe('getUserInvestmentValuesInput', () => {
    it('calls the api with the right parameters', async () => {
      const sdk = new Api();
      const input: z.infer<typeof UserInvestmentValuesInput> = {
        token: faker.datatype.string(100),
        userInvestmentAccountId: faker.datatype.number(),
      };
      const mockedResponse: z.infer<typeof UserInvestmentValuesOutput> = {
        '@context': '/v1/contexts/UserInvestmentValues',
        '@id': `/v1/user_investment_accounts/${input.userInvestmentAccountId}/user_investment_values`,
        '@type': 'hydra:Collection',
        'hydra:member': [],
        'hydra:totalItems': 0,
      };
      mockPool
        .intercept({
          path: `v1/user_investment_accounts/${input.userInvestmentAccountId}/user_investment_values`,
          method: 'GET',
          headers: expect.objectContaining({ Authorization: `Bearer ${input.token}` }),
        })
        .reply(200, mockedResponse);

      const response = await sdk.getUserInvestmentValuesInput(input);
      if (isExternalError(response)) {
        expect(response).toHaveProperty('detail');
        expect(response).toHaveProperty('title');
        expect(response).toHaveProperty('type');
      } else {
        expect(response).toHaveProperty('hydra:member');
      }
    });
  });

  describe('getAvailableProducts', () => {
    it('calls the api with the right parameters', async () => {
      const sdk = new Api();
      const input: z.infer<typeof AvailableProductsInput> = {
        token: faker.datatype.string(100),
        userKycsId: faker.datatype.number(),
      };
      const mockedResponse: z.infer<typeof AvailableProductsOutput> = {
        '@context': '/v1/contexts/Products',
        '@id': '/v1/products',
        '@type': 'hydra:Collection',
        'hydra:member': [],
        'hydra:totalItems': 0,
      };
      mockPool
        .intercept({
          path: `v1/user_kycs/${input.userKycsId}/available_products`,
          method: 'GET',
          headers: expect.objectContaining({ Authorization: `Bearer ${input.token}` }),
        })
        .reply(200, mockedResponse);

      const response = await sdk.getAvailableProducts(input);
      if (isExternalError(response)) {
        expect(response).toHaveProperty('detail');
        expect(response).toHaveProperty('title');
        expect(response).toHaveProperty('type');
      } else {
        expect(response).toHaveProperty('hydra:member');
      }
    });
  });

  describe('getUserInvestmentAccountProducts', () => {
    it('calls the api with the right parameters', async () => {
      const sdk = new Api();
      const input: z.infer<typeof UserInvestmentAccountProductsInput> = {
        token: faker.datatype.string(100),
        userInvestmentAccountId: faker.datatype.number(),
      };
      const mockedResponse: z.infer<typeof UserInvestmentAccountProductsOutput> = {
        '@context': '/v1/contexts/UserInvestmentAccountProduct',
        '@id': `/v1/user_investment_accounts/${input.userInvestmentAccountId}/user_investment_account_products`,
        '@type': 'hydra:Collection',
        'hydra:member': [],
        'hydra:view': {
          '@id': `/v1/user_investment_accounts/${input.userInvestmentAccountId}/user_investment_account_products`,
          '@type': 'hydra:PartialCollectionView',
        },
        'hydra:search': {
          '@type': 'hydra:IriTemplate',
          'hydra:template': `/v1/user_investment_accounts/${input.userInvestmentAccountId}/user_investmen...`,
          'hydra:variableRepresentation': 'BasicRepresentation',
          'hydra:mapping': [],
        },
      };
      mockPool
        .intercept({
          path: `v1/user_investment_accounts/${input.userInvestmentAccountId}/user_investment_account_products`,
          method: 'GET',
          headers: expect.objectContaining({ Authorization: `Bearer ${input.token}` }),
        })
        .reply(200, mockedResponse);

      const response = await sdk.getUserInvestmentAccountProducts(input);
      if (isExternalError(response)) {
        expect(response).toHaveProperty('detail');
        expect(response).toHaveProperty('title');
        expect(response).toHaveProperty('type');
      } else {
        expect(response).toHaveProperty('hydra:member');
      }
    });
  });

  describe('getTwitch', () => {
    it('calls the api with the right parameters', async () => {
      const sdk = new Api();
      const input: z.infer<typeof MPPTwitchInput> = {
        token: faker.datatype.string(100),
      };
      const mockedResponse: z.infer<typeof MPPTwitchOutput> = {
        key: 'twitch',
        readable: faker.datatype.boolean(),
        value: {
          isLive: faker.datatype.boolean(),
        },
      };
      mockPool
        .intercept({
          path: `v1/settings/twitch.json`,
          method: 'GET',
          headers: expect.objectContaining({ Authorization: `Bearer ${input.token}` }),
        })
        .reply(200, mockedResponse);

      const response = await sdk.getTwitch(input);
      if (isExternalError(response)) {
        expect(response).toHaveProperty('detail');
        expect(response).toHaveProperty('title');
        expect(response).toHaveProperty('type');
      } else {
        expect(response).toHaveProperty('key');
        expect(response).toHaveProperty('readable');
        expect(response).toHaveProperty('value.isLive');
      }
    });
  });

  describe('getAdviceWaitingVideo', () => {
    it('calls the api with the right parameters', async () => {
      const sdk = new Api();
      const input: z.infer<typeof AdviceWaitingVideoInput> = {
        token: faker.datatype.string(100),
      };
      const mockedResponse: z.infer<typeof AdviceWaitingVideoOutput> = {
        key: 'advice-waiting-video',
        readable: faker.datatype.boolean(),
        value: {
          videoId: faker.datatype.number(),
        },
      };
      mockPool
        .intercept({
          path: `v1/settings/advice-waiting-video.json`,
          method: 'GET',
          headers: expect.objectContaining({ Authorization: `Bearer ${input.token}` }),
        })
        .reply(200, mockedResponse);

      const response = await sdk.getAdviceWaitingVideo(input);
      if (isExternalError(response)) {
        expect(response).toHaveProperty('detail');
        expect(response).toHaveProperty('title');
        expect(response).toHaveProperty('type');
      } else {
        expect(response).toHaveProperty('key');
        expect(response).toHaveProperty('readable');
        expect(response).toHaveProperty('value.videoId');
      }
    });
  });

  describe('getAdviceDTO', () => {
    it('calls the api with the right parameters', async () => {
      const sdk = new Api();
      const input: z.infer<typeof UserAdviceDTOInput> = {
        token: faker.datatype.string(100),
        userInvestmentAccountId: faker.datatype.number(),
      };
      const mockedResponse: z.infer<typeof UserAdviceDTOOutput> = {
        '@context': {
          '@vocab': 'https://api.monpetitplacement.fr/v1/docs.jsonld#',
          hydra: 'http://www.w3.org/ns/hydra/core#',
          provider: 'AdviceDto/provider',
          advisor: 'AdviceDto/advisor',
          mppChoice: 'AdviceDto/mppChoice',
          userChoice: 'AdviceDto/userChoice',
          video: 'AdviceDto/video',
          introVideoLinkProvided: 'AdviceDto/introVideoLinkProvided',
          adviceId: 'AdviceDto/adviceId',
        },
        '@type': 'UserInvestmentAccount',
        '@id': `/v1/user_investment_accounts/${input.userInvestmentAccountId}`,
        provider: '/v1/investment_account_providers/generali',
        advisor: {
          '@context': '/v1/contexts/User',
          '@id': '/v1/users/12345',
          '@type': 'User',
          firstname: faker.name.firstName(),
          lastname: faker.name.lastName(),
          calendlyCalendarUrl: faker.internet.url(),
        },
        mppChoice: {
          '@context': {
            '@vocab': 'https://api.monpetitplacement.fr/v1/docs.jsonld#',
            hydra: 'http://www.w3.org/ns/hydra/core#',
            initialAmount: 'AdviceStrategyDto/initialAmount',
            monthlyAmount: 'AdviceStrategyDto/monthlyAmount',
            splitDuration: 'AdviceStrategyDto/splitDuration',
            initialDistribution: 'AdviceStrategyDto/initialDistribution',
            monthlyDistribution: 'AdviceStrategyDto/monthlyDistribution',
            trustLevel: 'AdviceStrategyDto/trustLevel',
            automatic: 'AdviceStrategyDto/automatic',
            inconsistent: 'AdviceStrategyDto/inconsistent',
          },
          '@type': 'AdviceStrategyDto',
          '@id': '_:2312',
          initialAmount: faker.datatype.number(),
          monthlyAmount: faker.datatype.number(),
          splitDuration: faker.datatype.number(),
          initialDistribution: [
            {
              '@context': {
                '@vocab': 'https://api.monpetitplacement.fr/v1/docs.jsonld#',
                hydra: 'http://www.w3.org/ns/hydra/core#',
                funds: 'FundGroup/funds',
                slug: 'FundGroup/slug',
                name: 'FundGroup/name',
                percent: 'FundGroup/percent',
                amount: 'FundGroup/amount',
                type: 'FundGroup/type',
              },
              '@type': 'FundGroup',
              '@id': '_:1234',
              funds: [
                {
                  '@context': {
                    '@vocab': 'https://api.monpetitplacement.fr/v1/docs.jsonld#',
                    hydra: 'http://www.w3.org/ns/hydra/core#',
                    dici: 'Fund/dici',
                    isin: 'Fund/isin',
                    slug: 'Fund/slug',
                    name: 'Fund/name',
                    percent: 'Fund/percent',
                    amount: 'Fund/amount',
                    type: 'Fund/type',
                  },
                  '@type': 'Fund',
                  '@id': '_:1234',
                  dici: '',
                  isin: faker.finance.iban(),
                  slug: faker.lorem.slug(),
                  name: faker.company.name(),
                  percent: faker.datatype.number(100),
                  amount: faker.datatype.number(),
                  type: 'fund',
                },
              ],
              slug: faker.lorem.slug(),
              name: faker.lorem.word(),
              percent: faker.datatype.number(),
              amount: faker.datatype.number(),
              type: 'fund_group',
            },
          ],
          monthlyDistribution: [
            {
              '@context': {
                '@vocab': 'https://api.monpetitplacement.fr/v1/docs.jsonld#',
                hydra: 'http://www.w3.org/ns/hydra/core#',
                funds: 'FundGroup/funds',
                slug: 'FundGroup/slug',
                name: 'FundGroup/name',
                percent: 'FundGroup/percent',
                amount: 'FundGroup/amount',
                type: 'FundGroup/type',
              },
              '@type': 'FundGroup',
              '@id': '_:1234',
              funds: [
                {
                  '@context': {
                    '@vocab': 'https://api.monpetitplacement.fr/v1/docs.jsonld#',
                    hydra: 'http://www.w3.org/ns/hydra/core#',
                    // eslint-disable-next-line max-len
                    // abbrev fr : Document d'informations clés pour l'investisseur https://www.amf-france.org/sites/default/files/contenu_simple/guide/guide_pedagogique/S%27informer%20sur%20%20Le%20document%20d%27information%20cle%20pour%20l%27investisseur%20%28DICI%29.pdf
                    dici: 'Fund/dici',
                    // eslint-disable-next-line max-len
                    isin: 'Fund/isin', // abbrev : International Securities Identification Number (can used with any broker)
                    slug: 'Fund/slug',
                    name: 'Fund/name',
                    percent: 'Fund/percent',
                    amount: 'Fund/amount',
                    type: 'Fund/type',
                  },
                  '@type': 'Fund',
                  '@id': '_:2534',
                  dici: '',
                  isin: faker.finance.iban(),
                  slug: faker.lorem.slug(),
                  name: faker.company.name(),
                  percent: faker.datatype.number(100),
                  amount: faker.datatype.number(),
                  type: 'fund',
                },
              ],
              slug: faker.lorem.slug(),
              name: faker.lorem.word(),
              percent: faker.datatype.number(),
              amount: faker.datatype.number(),
              type: 'fund_group',
            },
          ],
          automatic: faker.datatype.boolean(),
          inconsistent: faker.datatype.boolean(),
        },
        introVideoLinkProvided: faker.datatype.boolean(),
        adviceId: faker.datatype.string(),
      };
      mockPool
        .intercept({
          path: `v1/user_investment_accounts/${input.userInvestmentAccountId}/advice_dto`,
          method: 'GET',
          headers: expect.objectContaining({ Authorization: `Bearer ${input.token}` }),
        })
        .reply(200, mockedResponse);

      const response = await sdk.getAdviceDTO(input);
      if (isExternalError(response)) {
        expect(response).toHaveProperty('detail');
        expect(response).toHaveProperty('title');
        expect(response).toHaveProperty('type');
      } else {
        expect(response).toHaveProperty('advisor');
        expect(response).toHaveProperty('mppChoice');
      }
    });
  });

  describe('getKycCategories', () => {
    it('calls the api with the right parameters', async () => {
      const sdk = new Api();
      const input: z.infer<typeof UserKycCategoryInput> = {
        token: faker.datatype.string(100),
      };
      const mockedResponse: z.infer<typeof UserKycCategoryOutput> = {
        '@context': '/v1/contexts/KycCategory',
        '@id': '/v1/kyc_categories',
        '@type': 'hydra:Collection',
        'hydra:member': [
          {
            '@id': '/v1/kyc_categories/1',
            '@type': 'KycCategory',
            id: '1',
            name: faker.lorem.lines(),
            slug: faker.lorem.slug(),
            position: faker.datatype.string(),
            uuid: faker.datatype.uuid(),
            createdAt: faker.datatype.string(),
            updatedAt: faker.datatype.string(),
          },
        ],
        'hydra:totalItems': 1,
      };
      mockPool
        .intercept({
          path: `v1/kyc_categories`,
          method: 'GET',
          headers: expect.objectContaining({ Authorization: `Bearer ${input.token}` }),
        })
        .reply(200, mockedResponse);

      const response = await sdk.getKycCategories(input);
      if (isExternalError(response)) {
        expect(response).toHaveProperty('detail');
        expect(response).toHaveProperty('title');
        expect(response).toHaveProperty('type');
      } else {
        expect(response).toHaveProperty('hydra:member');
      }
    });
  });

  describe('getKycQuestions', () => {
    it('calls the api with the right parameters', async () => {
      const sdk = new Api();
      const input: z.infer<typeof UserKycQuestionsInput> = {
        token: faker.datatype.string(100),
        provider: faker.commerce.product(),
      };
      const mockedResponse: z.infer<typeof UserKycQuestionsOutput> = {
        '@context': '/v1/contexts/KycQuestion',
        '@id': '/v1/investment_account_providers/generali/kyc_questions',
        '@type': 'hydra:Collection',
        'hydra:member': [
          {
            '@id': '/v1/kyc_questions/123',
            '@type': 'KycQuestion',
            id: faker.random.numeric(3),
            position: faker.random.numeric(),
            type: 'custom',
            seconds: faker.random.numeric(),
            identifier: faker.lorem.slug(),
            options: null,
            isSubQuestion: faker.datatype.boolean(),
            postAnswer: faker.datatype.boolean(),
            currentStepToPatch: faker.lorem.slug(),
            previousQuestion: faker.lorem.slug(),
            nextQuestion: {
              default: faker.lorem.slug(),
              provider: { generali: faker.lorem.slug() },
            },
            category: '/v1/kyc_categories/22',
            parentAnswer: null,
            answers: [],
            name: faker.lorem.lines(4),
            slug: faker.lorem.slug(1),
            uuid: faker.datatype.uuid(),
            createdAt: faker.datatype.string(),
            updatedAt: faker.datatype.string(),
          },
          {
            '@id': '/v1/kyc_questions/123',
            '@type': 'KycQuestion',
            id: faker.random.numeric(3),
            position: '5',
            type: 'checkbox',
            seconds: '0',
            identifier: faker.lorem.slug(3),
            options: {
              subtitle: faker.lorem.lines(3),
            },
            isSubQuestion: faker.datatype.boolean(),
            postAnswer: faker.datatype.boolean(),
            currentStepToPatch: faker.lorem.slug(3),
            previousQuestion: faker.lorem.slug(3),
            nextQuestion: { default: faker.lorem.slug(3) },
            category: '/v1/kyc_categories/22',
            parentAnswer: null,
            answers: [
              {
                '@id': '/v1/kyc_answers/123',
                '@type': 'KycAnswer',
                id: faker.random.numeric(3),
                position: '1',
                value: null,
                score: null,
                identifier: faker.lorem.slug(),
                options: null,
                name: faker.lorem.word(),
                uuid: faker.datatype.uuid(),
                createdAt: faker.datatype.string(),
                updatedAt: faker.datatype.string(),
              },
            ],
            name: faker.lorem.text(),
            slug: faker.lorem.slug(),
            uuid: faker.datatype.uuid(),
            createdAt: faker.datatype.string(),
            updatedAt: faker.datatype.string(),
          },
        ],
        'hydra:totalItems': 21,
      };
      mockPool
        .intercept({
          path: `v1/investment_account_providers/${input.provider}/kyc_questions`,
          method: 'GET',
          headers: expect.objectContaining({ Authorization: `Bearer ${input.token}` }),
        })
        .reply(200, mockedResponse);

      const response = await sdk.getKycQuestions(input);
      if (isExternalError(response)) {
        expect(response).toHaveProperty('detail');
        expect(response).toHaveProperty('title');
        expect(response).toHaveProperty('type');
      } else {
        expect(response).toHaveProperty('hydra:member');
      }
    });
  });

  describe('getUserInvestmentAccountProviders', () => {
    it('calls the api with the right parameters', async () => {
      const sdk = new Api();
      const input: z.infer<typeof UserInvestmentAccountProvidersInput> = {
        token: faker.datatype.string(100),
        provider: faker.company.name(),
      };
      const mockedResponse: z.infer<typeof UserInvestmentAccountProvidersOutput> = {
        '@context': '/v1/contexts/InvestmentAccountProvider',
        '@id': '/v1/investment_account_providers/generali',
        '@type': 'InvestmentAccountProvider',
        id: faker.random.numeric(),
        name: faker.company.name(),
        slug: faker.lorem.slug(),
      };
      mockPool
        .intercept({
          path: `v1/investment_account_providers/${input.provider}`,
          method: 'GET',
          headers: expect.objectContaining({ Authorization: `Bearer ${input.token}` }),
        })
        .reply(200, mockedResponse);

      const response = await sdk.getUserInvestmentAccountProviders(input);
      if (isExternalError(response)) {
        expect(response).toHaveProperty('detail');
        expect(response).toHaveProperty('title');
        expect(response).toHaveProperty('type');
      } else {
        expect(response).toHaveProperty('hydra:member');
      }
    });
  });

  describe('getUserInvestmentAccount', () => {
    it('calls the api with the right parameters', async () => {
      const sdk = new Api();
      const input: z.infer<typeof UserInvestmentAccountInput> = {
        token: faker.datatype.string(100),
        userInvestmentAccountId: faker.datatype.string(),
      };
      const mockedResponse: z.infer<typeof UserInvestmentAccountOutput> = {
        '@context': '/v1/contexts/UserInvestmentAccount',
        '@id': '/v1/user_investment_accounts/131496',
        '@type': 'UserInvestmentAccount',
        id: '131496',
        status: faker.helpers.arrayElement(['pending']),
        watermark: faker.datatype.number(2),
        incompatible: faker.datatype.boolean(),
        appointmentRequired: false,
        provider: '/v1/investment_account_providers/generali',
        user: '/v1/users/123456',
        userKycs: ['/v1/user_kycs/123456'],
        hidden: faker.datatype.boolean(),
        duration: 5,
        advice: ['/v1/advice/123456'],
        userInvestmentAccountCallBack: [],
        uuid: faker.datatype.uuid(),
        createdAt: faker.datatype.string(),
        updatedAt: faker.datatype.string(),
        userKyc: '/v1/user_kycs/12345',
      };
      mockPool
        .intercept({
          path: `v1/user_investment_accounts/${input.userInvestmentAccountId}`,
          method: 'GET',
          headers: expect.objectContaining({ Authorization: `Bearer ${input.token}` }),
        })
        .reply(200, mockedResponse);

      const response = await sdk.getUserInvestmentAccount(input);
      if (isGatewayError(response)) {
        expect(typeof response === 'string');
      } else if (isExternalError(response)) {
        expect(response).toHaveProperty('detail');
        expect(response).toHaveProperty('title');
        expect(response).toHaveProperty('type');
      } else {
        expect(response).toHaveProperty('status');
        expect(response).toHaveProperty('uuid');
      }
    });
  });

  describe('getInitialConsultingAnalysis', () => {
    it('calls the api with the right parameters', async () => {
      const sdk = new Api();
      const input: z.infer<typeof GetConsultingAnalysisInput> = {
        token: faker.datatype.string(100),
        userKycsId: faker.datatype.number(),
      };
      const mockedResponse: z.infer<typeof GetConsultingAnalaysisOutput> = [
        {
          funds: [
            {
              dici: faker.datatype.string(),
              isin: faker.datatype.string(),
              slug: faker.lorem.slug(),
              name: faker.company.name(),
              percent: faker.datatype.number(100),
              amount: faker.datatype.number(),
              type: 'fund',
            },
          ],
          slug: faker.lorem.slug(),
          name: faker.datatype.string(),
          percent: faker.datatype.number(100),
          amount: faker.datatype.number(),
          type: 'fund_group',
        },
      ];
      mockPool
        .intercept({
          path: `v1/user_kycs/${input.userKycsId}/consulting_analysis/initial`,
          method: 'GET',
          headers: expect.objectContaining({ Authorization: `Bearer ${input.token}` }),
        })
        .reply(200, mockedResponse);

      const response = await sdk.getInitialConsultingAnalysis(input);
      if (isExternalError(response)) {
        expect(response).toHaveProperty('detail');
        expect(response).toHaveProperty('title');
        expect(response).toHaveProperty('type');
      } else {
        expect(response).toHaveProperty('hydra:member');
      }
    });
  });

  describe('getMonthlyConsultingAnalysis', () => {
    it('calls the api with the right parameters', async () => {
      const sdk = new Api();
      const input: z.infer<typeof GetConsultingAnalysisInput> = {
        token: faker.datatype.string(100),
        userKycsId: faker.datatype.number(),
      };
      const mockedResponse: z.infer<typeof GetConsultingAnalaysisOutput> = [
        {
          funds: [
            {
              dici: faker.datatype.string(),
              isin: faker.datatype.string(),
              slug: faker.lorem.slug(),
              name: faker.company.name(),
              percent: faker.datatype.number(100),
              amount: faker.datatype.number(),
              type: 'fund',
            },
          ],
          slug: faker.lorem.slug(),
          name: faker.datatype.string(),
          percent: faker.datatype.number(100),
          amount: faker.datatype.number(),
          type: 'fund_group',
        },
      ];
      mockPool
        .intercept({
          path: `v1/user_kycs/${input.userKycsId}/consulting_analysis/monthly`,
          method: 'GET',
          headers: expect.objectContaining({ Authorization: `Bearer ${input.token}` }),
        })
        .reply(200, mockedResponse);

      const response = await sdk.getMonthlyConsultingAnalysis(input);
      if (isExternalError(response)) {
        expect(response).toHaveProperty('detail');
        expect(response).toHaveProperty('title');
        expect(response).toHaveProperty('type');
      } else {
        expect(response.length).toBeGreaterThan(0);
      }
    });
  });

  mockPool = mockAgent.get(baseURLForFacade('public'));

  describe('getInvestProfileHistory', () => {
    it('calls the api with the right parameters', async () => {
      const sdk = new Api();
      const input: z.infer<typeof GetInvestProfileInput> = {
        profile: faker.helpers.arrayElement(['volontaire', 'energique', 'ambitieux', 'intrepide']),
      };
      const mockedResponse: z.infer<typeof GetInvestProfileOutput> = {
        history: {
          '2015-08-07': faker.datatype.number(),
          '2015-08-08': faker.datatype.number(),
          // ...
          '2022-08-25': faker.datatype.number(),
        },
      };
      mockPool
        .intercept({
          path: `v1/user_kycs/${input.profile}/consulting_analysis/monthly`,
          method: 'GET',
        })
        .reply(200, mockedResponse);

      const response = await sdk.getInvestProfileHistory(input);
      if (isExternalError(response)) {
        expect(response).toHaveProperty('detail');
        expect(response).toHaveProperty('title');
        expect(response).toHaveProperty('type');
      } else {
        expect(response).toHaveProperty('history');
      }
    });
  });
});
