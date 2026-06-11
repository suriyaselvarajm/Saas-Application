import { ComputersService } from './computers.service';
import { CreateComputerDto } from './dto/create-computer.dto';
import { ModifyComputerDto } from './dto/modify-computer.dto';
export declare class ComputersController {
    private readonly computersService;
    constructor(computersService: ComputersService);
    getTemplates(): Promise<any>;
    saveTemplate(body: any): Promise<{
        success: boolean;
        message: string;
    }>;
    deleteTemplate(id: string): Promise<{
        success: boolean;
        message: string;
    }>;
    searchComputers(tenantId: string, query?: string): Promise<{
        type: string;
        id: string;
        email: string;
        password: string | null;
        mustChangePassword: boolean;
        name: string | null;
        tenantId: string;
        roleId: string | null;
        createdAt: Date;
        updatedAt: Date;
        systemRole: import("@prisma/client").$Enums.SystemRole;
        mfaEnabled: boolean;
        mfaSecret: string | null;
    }[] | {
        id: string;
        name: string;
        email: string;
        systemRole: string;
        computerName: string;
        os: string;
        location: string;
    }[]>;
    createSingleComputer(tenantId: string, dto: CreateComputerDto): Promise<{
        success: true;
        message: string;
        logs: string[];
    }>;
    createBulkComputers(tenantId: string, body: {
        computers: CreateComputerDto[];
    }): Promise<{
        success: boolean;
        message: string;
        logs: string[];
    }>;
    modifySingleComputer(tenantId: string, dto: ModifyComputerDto): Promise<{
        success: true;
        message: string;
        logs: string[];
    }>;
    modifyBulkComputers(tenantId: string, body: {
        computers: ModifyComputerDto[];
    }): Promise<{
        success: boolean;
        message: string;
        logs: string[];
    }>;
}
