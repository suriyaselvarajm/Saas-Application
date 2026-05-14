import { TenantService } from './tenant.service';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';
export declare class TenantController {
    private readonly tenantService;
    constructor(tenantService: TenantService);
    create(createTenantDto: CreateTenantDto): string;
    findAll(): string;
    findOne(id: string): string;
    update(id: string, updateTenantDto: UpdateTenantDto): string;
    remove(id: string): string;
}
