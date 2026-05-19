import { PrismaService } from '../prisma/prisma.service';
import { CreateSingleUserDto } from './dto/create-single-user.dto';
export declare class UsersService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    checkAvailability(email: string): Promise<boolean>;
    createSingleUser(tenantId: string, dto: CreateSingleUserDto): Promise<{
        success: boolean;
        logs: string[];
        message: string;
    }>;
    private handleActiveDirectoryCreation;
    private handleMicrosoft365Creation;
    createBulkUsers(tenantId: string, users: CreateSingleUserDto[]): Promise<{
        success: boolean;
        createdCount: number;
        logs: string[];
    }>;
}
