import { Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as midtransClient from 'midtrans-client';

export const MIDTRANS_SNAP = 'MIDTRANS_SNAP';

export const midtransProvider: Provider = {
  provide: MIDTRANS_SNAP,
  inject: [ConfigService],
  useFactory: (config: ConfigService) => {
    return new midtransClient.Snap({
      isProduction: config.get('MIDTRANS_IS_PRODUCTION') === 'true',
      serverKey: config.getOrThrow<string>('MIDTRANS_SERVER_KEY'),
      clientKey: config.getOrThrow<string>('MIDTRANS_CLIENT_KEY'),
    });
  },
};