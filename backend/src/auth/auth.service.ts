import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService) {}

  async getTenantConfigByDomain(domain: string) {
    // 1. Master Tenant Auto-Seeding (Option B: Platform Owner)
    if (domain === 'petrus.io') {
      let masterTenant = await this.prisma.tenant.findFirst({
        where: { domainName: 'petrus.io' },
        include: { m365Settings: true },
      });

      if (!masterTenant) {
        masterTenant = await this.prisma.tenant.create({
          data: {
            name: 'Petrus Platform Admin',
            companyName: 'Petrus IAM',
            domainName: 'petrus.io',
            tenantCode: 'MASTER',
            m365Settings: {
              create: {
                azureTenantId: 'petrus-master-azure-id',
                clientId: 'petrus-master-client-id',
                redirectUrl: 'http://localhost:3000/auth/callback',
              }
            }
          },
          include: { m365Settings: true },
        });
      }

      return {
        tenantId: masterTenant.id,
        tenantCode: masterTenant.tenantCode,
        name: masterTenant.name,
        azureTenantId: masterTenant.m365Settings!.azureTenantId,
        clientId: masterTenant.m365Settings!.clientId,
        redirectUrl: masterTenant.m365Settings!.redirectUrl,
      };
    }

    // 2. Standard Tenant Lookup
    const tenant = await this.prisma.tenant.findFirst({
      where: { domainName: domain, status: 'ACTIVE' },
      include: { m365Settings: true },
    });

    if (!tenant) {
      throw new HttpException('Tenant not found or inactive', HttpStatus.NOT_FOUND);
    }

    if (!tenant.m365Settings || !tenant.m365Settings.clientId || !tenant.m365Settings.azureTenantId) {
      throw new HttpException('SSO is not configured for this tenant', HttpStatus.BAD_REQUEST);
    }

    return {
      tenantId: tenant.id,
      tenantCode: tenant.tenantCode,
      name: tenant.name,
      azureTenantId: tenant.m365Settings.azureTenantId,
      clientId: tenant.m365Settings.clientId,
      redirectUrl: tenant.m365Settings.redirectUrl || 'http://localhost:3000/auth/callback',
    };
  }

  async exchangeM365Token(code: string, domain: string) {
    // 1. Get the tenant settings to verify domain
    const config = await this.getTenantConfigByDomain(domain);
    
    // In a real implementation with valid Azure AD credentials, we would call MSAL or standard OAuth token endpoint here.
    
    // 2. Mock payload since we are bypassing actual Microsoft graph call
    const mockEmail = `admin@${domain}`;
    
    // 3. Find user in the tenant
    let user = await this.prisma.user.findFirst({
      where: { email: mockEmail, tenantId: config.tenantId }
    });

    // Auto-provision if it's the first time admin logs in (for demo purposes)
    if (!user) {
      user = await this.prisma.user.create({
        data: {
          email: mockEmail,
          name: config.tenantCode === 'MASTER' ? 'Platform Super Admin' : 'Tenant Administrator',
          tenantId: config.tenantId,
        }
      });
    }

    // 4. Issue Platform JWT
    const platformToken = `mock-jwt-token-for-${user.id}`;

    return {
      accessToken: platformToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        tenantCode: config.tenantCode,
        tenantName: config.name,
        isSuperAdmin: config.tenantCode === 'MASTER', // Grant Super Admin rights if MASTER tenant
      }
    };
  }

  async login(email: string, password?: string) {
    // For mock testing, password is not explicitly validated

    // 1. Mock Super Admin Login
    if (email === 'admin@petrus.io') {
      const config = await this.getTenantConfigByDomain('petrus.io');
      let user = await this.prisma.user.findFirst({
        where: { email, tenantId: config.tenantId }
      });

      if (!user) {
        user = await this.prisma.user.create({
          data: {
            email,
            name: 'Platform Super Admin',
            tenantId: config.tenantId,
            systemRole: 'SUPER_ADMIN',
          }
        });
      } else if (user.systemRole !== 'SUPER_ADMIN') {
        user = await this.prisma.user.update({
          where: { id: user.id },
          data: { systemRole: 'SUPER_ADMIN' }
        });
      }

      return {
        accessToken: `mock-jwt-token-for-${user.id}`,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          tenantCode: config.tenantCode,
          tenantName: config.name,
          systemRole: user.systemRole,
        }
      };
    }

    // 2. Standard Tenant User Login — tenant must exist and be ACTIVE
    const domain = email.split('@')[1];
    if (!domain) throw new HttpException('Invalid email format', HttpStatus.BAD_REQUEST);

    // Look up the tenant by domain — must be explicitly added by an admin
    const tenant = await this.prisma.tenant.findFirst({
      where: { domainName: domain, status: 'ACTIVE' },
    });

    if (!tenant) {
      throw new HttpException('Invalid account. Your organisation is not registered on this platform.', HttpStatus.UNAUTHORIZED);
    }

    const config = {
      tenantId: tenant.id,
      tenantCode: tenant.tenantCode,
      name: tenant.name,
    };

    let user = await this.prisma.user.findFirst({
      where: { email, tenantId: config.tenantId }
    });

    if (!user) {
      user = await this.prisma.user.create({
        data: {
          email,
          name: 'Tenant Administrator',
          tenantId: config.tenantId,
          systemRole: 'TENANT_ADMIN',
        }
      });
    } else if (email.startsWith('admin@') && user.systemRole !== 'TENANT_ADMIN') {
      user = await this.prisma.user.update({
        where: { id: user.id },
        data: { systemRole: 'TENANT_ADMIN' }
      });
    }

    return {
      accessToken: `mock-jwt-token-for-${user.id}`,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        tenantCode: config.tenantCode,
        tenantName: config.name,
        systemRole: user.systemRole,
      }
    };
  }
}
