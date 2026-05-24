import { UserCreationService } from './userCreation.service';
export declare class UserCreationController {
    private readonly userCreationService;
    constructor(userCreationService: UserCreationService);
    createSingleUser(userData: any): {
        message: string;
        userData: any;
    };
    createBulkUsers(file: any): {
        message: string;
        fileName: any;
    };
}
