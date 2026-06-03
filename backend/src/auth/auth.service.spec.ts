import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { HttpException } from '@nestjs/common';

describe('AuthService', () => {
  let service: AuthService;

  const mockPrisma = {
    tenant: {
      findFirst: jest.fn(),
      create: jest.fn(),
    },
    user: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getTenantConfigByDomain', () => {
    it('should return master config for petrus.io', async () => {
      mockPrisma.tenant.findFirst.mockResolvedValue({
        id: 'master',
        domainName: 'petrus.io',
        tenantCode: 'MASTER',
        m365Settings: { azureTenantId: '1', clientId: '2', redirectUrl: '3' },
      });
      const result = await service.getTenantConfigByDomain('petrus.io');
      expect(result.tenantCode).toBe('MASTER');
    });

    it('should throw error if tenant not found', async () => {
      mockPrisma.tenant.findFirst.mockResolvedValue(null);
      await expect(service.getTenantConfigByDomain('unknown.com')).rejects.toThrow(HttpException);
    });
  });

  describe('login', () => {
    it('should login super admin', async () => {
      mockPrisma.tenant.findFirst.mockResolvedValue({
        id: 'master',
        domainName: 'petrus.io',
        tenantCode: 'MASTER',
        m365Settings: { azureTenantId: '1', clientId: '2', redirectUrl: '3' },
      });
      mockPrisma.user.findFirst.mockResolvedValue({ id: 'admin', email: 'admin@petrus.io', password: 'admin' });
      const result = await service.login('admin@petrus.io', 'admin');
      expect(result.accessToken).toContain('mock-jwt-token-for-admin');
    });
  });
});
