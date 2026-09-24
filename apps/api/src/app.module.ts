import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { StoresModule } from './stores/stores.module';
import { CategoriesModule } from './categories/categories.module';
import { ProductModel } from './generated/prisma/models';
import { ProductsModule } from './products/products.module';
import { CartModule } from './cart/cart.module';

@Module({
  imports: [ConfigModule.forRoot({isGlobal:true}), 
    PrismaModule, 
    AuthModule,
    StoresModule,
    CategoriesModule,
    ProductsModule,
    CartModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
