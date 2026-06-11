import { UsersService } from './users.service';
import { CreateSingleUserDto } from './dto/create-single-user.dto';
import { ModifyUserDto } from './dto/modify-user.dto';
export declare class UsersController {
    private readonly usersService;
    constructor(usersService: UsersService);
    getTemplates(): Promise<any[]>;
    saveTemplate(body: any): Promise<any[]>;
    deleteTemplate(id: string): Promise<any[]>;
    createSingleUser(tenantId: string, dto: CreateSingleUserDto): Promise<{
        success: boolean;
        logs: string[];
        message: string;
    }>;
    createBulkUsers(tenantId: string, body: {
        users: CreateSingleUserDto[];
    }): Promise<{
        success: boolean;
        createdCount: number;
        logs: string[];
    }>;
    checkAvailability(email: string): Promise<{
        available: boolean;
    }>;
    searchUsers(tenantId: string, query?: string): Promise<any[]>;
    modifySingleUser(tenantId: string, dto: ModifyUserDto): Promise<{
        success: boolean;
        logs: string[];
        message: string;
    }>;
    modifyBulkUsers(tenantId: string, body: {
        users: ModifyUserDto[];
    }): Promise<{
        success: boolean;
        successCount: number;
        total: number;
        logs: string[];
    }>;
    getUserReport(tenantId: string, body: {
        reportType: string;
        csvUsers?: string[];
    }): Promise<any[]>;
    executeReportAction(tenantId: string, body: {
        email: string;
        action: string;
    }): Promise<{
        success: boolean;
        logs: string[];
        message: string;
    }>;
}
