import { Test, TestingModule } from '@nestjs/testing';
import { AuditService } from './audit.service';
import { PrismaService } from '../prisma/prisma.service';

describe('AuditService', () => {
  let service: AuditService;
  let prisma: PrismaService;

  const mockPrisma = {
    auditLog: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuditService,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
      ],
    }).compile();

    service = module.get<AuditService>(AuditService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('log', () => {
    it('should create an audit log', async () => {
      const logData = { tenantId: '1', module: 'test', action: 'test' };
      await service.log(logData);
      expect(mockPrisma.auditLog.create).toHaveBeenCalledWith({ data: logData });
    });
  });

  describe('findAll', () => {
    it('should find all logs for a tenant', async () => {
      await service.findAll('tenant-1');
      expect(mockPrisma.auditLog.findMany).toHaveBeenCalled();
    });
  });
});
