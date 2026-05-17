import { RbacService } from './rbac.service';
import { CreateRoleDto } from './dto/create-role.dto';
export declare class RbacController {
    private readonly rbacService;
    constructor(rbacService: RbacService);
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
