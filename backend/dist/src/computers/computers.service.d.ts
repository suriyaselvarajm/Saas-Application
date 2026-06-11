import { PrismaService } from '../prisma/prisma.service';
import * as ldap from 'ldapjs';
import { CreateComputerDto } from './dto/create-computer.dto';
import { ModifyComputerDto } from './dto/modify-computer.dto';
export declare class ComputersService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    getTemplatesFilePath(): string;
    getTemplates(): Promise<any>;
    writeTemplates(templates: any[]): void;
    saveTemplate(body: any): Promise<{
        success: boolean;
        message: string;
    }>;
    deleteTemplate(id: string): Promise<{
        success: boolean;
        message: string;
    }>;
    searchComputers(tenantId: string, query: string): Promise<{
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
    createBulkComputers(tenantId: string, computers: CreateComputerDto[]): Promise<{
        success: boolean;
        message: string;
        logs: string[];
    }>;
    modifySingleComputer(tenantId: string, dto: ModifyComputerDto): Promise<{
        success: true;
        message: string;
        logs: string[];
    }>;
    modifyBulkComputers(tenantId: string, computers: ModifyComputerDto[]): Promise<{
        success: boolean;
        message: string;
        logs: string[];
    }>;
    handleActiveDirectoryComputerCreation(tenantId: string, dto: CreateComputerDto, logs: string[]): Promise<boolean>;
    simulateAdComputerCreation(dto: CreateComputerDto, computerDn: string, ad: any, logs: string[]): boolean;
    handleActiveDirectoryComputerModification(tenantId: string, dto: ModifyComputerDto, logs: string[]): Promise<boolean>;
    simulateAdComputerModification(dto: ModifyComputerDto, computerDn: string, ad: any, logs: string[]): boolean;
    addComputerToGroup(client: ldap.Client, computerDn: string, groupDn: string, logs: string[]): Promise<void>;
    removeComputerFromGroup(client: ldap.Client, computerDn: string, groupDn: string, logs: string[]): Promise<void>;
    generateMachinePassword(): string;
}
