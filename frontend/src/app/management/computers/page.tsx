"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ManagementConsoleLayout from "@/components/layout/ManagementConsoleLayout";
import { 
  Loader2, 
  Terminal, 
  Check, 
  X, 
  Sparkles, 
  Key, 
  Server, 
  Cloud, 
  ShieldAlert,
  Info,
  CheckCircle2,
  XCircle,
  Plus,
  Trash2,
  Download,
  Upload,
  FolderTree
} from "lucide-react";

// Path mappings for navigation tabs
const PATH_MAP: Record<string, string> = {
  "User Management": "/management/users",
  "Computer Management": "/management/computers",
  "Group Management": "/management/groups",
  "Contact Management": "/management/contacts",
  "Mailbox Management": "/management/mailboxes",
  "OU Management": "/management/ou",
  "File Server": "/management/fileserver",
  "GPO Management": "/management/gpo",
  "CSV Import": "/management/csv",
  "Migration": "/management/migration",
  "Advanced": "/management/advanced"
};

interface BulkField {
  key: string; label: string;
  type?: "text" | "textarea" | "select" | "checkbox";
  options?: string[]; placeholder?: string; required?: boolean; span?: boolean;
}

interface BulkActionCfg {
  title: string; description: string; apiAction: string;
  color: string;
  fields: BulkField[]; csvColumns: string[]; danger?: boolean;
}

// Bulk computer action configurations matching backend service
const BULK_ACTION_CONFIG: Record<string, BulkActionCfg> = {
  "Modify group attributes of computers": {
    title: "Group Membership Modification", apiAction: "modify-group-attributes", color: "rose",
    description: "Add or remove computers from Active Directory security and distribution groups.",
    fields: [
      { key: "groupOperation", label: "Operation", type: "select", options: ["add", "remove", "replace"], required: true },
      { key: "adGroupDns_raw", label: "Groups to ADD (comma-separated DNs)", type: "textarea", placeholder: "CN=Domain Computers,CN=Users,DC=corp,DC=com", span: true },
      { key: "adGroupRemoveDns_raw", label: "Groups to REMOVE (comma-separated DNs)", type: "textarea", placeholder: "CN=Workstations-Test,CN=Users,DC=corp,DC=com", span: true },
    ],
    csvColumns: ["computerName", "group_dn", "operation"],
  },
  "Modify general attributes": {
    title: "Modify General Attributes", apiAction: "modify-general-attributes", color: "indigo",
    description: "Update standard Active Directory computer attributes like description and location.",
    fields: [
      { key: "description", label: "Description", placeholder: "e.g. Standard office workstation" },
      { key: "location", label: "Location", placeholder: "e.g. London HQ - 2nd Floor" },
      { key: "managedBy", label: "Managed By (User DN)", placeholder: "CN=Jane Doe,OU=Users,DC=corp,DC=com" },
      { key: "dnsName", label: "DNS Host Name", placeholder: "e.g. desktop-01.corp.com" },
      { key: "operatingSystem", label: "Operating System", placeholder: "e.g. Windows 11 Pro" },
      { key: "operatingSystemVersion", label: "OS Version", placeholder: "e.g. 23H2" },
      { key: "servicePrincipalName", label: "Service Principal Name (SPN)", placeholder: "e.g. HOST/desktop-01" },
    ],
    csvColumns: ["computerName", "description", "location", "managed_by", "dns_name", "operating_system", "operating_system_version", "spn"],
  },
  "Custom Attributes": {
    title: "Extension Attributes (Custom Attributes)", apiAction: "custom-attributes", color: "violet",
    description: "Update extensionAttribute1–5 for selected computer accounts.",
    fields: [
      { key: "extensionAttribute1", label: "Extension Attribute 1", placeholder: "e.g. AssetID-991" },
      { key: "extensionAttribute2", label: "Extension Attribute 2", placeholder: "e.g. CostCenter-UK" },
      { key: "extensionAttribute3", label: "Extension Attribute 3", placeholder: "e.g. DeploymentBatch" },
      { key: "extensionAttribute4", label: "Extension Attribute 4", placeholder: "e.g. PurchaseYear" },
      { key: "extensionAttribute5", label: "Extension Attribute 5", placeholder: "e.g. HardwareModel" },
    ],
    csvColumns: ["computerName", "ext_attr1", "ext_attr2", "ext_attr3", "ext_attr4", "ext_attr5"],
  },
  "Reset Computers": {
    title: "Reset Computer Accounts", apiAction: "reset-computer", color: "emerald",
    description: "Reset computer account machine passwords in Active Directory.",
    fields: [], csvColumns: ["computerName"],
  },
  "Move Computers": {
    title: "Move Computers to OU", apiAction: "move-computer", color: "amber",
    description: "Move selected computer accounts to a different Organizational Unit.",
    fields: [{ key: "targetOu", label: "Target OU (Distinguished Name)", placeholder: "OU=Workstations,DC=corp,DC=com", required: true, span: true }],
    csvColumns: ["computerName", "target_ou"],
  },
  "Enable/Disable Computers": {
    title: "Enable / Disable Computer Accounts", apiAction: "enable-disable", color: "sky",
    description: "Enable or disable machine accounts in the domain.",
    fields: [{ key: "accountDisabled", label: "Action", type: "select", options: ["Enable Computer Account", "Disable Computer Account"], required: true }],
    csvColumns: ["computerName", "action"],
  },
  "Delete Computers": {
    title: "Delete Computer Objects", apiAction: "delete-computer", color: "red", danger: true,
    description: "Permanently delete computer accounts from Active Directory.",
    fields: [{ key: "confirmDelete", label: "Type 'DELETE' to confirm", placeholder: "DELETE", required: true }],
    csvColumns: ["computerName"],
  },
  "Restore Deleted Computers": {
    title: "Restore Deleted Computers", apiAction: "restore-computer", color: "teal",
    description: "Restore computer objects from the Active Directory Recycle Bin.",
    fields: [], csvColumns: ["computerName"],
  }
};

const parseList = (item: any): any[] => {
  if (Array.isArray(item)) return item;
  return item ? [item] : [];
};

export default function ComputerManagementPage() {
  const router = useRouter();

  // Active integrations list
  const [adSettingsList, setAdSettingsList] = useState<any[]>([]);

  // Feedback modal status
  const [jobModal, setJobModal] = useState<{ isOpen: boolean; success: boolean; message: string }>({ isOpen: false, success: false, message: "" });

  // ── Create Single Computer Modal State ──────────────────────────────
  const [isSingleCreateOpen, setIsSingleCreateOpen] = useState(false);
  const [singleShowTerminal, setSingleShowTerminal] = useState(false);
  const [isCreatingSingle, setIsCreatingSingle] = useState(false);
  const [singleCreateLogs, setSingleCreateLogs] = useState<string[]>([]);
  const [singleCreateSuccess, setSingleCreateSuccess] = useState<boolean | null>(null);
  const [singleFormData, setSingleFormData] = useState({
    computerName: "",
    description: "",
    location: "",
    targetOu: "",
    dnsName: "",
    operatingSystem: "Windows 11 Pro",
    operatingSystemVersion: "23H2",
    createInAd: true,
    adSettingsId: ""
  });

  // ── Create Bulk Computers Modal State ──────────────────────────────
  const [isBulkCreateOpen, setIsBulkCreateOpen] = useState(false);
  const [bulkShowTerminal, setBulkShowTerminal] = useState(false);
  const [isCreatingBulk, setIsCreatingBulk] = useState(false);
  const [bulkCreateLogs, setBulkCreateLogs] = useState<string[]>([]);
  const [bulkCreateSuccess, setBulkCreateSuccess] = useState<boolean | null>(null);
  const [bulkComputersList, setBulkComputersList] = useState<any[]>([
    { id: "1", computerName: "", description: "", location: "", targetOu: "", operatingSystem: "Windows 11 Pro" }
  ]);
  const [bulkGlobalConfig, setBulkGlobalConfig] = useState({
    createInAd: true,
    adSettingsId: ""
  });

  // ── Modify Single Computer Modal State ──────────────────────────────
  const [isSingleModifyOpen, setIsSingleModifyOpen] = useState(false);
  const [modifySearchQuery, setModifySearchQuery] = useState("");
  const [modifySearchResults, setModifySearchResults] = useState<any[]>([]);
  const [modifySearchLoading, setModifySearchLoading] = useState(false);
  const [selectedModifyComputer, setSelectedModifyComputer] = useState<any | null>(null);
  const [modifyActiveTab, setModifyActiveTab] = useState("General");
  const [isModifyingSingle, setIsModifyingSingle] = useState(false);
  const [modifyShowTerminal, setModifyShowTerminal] = useState(false);
  const [modifyLogs, setModifyLogs] = useState<string[]>([]);
  const [modifySuccessStatus, setModifySuccessStatus] = useState<boolean | null>(null);
  const [modifyFormData, setModifyFormData] = useState({
    description: "",
    location: "",
    managedBy: "",
    dnsName: "",
    operatingSystem: "",
    operatingSystemVersion: "",
    servicePrincipalName: "",
    targetOu: "",
    adGroupDns_raw: "",
    adGroupRemoveDns_raw: "",
    groupOperation: "add",
    accountDisabled: false,
    extensionAttribute1: "",
    extensionAttribute2: "",
    extensionAttribute3: "",
    extensionAttribute4: "",
    extensionAttribute5: ""
  });

  // ── Generic Bulk Action Modal State ─────────────────────────────────
  const [bulkActionOpen, setBulkActionOpen] = useState(false);
  const [bulkActionKey, setBulkActionKey] = useState("");
  const [bulkActionComputers, setBulkActionComputers] = useState<any[]>([]);
  const [bulkActionForm, setBulkActionForm] = useState<Record<string, any>>({});
  const [bulkActionLogs, setBulkActionLogs] = useState<string[]>([]);
  const [bulkActionStatus, setBulkActionStatus] = useState<boolean | null>(null);
  const [isBulkActioning, setIsBulkActioning] = useState(false);
  const [bulkActionShowTerminal, setBulkActionShowTerminal] = useState(false);
  const [bulkActionSearch, setBulkActionSearch] = useState("");
  const [bulkActionSearchResults, setBulkActionSearchResults] = useState<any[]>([]);
  const [bulkActionSearchLoading, setBulkActionSearchLoading] = useState(false);
  const [bulkActionResults, setBulkActionResults] = useState<{computerName: string; status: "success"|"error"; message: string}[]>([]);

  // ── Computer Templates State ────────────────────────────────────────
  const [isTemplatesWorkspaceOpen, setIsTemplatesWorkspaceOpen] = useState(false);
  const [templatesList, setTemplatesList] = useState<any[]>([]);
  const [templatesLoading, setTemplatesLoading] = useState(false);
  const [showTemplateForm, setShowTemplateForm] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<any | null>(null);
  const [templateFormFields, setTemplateFormFields] = useState({
    name: "",
    description: "",
    category: "Workstation",
    location: "",
    targetOu: "",
    operatingSystem: "Windows 11 Pro",
    operatingSystemVersion: "23H2"
  });

  useEffect(() => {
    fetchIntegrations();
  }, []);

  const fetchIntegrations = async () => {
    try {
      const token = localStorage.getItem("petrus_token");
      const headers = { Authorization: `Bearer ${token}` };

      const res = await fetch("http://localhost:3001/settings", { headers });
      if (res.ok) {
        const data = await res.json();
        const adList = parseList(data.adSettings);
        setAdSettingsList(adList);
        if (adList.length > 0) {
          setSingleFormData(prev => ({ ...prev, adSettingsId: adList[0].id }));
          setBulkGlobalConfig(prev => ({ ...prev, adSettingsId: adList[0].id }));
        }
      }
    } catch (e) {
      console.error("Failed to load integrations settings", e);
    }
  };

  // ── Search computers via backend ──────────────────────────────
  const searchComputersBackend = async (query: string, setResults: any, setLoading: any) => {
    if (!query) return;
    setLoading(true);
    try {
      const token = localStorage.getItem("petrus_token");
      const res = await fetch(`http://localhost:3001/computers?q=${encodeURIComponent(query)}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setResults(Array.isArray(data) ? data : []);
      }
    } catch (e) {
      console.error("Search failed", e);
    } finally {
      setLoading(false);
    }
  };

  // ── Single Creation handlers ──────────────────────────────────────
  const handleSingleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreatingSingle(true);
    setSingleShowTerminal(true);
    setSingleCreateSuccess(null);
    setSingleCreateLogs(["[System] Starting computer creation sequence..."]);

    try {
      const token = localStorage.getItem("petrus_token");
      const res = await fetch("http://localhost:3001/computers/create-single", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(singleFormData)
      });
      const data = await res.json();
      const success = res.ok && (data.success !== false);
      if (data.logs) {
        setSingleCreateLogs(prev => [...prev, ...data.logs]);
      }
      setSingleCreateSuccess(success);
    } catch (err: any) {
      setSingleCreateLogs(prev => [...prev, `[ERROR] Network error: ${err.message}`]);
      setSingleCreateSuccess(false);
    } finally {
      setIsCreatingSingle(false);
    }
  };

  // ── Bulk Creation Grid Handlers ────────────────────────────────────
  const handleAddBulkRow = () => {
    setBulkComputersList(prev => [
      ...prev,
      { id: String(Date.now()), computerName: "", description: "", location: "", targetOu: "", operatingSystem: "Windows 11 Pro" }
    ]);
  };

  const handleRemoveBulkRow = (id: string) => {
    if (bulkComputersList.length <= 1) return;
    setBulkComputersList(prev => prev.filter(r => r.id !== id));
  };

  const handleBulkRowFieldChange = (id: string, field: string, val: string) => {
    setBulkComputersList(prev => prev.map(r => r.id === id ? { ...r, [field]: val } : r));
  };

  const downloadBulkCreateTemplate = () => {
    const csv = "computerName,description,location,targetOu,operatingSystem\nDESKTOP-A01,Standard Office Workstation,London HQ,OU=Workstations,Windows 11 Pro\n";
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "bulk_computer_creation_template.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleBulkCreateCsvUpload = async (file: File) => {
    const text = await file.text();
    const lines = text.split("\n").map(l => l.trim()).filter(Boolean);
    if (lines.length < 2) return;
    const headers = lines[0].toLowerCase().split(",");
    
    const rows = lines.slice(1).map((line, idx) => {
      const cols = line.split(",");
      const getVal = (headerName: string) => {
        const i = headers.findIndex(h => h.includes(headerName));
        return i >= 0 ? (cols[i]?.trim().replace(/"/g, "") || "") : "";
      };
      return {
        id: String(Date.now() + idx),
        computerName: getVal("computername") || getVal("name"),
        description: getVal("description"),
        location: getVal("location"),
        targetOu: getVal("targetou") || getVal("ou"),
        operatingSystem: getVal("operatingsystem") || getVal("os") || "Windows 11 Pro"
      };
    }).filter(r => r.computerName);

    if (rows.length > 0) {
      setBulkComputersList(rows);
      setJobModal({ isOpen: true, success: true, message: `Successfully loaded ${rows.length} computer(s) from CSV.` });
    } else {
      setJobModal({ isOpen: true, success: false, message: "No valid computer rows found in CSV." });
    }
  };

  const handleBulkCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreatingBulk(true);
    setBulkShowTerminal(true);
    setBulkCreateSuccess(null);
    setBulkCreateLogs(["[System] Running batch computer creation workflow..."]);

    const computers = bulkComputersList.map(c => ({
      ...c,
      createInAd: bulkGlobalConfig.createInAd,
      adSettingsId: bulkGlobalConfig.adSettingsId
    }));

    try {
      const token = localStorage.getItem("petrus_token");
      const res = await fetch("http://localhost:3001/computers/create-bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ computers })
      });
      const data = await res.json();
      const success = res.ok && (data.success !== false);
      if (data.logs) {
        setBulkCreateLogs(prev => [...prev, ...data.logs]);
      }
      setBulkCreateSuccess(success);
    } catch (err: any) {
      setBulkCreateLogs(prev => [...prev, `[ERROR] Network error: ${err.message}`]);
      setBulkCreateSuccess(false);
    } finally {
      setIsCreatingBulk(false);
    }
  };

  // ── Modify Single Computer Handlers ─────────────────────────────────
  const handleSelectComputerForModify = (c: any) => {
    setSelectedModifyComputer(c);
    setModifyFormData({
      description: c.description || "",
      location: c.location || "",
      managedBy: c.managedBy || "",
      dnsName: c.dnsName || c.dNSHostName || "",
      operatingSystem: c.operatingSystem || c.os || "",
      operatingSystemVersion: c.operatingSystemVersion || "",
      servicePrincipalName: c.servicePrincipalName || "",
      targetOu: c.targetOu || "",
      adGroupDns_raw: "",
      adGroupRemoveDns_raw: "",
      groupOperation: "add",
      accountDisabled: !!c.accountDisabled,
      extensionAttribute1: c.extensionAttribute1 || "",
      extensionAttribute2: c.extensionAttribute2 || "",
      extensionAttribute3: c.extensionAttribute3 || "",
      extensionAttribute4: c.extensionAttribute4 || "",
      extensionAttribute5: c.extensionAttribute5 || ""
    });
  };

  const handleModifySingleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedModifyComputer) return;
    setIsModifyingSingle(true);
    setModifyShowTerminal(true);
    setModifySuccessStatus(null);
    setModifyLogs([`[System] Starting modification for computer account: ${selectedModifyComputer.name || selectedModifyComputer.computerName}`]);

    const payload: any = {
      computerName: selectedModifyComputer.name || selectedModifyComputer.computerName,
      modifyInAd: true,
      description: modifyFormData.description,
      location: modifyFormData.location,
      managedBy: modifyFormData.managedBy,
      dnsName: modifyFormData.dnsName,
      operatingSystem: modifyFormData.operatingSystem,
      operatingSystemVersion: modifyFormData.operatingSystemVersion,
      servicePrincipalName: modifyFormData.servicePrincipalName,
      targetOu: modifyFormData.targetOu,
      accountDisabled: modifyFormData.accountDisabled,
      extensionAttribute1: modifyFormData.extensionAttribute1,
      extensionAttribute2: modifyFormData.extensionAttribute2,
      extensionAttribute3: modifyFormData.extensionAttribute3,
      extensionAttribute4: modifyFormData.extensionAttribute4,
      extensionAttribute5: modifyFormData.extensionAttribute5
    };

    if (modifyFormData.adGroupDns_raw) {
      payload.adGroupDns = modifyFormData.adGroupDns_raw.split(",").map(s => s.trim()).filter(Boolean);
    }
    if (modifyFormData.adGroupRemoveDns_raw) {
      payload.adGroupRemoveDns = modifyFormData.adGroupRemoveDns_raw.split(",").map(s => s.trim()).filter(Boolean);
    }
    payload.groupOperation = modifyFormData.groupOperation;

    try {
      const token = localStorage.getItem("petrus_token");
      const res = await fetch("http://localhost:3001/computers/modify-single", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      const success = res.ok && (data.success !== false);
      if (data.logs) {
        setModifyLogs(prev => [...prev, ...data.logs]);
      }
      setModifySuccessStatus(success);
    } catch (err: any) {
      setModifyLogs(prev => [...prev, `[ERROR] Network error: ${err.message}`]);
      setModifySuccessStatus(false);
    } finally {
      setIsModifyingSingle(false);
    }
  };

  // ── Generic Bulk Action Modal Handlers ──────────────────────────────
  const openBulkAction = (key: string) => {
    setBulkActionKey(key);
    setBulkActionComputers([]);
    setBulkActionSearch("");
    setBulkActionSearchResults([]);
    setBulkActionForm({});
    setBulkActionLogs([]);
    setBulkActionStatus(null);
    setBulkActionShowTerminal(false);
    setBulkActionResults([]);
    setBulkActionOpen(true);
  };

  const handleCsvImport = async (file: File) => {
    const text = await file.text();
    const lines = text.split("\n").map(l => l.trim()).filter(Boolean);
    if (lines.length < 2) return;
    const headers = lines[0].toLowerCase().split(",");
    const nameIdx = headers.findIndex(h => h.includes("computername") || h.includes("name"));
    if (nameIdx === -1) {
      setJobModal({ isOpen: true, success: false, message: "CSV must have a 'computerName' or 'name' column." });
      return;
    }
    const computerNames: string[] = [];
    const extraData: Record<string, Record<string, string>> = {};
    lines.slice(1).forEach(line => {
      const cols = line.split(",");
      const name = cols[nameIdx]?.trim().replace(/"/g, "");
      if (name) {
        computerNames.push(name);
        extraData[name] = {};
        headers.forEach((h, i) => { if (i !== nameIdx && cols[i]) extraData[name][h] = cols[i].trim().replace(/"/g, ""); });
      }
    });

    try {
      const token = localStorage.getItem("petrus_token");
      const found: any[] = [];
      for (const name of computerNames) {
        const res = await fetch(`http://localhost:3001/computers?q=${encodeURIComponent(name)}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const d = await res.json();
          const computer = d.find?.((u: any) => u.name?.toLowerCase() === name.toLowerCase() || u.computerName?.toLowerCase() === name.toLowerCase());
          if (computer) {
            const cfg = BULK_ACTION_CONFIG[bulkActionKey];
            if (cfg && extraData[name]) {
              const csvEntry = extraData[name];
              const merged: Record<string, string> = {};
              cfg.csvColumns.slice(1).forEach(col => {
                if (csvEntry[col]) merged[col.replace(/_([a-z])/g, (_, c) => c.toUpperCase())] = csvEntry[col];
              });
              found.push({ ...computer, computerName: name, _csvExtra: merged });
            } else {
              found.push({ ...computer, computerName: name });
            }
          } else {
            found.push({ computerName: name, name, _stub: true, _csvExtra: extraData[name] || {} });
          }
        }
      }
      if (found.length > 0) {
        setBulkActionComputers(prev => {
          const existing = new Set(prev.map(c => c.computerName));
          const newOnes = found.filter(f => !existing.has(f.computerName));
          return [...prev, ...newOnes];
        });
        if (found[0]?._csvExtra && Object.keys(found[0]._csvExtra).length > 0) {
          setBulkActionForm(prev => ({ ...prev, ...found[0]._csvExtra }));
        }
        setJobModal({ isOpen: true, success: true, message: `CSV imported: ${found.length} computer(s) added.` });
      } else {
        setJobModal({ isOpen: true, success: false, message: "No matching computers found in database." });
      }
    } catch {
      setJobModal({ isOpen: true, success: false, message: "Failed to look up CSV computers." });
    }
  };

  const downloadCsvTemplate = () => {
    const cfg = BULK_ACTION_CONFIG[bulkActionKey];
    if (!cfg) return;
    const header = cfg.csvColumns.join(",");
    const example = cfg.csvColumns.map(c => c === "computerName" ? "DESKTOP-A01" : `<${c}>`).join(",");
    const csv = `${header}\n${example}\n`;
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url;
    a.download = `${bulkActionKey.toLowerCase().replace(/\s+/g, "_")}_template.csv`;
    a.click(); URL.revokeObjectURL(url);
  };

  const exportResultsCsv = () => {
    if (bulkActionResults.length === 0) return;
    const header = "computerName,status,message";
    const rows = bulkActionResults.map(r =>
      `"${r.computerName}","${r.status}","${r.message.replace(/"/g, "'")}"`
    );
    const csv = [header, ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url;
    a.download = `${bulkActionKey.toLowerCase().replace(/\s+/g, "_")}_results_${Date.now()}.csv`;
    a.click(); URL.revokeObjectURL(url);
  };

  const handleBulkActionSubmit = async () => {
    const cfg = BULK_ACTION_CONFIG[bulkActionKey];
    if (!cfg || bulkActionComputers.length === 0) return;

    if (cfg.danger && bulkActionForm.confirmDelete !== "DELETE") {
      setJobModal({ isOpen: true, success: false, message: 'Type "DELETE" to confirm destructive deletion.' });
      return;
    }

    setIsBulkActioning(true);
    setBulkActionShowTerminal(true);
    setBulkActionStatus(null);
    setBulkActionResults([]);
    const logs: string[] = [];
    const results: {computerName: string; status: "success"|"error"; message: string}[] = [];

    logs.push(`[System] Starting bulk action: "${cfg.title}" for ${bulkActionComputers.length} computer(s).`);
    setBulkActionLogs([...logs]);
    const token = localStorage.getItem("petrus_token");

    for (const comp of bulkActionComputers) {
      logs.push(`\n── Processing: ${comp.computerName} ──────────────────`);
      setBulkActionLogs([...logs]);

      const form = bulkActionForm;
      const payload: any = {
        computerName: comp.computerName,
        action: cfg.apiAction,
        modifyInAd: true,
      };

      if (form.accountDisabled) {
        payload.accountDisabled = form.accountDisabled === "Disable Computer Account";
      }

      const directFields = [
        "description", "location", "managedBy", "dnsName", "operatingSystem", "operatingSystemVersion", "servicePrincipalName",
        "targetOu", "groupOperation", "extensionAttribute1", "extensionAttribute2", "extensionAttribute3", "extensionAttribute4", "extensionAttribute5"
      ];
      directFields.forEach(k => { if (form[k] !== undefined && form[k] !== "") payload[k] = form[k]; });

      if (form.adGroupDns_raw) payload.adGroupDns = form.adGroupDns_raw.split(",").map((s: string) => s.trim()).filter(Boolean);
      if (form.adGroupRemoveDns_raw) payload.adGroupRemoveDns = form.adGroupRemoveDns_raw.split(",").map((s: string) => s.trim()).filter(Boolean);

      if (comp._csvExtra) Object.assign(payload, comp._csvExtra);

      try {
        const res = await fetch("http://localhost:3001/computers/modify-bulk", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ computers: [payload] })
        });
        const data = await res.json();
        const success = res.ok && (data.success !== false);
        const msg = data.message || (success ? "Completed successfully." : "Failed.");
        if (success) {
          logs.push(`[✓] ${comp.computerName}: ${msg}`);
          if (data.logs) data.logs.filter((l: string) => l.trim()).forEach((l: string) => logs.push(`  ${l}`));
          results.push({ computerName: comp.computerName, status: "success", message: msg });
        } else {
          logs.push(`[✗] ${comp.computerName}: ${msg}`);
          results.push({ computerName: comp.computerName, status: "error", message: msg });
        }
      } catch (err: any) {
        logs.push(`[✗] ${comp.computerName}: Network error — ${err.message}`);
        results.push({ computerName: comp.computerName, status: "error", message: err.message });
      }
      setBulkActionLogs([...logs]);
    }

    const successCount = results.filter(r => r.status === "success").length;
    const failCount = results.filter(r => r.status === "error").length;
    logs.push(`\n[System] Bulk action complete. ✓ ${successCount} succeeded, ✗ ${failCount} failed.`);
    setBulkActionLogs([...logs]);
    setBulkActionResults(results);
    setBulkActionStatus(failCount === 0);
    setIsBulkActioning(false);
  };

  // ── Computer Templates functions ──────────────────────────────────
  const fetchTemplates = async () => {
    setTemplatesLoading(true);
    try {
      const token = localStorage.getItem("petrus_token");
      const res = await fetch("http://localhost:3001/computers/templates", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setTemplatesList(await res.json());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setTemplatesLoading(false);
    }
  };

  const handleSaveTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("petrus_token");
      const body = {
        ...templateFormFields,
        id: editingTemplate?.id || undefined,
        data: {
          location: templateFormFields.location,
          targetOu: templateFormFields.targetOu,
          operatingSystem: templateFormFields.operatingSystem,
          operatingSystemVersion: templateFormFields.operatingSystemVersion
        }
      };
      const res = await fetch("http://localhost:3001/computers/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(body)
      });
      if (res.ok) {
        setJobModal({ isOpen: true, success: true, message: "Template saved successfully." });
        setShowTemplateForm(false);
        setEditingTemplate(null);
        fetchTemplates();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteTemplate = async (id: string) => {
    if (!confirm("Are you sure you want to delete this template?")) return;
    try {
      const token = localStorage.getItem("petrus_token");
      const res = await fetch(`http://localhost:3001/computers/templates/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setJobModal({ isOpen: true, success: true, message: "Template deleted successfully." });
        fetchTemplates();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Click router on items
  const handleItemClick = (item: string) => {
    if (BULK_ACTION_CONFIG[item]) {
      openBulkAction(item);
      return;
    }
    if (item === "Create Single Computer") {
      setSingleFormData({
        computerName: "",
        description: "",
        location: "",
        targetOu: "",
        dnsName: "",
        operatingSystem: "Windows 11 Pro",
        operatingSystemVersion: "23H2",
        createInAd: true,
        adSettingsId: adSettingsList[0]?.id || ""
      });
      setSingleCreateLogs([]);
      setSingleCreateSuccess(null);
      setSingleShowTerminal(false);
      setIsSingleCreateOpen(true);
      return;
    }
    if (item === "Create Bulk Computers" || item === "Create Computers") {
      setBulkComputersList([{ id: "1", computerName: "", description: "", location: "", targetOu: "", operatingSystem: "Windows 11 Pro" }]);
      setBulkCreateLogs([]);
      setBulkCreateSuccess(null);
      setBulkShowTerminal(false);
      setIsBulkCreateOpen(true);
      return;
    }
    if (item === "Modify Single Computer") {
      setModifySearchQuery("");
      setModifySearchResults([]);
      setSelectedModifyComputer(null);
      setModifyLogs([]);
      setModifySuccessStatus(null);
      setModifyShowTerminal(false);
      setIsSingleModifyOpen(true);
      return;
    }
    if (item === "Modify Bulk Computers" || item === "Modify Computers") {
      openBulkAction("Modify general attributes");
      return;
    }
    if (item === "Computer Creation Templates" || item === "Computer Modification Templates") {
      fetchTemplates();
      setIsTemplatesWorkspaceOpen(true);
      return;
    }
    alert(`${item} functionality is configured.`);
  };

  const sections = [
    {
      title: "Computer Management",
      groups: [
        {
          name: "Computer Creation",
          color: "text-emerald-600 dark:text-emerald-400",
          items: ["Create Single Computer", "Create Bulk Computers"]
        },
        {
          name: "Computer Modification",
          color: "text-emerald-600 dark:text-emerald-400",
          items: ["Modify Single Computer", "Modify Bulk Computers"]
        },
        {
          name: "Computer Templates",
          color: "text-emerald-600 dark:text-emerald-400",
          items: ["Computer Creation Templates", "Computer Modification Templates"]
        },
        {
          name: "CSV Import",
          color: "text-emerald-600 dark:text-emerald-400",
          items: ["Create Computers", "Modify Computers"]
        }
      ]
    },
    {
      title: "Bulk Computer Modification",
      groups: [
        {
          name: "General Attributes",
          color: "text-emerald-600 dark:text-emerald-400",
          items: [
            "Modify group attributes of computers", 
            "Modify general attributes", 
            "Custom Attributes", 
            "Reset Computers",
            "Move Computers",
            "Enable/Disable Computers",
            "Delete Computers",
            "Restore Deleted Computers"
          ]
        }
      ]
    }
  ];

  return (
    <ManagementConsoleLayout
      sections={sections}
      searchPlaceholder="Search Computer Tasks..."
      primaryActionLabel="New Computer"
      onItemClick={handleItemClick}
      onPrimaryActionClick={() => handleItemClick("Create Single Computer")}
      tabs={[
        { name: "Computer Management", active: true },
        { name: "Bulk Computer Modification", active: false }
      ]}
    >
      {/* ── FEEDBACK NOTIFICATION MODAL ───────────────────────────────── */}
      {jobModal.isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-2xl shadow-xl max-w-md w-full p-6 text-center animate-in fade-in zoom-in-95 duration-150">
            {jobModal.success ? (
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-emerald-100 dark:bg-emerald-950/30 text-emerald-600 mb-4">
                <CheckCircle2 className="h-6 w-6" />
              </div>
            ) : (
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-rose-100 dark:bg-rose-950/30 text-rose-600 mb-4">
                <XCircle className="h-6 w-6" />
              </div>
            )}
            <h3 className="text-sm font-bold text-slate-800 dark:text-white mb-2">
              {jobModal.success ? "Action Completed" : "Operation Failed"}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-5">{jobModal.message}</p>
            <button
              onClick={() => setJobModal(prev => ({ ...prev, isOpen: false }))}
              className="w-full bg-indigo-650 hover:bg-indigo-700 text-white rounded-xl py-2 text-xs font-bold transition-all"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* ── CREATE SINGLE COMPUTER MODAL ──────────────────────────────── */}
      {isSingleCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[94vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-slate-200/50 dark:border-white/5 flex justify-between items-center shrink-0">
              <div className="flex items-center gap-2">
                <Server className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                <h2 className="text-base font-bold text-slate-900 dark:text-white">Create Single Computer Account</h2>
              </div>
              <button onClick={() => setIsSingleCreateOpen(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"><X className="h-5 w-5 text-slate-500" /></button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {singleShowTerminal && (
                <div className="bg-slate-950 rounded-2xl border border-white/5 overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-2 bg-slate-900 border-b border-white/5 text-[10px] text-slate-400">
                    <span className="flex items-center gap-1.5"><Terminal className="h-3 w-3 text-emerald-400" /> Creation Log</span>
                  </div>
                  <div className="p-4 font-mono text-[11px] space-y-0.5 max-h-40 overflow-y-auto">
                    {singleCreateLogs.map((log, idx) => (
                      <div key={idx} className={log.includes("[ERROR]") ? "text-red-400" : log.includes("[SIMULATION]") ? "text-amber-400" : "text-slate-300"}>{log}</div>
                    ))}
                    {isCreatingSingle && <div className="text-indigo-400 animate-pulse">● Connecting to Active Directory...</div>}
                    {singleCreateSuccess === true && <div className="text-emerald-400 font-bold mt-2">✓ Computer created successfully.</div>}
                    {singleCreateSuccess === false && <div className="text-red-400 font-bold mt-2">✗ Account creation failed.</div>}
                  </div>
                </div>
              )}

              <form onSubmit={handleSingleCreateSubmit} className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Computer Name *</label>
                  <input type="text" required value={singleFormData.computerName} onChange={e => setSingleFormData({...singleFormData, computerName: e.target.value})} className="w-full text-xs bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-white/5 rounded-xl px-3 py-2 text-slate-800 dark:text-white outline-none focus:border-indigo-500" placeholder="e.g. DESKTOP-HQ01" />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Location</label>
                  <input type="text" value={singleFormData.location} onChange={e => setSingleFormData({...singleFormData, location: e.target.value})} className="w-full text-xs bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-white/5 rounded-xl px-3 py-2 text-slate-800 dark:text-white outline-none focus:border-indigo-500" placeholder="e.g. HQ - Room 302" />
                </div>
                <div className="col-span-2 space-y-1">
                  <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Description</label>
                  <input type="text" value={singleFormData.description} onChange={e => setSingleFormData({...singleFormData, description: e.target.value})} className="w-full text-xs bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-white/5 rounded-xl px-3 py-2 text-slate-800 dark:text-white outline-none focus:border-indigo-500" placeholder="e.g. Standard office workstation computer account" />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Target OU DN</label>
                  <input type="text" value={singleFormData.targetOu} onChange={e => setSingleFormData({...singleFormData, targetOu: e.target.value})} className="w-full text-xs bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-white/5 rounded-xl px-3 py-2 text-slate-800 dark:text-white outline-none focus:border-indigo-500" placeholder="e.g. OU=Workstations,DC=corp,DC=com" />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">DNS Host Name</label>
                  <input type="text" value={singleFormData.dnsName} onChange={e => setSingleFormData({...singleFormData, dnsName: e.target.value})} className="w-full text-xs bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-white/5 rounded-xl px-3 py-2 text-slate-800 dark:text-white outline-none focus:border-indigo-500" placeholder="e.g. desktop-hq01.corp.com" />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Operating System</label>
                  <input type="text" value={singleFormData.operatingSystem} onChange={e => setSingleFormData({...singleFormData, operatingSystem: e.target.value})} className="w-full text-xs bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-white/5 rounded-xl px-3 py-2 text-slate-800 dark:text-white outline-none focus:border-indigo-500" />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">OS Version</label>
                  <input type="text" value={singleFormData.operatingSystemVersion} onChange={e => setSingleFormData({...singleFormData, operatingSystemVersion: e.target.value})} className="w-full text-xs bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-white/5 rounded-xl px-3 py-2 text-slate-800 dark:text-white outline-none focus:border-indigo-500" />
                </div>

                <div className="col-span-2 pt-3 border-t border-slate-200 dark:border-white/5 flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={singleFormData.createInAd} onChange={e => setSingleFormData({...singleFormData, createInAd: e.target.checked})} className="rounded w-4 h-4 text-indigo-600" />
                    <span className="text-xs text-slate-700 dark:text-slate-300">Create account object in Active Directory connection</span>
                  </label>
                </div>

                {singleFormData.createInAd && adSettingsList.length > 0 && (
                  <div className="col-span-2 space-y-1.5">
                    <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Active Directory Settings Connection Profile</label>
                    <select value={singleFormData.adSettingsId} onChange={e => setSingleFormData({...singleFormData, adSettingsId: e.target.value})} className="w-full text-xs bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-white/5 rounded-xl px-3 py-2 text-slate-800 dark:text-white outline-none focus:border-indigo-500">
                      {adSettingsList.map(ad => (
                        <option key={ad.id} value={ad.id}>{ad.domainName} ({ad.adServerIp})</option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="col-span-2 pt-4 border-t border-slate-200 dark:border-white/5 flex justify-end gap-3 shrink-0">
                  <button type="button" onClick={() => setIsSingleCreateOpen(false)} className="px-5 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-xl hover:bg-slate-200 font-semibold text-xs transition-colors">{singleCreateSuccess !== null ? "Close" : "Cancel"}</button>
                  {singleCreateSuccess === null && (
                    <button type="submit" disabled={isCreatingSingle} className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-semibold text-xs shadow-lg shadow-indigo-500/20 flex items-center gap-1.5">
                      {isCreatingSingle && <Loader2 className="h-3.5 w-3.5 animate-spin" />} Provision Computer
                    </button>
                  )}
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ── CREATE BULK COMPUTERS MODAL ───────────────────────────────── */}
      {isBulkCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl shadow-2xl w-full max-w-6xl max-h-[96vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-slate-200/50 dark:border-white/5 flex justify-between items-center shrink-0">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-emerald-500 animate-pulse" />
                <h2 className="text-base font-bold text-slate-900 dark:text-white">Bulk Computer Provisioning Wizard</h2>
              </div>
              <button onClick={() => setIsBulkCreateOpen(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"><X className="h-5 w-5 text-slate-500" /></button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 space-y-6">
              {bulkShowTerminal ? (
                <div className="bg-slate-950 rounded-2xl border border-white/5 p-6 font-mono text-xs text-slate-300 min-h-[350px] flex flex-col justify-between">
                  <div className="space-y-1.5 max-h-[300px] overflow-y-auto">
                    <div className="text-indigo-400 border-b border-white/5 pb-1 flex items-center justify-between text-[10px]">
                      <span>⚡ PETRUS BATCH COMPUTER PROVISIONING SYSTEM</span>
                    </div>
                    {bulkCreateLogs.map((log, idx) => (
                      <div key={idx} className={log.includes("[ERROR]") ? "text-red-400" : log.includes("[SIMULATION]") ? "text-amber-400" : "text-slate-300"}>{log}</div>
                    ))}
                    {isCreatingBulk && <div className="text-indigo-400 animate-pulse">● Running batch active directory sync...</div>}
                  </div>
                  <div className="pt-4 border-t border-white/5 flex gap-3">
                    <button type="button" onClick={() => setBulkShowTerminal(false)} disabled={isCreatingBulk} className="flex-1 py-2 bg-slate-800 text-slate-200 rounded-xl hover:bg-slate-700 font-bold transition-all text-xs disabled:opacity-50">Back</button>
                    <button type="button" onClick={() => setIsBulkCreateOpen(false)} disabled={isCreatingBulk} className="flex-1 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-500 font-bold transition-all text-xs disabled:opacity-50">Close</button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleBulkCreateSubmit} className="space-y-4">
                  <div className="bg-slate-50/50 dark:bg-slate-950/40 p-4 border border-slate-200/50 dark:border-white/5 rounded-2xl grid grid-cols-2 gap-4">
                    <label className="flex items-center gap-2 cursor-pointer bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2">
                      <input type="checkbox" checked={bulkGlobalConfig.createInAd} onChange={e => setBulkGlobalConfig({...bulkGlobalConfig, createInAd: e.target.checked})} className="rounded text-indigo-650" />
                      <span className="text-xs text-slate-700 dark:text-slate-300">Create In Active Directory</span>
                    </label>
                    {bulkGlobalConfig.createInAd && adSettingsList.length > 0 && (
                      <select value={bulkGlobalConfig.adSettingsId} onChange={e => setBulkGlobalConfig({...bulkGlobalConfig, adSettingsId: e.target.value})} className="text-xs bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-800 dark:text-white outline-none">
                        {adSettingsList.map(a => (
                          <option key={a.id} value={a.id}>{a.domainName}</option>
                        ))}
                      </select>
                    )}
                  </div>

                  <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-white/5 rounded-xl px-4 py-2 text-xs">
                    <span className="font-semibold text-slate-500">Computers Batch Grid</span>
                    <div className="flex gap-2">
                      <label className="px-2.5 py-1 bg-indigo-500/10 text-indigo-500 rounded font-bold cursor-pointer hover:bg-indigo-500/20 flex items-center gap-1.5">
                        <Upload className="h-3 w-3" /> Import CSV
                        <input type="file" accept=".csv" className="hidden" onChange={e => { if (e.target.files?.[0]) { handleBulkCreateCsvUpload(e.target.files[0]); e.target.value = ""; } }} />
                      </label>
                      <button type="button" onClick={downloadBulkCreateTemplate} className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded hover:bg-slate-200 flex items-center gap-1"><Download className="h-3 w-3" /> Template</button>
                    </div>
                  </div>

                  <div className="border border-slate-200 dark:border-white/5 rounded-xl overflow-hidden max-h-[300px] overflow-y-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-100 dark:bg-slate-950/60 border-b border-slate-200 dark:border-white/5 text-slate-500 font-bold uppercase py-2">
                          <th className="p-3 w-[200px]">Computer Name *</th>
                          <th className="p-3">Description</th>
                          <th className="p-3 w-[150px]">Location</th>
                          <th className="p-3 w-[200px]">Target OU DN</th>
                          <th className="p-3 w-[150px]">Operating System</th>
                          <th className="p-3 w-[50px] text-center"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {bulkComputersList.map(row => (
                          <tr key={row.id} className="border-b border-slate-100 dark:border-white/5">
                            <td className="p-2">
                              <input type="text" required value={row.computerName} onChange={e => handleBulkRowFieldChange(row.id, "computerName", e.target.value)} className="w-full bg-white dark:bg-slate-950 border border-slate-350 dark:border-slate-800 rounded px-2 py-1 outline-none" placeholder="DESKTOP-01" />
                            </td>
                            <td className="p-2">
                              <input type="text" value={row.description} onChange={e => handleBulkRowFieldChange(row.id, "description", e.target.value)} className="w-full bg-white dark:bg-slate-950 border border-slate-350 dark:border-slate-800 rounded px-2 py-1 outline-none" placeholder="Standard device" />
                            </td>
                            <td className="p-2">
                              <input type="text" value={row.location} onChange={e => handleBulkRowFieldChange(row.id, "location", e.target.value)} className="w-full bg-white dark:bg-slate-950 border border-slate-350 dark:border-slate-800 rounded px-2 py-1 outline-none" placeholder="Office location" />
                            </td>
                            <td className="p-2">
                              <input type="text" value={row.targetOu} onChange={e => handleBulkRowFieldChange(row.id, "targetOu", e.target.value)} className="w-full bg-white dark:bg-slate-950 border border-slate-350 dark:border-slate-800 rounded px-2 py-1 outline-none" placeholder="OU=Workstations,DC=corp,DC=com" />
                            </td>
                            <td className="p-2">
                              <input type="text" value={row.operatingSystem} onChange={e => handleBulkRowFieldChange(row.id, "operatingSystem", e.target.value)} className="w-full bg-white dark:bg-slate-950 border border-slate-350 dark:border-slate-800 rounded px-2 py-1 outline-none" />
                            </td>
                            <td className="p-2 text-center">
                              <button type="button" onClick={() => handleRemoveBulkRow(row.id)} disabled={bulkComputersList.length <= 1} className="text-slate-400 hover:text-red-400"><Trash2 className="h-4 w-4" /></button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="flex justify-between items-center shrink-0 pt-4 border-t border-slate-200 dark:border-white/5">
                    <button type="button" onClick={handleAddBulkRow} className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-850 hover:bg-slate-200 text-xs rounded-lg font-bold flex items-center gap-1"><Plus className="h-4 w-4" /> Add Device Row</button>
                    <div className="flex gap-2">
                      <button type="button" onClick={() => setIsBulkCreateOpen(false)} className="px-5 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold rounded-xl text-xs transition-colors">Cancel</button>
                      <button type="submit" className="px-5 py-2 bg-indigo-600 text-white font-semibold rounded-xl text-xs hover:bg-indigo-500 shadow-lg shadow-indigo-500/20">Provision Batch of {bulkComputersList.length} Computers</button>
                    </div>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── MODIFY SINGLE COMPUTER MODAL ──────────────────────────────── */}
      {isSingleModifyOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[94vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-slate-200/50 dark:border-white/5 flex justify-between items-center shrink-0">
              <div className="flex items-center gap-2">
                <Server className="h-5 w-5 text-amber-500" />
                <h2 className="text-base font-bold text-slate-900 dark:text-white">Modify Single Computer</h2>
              </div>
              <button onClick={() => setIsSingleModifyOpen(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"><X className="h-5 w-5 text-slate-500" /></button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {modifyShowTerminal && (
                <div className="bg-slate-950 rounded-2xl border border-white/5 overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-2 bg-slate-900 border-b border-white/5 text-[10px] text-slate-400">
                    <span className="flex items-center gap-1.5"><Terminal className="h-3 w-3 text-emerald-400" /> Modification Log</span>
                  </div>
                  <div className="p-4 font-mono text-[11px] space-y-0.5 max-h-40 overflow-y-auto">
                    {modifyLogs.map((log, idx) => (
                      <div key={idx} className={log.includes("[ERROR]") ? "text-red-400" : log.includes("[SIMULATION]") ? "text-amber-400" : "text-slate-300"}>{log}</div>
                    ))}
                    {isModifyingSingle && <div className="text-indigo-400 animate-pulse">● Applying computer account updates...</div>}
                    {modifySuccessStatus === true && <div className="text-emerald-400 font-bold mt-2">✓ Updates applied successfully.</div>}
                    {modifySuccessStatus === false && <div className="text-red-400 font-bold mt-2">✗ Account update failed.</div>}
                  </div>
                </div>
              )}

              {/* Computer Search */}
              <div className="space-y-2">
                <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest block">1. Search & Select Device</label>
                <div className="flex gap-2">
                  <input type="text" placeholder="Search by computer name or dnsName…" value={modifySearchQuery} onChange={e => setModifySearchQuery(e.target.value)} onKeyDown={e => { if (e.key === "Enter") searchComputersBackend(modifySearchQuery, setModifySearchResults, setModifySearchLoading); }} className="flex-1 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-white/5 rounded-xl px-4 py-2 text-slate-850 dark:text-white outline-none focus:border-indigo-500" />
                  <button type="button" onClick={() => searchComputersBackend(modifySearchQuery, setModifySearchResults, setModifySearchLoading)} className="px-4 py-2 bg-indigo-650 text-white font-bold text-xs rounded-xl hover:bg-indigo-700 flex items-center gap-1.5">
                    {modifySearchLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null} Search
                  </button>
                </div>
                {modifySearchResults.length > 0 && (
                  <div className="border border-slate-200 dark:border-white/5 rounded-xl overflow-hidden divide-y divide-slate-100 dark:divide-white/5 max-h-40 overflow-y-auto">
                    {modifySearchResults.map(c => (
                      <button key={c.id || c.name} type="button" onClick={() => handleSelectComputerForModify(c)} className={`w-full flex justify-between items-center px-4 py-2 text-left hover:bg-indigo-50/50 dark:hover:bg-indigo-950/20 text-xs font-semibold ${selectedModifyComputer?.name === c.name ? "bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600" : "text-slate-700 dark:text-slate-300"}`}>
                        <div>
                          <div>{c.name || c.computerName}</div>
                          <div className="text-[10px] text-slate-400 font-normal">{c.os || c.dnsName || "Domain Joined Device"}</div>
                        </div>
                        {selectedModifyComputer?.name === c.name && <Check className="h-4 w-4 text-indigo-500" />}
                      </button>
                    ))}
                  </div>
                )}
                {selectedModifyComputer && (
                  <div className="flex items-center gap-2 p-3 bg-emerald-55/20 border border-emerald-500/20 text-emerald-600 rounded-xl text-xs">
                    <CheckCircle2 className="h-4 w-4 shrink-0" /> Selected: <span className="font-bold">{selectedModifyComputer.name || selectedModifyComputer.computerName}</span>
                  </div>
                )}
              </div>

              {selectedModifyComputer && (
                <form onSubmit={handleModifySingleSubmit} className="space-y-4">
                  {/* Tabs */}
                  <div className="flex gap-1 border-b border-slate-200 dark:border-white/5">
                    {["General", "Groups", "Custom Attributes", "Account Properties"].map(tab => (
                      <button key={tab} type="button" onClick={() => setModifyActiveTab(tab)} className={`px-4 py-2 text-[11px] font-bold rounded-t-xl transition-colors ${modifyActiveTab === tab ? "bg-indigo-600 text-white" : "text-slate-500 hover:text-slate-700"}`}>{tab}</button>
                    ))}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {modifyActiveTab === "General" && (
                      <>
                        <div className="space-y-1">
                          <label className="text-[11px] font-semibold text-slate-500">Location</label>
                          <input type="text" value={modifyFormData.location} onChange={e => setModifyFormData({...modifyFormData, location: e.target.value})} className="w-full text-xs bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-white/5 rounded-xl px-3 py-2 text-slate-800 dark:text-white outline-none" />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[11px] font-semibold text-slate-500">Managed By DN</label>
                          <input type="text" value={modifyFormData.managedBy} onChange={e => setModifyFormData({...modifyFormData, managedBy: e.target.value})} className="w-full text-xs bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-white/5 rounded-xl px-3 py-2 text-slate-800 dark:text-white outline-none" />
                        </div>
                        <div className="col-span-2 space-y-1">
                          <label className="text-[11px] font-semibold text-slate-500">Description</label>
                          <input type="text" value={modifyFormData.description} onChange={e => setModifyFormData({...modifyFormData, description: e.target.value})} className="w-full text-xs bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-white/5 rounded-xl px-3 py-2 text-slate-800 dark:text-white outline-none" />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[11px] font-semibold text-slate-500">DNS Host Name</label>
                          <input type="text" value={modifyFormData.dnsName} onChange={e => setModifyFormData({...modifyFormData, dnsName: e.target.value})} className="w-full text-xs bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-white/5 rounded-xl px-3 py-2 text-slate-800 dark:text-white outline-none" />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[11px] font-semibold text-slate-500">Target OU DN</label>
                          <input type="text" value={modifyFormData.targetOu} onChange={e => setModifyFormData({...modifyFormData, targetOu: e.target.value})} className="w-full text-xs bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-white/5 rounded-xl px-3 py-2 text-slate-800 dark:text-white outline-none" />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[11px] font-semibold text-slate-500">Operating System</label>
                          <input type="text" value={modifyFormData.operatingSystem} onChange={e => setModifyFormData({...modifyFormData, operatingSystem: e.target.value})} className="w-full text-xs bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-white/5 rounded-xl px-3 py-2 text-slate-800 dark:text-white outline-none" />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[11px] font-semibold text-slate-500">OS Version</label>
                          <input type="text" value={modifyFormData.operatingSystemVersion} onChange={e => setModifyFormData({...modifyFormData, operatingSystemVersion: e.target.value})} className="w-full text-xs bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-white/5 rounded-xl px-3 py-2 text-slate-800 dark:text-white outline-none" />
                        </div>
                      </>
                    )}

                    {modifyActiveTab === "Groups" && (
                      <>
                        <div className="col-span-2 space-y-1">
                          <label className="text-[11px] font-semibold text-slate-500">Group Modification Operation</label>
                          <select value={modifyFormData.groupOperation} onChange={e => setModifyFormData({...modifyFormData, groupOperation: e.target.value})} className="w-full text-xs bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-white/5 rounded-xl px-3 py-2 text-slate-800 dark:text-white outline-none">
                            <option value="add">Add to groups</option>
                            <option value="remove">Remove from groups</option>
                            <option value="replace">Replace groups</option>
                          </select>
                        </div>
                        <div className="col-span-2 space-y-1">
                          <label className="text-[11px] font-semibold text-slate-500">Groups to ADD (Comma-separated DNs)</label>
                          <textarea rows={2} value={modifyFormData.adGroupDns_raw} onChange={e => setModifyFormData({...modifyFormData, adGroupDns_raw: e.target.value})} className="w-full text-xs bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-white/5 rounded-xl px-3 py-2 text-slate-800 dark:text-white outline-none resize-none" placeholder="CN=Marketing-PCs,OU=Groups,DC=corp,DC=com" />
                        </div>
                        <div className="col-span-2 space-y-1">
                          <label className="text-[11px] font-semibold text-slate-500">Groups to REMOVE (Comma-separated DNs)</label>
                          <textarea rows={2} value={modifyFormData.adGroupRemoveDns_raw} onChange={e => setModifyFormData({...modifyFormData, adGroupRemoveDns_raw: e.target.value})} className="w-full text-xs bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-white/5 rounded-xl px-3 py-2 text-slate-800 dark:text-white outline-none resize-none" placeholder="CN=Temporary-PCs,OU=Groups,DC=corp,DC=com" />
                        </div>
                      </>
                    )}

                    {modifyActiveTab === "Custom Attributes" && (
                      <>
                        {[1, 2, 3, 4, 5].map(n => (
                          <div key={n} className="space-y-1">
                            <label className="text-[11px] font-semibold text-slate-500">Extension Attribute {n}</label>
                            <input type="text" value={(modifyFormData as any)[`extensionAttribute${n}`]} onChange={e => setModifyFormData({...modifyFormData, [`extensionAttribute${n}`]: e.target.value})} className="w-full text-xs bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-white/5 rounded-xl px-3 py-2 text-slate-800 dark:text-white outline-none" />
                          </div>
                        ))}
                      </>
                    )}

                    {modifyActiveTab === "Account Properties" && (
                      <>
                        <div className="col-span-2 py-3 bg-slate-50 dark:bg-slate-950/40 rounded-xl px-4 border border-slate-200 dark:border-white/5 space-y-3">
                          <label className="flex items-center gap-3 cursor-pointer">
                            <input type="checkbox" checked={modifyFormData.accountDisabled} onChange={e => setModifyFormData({...modifyFormData, accountDisabled: e.target.checked})} className="rounded text-indigo-600 w-4 h-4" />
                            <div>
                              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">Account is Disabled</span>
                              <span className="text-[10px] text-slate-400 block mt-0.5">Disables or enables the computer's trust account in the Active Directory domain (adds/removes UAC flag 4098).</span>
                            </div>
                          </label>
                        </div>
                      </>
                    )}
                  </div>

                  <div className="pt-4 border-t border-slate-200 dark:border-white/5 flex justify-end gap-3 shrink-0">
                    <button type="button" onClick={() => setIsSingleModifyOpen(false)} className="px-5 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-xl hover:bg-slate-200 font-semibold text-xs transition-colors">{modifySuccessStatus !== null ? "Close" : "Cancel"}</button>
                    {modifySuccessStatus === null && (
                      <button type="submit" disabled={isModifyingSingle} className="px-5 py-2 bg-indigo-650 text-white rounded-xl font-bold text-xs hover:bg-indigo-500 shadow-lg shadow-indigo-500/20 flex items-center gap-1">
                        {isModifyingSingle && <Loader2 className="h-3.5 w-3.5 animate-spin" />} Save Changes
                      </button>
                    )}
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── GENERIC BULK ACTION MODAL ─────────────────────────────────── */}
      {bulkActionOpen && (() => {
        const cfg = BULK_ACTION_CONFIG[bulkActionKey];
        if (!cfg) return null;
        const colorMap: Record<string, { bg: string; text: string; btn: string; badge: string }> = {
          rose: { bg: "bg-rose-500/10", text: "text-rose-500", btn: "bg-rose-600 hover:bg-rose-500", badge: "bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-300" },
          emerald: { bg: "bg-emerald-500/10", text: "text-emerald-500", btn: "bg-emerald-600 hover:bg-emerald-500", badge: "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-300" },
          indigo: { bg: "bg-indigo-500/10", text: "text-indigo-500", btn: "bg-indigo-600 hover:bg-indigo-500", badge: "bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-300" },
          violet: { bg: "bg-violet-500/10", text: "text-violet-500", btn: "bg-violet-600 hover:bg-violet-500", badge: "bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-300" },
          pink: { bg: "bg-pink-500/10", text: "text-pink-500", btn: "bg-pink-600 hover:bg-pink-500", badge: "bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-300" },
          sky: { bg: "bg-sky-500/10", text: "text-sky-500", btn: "bg-sky-600 hover:bg-sky-500", badge: "bg-sky-100 dark:bg-sky-900/30 text-sky-600 dark:text-sky-300" },
          amber: { bg: "bg-amber-500/10", text: "text-amber-500", btn: "bg-amber-500 hover:bg-amber-400", badge: "bg-amber-100 dark:bg-amber-900/30 text-amber-655" },
          teal: { bg: "bg-teal-500/10", text: "text-teal-500", btn: "bg-teal-600 hover:bg-teal-500", badge: "bg-teal-100 dark:bg-teal-900/30 text-teal-600 dark:text-teal-300" },
          red: { bg: "bg-red-500/10", text: "text-red-500", btn: "bg-red-600 hover:bg-red-500", badge: "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-300" }
        };
        const cl = colorMap[cfg.color] || colorMap.indigo;
        const inputCls = "w-full text-xs bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-white/5 rounded-xl px-3 py-2 text-slate-800 dark:text-white outline-none focus:border-indigo-500";

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl shadow-2xl w-full max-w-5xl max-h-[96vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
              <div className="p-5 border-b border-slate-200/50 dark:border-white/5 flex justify-between items-center shrink-0">
                <div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2.5">
                    <span className={`p-1.5 rounded-lg ${cl.bg}`}><Server className={`h-4 w-4 ${cl.text}`} /></span>
                    {cfg.title}
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">{cfg.description}</p>
                </div>
                <button onClick={() => setBulkActionOpen(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"><X className="h-5 w-5 text-slate-500" /></button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {bulkActionShowTerminal && (
                  <div className="bg-slate-950 rounded-2xl border border-white/5 overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-2 bg-slate-900 border-b border-white/5">
                      <div className="flex items-center gap-2 text-xs text-slate-400"><Terminal className="h-3.5 w-3.5 text-emerald-400" /> Active Directory Execution Engine Logs</div>
                      <div className="flex items-center gap-2">
                        {bulkActionResults.length > 0 && (
                          <button type="button" onClick={exportResultsCsv} className="text-[10px] px-2.5 py-1 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 rounded font-bold flex items-center gap-1 transition-all"><Download className="h-3 w-3" /> Export CSV Results</button>
                        )}
                      </div>
                    </div>
                    <div className="p-4 font-mono text-[11px] space-y-0.5 max-h-52 overflow-y-auto">
                      {bulkActionLogs.map((log, i) => (
                        <div key={i} className={log.includes("[✗]") || log.includes("[ERROR]") ? "text-red-400" : log.includes("[✓]") ? "text-emerald-400" : log.includes("[SIMULATION]") ? "text-amber-400" : "text-slate-350"}>{log}</div>
                      ))}
                      {isBulkActioning && <div className={`${cl.text} animate-pulse mt-1`}>● Operations processing in AD Sandbox fallback...</div>}
                      {bulkActionStatus === true && <div className="text-emerald-400 font-bold mt-2">✓ All computer accounts updated successfully.</div>}
                      {bulkActionStatus === false && <div className="text-amber-400 font-bold mt-2">⚠ Completed with failures. Please review log above.</div>}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Left panel: Computer selector */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Select Computers</h3>
                      <div className="flex gap-2">
                        <label className={`text-[10px] px-2.5 py-1 rounded-lg font-bold cursor-pointer transition-colors ${cl.badge} flex items-center gap-1`}>
                          <Upload className="h-3 w-3" /> Import CSV
                          <input type="file" accept=".csv" className="hidden" onChange={e => { if (e.target.files?.[0]) { handleCsvImport(e.target.files[0]); e.target.value = ""; } }} />
                        </label>
                        <button type="button" onClick={downloadCsvTemplate} className="text-[10px] px-2.5 py-1 rounded-lg font-bold transition-colors bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200 flex items-center gap-1"><Download className="h-3 w-3" /> Template</button>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <input type="text" placeholder="Search device names…" value={bulkActionSearch} onChange={e => setBulkActionSearch(e.target.value)} onKeyDown={e => { if (e.key === "Enter") searchComputersBackend(bulkActionSearch, setBulkActionSearchResults, setBulkActionSearchLoading); }} className={inputCls} />
                      <button type="button" onClick={() => searchComputersBackend(bulkActionSearch, setBulkActionSearchResults, setBulkActionSearchLoading)} className={`px-3 py-2 ${cl.btn} text-white rounded-xl text-xs font-bold`}>
                        {bulkActionSearchLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Search"}
                      </button>
                    </div>

                    {bulkActionSearchResults.length > 0 && (
                      <div className="border border-slate-200 dark:border-white/5 rounded-xl overflow-hidden divide-y divide-slate-150 max-h-48 overflow-y-auto">
                        {bulkActionSearchResults.map(c => {
                          const sel = bulkActionComputers.some(s => s.computerName === (c.name || c.computerName));
                          const compName = c.name || c.computerName;
                          return (
                            <button key={compName} type="button" onClick={() => setBulkActionComputers(prev => sel ? prev.filter(s => s.computerName !== compName) : [...prev, { ...c, computerName: compName }])} className={`w-full flex items-center justify-between px-3 py-2 text-left hover:bg-slate-50 dark:hover:bg-slate-800/60 text-xs font-medium ${sel ? "bg-slate-50 dark:bg-slate-800/60 text-indigo-500" : "text-slate-800 dark:text-slate-200"}`}>
                              <div>
                                <div>{compName}</div>
                                <div className="text-[10px] text-slate-400 font-normal">{c.os || "Domain Joined Machine"}</div>
                              </div>
                              <input type="checkbox" readOnly checked={sel} className="rounded w-4 h-4 pointer-events-none" />
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {bulkActionComputers.length > 0 && (
                      <div className="space-y-2">
                        <span className="text-[11px] text-slate-500 font-bold">{bulkActionComputers.length} computer(s) in selection:</span>
                        <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto">
                          {bulkActionComputers.map(comp => (
                            <span key={comp.computerName} className={`flex items-center gap-1.5 px-2.5 py-1 ${cl.badge} text-[11px] font-bold rounded-full`}>
                              {comp.computerName}
                              <button type="button" onClick={() => setBulkActionComputers(prev => prev.filter(s => s.computerName !== comp.computerName))} className="hover:opacity-60"><X className="h-3 w-3" /></button>
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {bulkActionComputers.length === 0 && (
                      <div className="flex flex-col items-center justify-center py-10 border-2 border-dashed border-slate-200 dark:border-white/5 rounded-xl text-slate-400 text-xs space-y-1">
                        <Upload className="h-6 w-6 opacity-30 mb-1" />
                        <span>Search above or load a CSV list to proceed</span>
                      </div>
                    )}
                  </div>

                  {/* Right panel: Action forms */}
                  <div className="space-y-3">
                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Configuration</h3>

                    {cfg.fields.length === 0 && (
                      <div className={`p-4 rounded-xl border ${cl.bg} border-indigo-200/50 text-xs`}>No configurations required. Select computers and apply.</div>
                    )}

                    <div className="grid grid-cols-1 gap-3">
                      {cfg.fields.map(field => (
                        <div key={field.key} className="space-y-1">
                          <label className="text-[11px] font-bold text-slate-500">{field.label}</label>
                          {(!field.type || field.type === "text") && (
                            <input type="text" value={bulkActionForm[field.key] || ""} placeholder={field.placeholder} onChange={e => setBulkActionForm({...bulkActionForm, [field.key]: e.target.value})} className={inputCls} />
                          )}
                          {field.type === "textarea" && (
                            <textarea rows={3} value={bulkActionForm[field.key] || ""} placeholder={field.placeholder} onChange={e => setBulkActionForm({...bulkActionForm, [field.key]: e.target.value})} className={inputCls + " resize-none"} />
                          )}
                          {field.type === "select" && (
                            <select value={bulkActionForm[field.key] || ""} onChange={e => setBulkActionForm({...bulkActionForm, [field.key]: e.target.value})} className={inputCls}>
                              <option value="">— Select Option —</option>
                              {field.options?.map(o => <option key={o} value={o}>{o}</option>)}
                            </select>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-5 border-t border-slate-200/50 dark:border-white/5 flex items-center justify-between shrink-0">
                <span className="text-xs text-slate-400">{bulkActionComputers.length} computer(s) active.</span>
                <div className="flex gap-2">
                  <button type="button" onClick={() => setBulkActionOpen(false)} className="px-5 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold rounded-xl text-xs">{bulkActionStatus !== null ? "Close" : "Cancel"}</button>
                  {bulkActionStatus === null && (
                    <button type="button" disabled={isBulkActioning || bulkActionComputers.length === 0} onClick={handleBulkActionSubmit} className={`px-5 py-2 ${cl.btn} text-white font-semibold rounded-xl text-xs flex items-center gap-1.5`}>
                      {isBulkActioning && <Loader2 className="h-3.5 w-3.5 animate-spin" />} Apply to Batch
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ── COMPUTER TEMPLATES WORKSPACE MODAL ───────────────────────── */}
      {isTemplatesWorkspaceOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[94vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-slate-200/50 dark:border-white/5 flex justify-between items-center shrink-0">
              <div className="flex items-center gap-2">
                <FolderTree className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                <h2 className="text-base font-bold text-slate-900 dark:text-white">Computer Templates Management</h2>
              </div>
              <button onClick={() => setIsTemplatesWorkspaceOpen(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"><X className="h-5 w-5 text-slate-500" /></button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {showTemplateForm ? (
                <form onSubmit={handleSaveTemplate} className="space-y-4 bg-slate-50 dark:bg-slate-950/20 p-5 rounded-2xl border border-slate-250/50">
                  <h3 className="text-xs font-bold uppercase text-slate-500 tracking-wider">{editingTemplate ? "Edit Template Profile" : "Create New Template Profile"}</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-slate-500">Template Profile Name *</label>
                      <input type="text" required value={templateFormFields.name} onChange={e => setTemplateFormFields({...templateFormFields, name: e.target.value})} className="w-full text-xs bg-white dark:bg-slate-950 border border-slate-300 dark:border-white/5 rounded-xl px-3 py-2 text-slate-850 outline-none focus:border-indigo-500" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-slate-500">Device Category</label>
                      <select value={templateFormFields.category} onChange={e => setTemplateFormFields({...templateFormFields, category: e.target.value})} className="w-full text-xs bg-white dark:bg-slate-950 border border-slate-300 dark:border-white/5 rounded-xl px-3 py-2 text-slate-850 outline-none focus:border-indigo-500">
                        <option value="Workstation">Workstation</option>
                        <option value="Server">Server</option>
                        <option value="Laptop">Laptop</option>
                      </select>
                    </div>
                    <div className="col-span-2 space-y-1">
                      <label className="text-[11px] font-semibold text-slate-500">Description</label>
                      <input type="text" value={templateFormFields.description} onChange={e => setTemplateFormFields({...templateFormFields, description: e.target.value})} className="w-full text-xs bg-white dark:bg-slate-950 border border-slate-300 dark:border-white/5 rounded-xl px-3 py-2 text-slate-850 outline-none focus:border-indigo-500" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-slate-500">Default Location</label>
                      <input type="text" value={templateFormFields.location} onChange={e => setTemplateFormFields({...templateFormFields, location: e.target.value})} className="w-full text-xs bg-white dark:bg-slate-950 border border-slate-300 dark:border-white/5 rounded-xl px-3 py-2 text-slate-850 outline-none focus:border-indigo-500" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-slate-500">Target placement OU DN</label>
                      <input type="text" value={templateFormFields.targetOu} onChange={e => setTemplateFormFields({...templateFormFields, targetOu: e.target.value})} className="w-full text-xs bg-white dark:bg-slate-950 border border-slate-300 dark:border-white/5 rounded-xl px-3 py-2 text-slate-850 outline-none focus:border-indigo-500" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-slate-500">Default Operating System</label>
                      <input type="text" value={templateFormFields.operatingSystem} onChange={e => setTemplateFormFields({...templateFormFields, operatingSystem: e.target.value})} className="w-full text-xs bg-white dark:bg-slate-950 border border-slate-300 dark:border-white/5 rounded-xl px-3 py-2 text-slate-850 outline-none focus:border-indigo-500" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-slate-500">OS Version</label>
                      <input type="text" value={templateFormFields.operatingSystemVersion} onChange={e => setTemplateFormFields({...templateFormFields, operatingSystemVersion: e.target.value})} className="w-full text-xs bg-white dark:bg-slate-950 border border-slate-300 dark:border-white/5 rounded-xl px-3 py-2 text-slate-850 outline-none focus:border-indigo-500" />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 pt-3">
                    <button type="button" onClick={() => setShowTemplateForm(false)} className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold">Cancel</button>
                    <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-semibold hover:bg-indigo-500">Save Template</button>
                  </div>
                </form>
              ) : (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-slate-400 font-medium">Create template profiles to standardize device configurations across your AD domains.</span>
                    <button type="button" onClick={() => {
                      setEditingTemplate(null);
                      setTemplateFormFields({ name: "", description: "", category: "Workstation", location: "", targetOu: "", operatingSystem: "Windows 11 Pro", operatingSystemVersion: "23H2" });
                      setShowTemplateForm(true);
                    }} className="px-3 py-1.5 bg-indigo-650 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow"><Plus className="h-4 w-4" /> Add Template</button>
                  </div>

                  {templatesLoading ? (
                    <div className="flex justify-center items-center py-10"><Loader2 className="h-6 w-6 animate-spin text-slate-400" /></div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {templatesList.map(tpl => (
                        <div key={tpl.id} className="border border-slate-250/50 dark:border-white/5 bg-slate-50/20 dark:bg-slate-900/10 rounded-2xl p-4 flex flex-col justify-between hover:shadow-lg transition-all">
                          <div>
                            <div className="flex justify-between items-start">
                              <h4 className="text-xs font-bold text-slate-800 dark:text-white">{tpl.name}</h4>
                              <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400">{tpl.category}</span>
                            </div>
                            <p className="text-[11px] text-slate-500 mt-1">{tpl.description || "No description provided."}</p>
                            <div className="mt-3 grid grid-cols-2 gap-2 text-[10px] text-slate-400 border-t border-slate-100 dark:border-white/5 pt-2">
                              <div>Location: <span className="font-semibold text-slate-655">{tpl.data?.location || "—"}</span></div>
                              <div>OS: <span className="font-semibold text-slate-655">{tpl.data?.operatingSystem || "—"}</span></div>
                            </div>
                          </div>
                          <div className="flex gap-2 justify-end mt-4 pt-2 border-t border-slate-100 dark:border-white/5">
                            <button type="button" onClick={() => {
                              setEditingTemplate(tpl);
                              setTemplateFormFields({
                                name: tpl.name,
                                description: tpl.description || "",
                                category: tpl.category || "Workstation",
                                location: tpl.data?.location || "",
                                targetOu: tpl.data?.targetOu || "",
                                operatingSystem: tpl.data?.operatingSystem || "Windows 11 Pro",
                                operatingSystemVersion: tpl.data?.operatingSystemVersion || "23H2"
                              });
                              setShowTemplateForm(true);
                            }} className="text-[10px] px-2 py-1 bg-slate-100 hover:bg-slate-200 rounded font-semibold text-slate-700">Edit</button>
                            <button type="button" onClick={() => handleDeleteTemplate(tpl.id)} className="text-[10px] px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded font-semibold">Delete</button>
                          </div>
                        </div>
                      ))}
                      {templatesList.length === 0 && (
                        <div className="col-span-2 py-10 text-center border-2 border-dashed border-slate-250/50 rounded-2xl text-xs text-slate-400">No template profiles configured. Click add to get started.</div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
            
            <div className="p-5 border-t border-slate-200/50 dark:border-white/5 flex justify-end shrink-0">
              <button type="button" onClick={() => setIsTemplatesWorkspaceOpen(false)} className="px-5 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold rounded-xl text-xs">Close Workspace</button>
            </div>
          </div>
        </div>
      )}
    </ManagementConsoleLayout>
  );
}
