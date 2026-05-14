import { Test, TestingModule } from '@nestjs/testing';
import { SettingsService } from './settings.service';
import { PrismaService } from '../prisma/prisma.service';
import * as ldap from 'ldapjs';

jest.mock('ldapjs');

describe('SettingsService', () => {
  let service: SettingsService;
  let prisma: PrismaService;

  const mockPrisma = {
    m365Settings: {
      upsert: jest.fn(),
    },
    adSettings: {
      upsert: jest.fn(),
    },
    tenant: {
      findUnique: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SettingsService,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
      ],
    }).compile();

    service = module.get<SettingsService>(SettingsService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('updateM365', () => {
    it('should upsert M365 settings', async () => {
      const dto = { azureTenantId: 'test', clientId: 'test' } as any;
      await service.updateM365('tenant-1', dto);
      expect(mockPrisma.m365Settings.upsert).toHaveBeenCalled();
    });
  });

  describe('updateAD', () => {
    it('should upsert AD settings', async () => {
      const dto = { adServerIp: '1.1.1.1', domainName: 'test.com' } as any;
      await service.updateAD('tenant-1', dto);
      expect(mockPrisma.adSettings.upsert).toHaveBeenCalled();
    });
  });

  describe('testAdConnection', () => {
    it('should return success if LDAP bind succeeds', async () => {
      const mockClient = {
        bind: jest.fn((user, pass, cb) => cb(null)),
        unbind: jest.fn(),
        on: jest.fn(),
        search: jest.fn((base, opt, cb) => {
          const res = {
            on: jest.fn((event, callback) => {
              if (event === 'searchEntry') callback({});
              if (event === 'end') callback();
            }),
          };
          cb(null, res);
        }),
      };
      (ldap.createClient as jest.Mock).mockReturnValue(mockClient);

      const result = await service.testAdConnection({
        adServerIp: '1.1.1.1',
        baseDn: 'dc=test',
      } as any);
      expect(result.success).toBe(true);
    });

    it('should return failure if LDAP bind fails', async () => {
      const mockClient = {
        bind: jest.fn((user, pass, cb) => cb(new Error('Invalid credentials'))),
        unbind: jest.fn(),
        on: jest.fn(),
      };
      (ldap.createClient as jest.Mock).mockReturnValue(mockClient);

      const result = await service.testAdConnection({
        adServerIp: '1.1.1.1',
      } as any);
      expect(result.success).toBe(false);
      expect(result.message).toContain('Authentication failed');
    });
  });
});
