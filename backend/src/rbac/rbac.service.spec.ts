import { Test, TestingModule } from '@nestjs/testing';
import { RbacService } from './rbac.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException } from '@nestjs/common';

describe('RbacService', () => {
  let service: RbacService;

  const mockPrisma = {
    role: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      delete: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RbacService,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
      ],
    }).compile();

    service = module.get<RbacService>(RbacService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createRole', () => {
    it('should create a role', async () => {
      const dto = { name: 'Admin', permissions: ['all'] } as any;
      mockPrisma.role.create.mockResolvedValue({ id: '1', ...dto });
      const result = await service.createRole('tenant-1', dto);
      expect(result.id).toBe('1');
    });
  });

  describe('getRoles', () => {
    it('should return all roles for a tenant', async () => {
      mockPrisma.role.findMany.mockResolvedValue([{ id: '1' }]);
      const result = await service.getRoles('tenant-1');
      expect(result.length).toBe(1);
    });
  });

  describe('deleteRole', () => {
    it('should delete a role if found', async () => {
      mockPrisma.role.findFirst.mockResolvedValue({ id: '1' });
      mockPrisma.role.delete.mockResolvedValue({ id: '1' });
      const result = await service.deleteRole('tenant-1', '1');
      expect(result.id).toBe('1');
    });

    it('should throw NotFoundException if role not found', async () => {
      mockPrisma.role.findFirst.mockResolvedValue(null);
      await expect(service.deleteRole('tenant-1', '999')).rejects.toThrow(NotFoundException);
    });
  });
});
