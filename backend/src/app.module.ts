import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import configuration from './config/configuration.js';
import { validationSchema } from './config/validation.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { AuthModule } from './auth/auth.module.js';
import { ProductsModule } from './products/products.module.js';
import { VendorsModule } from './vendors/vendors.module.js';
import { CustomersModule } from './customers/customers.module.js';
import { WarehousesModule } from './warehouses/warehouses.module.js';
import { DashboardModule } from './dashboard/dashboard.module.js';
import { AuditModule } from './audit/audit.module.js';
import { SalesOrdersModule } from './sales-orders/sales-orders.module.js';
import { PurchaseOrdersModule } from './purchase-orders/purchase-orders.module.js';
import { InventoryModule } from './inventory/inventory.module.js';
import { FulfilmentModule } from './fulfilment/fulfilment.module.js';
import { FinanceModule } from './finance/finance.module.js';
import { IntakeModule } from './intake/intake.module.js';
import { AnalyticsModule } from './analytics/analytics.module.js';
import { AiModule } from './ai/ai.module.js';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validationSchema,
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 120,
      },
    ]),
    PrismaModule,
    AuditModule,
    AuthModule,
    ProductsModule,
    VendorsModule,
    CustomersModule,
    WarehousesModule,
    DashboardModule,
    SalesOrdersModule,
    PurchaseOrdersModule,
    InventoryModule,
    FulfilmentModule,
    FinanceModule,
    IntakeModule,
    AnalyticsModule,
    AiModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
