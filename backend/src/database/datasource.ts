import 'reflect-metadata'
import { DataSource } from 'typeorm'
import { ConfigModule } from '@nestjs/config'
import { User } from '@/modules/users/entities/user.entity'
import { Plan } from '@/modules/subscriptions/entities/plan.entity'
import { Subscription } from '@/modules/subscriptions/entities/subscription.entity'
import { GatewayMeta } from '@/modules/subscriptions/entities/gateway-meta.entity'
import { GatewayWebhook } from '@/modules/subscriptions/entities/gateway-webhook.entity'
import { Invoice } from '@/modules/subscriptions/entities/invoice.entity'
import { LegalDocument } from '@/modules/legal/entities/legal-document.entity'
import { UserAgreement } from '@/modules/legal/entities/user-agreement.entity'
import { Affiliate } from '@/modules/subscriptions/entities/affiliate.entity'
import { Partnership } from '@/modules/subscriptions/entities/partnership.entity'
import { PartnershipAffiliate } from '@/modules/subscriptions/entities/partnership-affiliate.entity'
import { UserActiveCoupon } from '@/modules/subscriptions/entities/user-active-coupon.entity'
import { AuditLog } from '@/modules/audit/entities/audit-log.entity'
import { SystemSetting } from '@/modules/settings/entities/system-setting.entity'
import * as path from 'path'

const dbUrl = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5433/little_tales'
const isProd = process.env.NODE_ENV === 'production'
const rawSsl = process.env.DB_SSL || process.env.DATABASE_SSL
const useSsl = rawSsl !== undefined
  ? ['true', '1', 'yes', 'on'].includes(String(rawSsl).toLowerCase())
  : isProd
const isTs = __filename.endsWith('.ts')
const migrationsPath = isTs
  ? 'src/database/migrations/*.ts'
  : 'dist/src/database/migrations/*.js'

const AppDataSource = new DataSource({
  type: 'postgres',
  url: dbUrl,
  ssl: useSsl ? { rejectUnauthorized: false } : false,
  entities: [
    User,
    Plan,
    Subscription,
    GatewayMeta,
    GatewayWebhook,
    Invoice,
    LegalDocument,
    UserAgreement,
    Affiliate,
    Partnership,
    PartnershipAffiliate,
    UserActiveCoupon,
    AuditLog,
    SystemSetting,
  ],
  migrations: [migrationsPath],
})

export default AppDataSource
