export class Xirr {
  constructor() {}

  fetchXirr = async (instrumentId: string): Promise<number> => {
    const token = window.localStorage.getItem('__storejs_kite_public_token');
    if (token == null) {
      console.log('console token is null');
      return 0;
    }
    try {
      const {data} = await fetch(
        `https://console.zerodha.com/api/reports/xirr?segment=EQ&instrument_id=${instrumentId}`,
        {
          headers: {
            'X-Csrftoken': token.replaceAll('"', ''),
            'X-Extension': 'true',
          },
          credentials: 'include',
        }
      ).then(res => res.json());
      return Number(data.result);
    } catch (e) {
      console.log('error', e);
    }
    return 0;
  };
}
