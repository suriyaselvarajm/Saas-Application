import { GroupsService } from './groups.service';
import { CreateGroupDto } from './dto/create-group.dto';
import { ModifyGroupDto } from './dto/modify-group.dto';
export declare class GroupsController {
    private readonly groupsService;
    constructor(groupsService: GroupsService);
    getTemplates(): Promise<any>;
    saveTemplate(body: any): Promise<{
        success: boolean;
        message: string;
    }>;
    deleteTemplate(id: string): Promise<{
        success: boolean;
        message: string;
    }>;
    searchGroups(tenantId: string, query?: string): Promise<{
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
    createBulkGroups(tenantId: string, body: {
        groups: CreateGroupDto[];
    }): Promise<{
        success: boolean;
        message: string;
        logs: string[];
    }>;
    modifySingleGroup(tenantId: string, dto: ModifyGroupDto): Promise<{
        success: true;
        message: string;
        logs: string[];
    }>;
    modifyBulkGroups(tenantId: string, body: {
        groups: ModifyGroupDto[];
    }): Promise<{
        success: boolean;
        message: string;
        logs: string[];
    }>;
}
