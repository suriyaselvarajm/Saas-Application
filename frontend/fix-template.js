const fs = require('fs');
const file = 'c:/Saas Application/frontend/src/app/management/users/page.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(/office: t\.data\.office \|\| \"\",/g, 'office: t.data.office !== undefined ? t.data.office : \"\",');
content = content.replace(/selectContainer: t\.data\.targetOu \|\| \"CN=Users,DC=petrus,DC=io\",/g, 'selectContainer: t.data.targetOu !== undefined ? t.data.targetOu : \"CN=Users,DC=petrus,DC=io\",');
content = content.replace(/memberOf: t\.data\.adGroupDn\?\.replace\(\"CN=\", \"\"\)\.split\(\",\"\)\[0\] \|\| \"Domain Users\",/g, 'memberOf: t.data.adGroupDn !== undefined ? t.data.adGroupDn.replace(\"CN=\", \"\").split(\",\")[0] : \"Domain Users\",');
content = content.replace(/title: t\.data\.jobTitle \|\| \"\",/g, 'title: t.data.jobTitle !== undefined ? t.data.jobTitle : \"\",');
content = content.replace(/department: t\.data\.department \|\| \"\",/g, 'department: t.data.department !== undefined ? t.data.department : \"\",');

fs.writeFileSync(file, content);
