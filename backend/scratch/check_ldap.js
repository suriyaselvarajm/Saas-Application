try {
  const ldap = require('ldapjs');
  console.log('ldapjs loaded successfully');
  process.exit(0);
} catch (e) {
  console.error('Failed to load ldapjs:', e.message);
  process.exit(1);
}
