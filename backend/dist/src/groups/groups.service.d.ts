import { PrismaService } from '../prisma/prisma.service';
import { CreateGroupDto } from './dto/create-group.dto';
import { ModifyGroupDto } from './dto/modify-group.dto';
export declare class GroupsService {
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
    searchGroups(tenantId: string, query: string): Promise<{
        id: string;
        name: string;
        email: string;
        groupType: string;
        groupScope: string;
        description: string;
    }[]>;
    createSingleGroup(tenantId: string, dto: CreateGroupDto): Promise<{
        success: true;
        message: string;
        logs: string[];
    }>;
    createBulkGroups(tenantId: string, groups: CreateGroupDto[]): Promise<{
        success: boolean;
        message: string;
        logs: string[];
    }>;
    modifySingleGroup(tenantId: string, dto: ModifyGroupDto): Promise<{
        success: true;
        message: string;
        logs: string[];
    }>;
    modifyBulkGroups(tenantId: string, groups: ModifyGroupDto[]): Promise<{
        success: boolean;
        message: string;
        logs: string[];
    }>;
    private getGroupTypeValue;
    handleActiveDirectoryGroupCreation(tenantId: string, dto: CreateGroupDto, logs: string[]): Promise<boolean>;
    simulateAdGroupCreation(dto: CreateGroupDto, groupDn: string, ad: any, logs: string[]): boolean;
    handleActiveDirectoryGroupModification(tenantId: string, dto: ModifyGroupDto, logs: string[]): Promise<boolean>;
    simulateAdGroupModification(dto: ModifyGroupDto, groupDn: string, ad: any, logs: string[]): boolean;
}
