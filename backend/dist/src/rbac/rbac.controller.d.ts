import { RbacService } from './rbac.service';
import { CreateRoleDto } from './dto/create-role.dto';
export declare class RbacController {
    private readonly rbacService;
    constructor(rbacService: RbacService);
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
