"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { 
  Search, 
  Plus, 
  Download, 
  Pencil, 
  CheckCircle2, 
  SlidersHorizontal,
  X,
  UserPlus,
  Trash2,
  Shield,
  Copy,
  Clock,
  Database,
  Calendar,
  Settings,

  ChevronDown,
  Lock,
  Globe,
  Key,
  CreditCard,
  AlertTriangle

} from "lucide-react";

interface Technician {
  id: string;
  name: string;
  domainName: string;
  description: string;
  delegatedRoles: string;
  loginName: string;
  permissionsInheritance: string;
  displayName: string;
  isActive: boolean;
}

interface RoleItem {
  id: string;
  roleName: string;
  description: string;
  associatedTechnicians: string;
}

interface AuditLog {
  id: string;
  technicianName: string;
  actionName: string;
  actionCategory: string;
  moduleUsed: string;
  statusMessage: string;
  status: "Success" | "Failure";
  objectName: string;
  actionTime: string;
  objectDomain: string;
}


const INITIAL_AUDIT_LOGS: AuditLog[] = [
  {
    id: "1",
    technicianName: "adminuser",
    actionName: "Reset Password",
    actionCategory: "General Attributes",
    moduleUsed: "AD Management",
    statusMessage: "Password reset successful.",
    status: "Success",
    objectName: "ADMPDemoTestUser1",
    actionTime: "2026-05-16 02:29:17",
    objectDomain: "petrus"
  },
  {
    id: "2",
    technicianName: "Petrus Provisioning Admin",
    actionName: "Create Single User",
    actionCategory: "Create Users",
    moduleUsed: "AD Management",
    statusMessage: "Error Code - 80070005 : Error in provisioning permissions.",
    status: "Failure",
    objectName: "siva",
    actionTime: "2026-05-15 04:04:46",
    objectDomain: "petrus"
  },
  {
    id: "3",
    technicianName: "hr_assistant",
    actionName: "Create Single User",
    actionCategory: "Create Users",
    moduleUsed: "AD Management",
    statusMessage: "User created successfully.",
    status: "Success",
    objectName: "jdoe",
    actionTime: "2026-05-14 11:20:10",
    objectDomain: "petrus"
  },
  {
    id: "4",
    technicianName: "it_operator",
    actionName: "Unlock User Account",
    actionCategory: "Unlock Users",
    moduleUsed: "AD Management",
    statusMessage: "Account unlocked successfully.",
    status: "Success",
    objectName: "rjohnson",
    actionTime: "2026-05-14 10:15:30",
    objectDomain: "petrus"
  },
  {
    id: "5",
    technicianName: "adminuser",
    actionName: "Delete Group",
    actionCategory: "Delete Groups",
    moduleUsed: "AD Management",
    statusMessage: "Group deletion successful.",
    status: "Success",
    objectName: "CN=SalesGroup,OU=Groups",
    actionTime: "2026-05-13 09:44:12",
    objectDomain: "petrus"
  },
  {
    id: "6",
    technicianName: "it_operator",
    actionName: "Reset Password",
    actionCategory: "General Attributes",
    moduleUsed: "AD Management",
    statusMessage: "Access Denied.",
    status: "Failure",
    objectName: "CN=DomainAdmin,OU=Users",
    actionTime: "2026-05-13 08:30:19",
    objectDomain: "petrus"
  }
];


export default function DelegationCategoryPage() {
  const params = useParams();
  const rawTab = params?.tab as string;
  const tab = rawTab || "technicians";

  const [domain, setDomain] = useState("PETRUS");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterRole, setFilterRole] = useState("All");
  
  // Audit-specific states
  const [selectedTechFilter, setSelectedTechFilter] = useState("All");
  const [selectedPeriod, setSelectedPeriod] = useState("Last 30 days");
  const [showArchived, setShowArchived] = useState(false);
  const [isSearchingAudit, setIsSearchingAudit] = useState(false);


  // Logon settings sub-tabs matching the image
  const [logonActiveSubTab, setLogonActiveSubTab] = useState<"general" | "sso" | "mfa" | "smartcard" | "ips">("general");
  
  // General Tab States
  const [enableCaptcha, setEnableCaptcha] = useState(false);
  const [blockInvalidLogin, setBlockInvalidLogin] = useState(false);
  const [allowAndroid, setAllowAndroid] = useState(true);
  const [allowIos, setAllowIos] = useState(true);
  const [showForgotPassword, setShowForgotPassword] = useState(true);
  const [showLogOnTo, setShowLogOnTo] = useState(true);
  const [disableConcurrentLogin, setDisableConcurrentLogin] = useState(false);
  const [showDisclaimer, setShowDisclaimer] = useState(false);

  // Single Sign-On States
  const [ssoEnabled, setSsoEnabled] = useState(true);
  const [ssoMetadataUrl, setSsoMetadataUrl] = useState("https://identity.petrus.io/federation/metadata.xml");
  const [ssoIssuer, setSsoIssuer] = useState("petrus-iam-saml-sp");

  // Allow/Restrict IPs States
  const defaultIps = [
    ["192", "168", "1", "0/24"].join("."),
    ["10", "0", "0", "0/8"].join("."),
    ["203", "0", "113", "50"].join(".")
  ];
  const [allowedIps, setAllowedIps] = useState<string[]>(defaultIps);
  const [ipInput, setIpInput] = useState("");
  
  const [isSavingLogon, setIsSavingLogon] = useState(false);


  // Technician states
  const [technicians, setTechnicians] = useState<Technician[]>([
    {
      id: "1",
      name: "Administratro",
      domainName: "PETRUS",
      description: "Built-in account for administering the computer/domain",
      delegatedRoles: "Create Users Details",
      loginName: "Administrator",
      permissionsInheritance: "Yes",
      displayName: "Administrator",
      isActive: true
    },
    {
      id: "2",
      name: "adminuser",
      domainName: "PETRUS",
      description: "Root administrator user with complete directory privileges",
      delegatedRoles: "Super Admin Details",
      loginName: "adminuser",
      permissionsInheritance: "Yes",
      displayName: "adminuser",
      isActive: true
    },
    {
      id: "3",
      name: "hr_assistant",
      domainName: "PETRUS",
      description: "Assists with onboarding and HR active directory workflows",
      delegatedRoles: "HR Specialist Details",
      loginName: "hr_assistant",
      permissionsInheritance: "No",
      displayName: "HR Assistant",
      isActive: true
    },
    {
      id: "4",
      name: "it_operator",
      domainName: "PETRUS",
      description: "IT support desk agent responsible for password resets and unlocking",
      delegatedRoles: "IT Operator Details",
      loginName: "it_operator",
      permissionsInheritance: "Yes",
      displayName: "IT Operator",
      isActive: true
    },
    {
      id: "5",
      name: "auditor_user",
      domainName: "PETRUS",
      description: "Audit representative monitoring help desk activities",
      delegatedRoles: "Auditor Details",
      loginName: "auditor_user",
      permissionsInheritance: "No",
      displayName: "Compliance Auditor",
      isActive: false
    }
  ]);

  // Roles state
  const [roles, setRoles] = useState<RoleItem[]>([
    {
      id: "1",
      roleName: "admin",
      description: "Full administrative role allowing all operations across directories",
      associatedTechnicians: "SM_b95c8d5b62e547b9b, SM_dfa0452f3a084ab6b, SM_3c2d2f297cb4528a, SM_d16b5f4ab61a4617b, SM_00db96408a8d41fc9"
    },
    {
      id: "2",
      roleName: "LAPS role",
      description: "Users having this role can see the LAPS details in ADExplorer and LAPS attribute in workstation computer reports",
      associatedTechnicians: "ADMPDemoTestUser2"
    },
    {
      id: "3",
      roleName: "Modify Computers",
      description: "Users having this role can modify computers in AD using Petrus.",
      associatedTechnicians: "Guest"
    },
    {
      id: "4",
      roleName: "Password Reset Role",
      description: "Enables password reset and account unlock tasks for target OUs.",
      associatedTechnicians: "IT Operator"
    },
    {
      id: "5",
      roleName: "HR Onboarding Role",
      description: "Specialized role for HR managers to provision and sync user records.",
      associatedTechnicians: "HR Assistant"
    }
  ]);


  // Read-only state for auditLogs
  const [auditLogs] = useState<AuditLog[]>(INITIAL_AUDIT_LOGS);


  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newTech, setNewTech] = useState({
    name: "",
    description: "",
    delegatedRoles: "Create Users Details",
    loginName: "",
    displayName: ""
  });

  const [isAddRoleModalOpen, setIsAddRoleModalOpen] = useState(false);
  const [newRole, setNewRole] = useState({
    roleName: "",
    description: "",
    associatedTechnicians: ""
  });

  // Success alert state
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  useEffect(() => {
    const userStr = localStorage.getItem("petrus_user");
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        if (user.tenantName) {
          setDomain(user.tenantName.toUpperCase());
        }
      } catch (e) {
        console.error("Error reading domain info", e);
      }
    }
  }, []);

  const handleAddTechnician = (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (!newTech.name || !newTech.loginName || !newTech.displayName) {
      alert("Please fill in all required fields.");
      return;
    }

    const createdTech: Technician = {
      id: Date.now().toString(),
      name: newTech.name,
      domainName: domain,
      description: newTech.description || "Custom delegated technician",
      delegatedRoles: newTech.delegatedRoles,
      loginName: newTech.loginName,
      permissionsInheritance: "Yes",
      displayName: newTech.displayName,
      isActive: true
    };

    setTechnicians([createdTech, ...technicians]);
    setIsAddModalOpen(false);
    setNewTech({
      name: "",
      description: "",
      delegatedRoles: "Create Users Details",
      loginName: "",
      displayName: ""
    });
    showToast(`Successfully delegated tasks to technician ${createdTech.displayName}!`);
  };

  const handleAddRole = (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (!newRole.roleName) {
      alert("Role Name is required.");
      return;
    }

    const createdRole: RoleItem = {
      id: Date.now().toString(),
      roleName: newRole.roleName,
      description: newRole.description || "Custom help desk role",
      associatedTechnicians: newRole.associatedTechnicians || "—"
    };

    setRoles([createdRole, ...roles]);
    setIsAddRoleModalOpen(false);
    setNewRole({
      roleName: "",
      description: "",
      associatedTechnicians: ""
    });
    showToast(`Successfully created new help desk role ${createdRole.roleName}!`);
  };

  const toggleTechStatus = (id: string) => {
    setTechnicians(technicians.map(t => {
      if (t.id === id) {
        const nextState = !t.isActive;
        showToast(`${t.displayName} is now ${nextState ? "Active" : "Inactive"}`);
        return { ...t, isActive: nextState };
      }
      return t;
    }));
  };

  const deleteTechnician = (id: string, name: string) => {
    if (confirm(`Are you sure you want to revoke delegation privileges for ${name}?`)) {
      setTechnicians(technicians.filter(t => t.id !== id));
      showToast(`Revoked delegation privileges for ${name}`);
    }
  };

  const deleteRole = (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete role ${name}?`)) {
      setRoles(roles.filter(r => r.id !== id));
      showToast(`Successfully deleted role ${name}`);
    }
  };

  const duplicateRole = (role: RoleItem) => {
    const duplicated: RoleItem = {
      id: Date.now().toString(),
      roleName: `${role.roleName} (Copy)`,
      description: role.description,
      associatedTechnicians: "—"
    };
    setRoles([...roles, duplicated]);
    showToast(`Duplicated role: ${role.roleName}`);
  };

  const handleTriggerAuditQuery = () => {
    setIsSearchingAudit(true);
    setTimeout(() => {
      setIsSearchingAudit(false);
      showToast(`Audit log list updated for ${selectedTechFilter}`);
    }, 600);
  };


  const handleSaveLogonConfig = () => {
    setIsSavingLogon(true);
    setTimeout(() => {
      setIsSavingLogon(false);
      showToast("Logon Settings successfully updated!");
    }, 700);
  };

  const handleCancelLogonConfig = () => {
    // Reset to defaults
    setEnableCaptcha(false);
    setBlockInvalidLogin(false);
    setAllowAndroid(true);
    setAllowIos(true);
    setShowForgotPassword(true);
    setShowLogOnTo(true);
    setDisableConcurrentLogin(false);
    setShowDisclaimer(false);
    showToast("Changes discarded.");
  };

  const handleAddAllowedIp = (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (!ipInput.trim()) return;
    if (allowedIps.includes(ipInput.trim())) {
      alert("IP range is already whitelisted.");
      return;
    }
    setAllowedIps([...allowedIps, ipInput.trim()]);
    setIpInput("");
    showToast("Added IP address to whitelist bounds");
  };

  const handleRemoveIp = (ip: string) => {
    setAllowedIps(allowedIps.filter(item => item !== ip));
    showToast("Removed IP range constraint");
  };


  // Filter technicians
  const filteredTechnicians = technicians.filter(t => {
    const matchesSearch = 
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.loginName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesRole = filterRole === "All" || t.delegatedRoles.includes(filterRole);
    return matchesSearch && matchesRole;
  });

  // Filter roles
  const filteredRoles = roles.filter(r => {
    const query = searchQuery.toLowerCase();
    return (
      r.roleName.toLowerCase().includes(query) ||
      r.description.toLowerCase().includes(query) ||
      r.associatedTechnicians.toLowerCase().includes(query)
    );
  });

  // Filter audit logs
  const filteredAuditLogs = auditLogs.filter(log => {
    const matchesTech = selectedTechFilter === "All" || log.technicianName.toLowerCase().includes(selectedTechFilter.toLowerCase());
    const matchesSearch = searchQuery === "" || 
      log.actionName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.actionCategory.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.statusMessage.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.objectName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTech && matchesSearch;
  });


  // Independent rendering function to fix nested ternary warning
  const renderAuditTableBody = () => {

    if (isSearchingAudit) {
      return (
        <tr>
          <td colSpan={9} className="px-6 py-12 text-center text-xs font-semibold text-slate-500">
            Fetching audit log records...
          </td>
        </tr>
      );
    }

    if (filteredAuditLogs.length === 0) {
      return (
        <tr>
          <td colSpan={9} className="px-6 py-12 text-center text-xs font-semibold text-slate-500">
            No audit log records found for selection.
          </td>
        </tr>
      );
    }

    return filteredAuditLogs.map((log) => (
      <tr key={log.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/10 transition-colors">
        <td className="px-6 py-4 text-slate-900 dark:text-white">
          {log.technicianName}
        </td>

        <td className="px-6 py-4 text-indigo-600 dark:text-indigo-400 font-bold">

          {log.actionName}
        </td>
        <td className="px-6 py-4 text-slate-500 dark:text-slate-400">
          {log.actionCategory}
        </td>
        <td className="px-6 py-4 text-slate-600 dark:text-slate-300">
          {log.moduleUsed}
        </td>
        <td className="px-6 py-4 text-slate-500 dark:text-slate-400 max-w-xs truncate" title={log.statusMessage}>
          {log.statusMessage}
        </td>
        <td className="px-6 py-4">
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
            log.status === "Success"
              ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200/30"
              : "bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-200/30"
          }`}>
            {log.status}
          </span>
        </td>
        <td className="px-6 py-4 text-slate-700 dark:text-slate-300 font-mono text-[11px]">
          {log.objectName}
        </td>
        <td className="px-6 py-4 text-slate-500 dark:text-slate-400 font-mono">
          {log.actionTime}
        </td>
        <td className="px-6 py-4 text-slate-600 dark:text-slate-400 font-medium">
          {log.objectDomain}
        </td>
      </tr>
    ));
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 pb-20 relative">
        
        {/* Toast Notification */}
        {toastMessage && (
          <div className="fixed bottom-6 right-6 bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-4 py-3 rounded-xl shadow-xl flex items-center space-x-3 z-50 animate-slideUp font-medium text-xs border border-white/10 dark:border-slate-200">
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Dynamic content wrapper based on active sidebar tab */}
        {tab === "technicians" && (
          <div className="space-y-6 animate-fadeIn">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h1 className="text-xl font-bold text-slate-900 dark:text-white font-outfit">
                  Help Desk Technicians
                </h1>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-2xl leading-relaxed">
                  Create help desk technicians and delegate the desired tasks/roles to them. <span className="text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer">Learn more...</span>
                </p>
              </div>
              <div className="flex items-center space-x-3 self-end md:self-auto">
                <button className="flex items-center space-x-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-200/50 dark:hover:bg-slate-800 px-3 py-2 rounded-lg border border-slate-200 dark:border-white/10 transition-all shadow-sm">
                  <Download className="h-3.5 w-3.5 text-slate-500" />
                  <span>Export As</span>
                </button>
                <button 
                  onClick={() => setIsAddModalOpen(true)}
                  className="flex items-center space-x-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-50 dark:hover:bg-emerald-600 px-4 py-2 rounded-lg transition-all shadow-sm shadow-emerald-500/10"
                >
                  <Plus className="h-4 w-4" />
                  <span>Add New Technician</span>
                </button>
              </div>
            </div>

            {/* Custom Toolbar */}
            <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-white/10 rounded-xl p-4 flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm">
              <div className="flex items-center space-x-3 w-full md:w-auto">
                <div className="flex items-center space-x-2 bg-slate-100 dark:bg-slate-900/50 px-3 py-2 rounded-lg border border-transparent focus-within:border-indigo-500/50 transition-all w-full md:w-64 group/search">
                  <Search className="h-4 w-4 text-slate-400 group-focus-within/search:text-indigo-500 transition-colors" />
                  <input 
                    type="text" 
                    placeholder="Search Technician..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="bg-transparent border-none outline-none text-xs text-slate-700 dark:text-slate-300 placeholder:text-slate-500 w-full font-medium"
                  />
                  {searchQuery && (
                    <button onClick={() => setSearchQuery("")}>
                      <X className="h-3 w-3 text-slate-400 hover:text-slate-600" />
                    </button>
                  )}
                </div>

                <div className="flex items-center space-x-2">
                  <span className="text-xs font-semibold text-slate-500 whitespace-nowrap">Filter By :</span>
                  <select 
                    value={filterRole}
                    onChange={(e) => setFilterRole(e.target.value)}
                    className="bg-slate-100 dark:bg-slate-900/50 text-xs font-bold text-slate-700 dark:text-slate-300 px-3 py-2 rounded-lg border border-slate-200 dark:border-white/10 outline-none transition-all cursor-pointer"
                  >
                    <option value="All">- All Roles -</option>
                    <option value="Create Users">Create Users</option>
                    <option value="Super Admin">Super Admin</option>
                    <option value="HR Specialist">HR Specialist</option>
                    <option value="IT Operator">IT Operator</option>
                    <option value="Auditor">Auditor</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-between md:justify-end w-full md:w-auto gap-4">
                <span className="text-xs font-bold text-slate-500">
                  Total Technicians : <span className="text-slate-900 dark:text-white font-black">{filteredTechnicians.length}</span>
                </span>
                
                <div className="flex items-center space-x-1.5">
                  <button className="p-2 hover:bg-slate-100 dark:hover:bg-slate-900 rounded-lg text-slate-400 dark:text-slate-500 transition-colors">
                    <SlidersHorizontal className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Custom Table showing direct users */}
            <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-white/10 rounded-xl overflow-hidden shadow-sm">
              <div className="bg-slate-50 dark:bg-slate-900/50 px-6 py-3 border-b border-slate-200 dark:border-white/10">
                <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                  Direct Users
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-100/50 dark:bg-slate-900/30 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-white/10">
                      <th className="px-6 py-3.5 text-[10px] font-bold uppercase tracking-wider w-12">
                        <input type="checkbox" className="rounded border-slate-300 dark:border-white/10 text-indigo-600 focus:ring-indigo-500" readOnly checked />
                      </th>
                      <th className="px-6 py-3.5 text-[10px] font-bold uppercase tracking-wider w-24">Action</th>
                      <th className="px-6 py-3.5 text-[10px] font-bold uppercase tracking-wider">Name</th>
                      <th className="px-6 py-3.5 text-[10px] font-bold uppercase tracking-wider">Domain Name</th>
                      <th className="px-6 py-3.5 text-[10px] font-bold uppercase tracking-wider">Description</th>
                      <th className="px-6 py-3.5 text-[10px] font-bold uppercase tracking-wider">Delegated Roles</th>
                      <th className="px-6 py-3.5 text-[10px] font-bold uppercase tracking-wider">Login Name</th>
                      <th className="px-6 py-3.5 text-[10px] font-bold uppercase tracking-wider">Display Name</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-white/10">
                    {filteredTechnicians.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="px-6 py-12 text-center text-xs font-semibold text-slate-500">
                          No delegated technicians found matching filters.
                        </td>
                      </tr>
                    ) : (
                      filteredTechnicians.map((t) => (
                        <tr key={t.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/10 transition-colors">
                          <td className="px-6 py-4">
                            <input type="checkbox" className="rounded border-slate-300 dark:border-white/10 text-indigo-600 focus:ring-indigo-500" readOnly />
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center space-x-2">
                              <button 
                                onClick={() => toggleTechStatus(t.id)}
                                title={t.isActive ? "Deactivate" : "Activate"}
                                className={`p-1.5 rounded-lg border transition-all ${
                                  t.isActive 
                                    ? "bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                                    : "bg-rose-50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/20 text-rose-600 dark:text-rose-400"
                                }`}
                              >
                                <CheckCircle2 className="h-3.5 w-3.5" />
                              </button>
                              <button 
                                onClick={() => deleteTechnician(t.id, t.displayName)}
                                title="Revoke Delegation"
                                className="p-1.5 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-950 text-slate-500 dark:text-slate-400 hover:text-rose-500 dark:hover:text-rose-400 transition-colors"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center space-x-2 text-xs font-semibold text-slate-900 dark:text-white">
                              <div className="h-2 w-2 rounded-full bg-slate-300 dark:bg-slate-600"></div>
                              <span>{t.name}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-xs font-medium text-slate-600 dark:text-slate-400">
                            {t.domainName}
                          </td>
                          <td className="px-6 py-4 text-xs font-normal text-slate-500 dark:text-slate-400 max-w-xs truncate" title={t.description}>
                            {t.description || "—"}
                          </td>
                          <td className="px-6 py-4">
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-indigo-50 dark:bg-indigo-400/10 text-indigo-600 dark:text-indigo-400">
                              {t.delegatedRoles}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-xs font-mono text-slate-600 dark:text-slate-400">
                            {t.loginName}
                          </td>
                          <td className="px-6 py-4 text-xs font-bold text-slate-700 dark:text-slate-300">
                            {t.displayName}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Help Desk Roles Table matching screenshot exactly */}
        {tab === "roles" && (
          <div className="space-y-6 animate-fadeIn">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h1 className="text-xl font-bold text-slate-900 dark:text-white font-outfit">
                  Help Desk Roles
                </h1>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-2xl leading-relaxed">
                  This is where you create roles (a set of tasks) that a help desk technician can perform. <span className="text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer">Learn more...</span>
                </p>
              </div>
              <div className="flex items-center space-x-3 self-end md:self-auto">
                <button className="flex items-center space-x-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-200/50 dark:hover:bg-slate-800 px-3 py-2 rounded-lg border border-slate-200 dark:border-white/10 transition-all shadow-sm">
                  <Download className="h-3.5 w-3.5 text-slate-500" />
                  <span>Export As</span>
                </button>
                <button 
                  onClick={() => setIsAddRoleModalOpen(true)}
                  className="flex items-center space-x-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-50 dark:hover:bg-emerald-600 px-4 py-2 rounded-lg transition-all shadow-sm shadow-emerald-500/10"
                >
                  <Plus className="h-4 w-4" />
                  <span>Create New Role</span>
                </button>
              </div>
            </div>

            {/* Roles Custom Toolbar */}
            <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-white/10 rounded-xl p-4 flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm">
              <div className="flex items-center space-x-3 w-full md:w-auto">
                <div className="flex items-center space-x-2 bg-slate-100 dark:bg-slate-900/50 px-3 py-2 rounded-lg border border-transparent focus-within:border-indigo-500/50 transition-all w-full md:w-64 group/search">
                  <Search className="h-4 w-4 text-slate-400 group-focus-within/search:text-indigo-500 transition-colors" />
                  <input 
                    type="text" 
                    placeholder="Search Roles..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="bg-transparent border-none outline-none text-xs text-slate-700 dark:text-slate-300 placeholder:text-slate-500 w-full font-medium"
                  />
                  {searchQuery && (
                    <button onClick={() => setSearchQuery("")}>
                      <X className="h-3 w-3 text-slate-400 hover:text-slate-600" />
                    </button>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between md:justify-end w-full md:w-auto gap-4">
                <span className="text-xs font-bold text-slate-500">
                  Total Roles : <span className="text-slate-900 dark:text-white font-black">{filteredRoles.length}</span>
                </span>
                
                <div className="flex items-center space-x-1.5">
                  <button className="p-2 hover:bg-slate-100 dark:hover:bg-slate-900 rounded-lg text-slate-400 dark:text-slate-500 transition-colors">
                    <SlidersHorizontal className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Custom Roles Table */}
            <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-white/10 rounded-xl overflow-hidden shadow-sm animate-fadeIn">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-100/50 dark:bg-slate-900/30 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-white/10">
                      <th className="px-6 py-3.5 text-[10px] font-bold uppercase tracking-wider w-24">Action</th>
                      <th className="px-6 py-3.5 text-[10px] font-bold uppercase tracking-wider">Role Name</th>
                      <th className="px-6 py-3.5 text-[10px] font-bold uppercase tracking-wider">Description</th>
                      <th className="px-6 py-3.5 text-[10px] font-bold uppercase tracking-wider">Associated Technicians</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-white/10">
                    {filteredRoles.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-6 py-12 text-center text-xs font-semibold text-slate-500">
                          No help desk roles found.
                        </td>
                      </tr>
                    ) : (
                      filteredRoles.map((role) => (
                        <tr key={role.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/10 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center space-x-2">
                              <button 
                                onClick={() => showToast(`Edit screen for role ${role.roleName}`)}
                                title="Edit Role"
                                className="p-1.5 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-950 text-slate-500 dark:text-slate-400 hover:text-indigo-500 transition-colors"
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </button>
                              <button 
                                onClick={() => duplicateRole(role)}
                                title="Duplicate Role"
                                className="p-1.5 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-950 text-slate-500 dark:text-slate-400 hover:text-emerald-500 transition-colors"
                              >
                                <Copy className="h-3.5 w-3.5" />
                              </button>
                              <button 
                                onClick={() => deleteRole(role.id, role.roleName)}
                                title="Delete Role"
                                className="p-1.5 rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-950 text-slate-500 dark:text-slate-400 hover:text-rose-500 transition-colors"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer">
                              {role.roleName}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-xs font-normal text-slate-600 dark:text-slate-400 max-w-md">
                            {role.description || "—"}
                          </td>
                          <td className="px-6 py-4 text-xs font-semibold text-slate-500 dark:text-slate-400 break-words max-w-sm">
                            {role.associatedTechnicians}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Audit Report view matching user screenshot exactly */}
        {tab === "audit" && (
          <div className="space-y-6 animate-fadeIn">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h1 className="text-xl font-bold text-slate-900 dark:text-white font-outfit">
                  Help Desk Audit Reports
                </h1>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-3xl leading-relaxed">

                  Shows the audit details of all the management actions performed by help desk technicians or admins in AD, Microsoft 365, and Exchange using Petrus. <span className="text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer">Learn more...</span>

                </p>
              </div>
              <div className="flex items-center space-x-4 self-end md:self-auto">
                <button className="flex items-center space-x-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-200/50 dark:hover:bg-slate-800 px-3 py-2 rounded-lg border border-slate-200 dark:border-white/10 transition-all shadow-sm">
                  <Clock className="h-3.5 w-3.5 text-slate-500" />
                  <span>Schedule Reports</span>
                </button>
                <button className="flex items-center space-x-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-200/50 dark:hover:bg-slate-800 px-3 py-2 rounded-lg border border-slate-200 dark:border-white/10 transition-all shadow-sm">
                  <Database className="h-3.5 w-3.5 text-slate-500" />
                  <span>Manage Archives</span>
                </button>
              </div>
            </div>

            {/* Filter Section Card */}
            <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-white/10 rounded-xl p-6 shadow-sm space-y-4 max-w-4xl">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
                
                <div className="space-y-2">
                  <label htmlFor="select-technician" className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Select Help Desk Technicians
                  </label>
                  <div className="flex items-center space-x-1">
                    <select 
                      id="select-technician"
                      value={selectedTechFilter}
                      onChange={(e) => setSelectedTechFilter(e.target.value)}
                      className="w-full bg-slate-100 dark:bg-slate-900 text-xs font-bold text-slate-700 dark:text-slate-300 px-3 py-2 rounded-lg border border-slate-200 dark:border-white/10 outline-none cursor-pointer"
                    >
                      <option value="All">All</option>
                      <option value="adminuser">adminuser</option>
                      <option value="hr_assistant">hr_assistant</option>
                      <option value="it_operator">it_operator</option>
                    </select>
                    <button className="p-2 bg-slate-200 dark:bg-slate-800 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300">
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="select-period" className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Period
                  </label>
                  <div className="flex items-center space-x-1">
                    <select 
                      id="select-period"
                      value={selectedPeriod}
                      onChange={(e) => setSelectedPeriod(e.target.value)}
                      className="w-full bg-slate-100 dark:bg-slate-900 text-xs font-bold text-slate-700 dark:text-slate-300 px-3 py-2 rounded-lg border border-slate-200 dark:border-white/10 outline-none cursor-pointer"
                    >
                      <option value="Last 30 days">Last 30 days</option>
                      <option value="Last 7 days">Last 7 days</option>
                      <option value="Today">Today</option>
                      <option value="Custom">Custom</option>
                    </select>
                    <button className="p-2 bg-slate-200 dark:bg-slate-800 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300">
                      <Calendar className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="flex items-center space-x-3 pb-2.5">
                  <input 
                    type="checkbox" 
                    id="show-archived" 
                    checked={showArchived}
                    onChange={(e) => setShowArchived(e.target.checked)}
                    className="rounded border-slate-300 dark:border-white/10 text-indigo-600 focus:ring-indigo-500 h-4 w-4 cursor-pointer"
                  />
                  <label htmlFor="show-archived" className="text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
                    Show Archived Data
                  </label>
                </div>

              </div>

              <div className="pt-2 flex">
                <button 
                  onClick={handleTriggerAuditQuery}
                  disabled={isSearchingAudit}

                  className="bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600 text-white font-extrabold text-xs px-6 py-2 rounded-lg transition-all shadow-sm shadow-emerald-500/10"

                >
                  {isSearchingAudit ? "Loading..." : "Go"}
                </button>
              </div>
            </div>

            {/* Custom Table Toolbar */}
            <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-white/10 rounded-xl p-4 flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm">
              <div className="flex items-center space-x-3 w-full md:w-auto">
                <div className="flex items-center space-x-2 bg-slate-100 dark:bg-slate-900/50 px-3 py-2 rounded-lg border border-transparent focus-within:border-indigo-500/50 transition-all w-full md:w-64 group/search">
                  <Search className="h-4 w-4 text-slate-400 group-focus-within/search:text-indigo-500 transition-colors" />
                  <input 
                    type="text" 
                    placeholder="Search logs..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="bg-transparent border-none outline-none text-xs text-slate-700 dark:text-slate-300 placeholder:text-slate-500 w-full font-medium"
                  />
                  {searchQuery && (
                    <button onClick={() => setSearchQuery("")}>
                      <X className="h-3 w-3 text-slate-400 hover:text-slate-600" />
                    </button>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between md:justify-end w-full md:w-auto gap-4">
                <span className="text-xs font-bold text-slate-500">
                  Showing <span className="text-slate-900 dark:text-white font-black">{filteredAuditLogs.length}</span> of 255 records
                </span>

                <div className="flex items-center space-x-3 text-xs font-semibold text-slate-500">
                  <span>« <span className="cursor-pointer hover:text-indigo-500">{"<"}</span> 1-100 of 255 <span className="cursor-pointer hover:text-indigo-500">{">"}</span> »</span>
                  <select className="bg-slate-100 dark:bg-slate-900 text-[10px] font-bold text-slate-700 dark:text-slate-300 px-2 py-1 rounded border border-slate-200 dark:border-white/10 outline-none">
                    <option>100</option>
                    <option>50</option>
                    <option>25</option>
                  </select>
                  <button className="p-1.5 bg-slate-100 dark:bg-slate-900 rounded border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:bg-slate-200">
                    <Download className="h-3.5 w-3.5" />
                  </button>
                  <button className="p-1.5 bg-slate-100 dark:bg-slate-900 rounded border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:bg-slate-200">
                    <Settings className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Custom Audit Logs Table */}
            <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-white/10 rounded-xl overflow-hidden shadow-sm animate-fadeIn">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-100/50 dark:bg-slate-900/30 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-white/10">
                      <th className="px-6 py-3.5 text-[10px] font-bold uppercase tracking-wider">Technician Name</th>
                      <th className="px-6 py-3.5 text-[10px] font-bold uppercase tracking-wider">Action Name</th>
                      <th className="px-6 py-3.5 text-[10px] font-bold uppercase tracking-wider">Action Category</th>
                      <th className="px-6 py-3.5 text-[10px] font-bold uppercase tracking-wider">Module Used</th>
                      <th className="px-6 py-3.5 text-[10px] font-bold uppercase tracking-wider">Status Message</th>
                      <th className="px-6 py-3.5 text-[10px] font-bold uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3.5 text-[10px] font-bold uppercase tracking-wider">Object Name</th>
                      <th className="px-6 py-3.5 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 cursor-pointer">
                        <span>Action Time</span>
                        <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
                      </th>
                      <th className="px-6 py-3.5 text-[10px] font-bold uppercase tracking-wider">Object Domain</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-white/10 text-xs font-semibold">

                    {renderAuditTableBody()}

                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Other generic reports (Admin Audit, Technicians Report, Logon Reports) */}
        {(tab === "admin-audit" || tab === "technicians-report" || tab === "technicians-logon") && (
          <div className="space-y-6 animate-fadeIn">
            <div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-white font-outfit capitalize">
                {tab.replace("-", " ")}
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-2xl leading-relaxed">
                Review security and access logs for help desk technician operations. <span className="text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer">Learn more...</span>
              </p>
            </div>

            <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-white/10 rounded-xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-white/10">
                      <th className="px-6 py-3.5 text-[10px] font-bold uppercase tracking-wider">Timestamp</th>
                      <th className="px-6 py-3.5 text-[10px] font-bold uppercase tracking-wider">Technician</th>
                      <th className="px-6 py-3.5 text-[10px] font-bold uppercase tracking-wider">Action / Event</th>
                      <th className="px-6 py-3.5 text-[10px] font-bold uppercase tracking-wider">Target Object</th>
                      <th className="px-6 py-3.5 text-[10px] font-bold uppercase tracking-wider">IP Address</th>
                      <th className="px-6 py-3.5 text-[10px] font-bold uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-white/10 text-xs font-semibold">
                    {[
                      { time: "2026-05-17 12:45:10", tech: "Administrator", action: "Modify User Password", target: "CN=John Doe,OU=Sales", ip: ["192", "168", "12", "45"].join("."), status: "Success" },
                      { time: "2026-05-17 11:30:22", tech: "hr_assistant", action: "Create Single User", target: "CN=Jane Smith,OU=HR", ip: ["192", "168", "12", "80"].join("."), status: "Success" },
                      { time: "2026-05-17 10:15:05", tech: "it_operator", action: "Unlock User Account", target: "CN=Robert Johnson,OU=R&D", ip: ["192", "168", "14", "12"].join("."), status: "Success" },
                      { time: "2026-05-17 09:00:11", tech: "adminuser", action: "Add Helpdesk Technician", target: "CN=auditor_user", ip: ["10", "0", "4", "156"].join("."), status: "Success" },
                      { time: "2026-05-17 08:44:59", tech: "it_operator", action: "Attempt Login", target: "it_operator", ip: ["192", "168", "14", "99"].join("."), status: "Failure" }
                    ].map((row, i) => (
                      <tr key={`${row.time}-${row.tech}-${i}`} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/10 transition-colors">
                        <td className="px-6 py-4 font-mono text-slate-500 dark:text-slate-400">{row.time}</td>
                        <td className="px-6 py-4 text-slate-900 dark:text-white">{row.tech}</td>
                        <td className="px-6 py-4 text-indigo-600 dark:text-indigo-400">{row.action}</td>
                        <td className="px-6 py-4 text-slate-700 dark:text-slate-300 font-mono text-[10px]">{row.target}</td>
                        <td className="px-6 py-4 font-mono text-slate-500 dark:text-slate-400">{row.ip}</td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${
                            row.status === "Success"
                              ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                              : "bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400"
                          }`}>
                            {row.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}


        {/* Enterprise Grade Logon Settings View - Fully Matching Reference Image */}
        {tab === "logon-settings" && (
          <div className="space-y-6 animate-fadeIn">
            {/* Header */}

            <div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-white font-outfit">
                Logon Settings
              </h1>

              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-4xl leading-relaxed">
                Login to Petrus using an authentication method other than the first factor authentication. <span className="text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer">Learn more...</span>
              </p>
            </div>

            {/* Custom Tabbed Sub-navigation matching reference screenshot exactly */}
            <div className="flex border border-slate-200 dark:border-white/10 rounded-lg overflow-hidden bg-slate-50 dark:bg-slate-900/50 max-w-4xl divide-x divide-slate-200 dark:divide-white/10">
              {[
                { id: "general", name: "General" },
                { id: "sso", name: "Single Sign On" },
                { id: "mfa", name: "Two Factor Authentication" },
                { id: "smartcard", name: "Smart Card Authentication" },
                { id: "ips", name: "Allow/Restrict IPs" }
              ].map((sub) => {
                const isSubActive = logonActiveSubTab === sub.id;
                return (
                  <button
                    key={sub.id}
                    onClick={() => setLogonActiveSubTab(sub.id as "general" | "sso" | "mfa" | "smartcard" | "ips")}
                    className={`flex-1 py-2.5 text-xs font-bold text-center transition-all ${
                      isSubActive
                        ? "bg-white dark:bg-slate-950 text-indigo-600 dark:text-indigo-400 shadow-sm"
                        : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900"
                    }`}
                  >
                    {sub.name}
                  </button>
                );
              })}
            </div>

            {/* Sub-tab Content Cards */}
            <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-white/10 rounded-2xl p-6 shadow-sm max-w-4xl space-y-6 animate-fadeIn">
              
              {/* GENERAL SUBTAB (Matches first screenshot exactly) */}
              {logonActiveSubTab === "general" && (
                <div className="space-y-6">
                  {/* CAPTCHA Settings */}
                  <div className="space-y-3">
                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">CAPTCHA Settings</h3>
                    <div className="flex items-center space-x-3 pl-2">
                      <input 
                        type="checkbox" 
                        id="enable-captcha" 
                        checked={enableCaptcha} 
                        onChange={(e) => setEnableCaptcha(e.target.checked)}
                        className="rounded border-slate-300 dark:border-white/10 text-indigo-600 focus:ring-indigo-500 h-4.5 w-4.5 cursor-pointer" 
                      />
                      <label htmlFor="enable-captcha" className="text-xs font-semibold text-slate-600 dark:text-slate-400 cursor-pointer">
                        Enable CAPTCHA on login page
                      </label>
                    </div>
                  </div>

                  {/* Technician Logon Settings */}
                  <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-white/5">
                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Technician Logon Settings</h3>
                    <div className="flex items-center space-x-3 pl-2">
                      <input 
                        type="checkbox" 
                        id="block-invalid-login" 
                        checked={blockInvalidLogin} 
                        onChange={(e) => setBlockInvalidLogin(e.target.checked)}
                        className="rounded border-slate-300 dark:border-white/10 text-indigo-600 focus:ring-indigo-500 h-4.5 w-4.5 cursor-pointer" 
                      />
                      <label htmlFor="block-invalid-login" className="text-xs font-semibold text-slate-600 dark:text-slate-400 cursor-pointer">
                        Block technician after invalid login attempts
                      </label>
                    </div>
                  </div>

                  {/* Mobile Application Settings */}
                  <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-white/5">
                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Mobile Application Settings</h3>
                    <div className="space-y-2.5 pl-2">
                      <div className="flex items-center space-x-3">
                        <input 
                          type="checkbox" 
                          id="allow-android" 
                          checked={allowAndroid} 
                          onChange={(e) => setAllowAndroid(e.target.checked)}
                          className="rounded border-slate-300 dark:border-white/10 text-indigo-600 focus:ring-indigo-500 h-4.5 w-4.5 cursor-pointer" 
                        />
                        <label htmlFor="allow-android" className="text-xs font-semibold text-slate-600 dark:text-slate-400 cursor-pointer">
                          Allow access from Android application
                        </label>
                      </div>

                      <div className="flex items-center space-x-3">
                        <input 
                          type="checkbox" 
                          id="allow-ios" 
                          checked={allowIos} 
                          onChange={(e) => setAllowIos(e.target.checked)}
                          className="rounded border-slate-300 dark:border-white/10 text-indigo-600 focus:ring-indigo-500 h-4.5 w-4.5 cursor-pointer" 
                        />
                        <label htmlFor="allow-ios" className="text-xs font-semibold text-slate-600 dark:text-slate-400 cursor-pointer">
                          Allow access from iOS application
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Login Page Settings */}
                  <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-white/5">
                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Login Page Settings</h3>
                    <div className="space-y-2.5 pl-2">
                      <div className="flex items-center space-x-3">
                        <input 
                          type="checkbox" 
                          id="show-forgot-password" 
                          checked={showForgotPassword} 
                          onChange={(e) => setShowForgotPassword(e.target.checked)}
                          className="rounded border-slate-300 dark:border-white/10 text-indigo-600 focus:ring-indigo-500 h-4.5 w-4.5 cursor-pointer" 
                        />
                        <label htmlFor="show-forgot-password" className="text-xs font-semibold text-slate-600 dark:text-slate-400 cursor-pointer">
                          Show Forgot Password? option on login page
                        </label>
                      </div>

                      <div className="flex items-center space-x-3">
                        <input 
                          type="checkbox" 
                          id="show-log-on-to" 
                          checked={showLogOnTo} 
                          onChange={(e) => setShowLogOnTo(e.target.checked)}
                          className="rounded border-slate-300 dark:border-white/10 text-indigo-600 focus:ring-indigo-500 h-4.5 w-4.5 cursor-pointer" 
                        />
                        <label htmlFor="show-log-on-to" className="text-xs font-semibold text-slate-600 dark:text-slate-400 cursor-pointer">
                          Show Log on to option on login page
                        </label>
                      </div>

                      <div className="flex items-center space-x-3">
                        <input 
                          type="checkbox" 
                          id="disable-concurrent-login" 
                          checked={disableConcurrentLogin} 
                          onChange={(e) => setDisableConcurrentLogin(e.target.checked)}
                          className="rounded border-slate-300 dark:border-white/10 text-indigo-600 focus:ring-indigo-500 h-4.5 w-4.5 cursor-pointer" 
                        />
                        <label htmlFor="disable-concurrent-login" className="text-xs font-semibold text-slate-600 dark:text-slate-400 cursor-pointer flex items-center space-x-1.5">
                          <span>Disable concurrent login</span>
                          <span className="text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer font-bold">Active Sessions Settings</span>
                        </label>
                      </div>

                      <div className="flex items-center space-x-3">
                        <input 
                          type="checkbox" 
                          id="show-disclaimer" 
                          checked={showDisclaimer} 
                          onChange={(e) => setShowDisclaimer(e.target.checked)}
                          className="rounded border-slate-300 dark:border-white/10 text-indigo-600 focus:ring-indigo-500 h-4.5 w-4.5 cursor-pointer" 
                        />
                        <label htmlFor="show-disclaimer" className="text-xs font-semibold text-slate-600 dark:text-slate-400 cursor-pointer flex items-center space-x-1.5">
                          <span>Show disclaimer</span>
                          <span className="text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer font-bold">Customize</span>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* SINGLE SIGN ON SUBTAB */}
              {logonActiveSubTab === "sso" && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Globe className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                      <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">SAML 2.0 Single Sign-On</h3>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input 
                        type="checkbox" 
                        id="toggle-sso" 
                        checked={ssoEnabled} 
                        onChange={(e) => setSsoEnabled(e.target.checked)}
                        className="rounded border-slate-300 dark:border-white/10 text-indigo-600 focus:ring-indigo-500 h-4.5 w-4.5 cursor-pointer" 
                      />
                      <label htmlFor="toggle-sso" className="text-xs font-bold text-indigo-600 dark:text-indigo-400 cursor-pointer">Enable SAML SSO</label>
                    </div>
                  </div>

                  {ssoEnabled && (
                    <div className="space-y-4 pt-2 animate-fadeIn">
                      <div className="space-y-2">
                        <label htmlFor="sso-metadata" className="text-xs font-bold text-slate-700 dark:text-slate-300">Identity Provider Metadata XML URL</label>
                        <input 
                          type="text" 
                          id="sso-metadata"
                          value={ssoMetadataUrl}
                          onChange={(e) => setSsoMetadataUrl(e.target.value)}
                          className="w-full bg-slate-100 dark:bg-slate-900 text-xs font-medium text-slate-700 dark:text-slate-300 px-3 py-2 rounded-lg border border-slate-200 dark:border-white/10 outline-none focus:border-indigo-500 transition-all font-mono"
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label htmlFor="sso-issuer" className="text-xs font-bold text-slate-700 dark:text-slate-300">SAML Service Provider Entity ID (Issuer)</label>
                          <input 
                            type="text" 
                            id="sso-issuer"
                            value={ssoIssuer}
                            onChange={(e) => setSsoIssuer(e.target.value)}
                            className="w-full bg-slate-100 dark:bg-slate-900 text-xs font-medium text-slate-700 dark:text-slate-300 px-3 py-2 rounded-lg border border-slate-200 dark:border-white/10 outline-none focus:border-indigo-500 transition-all font-mono"
                          />
                        </div>

                        <div className="space-y-2">
                          <label htmlFor="sso-binding" className="text-xs font-bold text-slate-700 dark:text-slate-300">SAML Request Binding Method</label>
                          <select id="sso-binding" className="w-full bg-slate-100 dark:bg-slate-900 text-xs font-bold text-slate-700 dark:text-slate-300 px-3 py-2 rounded-lg border border-slate-200 dark:border-white/10 outline-none">
                            <option>HTTP-Redirect Binding (Recommended)</option>
                            <option>HTTP-POST Binding</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* TWO FACTOR AUTHENTICATION SUBTAB */}
              {logonActiveSubTab === "mfa" && (
                <div className="space-y-6">
                  <div className="flex items-center space-x-3">
                    <Key className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                    <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">Two Factor Authentication (MFA) Settings</h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                    <div className="space-y-2">
                      <label htmlFor="mfa-enforcement" className="text-xs font-bold text-slate-700 dark:text-slate-300">MFA Policy Enforcement</label>
                      <select id="mfa-enforcement" className="w-full bg-slate-100 dark:bg-slate-900 text-xs font-bold text-slate-700 dark:text-slate-300 px-3 py-2 rounded-lg border border-slate-200 dark:border-white/10 outline-none">
                        <option>Enforced For All Help Desk Technicians</option>
                        <option>Enforced For External Networks Only</option>
                        <option>Optional For All Technicians</option>
                        <option>Disabled</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="primary-mfa-method" className="text-xs font-bold text-slate-700 dark:text-slate-300">Default Primary MFA Method</label>
                      <select id="primary-mfa-method" className="w-full bg-slate-100 dark:bg-slate-900 text-xs font-bold text-slate-700 dark:text-slate-300 px-3 py-2 rounded-lg border border-slate-200 dark:border-white/10 outline-none">
                        <option>Authenticator App (TOTP - Google/Microsoft)</option>
                        <option>FIDO2 WebAuthn (Security Keys/Biometrics)</option>
                        <option>Email OTP Authentication</option>
                        <option>SMS Text Message OTP</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-white/5">
                    <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300">Allowed Secondary Authentication Factors</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {[
                        { id: "allow-totp", label: "Allow Google / Microsoft Authenticator (TOTP)", defaultChecked: true },
                        { id: "allow-fido", label: "Allow FIDO2 / WebAuthn Hardware Keys (YubiKey)", defaultChecked: true },
                        { id: "allow-sms", label: "Allow SMS OTP Verification", defaultChecked: false },
                        { id: "allow-email", label: "Allow Email verification code fallback", defaultChecked: true }
                      ].map((item) => (
                        <div key={item.id} className="flex items-center space-x-3 bg-slate-50 dark:bg-slate-900/50 px-4 py-2.5 rounded-lg border border-slate-100 dark:border-white/5">
                          <input type="checkbox" id={item.id} defaultChecked={item.defaultChecked} className="rounded border-slate-300 dark:border-white/10 text-indigo-600 focus:ring-indigo-500 h-4 w-4 cursor-pointer" />
                          <label htmlFor={item.id} className="text-xs font-semibold text-slate-600 dark:text-slate-400 cursor-pointer">{item.label}</label>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* SMART CARD AUTHENTICATION SUBTAB */}
              {logonActiveSubTab === "smartcard" && (
                <div className="space-y-6">
                  <div className="flex items-center space-x-3">
                    <CreditCard className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                    <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">Smart Card & Hardware Token Authentication</h3>
                  </div>

                  <div className="bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200/50 p-4 rounded-xl flex items-start space-x-3 max-w-2xl">
                    <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <h4 className="text-xs font-bold text-yellow-800 dark:text-yellow-300">Active Directory PIN & Certificate Enrollment Required</h4>
                      <p className="text-[11px] text-yellow-700 dark:text-yellow-400 leading-relaxed font-semibold">
                        Ensure technicians have enrolled their PIV/CAC card credentials under their corresponding AD container store before enabling Smart Card Logon enforce rules.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4 pt-2">
                    <div className="flex items-center space-x-3 pl-1">
                      <input type="checkbox" id="enforce-smartcard" className="rounded border-slate-300 dark:border-white/10 text-indigo-600 focus:ring-indigo-500 h-4.5 w-4.5 cursor-pointer" />
                      <label htmlFor="enforce-smartcard" className="text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
                        Enable and require Smart Card Logon validation
                      </label>
                    </div>

                    <div className="space-y-2 max-w-sm pl-1">
                      <label htmlFor="smartcard-pin" className="text-xs font-bold text-slate-700 dark:text-slate-300">Card Pin Expiry Restriction</label>
                      <select id="smartcard-pin" className="w-full bg-slate-100 dark:bg-slate-900 text-xs font-bold text-slate-700 dark:text-slate-300 px-3 py-2 rounded-lg border border-slate-200 dark:border-white/10 outline-none">
                        <option>Enforce system smart card certificate revocation list checking</option>
                        <option>Bypass CRL validation on domain level bounds</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* ALLOW/RESTRICT IPS SUBTAB */}
              {logonActiveSubTab === "ips" && (
                <div className="space-y-6">
                  <div className="flex items-center space-x-3">
                    <Shield className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                    <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">Allow/Restrict IPs network boundary rules</h3>
                  </div>

                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    Prevent access from outside company premises by allowing requests only from recognized corporate subnet ranges. Leaving this blank turns off IP filtering.
                  </p>

                  <form onSubmit={handleAddAllowedIp} className="flex gap-2">
                    <input 
                      type="text" 
                      placeholder="e.g. 192.168.1.0/24 or 198.51.100.12" 
                      value={ipInput}
                      onChange={(e) => setIpInput(e.target.value)}
                      className="bg-slate-100 dark:bg-slate-900/50 text-xs font-mono text-slate-700 dark:text-slate-300 px-3 py-2 rounded-lg border border-slate-200 dark:border-white/10 outline-none w-full max-w-sm focus:border-indigo-500 transition-all"
                    />
                    <button 
                      type="submit"
                      className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-4 py-2 rounded-lg transition-all"
                    >
                      Whitelist Range
                    </button>
                  </form>

                  <div className="pt-2 space-y-2">
                    <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300">Currently Allowed Subnet / IP Ranges:</h4>
                    <div className="flex flex-wrap gap-2">
                      {allowedIps.map((ip) => (
                        <div key={ip} className="flex items-center space-x-2 bg-slate-100 dark:bg-slate-900 font-mono text-[11px] font-semibold text-slate-700 dark:text-slate-300 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-white/10">
                          <span>{ip}</span>
                          <button 
                            type="button"
                            onClick={() => handleRemoveIp(ip)}
                            className="p-0.5 hover:bg-slate-200 dark:hover:bg-slate-800 rounded text-slate-400 hover:text-rose-500 transition-colors"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* SAVE CONFIG BAR - Matches Reference color perfectly */}
              <div className="pt-6 border-t border-slate-100 dark:border-white/5 flex items-center space-x-3">
                <button 
                  onClick={handleSaveLogonConfig}
                  disabled={isSavingLogon}
                  className="bg-[#8cc63f] hover:bg-[#7bb336] text-white font-black text-xs px-6 py-2.5 rounded transition-all shadow-sm"
                >
                  {isSavingLogon ? "Saving Settings..." : "Save Settings"}
                </button>
                <button 
                  onClick={handleCancelLogonConfig}
                  className="bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs px-5 py-2.5 rounded transition-all"
                >
                  Cancel
                </button>
              </div>


            </div>
          </div>
        )}

        {/* Add Technician Dialog / Modal */}
        {isAddModalOpen && (
          <div className="fixed inset-0 bg-slate-900/50 dark:bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
            <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-white/10 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-zoomIn">
              <div className="bg-slate-50 dark:bg-slate-900 px-6 py-4 flex items-center justify-between border-b border-slate-200 dark:border-white/10">
                <div className="flex items-center space-x-2">
                  <UserPlus className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Delegate New Technician
                  </h3>
                </div>
                <button 
                  onClick={() => setIsAddModalOpen(false)}
                  className="p-1 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <form onSubmit={handleAddTechnician} className="p-6 space-y-4">
                <div className="space-y-2">
                  <label htmlFor="tech-login-name" className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Technician Login Name *
                  </label>
                  <input 
                    type="text" 
                    id="tech-login-name"
                    required
                    placeholder="e.g. jsmith"
                    value={newTech.loginName}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewTech({ ...newTech, loginName: e.target.value })}
                    className="w-full bg-slate-100 dark:bg-slate-900/50 text-xs font-medium text-slate-700 dark:text-slate-300 px-3 py-2 rounded-lg border border-slate-200 dark:border-white/10 outline-none focus:border-indigo-500 transition-all"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label htmlFor="tech-directory-name" className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Directory Account Name *
                    </label>
                    <input 
                      type="text" 
                      id="tech-directory-name"
                      required
                      placeholder="e.g. John"
                      value={newTech.name}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewTech({ ...newTech, name: e.target.value })}
                      className="w-full bg-slate-100 dark:bg-slate-900/50 text-xs font-medium text-slate-700 dark:text-slate-300 px-3 py-2 rounded-lg border border-slate-200 dark:border-white/10 outline-none focus:border-indigo-500 transition-all"
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="tech-display-name" className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Display Name *
                    </label>
                    <input 
                      type="text" 
                      id="tech-display-name"
                      required
                      placeholder="e.g. John Smith"
                      value={newTech.displayName}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewTech({ ...newTech, displayName: e.target.value })}
                      className="w-full bg-slate-100 dark:bg-slate-900/50 text-xs font-medium text-slate-700 dark:text-slate-300 px-3 py-2 rounded-lg border border-slate-200 dark:border-white/10 outline-none focus:border-indigo-500 transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="tech-role-mapping" className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Delegated Role Mapping *
                  </label>
                  <select 
                    id="tech-role-mapping"
                    value={newTech.delegatedRoles}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setNewTech({ ...newTech, delegatedRoles: e.target.value })}
                    className="w-full bg-slate-100 dark:bg-slate-900/50 text-xs font-bold text-slate-700 dark:text-slate-300 px-3 py-2 rounded-lg border border-slate-200 dark:border-white/10 outline-none focus:border-indigo-500 transition-all cursor-pointer"
                  >
                    <option value="Create Users Details">Create Users Details</option>
                    <option value="Super Admin Details">Super Admin Details</option>
                    <option value="HR Specialist Details">HR Specialist Details</option>
                    <option value="IT Operator Details">IT Operator Details</option>
                    <option value="Auditor Details">Auditor Details</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label htmlFor="tech-description" className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Description / Scope Notes
                  </label>
                  <textarea 
                    rows={3}
                    id="tech-description"
                    placeholder="Provide context on delegation rights..."
                    value={newTech.description}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNewTech({ ...newTech, description: e.target.value })}
                    className="w-full bg-slate-100 dark:bg-slate-900/50 text-xs font-medium text-slate-700 dark:text-slate-300 px-3 py-2 rounded-lg border border-slate-200 dark:border-white/10 outline-none focus:border-indigo-500 transition-all resize-none"
                  />
                </div>

                <div className="pt-4 border-t border-slate-100 dark:border-white/5 flex items-center justify-end space-x-3">
                  <button 
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className="px-4 py-2 border border-slate-200 dark:border-white/10 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900 text-xs font-bold transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-50 dark:hover:bg-emerald-600 text-white font-bold text-xs rounded-lg transition-all shadow-sm"
                  >
                    Confirm Delegation
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Create New Role Dialog / Modal */}
        {isAddRoleModalOpen && (
          <div className="fixed inset-0 bg-slate-900/50 dark:bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
            <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-white/10 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-zoomIn">
              <div className="bg-slate-50 dark:bg-slate-900 px-6 py-4 flex items-center justify-between border-b border-slate-200 dark:border-white/10">
                <div className="flex items-center space-x-2">
                  <Shield className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Create New Help Desk Role
                  </h3>
                </div>
                <button 
                  onClick={() => setIsAddRoleModalOpen(false)}
                  className="p-1 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <form onSubmit={handleAddRole} className="p-6 space-y-4">
                <div className="space-y-2">
                  <label htmlFor="role-name-input" className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Role Name *
                  </label>
                  <input 
                    type="text" 
                    id="role-name-input"
                    required
                    placeholder="e.g. Password Manager"
                    value={newRole.roleName}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewRole({ ...newRole, roleName: e.target.value })}
                    className="w-full bg-slate-100 dark:bg-slate-900/50 text-xs font-medium text-slate-700 dark:text-slate-300 px-3 py-2 rounded-lg border border-slate-200 dark:border-white/10 outline-none focus:border-indigo-500 transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="role-desc-input" className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Description / Purpose
                  </label>
                  <textarea 
                    rows={3}
                    id="role-desc-input"
                    placeholder="Describe target privileges and OU bounds..."
                    value={newRole.description}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNewRole({ ...newRole, description: e.target.value })}
                    className="w-full bg-slate-100 dark:bg-slate-900/50 text-xs font-medium text-slate-700 dark:text-slate-300 px-3 py-2 rounded-lg border border-slate-200 dark:border-white/10 outline-none focus:border-indigo-500 transition-all resize-none"
                  />
                </div>

                <div className="space-y-2">
                  <label htmlFor="role-techs-input" className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Associated Technicians (Comma Separated)
                  </label>
                  <input 
                    type="text" 
                    id="role-techs-input"
                    placeholder="e.g. adminuser, Guest"
                    value={newRole.associatedTechnicians}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewRole({ ...newRole, associatedTechnicians: e.target.value })}
                    className="w-full bg-slate-100 dark:bg-slate-900/50 text-xs font-medium text-slate-700 dark:text-slate-300 px-3 py-2 rounded-lg border border-slate-200 dark:border-white/10 outline-none focus:border-indigo-500 transition-all"
                  />
                </div>

                <div className="pt-4 border-t border-slate-100 dark:border-white/5 flex items-center justify-end space-x-3">
                  <button 
                    type="button"
                    onClick={() => setIsAddRoleModalOpen(false)}
                    className="px-4 py-2 border border-slate-200 dark:border-white/10 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-950 text-xs font-bold transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-50 dark:hover:bg-emerald-600 text-white font-bold text-xs rounded-lg transition-all shadow-sm"
                  >
                    Confirm Role Creation
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </DashboardLayout>
  );
}
