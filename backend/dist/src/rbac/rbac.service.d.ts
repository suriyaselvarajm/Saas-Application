import { PrismaService } from '../prisma/prisma.service';
import { CreateRoleDto } from './dto/create-role.dto';
export declare class RbacService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    createRole(tenantId: string, data: CreateRoleDto): Promise<{
        id: string;
        name: string;
        tenantId: string;
        createdAt: Date;
        updatedAt: Date;
        permissions: string[];
    }>;
    getRoles(tenantId: string): Promise<{
        id: string;
        name: string;
        tenantId: string;
        createdAt: Date;
        updatedAt: Date;
        permissions: string[];
    }[]>;
    deleteRole(tenantId: string, id: string): Promise<{
        id: string;
        name: string;
        tenantId: string;
        createdAt: Date;
        updatedAt: Date;
        permissions: string[];
    }>;
}
