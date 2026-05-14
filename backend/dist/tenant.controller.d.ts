import { TenantService } from './tenant.service';
export declare class TenantController {
    private readonly tenantService;
    constructor(tenantService: TenantService);
    create(): string;
    findAll(): string;
    findOne(id: string): string;
    update(id: string): string;
    remove(id: string): string;
}
