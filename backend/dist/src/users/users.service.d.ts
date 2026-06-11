import { PrismaService } from '../prisma/prisma.service';
import { CreateSingleUserDto } from './dto/create-single-user.dto';
import { ModifyUserDto } from './dto/modify-user.dto';
export declare class UsersService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    private getTemplatesFilePath;
    getTemplates(): Promise<any[]>;
    private writeTemplates;
    saveTemplate(template: any): Promise<any[]>;
    deleteTemplate(id: string): Promise<any[]>;
    checkAvailability(email: string): Promise<boolean>;
    createSingleUser(tenantId: string, dto: CreateSingleUserDto): Promise<{
        success: boolean;
        logs: string[];
        message: string;
    }>;
    private handleActiveDirectoryCreation;
    private simulateAdCreation;
    private buildAdUserEntry;
    private addUserToAdGroup;
    private removeUserFromAdGroup;
    private handleMicrosoft365Creation;
    private provisionSingleBulkUser;
    createBulkUsers(tenantId: string, users: CreateSingleUserDto[]): Promise<{
        success: boolean;
        createdCount: number;
        logs: string[];
    }>;
    searchUsers(tenantId: string, query: string): Promise<any[]>;
    modifySingleUser(tenantId: string, dto: ModifyUserDto): Promise<{
        success: boolean;
        logs: string[];
        message: string;
    }>;
    private handleActiveDirectoryModification;
    private simulateAdAction;
    private generateStrongPassword;
    private handleMicrosoft365Modification;
    modifyBulkUsers(tenantId: string, users: ModifyUserDto[]): Promise<{
        success: boolean;
        successCount: number;
        total: number;
        logs: string[];
    }>;
    validateUserSchema(dto: any): void;
    private getSimulatedReportUsers;
    getUserReport(tenantId: string, reportType: string, csvUsers?: string[]): Promise<any[]>;
    executeReportAction(tenantId: string, email: string, action: string): Promise<{
        success: boolean;
        logs: string[];
        message: string;
    }>;
}
