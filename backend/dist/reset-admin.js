"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function main() {
    const users = await prisma.user.findMany({
        where: { email: 'admin@petrus.io' },
    });
    console.log('Admin users:', users);
    await prisma.user.updateMany({
        where: { email: 'admin@petrus.io' },
        data: { password: 'admin' },
    });
    console.log('Password reset to "admin"');
}
main()
    .catch((e) => {
    console.error(e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
//# sourceMappingURL=reset-admin.js.map