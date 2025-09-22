import { fireKeys } from '../queries/fires';
import { FiresQueryParams } from '../types';

describe('fireKeys', () => {
  it('creates stable list keys', () => {
    const params: FiresQueryParams = {
      mode: 'country',
      country: 'USA',
      startDate: '2024-01-01',
      endDate: '2024-01-02',
    };
    const keyA = fireKeys.list(params);
    const keyB = fireKeys.list(params);

    expect(keyA).toEqual(keyB);
  });
});
