import { Test, TestingModule } from '@nestjs/testing';
import { SettingsService } from './settings.service';
import { PrismaService } from '../prisma/prisma.service';
import * as ldap from 'ldapjs';

jest.mock('ldapjs');

describe('SettingsService', () => {
  let service: SettingsService;

  const mockPrisma = {
    m365Settings: {
      create: jest.fn(),
      update: jest.fn(),
    },
    adSettings: {
      create: jest.fn(),
      update: jest.fn(),
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
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('updateM365', () => {
    it('should create M365 settings if no id is provided', async () => {
      const dto = { azureTenantId: 'test', clientId: 'test' } as any;
      await service.updateM365('tenant-1', dto);
      expect(mockPrisma.m365Settings.create).toHaveBeenCalled();
    });
  });

  describe('updateAD', () => {
    it('should create AD settings if no id is provided', async () => {
      // NOSONAR - test IP address
      const testIp = '192.0.2.1'; // RFC5737 TEST-NET, safe for tests
      const dto = { adServerIp: testIp, domainName: 'test.com' } as any;
      await service.updateAD('tenant-1', dto);
      expect(mockPrisma.adSettings.create).toHaveBeenCalled();
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

      // NOSONAR - test IP address
      const testIp = '192.0.2.1'; // RFC5737 TEST-NET, safe for tests
      const result = await service.testAdConnection({
        adServerIp: testIp,
        baseDn: 'dc=test',
      } as any) as { success: boolean; message?: string };
      expect(result.success).toBe(true);
    });

    it('should return failure if LDAP bind fails', async () => {
      const mockClient = {
        bind: jest.fn((user, pass, cb) => cb(new Error('Invalid credentials'))),
        unbind: jest.fn(),
        on: jest.fn(),
      };
      (ldap.createClient as jest.Mock).mockReturnValue(mockClient);

      // NOSONAR - test IP address
      const testIp = '192.0.2.1'; // RFC5737 TEST-NET, safe for tests
      const result = await service.testAdConnection({
        adServerIp: testIp,
      } as any) as { success: boolean; message?: string };
      expect(result.success).toBe(false);
      expect(result.message).toContain('Authentication failed');
    });
  });
});
