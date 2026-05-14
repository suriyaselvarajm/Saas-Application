import { Test, TestingModule } from '@nestjs/testing';
import { RbacService } from './rbac.service';
import { PrismaService } from '../prisma/prisma.service';

describe('RbacService', () => {
  let service: RbacService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RbacService,
        {
          provide: PrismaService,
          useValue: {},
        },
      ],
    }).compile();

    service = module.get<RbacService>(RbacService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
