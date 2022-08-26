/* eslint-disable no-console */
import axios, { AxiosError } from 'axios';
import 'dotenv/config';

import { logger } from './src/logger';

import { Api } from './src';

const { USERNAME, PASSWORD } = process.env;
if (USERNAME === undefined) {
  throw new Error(`Missing en var "username".`);
}
if (PASSWORD === undefined) {
  throw new Error(`Missing en var "password".`);
}

function handleRemoteError(err: AxiosError | Error) {
  if (axios.isAxiosError(err)) {
    logger.error({
      message: err.message,
      code: err.code,
      url: err.config.baseURL && err.config.url ? err.config.baseURL + err.config.url : '',
      data: err.response?.data,
    });
    return;
  }

  logger.error({ message: 'unknown error', err });
}

function defaultHandler(err: unknown) {
  if (err instanceof Error || err instanceof AxiosError) {
    handleRemoteError(err);
    return;
  }

  logger.fatal(err);
}

(async () => {
  const api = new Api();

  const { access_token: token } = await api.login({ username: USERNAME, password: PASSWORD });
  const user = await api.getMe({ token });

  logger.warn({
    action: 'login',
    username: USERNAME,
    // user,
  });

  const userId = user.id;
  const investProfileCategories = await api.getInvestProfileCategories({ token });
  const investProfiles = await api.getInvestProfiles({ token });
  const userCoupons = await api.getUserCoupons({ token, userId });
  const coupons = await api.getCoupons({ token, userId });
  const userKycs = await api.getUserKycs({ token, userId });

  // console.debug(investProfileCategories, investProfiles, userCoupons, coupons, userKycs);
  const kycs = userKycs['hydra:member'];

  if (!user.investmentAccounts) {
    logger.error({
      message: 'no investmentAccounts found',
      user,
    });
    return;
  }

  const advicesDTO = await Promise.all(
    user.investmentAccounts?.map((investmentAccount) => {
      return api
        .getAdviceDTO({ token, userInvestmentAccountId: investmentAccount.id })
        .then((dto) => {
          const initialDistribution = dto.mppChoice.initialDistribution[0];
          const monthlyDistribution = dto.mppChoice.monthlyDistribution[0];
          logger.warn({
            log: 'initial distribution per funds',
            advisor: `${dto.advisor.firstname} ${dto.advisor.lastname}`,
            mppChoice: {
              initialAmount: dto.mppChoice.initialAmount,
              initialDistribution: {
                name: initialDistribution.name,
                amount: initialDistribution.amount,
                funds: initialDistribution.funds.map((fund) => {
                  return {
                    amount: fund.amount,
                    isin: fund.isin,
                    name: fund.name,
                    percent: fund.percent,
                    slug: fund.slug,
                  };
                }),
                monthlyAmount: monthlyDistribution.amount,
                monthlyDistribution: {
                  name: monthlyDistribution.name,
                  percent: monthlyDistribution.percent,
                  funds: initialDistribution.funds.map((fund) => {
                    return {
                      amount: fund.amount,
                      isin: fund.isin,
                      name: fund.name,
                      percent: fund.percent,
                      slug: fund.slug,
                    };
                  }),
                },
              },
            },
          });

          return dto;
        });
    })
  );

  // Below doesn't work if no strategy in account
  const advices = await Promise.all(
    kycs.map((adviceId) => api.getAdvice({ token, adviceId: parseInt(adviceId.id, 10) }))
  );
  if (advices && !advices.length) {
    logger.warn('No advices found');
  }

  const activeInvestmentAccounts = user.investmentAccounts.filter(
    (investmentAccount) => investmentAccount.status !== 'pending'
  );

  if (!activeInvestmentAccounts.length) {
    logger.error({
      message: 'No active investment accounts found',
      // investmentAccounts: user.investmentAccounts,
    });
    return;
  }

  logger.info({
    message: 'got these active investment accounts',
    // activeInvestmentAccounts,
  });

  // below is denied for inactive investment accounts
  const availableProducts = await Promise.all(
    userKycs['hydra:member'].map(({ id }) =>
      api.getAvailableProducts({ token, userKycsId: parseInt(id, 10) })
    )
  );

  const userFinancialCapitals = await Promise.all(
    activeInvestmentAccounts.map(({ id }) =>
      api.getUserFinancialCapital({ token, userInvestmentAccountId: parseInt(id, 10) })
    )
  );

  const userInvestmentValuesInput = await Promise.all(
    activeInvestmentAccounts.map(({ id }) =>
      api.getUserInvestmentValuesInput({ token, userInvestmentAccountId: parseInt(id, 10) })
    )
  );

  const userInvestmentAccountProducts = await Promise.all(
    activeInvestmentAccounts.map(({ id }) =>
      api.getUserInvestmentAccountProducts({ token, userInvestmentAccountId: parseInt(id, 10) })
    )
  );

  logger.info({
    investProfileCategories,
    investProfiles,
    user,
    userCoupons,
    coupons,
    userKycs,
    availableProducts,
    advicesDTO,
    advices,
    userFinancialCapitals,
    userInvestmentValuesInput,
    userInvestmentAccountProducts,
  });
})().catch((e) => {
  defaultHandler(e);
  process.exit(-1);
});
