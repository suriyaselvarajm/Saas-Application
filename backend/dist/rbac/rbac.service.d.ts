import { PrismaService } from '../prisma/prisma.service';
import { CreateRoleDto } from './dto/create-role.dto';
export declare class RbacService {
    private prisma;
    constructor(prisma: PrismaService);
    createRole(tenantId: string, data: CreateRoleDto): Promise<{
        name: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        tenantId: string;
        permissions: string[];
    }>;
    getRoles(tenantId: string): Promise<{
        name: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        tenantId: string;
        permissions: string[];
    }[]>;
    deleteRole(tenantId: string, id: string): Promise<{
        name: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        tenantId: string;
        permissions: string[];
    }>;
}
