import { Test, TestingModule } from '@nestjs/testing';
import { SmtpService } from './smtp.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException } from '@nestjs/common';

describe('SmtpService', () => {
  let service: SmtpService;

  const mockPrisma = {
    smtpSettings: {
      upsert: jest.fn(),
      findUnique: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SmtpService,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
      ],
    }).compile();

    service = module.get<SmtpService>(SmtpService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('upsert', () => {
    it('should upsert SMTP settings', async () => {
      const dto = { host: 'smtp.test.com' } as any;
      await service.upsert('tenant-1', dto);
      expect(mockPrisma.smtpSettings.upsert).toHaveBeenCalled();
    });
  });

  describe('get', () => {
    it('should return settings if found', async () => {
      mockPrisma.smtpSettings.findUnique.mockResolvedValue({ id: '1' });
      const result = await service.get('tenant-1');
      expect(result.id).toBe('1');
    });

    it('should throw NotFoundException if not found', async () => {
      mockPrisma.smtpSettings.findUnique.mockResolvedValue(null);
      await expect(service.get('tenant-1')).rejects.toThrow(NotFoundException);
    });
  });
});
