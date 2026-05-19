import { UsersService } from './users.service';
import { CreateSingleUserDto } from './dto/create-single-user.dto';
export declare class UsersController {
    private readonly usersService;
    constructor(usersService: UsersService);
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
}
