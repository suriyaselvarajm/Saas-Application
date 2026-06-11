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

// Bulk action configurations matching backend groups service actions
const BULK_ACTION_CONFIG: Record<string, BulkActionCfg> = {
  "Organization Attributes": {
    title: "Organization Attributes Modification", apiAction: "organization-attributes", color: "indigo",
    description: "Update the group's general description, notes, or info attributes in bulk.",
    fields: [
      { key: "description", label: "Description", placeholder: "e.g. Finance Division security group" },
      { key: "notes", label: "Notes (info attribute)", type: "textarea", placeholder: "General operational notes...", span: true }
    ],
    csvColumns: ["groupName", "description", "notes"],
  },
  "Exchange Attributes": {
    title: "Modify Exchange/Mail Attributes", apiAction: "exchange-attributes", color: "pink",
    description: "Configure group email address, mail status, or visibility in global address lists.",
    fields: [
      { key: "mailEnabled", label: "Mail Settings", type: "checkbox", placeholder: "Mail-enable Group Account" },
      { key: "mail", label: "Group Email Address", placeholder: "e.g. finance-dept@corp.com" },
      { key: "hideFromAddressLists", label: "Visibility", type: "checkbox", placeholder: "Hide group from Global Address List (GAL)" }
    ],
    csvColumns: ["groupName", "mail_enabled", "mail", "hide_from_address_lists"],
  },
  "Move Groups": {
    title: "Move Groups to OU", apiAction: "move-group", color: "amber",
    description: "Relocate selected groups to a different Organizational Unit in the domain.",
    fields: [{ key: "targetOu", label: "Target OU (Distinguished Name)", placeholder: "OU=Groups,DC=corp,DC=com", required: true, span: true }],
    csvColumns: ["groupName", "target_ou"],
  },
  "Delete Groups": {
    title: "Delete Group Objects", apiAction: "delete-group", color: "red", danger: true,
    description: "Permanently delete group accounts from Active Directory.",
    fields: [{ key: "confirmDelete", label: "Type 'DELETE' to confirm", placeholder: "DELETE", required: true }],
    csvColumns: ["groupName"],
  },
  "Restore Deleted Groups": {
    title: "Restore Deleted Groups", apiAction: "restore-group", color: "teal",
    description: "Restore deleted group objects from the Active Directory Recycle Bin.",
    fields: [], csvColumns: ["groupName"],
  }
};

const parseList = (item: any): any[] => {
  if (Array.isArray(item)) return item;
  return item ? [item] : [];
};

export default function GroupManagementPage() {
  const router = useRouter();

  // Active integrations list
  const [adSettingsList, setAdSettingsList] = useState<any[]>([]);

  // Feedback notification modal state
  const [jobModal, setJobModal] = useState<{ isOpen: boolean; success: boolean; message: string }>({ isOpen: false, success: false, message: "" });

  // ── Create Single Group Modal State ────────────────────────────────
  const [isSingleCreateOpen, setIsSingleCreateOpen] = useState(false);
  const [singleShowTerminal, setSingleShowTerminal] = useState(false);
  const [isCreatingSingle, setIsCreatingSingle] = useState(false);
  const [singleCreateLogs, setSingleCreateLogs] = useState<string[]>([]);
  const [singleCreateSuccess, setSingleCreateSuccess] = useState<boolean | null>(null);
  const [singleFormData, setSingleFormData] = useState({
    groupName: "",
    description: "",
    groupType: "Security",
    groupScope: "Global",
    notes: "",
    targetOu: "",
    createInAd: true,
    adSettingsId: "",
    mailEnabled: false,
    mail: "",
    isDynamic: false,
    dynamicQuery: ""
  });

  // ── Create Bulk Groups Modal State ──────────────────────────────────
  const [isBulkCreateOpen, setIsBulkCreateOpen] = useState(false);
  const [bulkShowTerminal, setBulkShowTerminal] = useState(false);
  const [isCreatingBulk, setIsCreatingBulk] = useState(false);
  const [bulkCreateLogs, setBulkCreateLogs] = useState<string[]>([]);
  const [bulkCreateSuccess, setBulkCreateSuccess] = useState<boolean | null>(null);
  const [bulkGroupsList, setBulkGroupsList] = useState<any[]>([
    { id: "1", groupName: "", description: "", targetOu: "", groupType: "Security", groupScope: "Global" }
  ]);
  const [bulkGlobalConfig, setBulkGlobalConfig] = useState({
    createInAd: true,
    adSettingsId: ""
  });

  // ── Modify Single Group Modal State ─────────────────────────────────
  const [isSingleModifyOpen, setIsSingleModifyOpen] = useState(false);
  const [modifySearchQuery, setModifySearchQuery] = useState("");
  const [modifySearchResults, setModifySearchResults] = useState<any[]>([]);
  const [modifySearchLoading, setModifySearchLoading] = useState(false);
  const [selectedModifyGroup, setSelectedModifyGroup] = useState<any | null>(null);
  const [modifyActiveTab, setModifyActiveTab] = useState("General");
  const [isModifyingSingle, setIsModifyingSingle] = useState(false);
  const [modifyShowTerminal, setModifyShowTerminal] = useState(false);
  const [modifyLogs, setModifyLogs] = useState<string[]>([]);
  const [modifySuccessStatus, setModifySuccessStatus] = useState<boolean | null>(null);
  const [modifyFormData, setModifyFormData] = useState({
    description: "",
    notes: "",
    targetOu: "",
    mail: "",
    mailEnabled: false,
    groupType: "Security",
    groupScope: "Global",
    hideFromAddressLists: false,
    isDynamic: false,
    dynamicQuery: ""
  });

  // ── Generic Bulk Action Modal State ─────────────────────────────────
  const [bulkActionOpen, setBulkActionOpen] = useState(false);
  const [bulkActionKey, setBulkActionKey] = useState("");
  const [bulkActionGroups, setBulkActionGroups] = useState<any[]>([]);
  const [bulkActionForm, setBulkActionForm] = useState<Record<string, any>>({});
  const [bulkActionLogs, setBulkActionLogs] = useState<string[]>([]);
  const [bulkActionStatus, setBulkActionStatus] = useState<boolean | null>(null);
  const [isBulkActioning, setIsBulkActioning] = useState(false);
  const [bulkActionShowTerminal, setBulkActionShowTerminal] = useState(false);
  const [bulkActionSearch, setBulkActionSearch] = useState("");
  const [bulkActionSearchResults, setBulkActionSearchResults] = useState<any[]>([]);
  const [bulkActionSearchLoading, setBulkActionSearchLoading] = useState(false);
  const [bulkActionResults, setBulkActionResults] = useState<{groupName: string; status: "success"|"error"; message: string}[]>([]);

  // ── Group Templates State ──────────────────────────────────────────
  const [isTemplatesWorkspaceOpen, setIsTemplatesWorkspaceOpen] = useState(false);
  const [templatesList, setTemplatesList] = useState<any[]>([]);
  const [templatesLoading, setTemplatesLoading] = useState(false);
  const [showTemplateForm, setShowTemplateForm] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<any | null>(null);
  const [templateFormFields, setTemplateFormFields] = useState({
    name: "",
    description: "",
    category: "Security",
    groupType: "Security",
    groupScope: "Global",
    targetOu: ""
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

  // ── Search groups via backend ──────────────────────────────
  const searchGroupsBackend = async (query: string, setResults: any, setLoading: any) => {
    if (!query) return;
    setLoading(true);
    try {
      const token = localStorage.getItem("petrus_token");
      const res = await fetch(`http://localhost:3001/groups?q=${encodeURIComponent(query)}`, {
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
    setSingleCreateLogs(["[System] Starting group provisioning sequence..."]);

    try {
      const token = localStorage.getItem("petrus_token");
      const res = await fetch("http://localhost:3001/groups/create-single", {
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
    setBulkGroupsList(prev => [
      ...prev,
      { id: String(Date.now()), groupName: "", description: "", targetOu: "", groupType: "Security", groupScope: "Global" }
    ]);
  };

  const handleRemoveBulkRow = (id: string) => {
    if (bulkGroupsList.length <= 1) return;
    setBulkGroupsList(prev => prev.filter(r => r.id !== id));
  };

  const handleBulkRowFieldChange = (id: string, field: string, val: string) => {
    setBulkGroupsList(prev => prev.map(r => r.id === id ? { ...r, [field]: val } : r));
  };

  const downloadBulkCreateTemplate = () => {
    const csv = "groupName,description,targetOu,groupType,groupScope\nFinance-Dept,Finance Department Security Group,OU=Groups,Security,Global\nMarketing-All,Marketing distribution list,OU=Groups,Distribution,Universal\n";
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "bulk_group_creation_template.csv";
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
        groupName: getVal("groupname") || getVal("name"),
        description: getVal("description"),
        targetOu: getVal("targetou") || getVal("ou"),
        groupType: getVal("grouptype") || "Security",
        groupScope: getVal("groupscope") || "Global"
      };
    }).filter(r => r.groupName);

    if (rows.length > 0) {
      setBulkGroupsList(rows);
      setJobModal({ isOpen: true, success: true, message: `Successfully loaded ${rows.length} group(s) from CSV.` });
    } else {
      setJobModal({ isOpen: true, success: false, message: "No valid group rows found in CSV." });
    }
  };

  const handleBulkCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreatingBulk(true);
    setBulkShowTerminal(true);
    setBulkCreateSuccess(null);
    setBulkCreateLogs(["[System] Running bulk group creation workflow..."]);

    const groups = bulkGroupsList.map(g => ({
      ...g,
      createInAd: bulkGlobalConfig.createInAd,
      adSettingsId: bulkGlobalConfig.adSettingsId
    }));

    try {
      const token = localStorage.getItem("petrus_token");
      const res = await fetch("http://localhost:3001/groups/create-bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ groups })
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

  // ── Modify Single Group Handlers ────────────────────────────────────
  const handleSelectGroupForModify = (g: any) => {
    setSelectedModifyGroup(g);
    setModifyFormData({
      description: g.description || "",
      notes: g.notes || g.info || "",
      targetOu: g.targetOu || "",
      mail: g.email || g.mail || "",
      mailEnabled: !!(g.email || g.mail),
      groupType: g.groupType || "Security",
      groupScope: g.groupScope || "Global",
      hideFromAddressLists: !!g.hideFromAddressLists,
      isDynamic: !!g.isDynamic,
      dynamicQuery: g.dynamicQuery || ""
    });
  };

  const handleModifySingleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedModifyGroup) return;
    setIsModifyingSingle(true);
    setModifyShowTerminal(true);
    setModifySuccessStatus(null);
    setModifyLogs([`[System] Starting modification for group account: ${selectedModifyGroup.name || selectedModifyGroup.groupName}`]);

    const payload: any = {
      groupName: selectedModifyGroup.name || selectedModifyGroup.groupName,
      modifyInAd: true,
      description: modifyFormData.description,
      notes: modifyFormData.notes,
      targetOu: modifyFormData.targetOu,
      mail: modifyFormData.mail,
      mailEnabled: modifyFormData.mailEnabled,
      groupType: modifyFormData.groupType,
      groupScope: modifyFormData.groupScope,
      hideFromAddressLists: modifyFormData.hideFromAddressLists,
      isDynamic: modifyFormData.isDynamic,
      dynamicQuery: modifyFormData.dynamicQuery,
      action: modifyActiveTab === "Exchange" ? "exchange-attributes" : modifyActiveTab === "Dynamic Options" ? "modify-dynamic-group" : "organization-attributes"
    };

    try {
      const token = localStorage.getItem("petrus_token");
      const res = await fetch("http://localhost:3001/groups/modify-single", {
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
    setBulkActionGroups([]);
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
    const nameIdx = headers.findIndex(h => h.includes("groupname") || h.includes("name"));
    if (nameIdx === -1) {
      setJobModal({ isOpen: true, success: false, message: "CSV must have a 'groupName' or 'name' column." });
      return;
    }
    const groupNames: string[] = [];
    const extraData: Record<string, Record<string, string>> = {};
    lines.slice(1).forEach(line => {
      const cols = line.split(",");
      const name = cols[nameIdx]?.trim().replace(/"/g, "");
      if (name) {
        groupNames.push(name);
        extraData[name] = {};
        headers.forEach((h, i) => { if (i !== nameIdx && cols[i]) extraData[name][h] = cols[i].trim().replace(/"/g, ""); });
      }
    });

    try {
      const token = localStorage.getItem("petrus_token");
      const found: any[] = [];
      for (const name of groupNames) {
        const res = await fetch(`http://localhost:3001/groups?q=${encodeURIComponent(name)}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const d = await res.json();
          const group = d.find?.((u: any) => u.name?.toLowerCase() === name.toLowerCase() || u.groupName?.toLowerCase() === name.toLowerCase());
          if (group) {
            const cfg = BULK_ACTION_CONFIG[bulkActionKey];
            if (cfg && extraData[name]) {
              const csvEntry = extraData[name];
              const merged: Record<string, string> = {};
              cfg.csvColumns.slice(1).forEach(col => {
                if (csvEntry[col]) merged[col.replace(/_([a-z])/g, (_, c) => c.toUpperCase())] = csvEntry[col];
              });
              found.push({ ...group, groupName: name, _csvExtra: merged });
            } else {
              found.push({ ...group, groupName: name });
            }
          } else {
            found.push({ groupName: name, name, _stub: true, _csvExtra: extraData[name] || {} });
          }
        }
      }
      if (found.length > 0) {
        setBulkActionGroups(prev => {
          const existing = new Set(prev.map(g => g.groupName));
          const newOnes = found.filter(f => !existing.has(f.groupName));
          return [...prev, ...newOnes];
        });
        if (found[0]?._csvExtra && Object.keys(found[0]._csvExtra).length > 0) {
          setBulkActionForm(prev => ({ ...prev, ...found[0]._csvExtra }));
        }
        setJobModal({ isOpen: true, success: true, message: `CSV imported: ${found.length} group(s) added.` });
      } else {
        setJobModal({ isOpen: true, success: false, message: "No matching groups found in domain." });
      }
    } catch {
      setJobModal({ isOpen: true, success: false, message: "Failed to look up CSV groups." });
    }
  };

  const downloadCsvTemplate = () => {
    const cfg = BULK_ACTION_CONFIG[bulkActionKey];
    if (!cfg) return;
    const header = cfg.csvColumns.join(",");
    const example = cfg.csvColumns.map(c => c === "groupName" ? "Marketing-List" : `<${c}>`).join(",");
    const csv = `${header}\n${example}\n`;
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url;
    a.download = `${bulkActionKey.toLowerCase().replace(/\s+/g, "_")}_template.csv`;
    a.click(); URL.revokeObjectURL(url);
  };

  const exportResultsCsv = () => {
    if (bulkActionResults.length === 0) return;
    const header = "groupName,status,message";
    const rows = bulkActionResults.map(r =>
      `"${r.groupName}","${r.status}","${r.message.replace(/"/g, "'")}"`
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
    if (!cfg || bulkActionGroups.length === 0) return;

    if (cfg.danger && bulkActionForm.confirmDelete !== "DELETE") {
      setJobModal({ isOpen: true, success: false, message: 'Type "DELETE" to confirm destructive deletion.' });
      return;
    }

    setIsBulkActioning(true);
    setBulkActionShowTerminal(true);
    setBulkActionStatus(null);
    setBulkActionResults([]);
    const logs: string[] = [];
    const results: {groupName: string; status: "success"|"error"; message: string}[] = [];

    logs.push(`[System] Starting bulk group modification: "${cfg.title}" for ${bulkActionGroups.length} group(s).`);
    setBulkActionLogs([...logs]);
    const token = localStorage.getItem("petrus_token");

    for (const group of bulkActionGroups) {
      logs.push(`\n── Processing: ${group.groupName} ──────────────────`);
      setBulkActionLogs([...logs]);

      const form = bulkActionForm;
      const payload: any = {
        groupName: group.groupName,
        action: cfg.apiAction,
        modifyInAd: true,
      };

      const directFields = [
        "description", "notes", "targetOu", "mail", "mailEnabled", "groupType", "groupScope", "hideFromAddressLists"
      ];
      directFields.forEach(k => { if (form[k] !== undefined && form[k] !== "") payload[k] = form[k]; });

      if (group._csvExtra) Object.assign(payload, group._csvExtra);

      try {
        const res = await fetch("http://localhost:3001/groups/modify-bulk", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ groups: [payload] })
        });
        const data = await res.json();
        const success = res.ok && (data.success !== false);
        const msg = data.message || (success ? "Completed successfully." : "Failed.");
        if (success) {
          logs.push(`[✓] ${group.groupName}: ${msg}`);
          if (data.logs) data.logs.filter((l: string) => l.trim()).forEach((l: string) => logs.push(`  ${l}`));
          results.push({ groupName: group.groupName, status: "success", message: msg });
        } else {
          logs.push(`[✗] ${group.groupName}: ${msg}`);
          results.push({ groupName: group.groupName, status: "error", message: msg });
        }
      } catch (err: any) {
        logs.push(`[✗] ${group.groupName}: Network error — ${err.message}`);
        results.push({ groupName: group.groupName, status: "error", message: err.message });
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

  // ── Group Templates Functions ─────────────────────────────────────
  const fetchTemplates = async () => {
    setTemplatesLoading(true);
    try {
      const token = localStorage.getItem("petrus_token");
      const res = await fetch("http://localhost:3001/groups/templates", {
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
          groupType: templateFormFields.groupType,
          groupScope: templateFormFields.groupScope,
          targetOu: templateFormFields.targetOu
        }
      };
      const res = await fetch("http://localhost:3001/groups/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(body)
      });
      if (res.ok) {
        setJobModal({ isOpen: true, success: true, message: "Group template saved." });
        setShowTemplateForm(false);
        setEditingTemplate(null);
        fetchTemplates();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteTemplate = async (id: string) => {
    if (!confirm("Delete this group template?")) return;
    try {
      const token = localStorage.getItem("petrus_token");
      const res = await fetch(`http://localhost:3001/groups/templates/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setJobModal({ isOpen: true, success: true, message: "Template deleted." });
        fetchTemplates();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Route clicks from Layout
  const handleItemClick = (item: string) => {
    if (BULK_ACTION_CONFIG[item]) {
      openBulkAction(item);
      return;
    }
    if (item === "Create Single Group") {
      setSingleFormData({
        groupName: "",
        description: "",
        groupType: "Security",
        groupScope: "Global",
        notes: "",
        targetOu: "",
        createInAd: true,
        adSettingsId: adSettingsList[0]?.id || "",
        mailEnabled: false,
        mail: "",
        isDynamic: false,
        dynamicQuery: ""
      });
      setSingleCreateLogs([]);
      setSingleCreateSuccess(null);
      setSingleShowTerminal(false);
      setIsSingleCreateOpen(true);
      return;
    }
    if (item === "Create Single Dynamic Distribution Group") {
      setSingleFormData({
        groupName: "",
        description: "",
        groupType: "Distribution",
        groupScope: "Universal",
        notes: "",
        targetOu: "",
        createInAd: true,
        adSettingsId: adSettingsList[0]?.id || "",
        mailEnabled: true,
        mail: "",
        isDynamic: true,
        dynamicQuery: "(department=Sales)"
      });
      setSingleCreateLogs([]);
      setSingleCreateSuccess(null);
      setSingleShowTerminal(false);
      setIsSingleCreateOpen(true);
      return;
    }
    if (item === "Create Bulk Groups" || item === "Create Groups") {
      setBulkGroupsList([{ id: "1", groupName: "", description: "", targetOu: "", groupType: "Security", groupScope: "Global" }]);
      setBulkCreateLogs([]);
      setBulkCreateSuccess(null);
      setBulkShowTerminal(false);
      setIsBulkCreateOpen(true);
      return;
    }
    if (item === "Modify Single Group") {
      setModifySearchQuery("");
      setModifySearchResults([]);
      setSelectedModifyGroup(null);
      setModifyLogs([]);
      setModifySuccessStatus(null);
      setModifyShowTerminal(false);
      setModifyActiveTab("General");
      setIsSingleModifyOpen(true);
      return;
    }
    if (item === "Modify Bulk Groups" || item === "Modify Groups") {
      openBulkAction("Organization Attributes");
      return;
    }
    if (item === "Modify Dynamic Group" || item === "Modify single Dynamic Distribution Group") {
      setModifySearchQuery("");
      setModifySearchResults([]);
      setSelectedModifyGroup(null);
      setModifyLogs([]);
      setModifySuccessStatus(null);
      setModifyShowTerminal(false);
      setModifyActiveTab("Dynamic Options");
      setIsSingleModifyOpen(true);
      return;
    }
    if (item === "Group Creation Templates" || item === "Group Modification Templates" || item === "Dynamic Distribution Group Creation Templates") {
      fetchTemplates();
      setIsTemplatesWorkspaceOpen(true);
      return;
    }
    alert(`${item} task is configured.`);
  };

  const sections = [
    {
      title: "Group Management",
      groups: [
        {
          name: "Group Creation",
          color: "text-emerald-600 dark:text-emerald-400",
          items: ["Create Single Group", "Create Bulk Groups"]
        },
        {
          name: "Group Modification",
          color: "text-emerald-600 dark:text-emerald-400",
          items: ["Modify Single Group", "Modify Bulk Groups", "Modify Dynamic Group"]
        },
        {
          name: "Group Templates",
          color: "text-emerald-600 dark:text-emerald-400",
          items: ["Group Creation Templates", "Group Modification Templates"]
        },
        {
          name: "CSV Import",
          color: "text-emerald-600 dark:text-emerald-400",
          items: ["Create Groups", "Modify Groups"]
        }
      ]
    },
    {
      title: "Bulk Group Modification",
      groups: [
        {
          name: "Bulk Group Modification",
          color: "text-emerald-600 dark:text-emerald-400",
          items: [
            "Organization Attributes", 
            "Exchange Attributes", 
            "Move Groups", 
            "Delete Groups", 
            "Restore Deleted Groups"
          ]
        }
      ]
    },
    {
      title: "Dynamic Distribution Group Management",
      groups: [
        {
          name: "Dynamic Distribution Group Creation",
          color: "text-emerald-600 dark:text-emerald-400",
          items: ["Create Single Dynamic Distribution Group"]
        },
        {
          name: "Dynamic Distribution Group Modification",
          color: "text-emerald-600 dark:text-emerald-400",
          items: ["Modify single Dynamic Distribution Group"]
        },
        {
          name: "Dynamic Distribution Group Template",
          color: "text-emerald-600 dark:text-emerald-400",
          items: ["Dynamic Distribution Group Creation Templates"]
        }
      ]
    }
  ];

  return (
    <ManagementConsoleLayout
      sections={sections}
      searchPlaceholder="Search Group Tasks..."
      primaryActionLabel="Create Group"
      onItemClick={handleItemClick}
      onPrimaryActionClick={() => handleItemClick("Create Single Group")}
      tabs={[
        { name: "Group Management", active: true },
        { name: "Bulk Group Modification", active: false }
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
              {jobModal.success ? "Success" : "Error"}
            </h3>
            <p className="text-xs text-slate-505 mb-5">{jobModal.message}</p>
            <button onClick={() => setJobModal(prev => ({ ...prev, isOpen: false }))} className="w-full bg-indigo-650 hover:bg-indigo-700 text-white rounded-xl py-2 text-xs font-bold">Dismiss</button>
          </div>
        </div>
      )}

      {/* ── CREATE SINGLE GROUP MODAL ─────────────────────────────────── */}
      {isSingleCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[94vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-slate-200/50 dark:border-white/5 flex justify-between items-center shrink-0">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                <h2 className="text-base font-bold text-slate-900 dark:text-white">{singleFormData.isDynamic ? "Create Dynamic Distribution Group" : "Create Single Group"}</h2>
              </div>
              <button onClick={() => setIsSingleCreateOpen(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"><X className="h-5 w-5 text-slate-500" /></button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {singleShowTerminal && (
                <div className="bg-slate-950 rounded-2xl border border-white/5 overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-2 bg-slate-900 border-b border-white/5 text-[10px] text-slate-400">
                    <span className="flex items-center gap-1.5"><Terminal className="h-3 w-3 text-emerald-400" /> Live Terminal Log</span>
                  </div>
                  <div className="p-4 font-mono text-[11px] space-y-0.5 max-h-40 overflow-y-auto">
                    {singleCreateLogs.map((log, idx) => (
                      <div key={idx} className={log.includes("[ERROR]") ? "text-red-400" : log.includes("[SIMULATION]") ? "text-amber-400" : "text-slate-300"}>{log}</div>
                    ))}
                    {isCreatingSingle && <div className="text-indigo-400 animate-pulse">● Creating active directory objects...</div>}
                    {singleCreateSuccess === true && <div className="text-emerald-400 font-bold mt-2">✓ Group provisioned successfully.</div>}
                    {singleCreateSuccess === false && <div className="text-red-400 font-bold mt-2">✗ Group provisioning failed.</div>}
                  </div>
                </div>
              )}

              <form onSubmit={handleSingleCreateSubmit} className="grid grid-cols-2 gap-4">
                <div className="space-y-1 col-span-2 sm:col-span-1">
                  <label className="text-[11px] font-semibold text-slate-500">Group Name *</label>
                  <input type="text" required value={singleFormData.groupName} onChange={e => setSingleFormData({...singleFormData, groupName: e.target.value})} className="w-full text-xs bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-white/5 rounded-xl px-3 py-2 text-slate-800 dark:text-white outline-none focus:border-indigo-500" placeholder="e.g. Sales-Team" />
                </div>
                <div className="space-y-1 col-span-2 sm:col-span-1">
                  <label className="text-[11px] font-semibold text-slate-500">Target OU DN</label>
                  <input type="text" value={singleFormData.targetOu} onChange={e => setSingleFormData({...singleFormData, targetOu: e.target.value})} className="w-full text-xs bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-white/5 rounded-xl px-3 py-2 text-slate-800 dark:text-white outline-none focus:border-indigo-500" placeholder="e.g. OU=Groups,DC=corp,DC=com" />
                </div>
                <div className="col-span-2 space-y-1">
                  <label className="text-[11px] font-semibold text-slate-500">Description</label>
                  <input type="text" value={singleFormData.description} onChange={e => setSingleFormData({...singleFormData, description: e.target.value})} className="w-full text-xs bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-white/5 rounded-xl px-3 py-2 text-slate-800 dark:text-white outline-none focus:border-indigo-500" placeholder="e.g. Public distribution lists for marketing division" />
                </div>

                {!singleFormData.isDynamic && (
                  <>
                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-slate-500">Group Type</label>
                      <select value={singleFormData.groupType} onChange={e => setSingleFormData({...singleFormData, groupType: e.target.value})} className="w-full text-xs bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-white/5 rounded-xl px-3 py-2 text-slate-850 outline-none">
                        <option value="Security">Security Group (Acl / Permissions)</option>
                        <option value="Distribution">Distribution Group (Mailing List)</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-slate-500">Group Scope</label>
                      <select value={singleFormData.groupScope} onChange={e => setSingleFormData({...singleFormData, groupScope: e.target.value})} className="w-full text-xs bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-white/5 rounded-xl px-3 py-2 text-slate-850 outline-none">
                        <option value="Global">Global</option>
                        <option value="Universal">Universal</option>
                        <option value="Domain Local">Domain Local</option>
                      </select>
                    </div>
                  </>
                )}

                <div className="col-span-2 space-y-1">
                  <label className="text-[11px] font-semibold text-slate-500">Notes (info attribute)</label>
                  <textarea rows={2} value={singleFormData.notes} onChange={e => setSingleFormData({...singleFormData, notes: e.target.value})} className="w-full text-xs bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-white/5 rounded-xl px-3 py-2 text-slate-800 dark:text-white outline-none resize-none" />
                </div>

                {/* Mail-enabled Exchange properties */}
                <div className="col-span-2 pt-3 border-t border-slate-200 dark:border-white/5 grid grid-cols-2 gap-4">
                  <label className="flex items-center gap-2 cursor-pointer col-span-2">
                    <input type="checkbox" checked={singleFormData.mailEnabled} onChange={e => setSingleFormData({...singleFormData, mailEnabled: e.target.checked})} className="rounded w-4 h-4 text-indigo-650" />
                    <span className="text-xs text-slate-700 dark:text-slate-300 font-semibold">Enable Group Email (Exchange Mail-Enabled Group)</span>
                  </label>
                  {singleFormData.mailEnabled && (
                    <div className="space-y-1 col-span-2">
                      <label className="text-[11px] font-semibold text-slate-500">Group Email Address</label>
                      <input type="email" value={singleFormData.mail} onChange={e => setSingleFormData({...singleFormData, mail: e.target.value})} className="w-full text-xs bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-white/5 rounded-xl px-3 py-2 text-slate-800 dark:text-white outline-none focus:border-indigo-500" placeholder="e.g. sales-team@corp.com" />
                    </div>
                  )}
                </div>

                {/* Dynamic distribution group properties */}
                {singleFormData.isDynamic && (
                  <div className="col-span-2 pt-3 border-t border-slate-200 dark:border-white/5 space-y-2">
                    <label className="text-[11px] font-bold text-slate-500 block">Dynamic Query Filter *</label>
                    <input type="text" required value={singleFormData.dynamicQuery} onChange={e => setSingleFormData({...singleFormData, dynamicQuery: e.target.value})} className="w-full text-xs bg-slate-50 dark:bg-slate-950 border border-slate-350 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-800 dark:text-white outline-none" placeholder="e.g. (&(objectClass=user)(department=Sales))" />
                    <span className="text-[10px] text-slate-400 block">Active Directory query used to resolve memberships dynamically in Exchange.</span>
                  </div>
                )}

                <div className="col-span-2 pt-3 border-t border-slate-200 dark:border-white/5 flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={singleFormData.createInAd} onChange={e => setSingleFormData({...singleFormData, createInAd: e.target.checked})} className="rounded w-4 h-4 text-indigo-650" />
                    <span className="text-xs text-slate-700 dark:text-slate-300">Synchronize to AD Connection</span>
                  </label>
                </div>

                {singleFormData.createInAd && adSettingsList.length > 0 && (
                  <div className="col-span-2 space-y-1">
                    <label className="text-[11px] font-semibold text-slate-500">Active Directory Profile</label>
                    <select value={singleFormData.adSettingsId} onChange={e => setSingleFormData({...singleFormData, adSettingsId: e.target.value})} className="w-full text-xs bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-white/5 rounded-xl px-3 py-2 text-slate-850 outline-none">
                      {adSettingsList.map(a => (
                        <option key={a.id} value={a.id}>{a.domainName} ({a.adServerIp})</option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="col-span-2 pt-4 border-t border-slate-200 dark:border-white/5 flex justify-end gap-3 shrink-0">
                  <button type="button" onClick={() => setIsSingleCreateOpen(false)} className="px-5 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-xl hover:bg-slate-200 font-semibold text-xs transition-colors">{singleCreateSuccess !== null ? "Close" : "Cancel"}</button>
                  {singleCreateSuccess === null && (
                    <button type="submit" disabled={isCreatingSingle} className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-semibold text-xs shadow-lg flex items-center gap-1.5">
                      {isCreatingSingle && <Loader2 className="h-3.5 w-3.5 animate-spin" />} Provision Group
                    </button>
                  )}
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ── CREATE BULK GROUPS MODAL ──────────────────────────────────── */}
      {isBulkCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl shadow-2xl w-full max-w-6xl max-h-[96vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-slate-200/50 dark:border-white/5 flex justify-between items-center shrink-0">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-emerald-555 animate-pulse" />
                <h2 className="text-base font-bold text-slate-900 dark:text-white">Bulk Group Creation Wizard</h2>
              </div>
              <button onClick={() => setIsBulkCreateOpen(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"><X className="h-5 w-5 text-slate-500" /></button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 space-y-6">
              {bulkShowTerminal ? (
                <div className="bg-slate-950 rounded-2xl border border-white/5 p-6 font-mono text-xs text-slate-300 min-h-[350px] flex flex-col justify-between">
                  <div className="space-y-1.5 max-h-[300px] overflow-y-auto">
                    <div className="text-indigo-400 border-b border-white/5 pb-1 flex items-center justify-between text-[10px]">
                      <span>⚡ PETRUS BATCH GROUP PROVISIONING MODULE</span>
                    </div>
                    {bulkCreateLogs.map((log, idx) => (
                      <div key={idx} className={log.includes("[ERROR]") ? "text-red-400" : log.includes("[SIMULATION]") ? "text-amber-400" : "text-slate-300"}>{log}</div>
                    ))}
                    {isCreatingBulk && <div className="text-indigo-400 animate-pulse">● Running batch active directory sync...</div>}
                  </div>
                  <div className="pt-4 border-t border-white/5 flex gap-3">
                    <button type="button" onClick={() => setBulkShowTerminal(false)} disabled={isCreatingBulk} className="flex-1 py-2 bg-slate-800 text-slate-200 rounded-xl hover:bg-slate-700 font-bold transition-all text-xs">Back</button>
                    <button type="button" onClick={() => setIsBulkCreateOpen(false)} disabled={isCreatingBulk} className="flex-1 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-500 font-bold transition-all text-xs">Close</button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleBulkCreateSubmit} className="space-y-4">
                  <div className="bg-slate-50/50 dark:bg-slate-950/40 p-4 border border-slate-200/50 dark:border-white/5 rounded-2xl grid grid-cols-2 gap-4">
                    <label className="flex items-center gap-2 cursor-pointer bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2">
                      <input type="checkbox" checked={bulkGlobalConfig.createInAd} onChange={e => setBulkGlobalConfig({...bulkGlobalConfig, createInAd: e.target.checked})} className="rounded text-indigo-650" />
                      <span className="text-xs text-slate-700 dark:text-slate-300">Synchronize to Active Directory</span>
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
                    <span className="font-semibold text-slate-500">Group Batch Spreadsheet</span>
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
                          <th className="p-3 w-[200px]">Group Name *</th>
                          <th className="p-3">Description</th>
                          <th className="p-3 w-[200px]">Target OU DN</th>
                          <th className="p-3 w-[150px]">Group Type</th>
                          <th className="p-3 w-[150px]">Group Scope</th>
                          <th className="p-3 w-[50px] text-center"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {bulkGroupsList.map(row => (
                          <tr key={row.id} className="border-b border-slate-100 dark:border-white/5">
                            <td className="p-2">
                              <input type="text" required value={row.groupName} onChange={e => handleBulkRowFieldChange(row.id, "groupName", e.target.value)} className="w-full bg-white dark:bg-slate-950 border border-slate-350 dark:border-slate-800 rounded px-2 py-1 outline-none" placeholder="Finance-Dept" />
                            </td>
                            <td className="p-2">
                              <input type="text" value={row.description} onChange={e => handleBulkRowFieldChange(row.id, "description", e.target.value)} className="w-full bg-white dark:bg-slate-950 border border-slate-350 dark:border-slate-800 rounded px-2 py-1 outline-none" placeholder="Standard group description" />
                            </td>
                            <td className="p-2">
                              <input type="text" value={row.targetOu} onChange={e => handleBulkRowFieldChange(row.id, "targetOu", e.target.value)} className="w-full bg-white dark:bg-slate-950 border border-slate-350 dark:border-slate-800 rounded px-2 py-1 outline-none" placeholder="OU=Groups,DC=corp,DC=com" />
                            </td>
                            <td className="p-2">
                              <select value={row.groupType} onChange={e => handleBulkRowFieldChange(row.id, "groupType", e.target.value)} className="w-full bg-white dark:bg-slate-950 border border-slate-350 dark:border-slate-800 rounded px-2 py-1 outline-none">
                                <option value="Security">Security</option>
                                <option value="Distribution">Distribution</option>
                              </select>
                            </td>
                            <td className="p-2">
                              <select value={row.groupScope} onChange={e => handleBulkRowFieldChange(row.id, "groupScope", e.target.value)} className="w-full bg-white dark:bg-slate-950 border border-slate-350 dark:border-slate-800 rounded px-2 py-1 outline-none">
                                <option value="Global">Global</option>
                                <option value="Universal">Universal</option>
                                <option value="Domain Local">Domain Local</option>
                              </select>
                            </td>
                            <td className="p-2 text-center">
                              <button type="button" onClick={() => handleRemoveBulkRow(row.id)} disabled={bulkGroupsList.length <= 1} className="text-slate-400 hover:text-red-400"><Trash2 className="h-4 w-4" /></button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="flex justify-between items-center shrink-0 pt-4 border-t border-slate-200 dark:border-white/5">
                    <button type="button" onClick={handleAddBulkRow} className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-850 hover:bg-slate-200 text-xs rounded-lg font-bold flex items-center gap-1"><Plus className="h-4 w-4" /> Add Group Row</button>
                    <div className="flex gap-2">
                      <button type="button" onClick={() => setIsBulkCreateOpen(false)} className="px-5 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold rounded-xl text-xs">Cancel</button>
                      <button type="submit" className="px-5 py-2 bg-indigo-600 text-white font-semibold rounded-xl text-xs hover:bg-indigo-500 shadow-lg">Provision Batch of {bulkGroupsList.length} Groups</button>
                    </div>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── MODIFY SINGLE GROUP MODAL ─────────────────────────────────── */}
      {isSingleModifyOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[94vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-slate-200/50 dark:border-white/5 flex justify-between items-center shrink-0">
              <div className="flex items-center gap-2">
                <Server className="h-5 w-5 text-amber-500" />
                <h2 className="text-base font-bold text-slate-900 dark:text-white">Modify Single Group</h2>
              </div>
              <button onClick={() => setIsSingleModifyOpen(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"><X className="h-5 w-5 text-slate-500" /></button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {modifyShowTerminal && (
                <div className="bg-slate-950 rounded-2xl border border-white/5 overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-2 bg-slate-900 border-b border-white/5 text-[10px] text-slate-400">
                    <span className="flex items-center gap-1.5"><Terminal className="h-3 w-3 text-emerald-400" /> Live Terminal Logs</span>
                  </div>
                  <div className="p-4 font-mono text-[11px] space-y-0.5 max-h-40 overflow-y-auto">
                    {modifyLogs.map((log, idx) => (
                      <div key={idx} className={log.includes("[ERROR]") ? "text-red-400" : log.includes("[SIMULATION]") ? "text-amber-400" : "text-slate-300"}>{log}</div>
                    ))}
                    {isModifyingSingle && <div className="text-indigo-400 animate-pulse">● Connecting to Domain Controllers...</div>}
                    {modifySuccessStatus === true && <div className="text-emerald-400 font-bold mt-2">✓ Updates applied successfully.</div>}
                    {modifySuccessStatus === false && <div className="text-red-400 font-bold mt-2">✗ Modification failed.</div>}
                  </div>
                </div>
              )}

              {/* Group Search */}
              <div className="space-y-2">
                <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest block">1. Search & Select Group</label>
                <div className="flex gap-2">
                  <input type="text" placeholder="Search by group name or email…" value={modifySearchQuery} onChange={e => setModifySearchQuery(e.target.value)} onKeyDown={e => { if (e.key === "Enter") searchGroupsBackend(modifySearchQuery, setModifySearchResults, setModifySearchLoading); }} className="flex-1 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-white/5 rounded-xl px-4 py-2 text-slate-850 dark:text-white outline-none focus:border-indigo-500" />
                  <button type="button" onClick={() => searchGroupsBackend(modifySearchQuery, setModifySearchResults, setModifySearchLoading)} className="px-4 py-2 bg-indigo-650 text-white font-bold text-xs rounded-xl hover:bg-indigo-700 flex items-center gap-1.5">
                    {modifySearchLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null} Search
                  </button>
                </div>
                {modifySearchResults.length > 0 && (
                  <div className="border border-slate-200 dark:border-white/5 rounded-xl overflow-hidden divide-y divide-slate-100 dark:divide-white/5 max-h-40 overflow-y-auto">
                    {modifySearchResults.map(g => (
                      <button key={g.id || g.name} type="button" onClick={() => handleSelectGroupForModify(g)} className={`w-full flex justify-between items-center px-4 py-2 text-left hover:bg-indigo-50/50 dark:hover:bg-indigo-950/20 text-xs font-semibold ${selectedModifyGroup?.name === g.name ? "bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600" : "text-slate-700 dark:text-slate-300"}`}>
                        <div>
                          <div>{g.name || g.groupName}</div>
                          <div className="text-[10px] text-slate-400 font-normal">{g.email || g.description || "Active Directory Group"}</div>
                        </div>
                        {selectedModifyGroup?.name === g.name && <Check className="h-4 w-4 text-indigo-500" />}
                      </button>
                    ))}
                  </div>
                )}
                {selectedModifyGroup && (
                  <div className="flex items-center gap-2 p-3 bg-emerald-55/20 border border-emerald-500/20 text-emerald-600 rounded-xl text-xs">
                    <CheckCircle2 className="h-4 w-4 shrink-0" /> Selected: <span className="font-bold">{selectedModifyGroup.name || selectedModifyGroup.groupName}</span>
                  </div>
                )}
              </div>

              {selectedModifyGroup && (
                <form onSubmit={handleModifySingleSubmit} className="space-y-4">
                  {/* Tabs */}
                  <div className="flex gap-1 border-b border-slate-200 dark:border-white/5">
                    {["General", "Exchange", "Dynamic Options"].map(tab => (
                      <button key={tab} type="button" onClick={() => setModifyActiveTab(tab)} className={`px-4 py-2 text-[11px] font-bold rounded-t-xl transition-colors ${modifyActiveTab === tab ? "bg-indigo-600 text-white" : "text-slate-500 hover:text-slate-700"}`}>{tab}</button>
                    ))}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {modifyActiveTab === "General" && (
                      <>
                        <div className="space-y-1 col-span-2">
                          <label className="text-[11px] font-semibold text-slate-500">Description</label>
                          <input type="text" value={modifyFormData.description} onChange={e => setModifyFormData({...modifyFormData, description: e.target.value})} className="w-full text-xs bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-white/5 rounded-xl px-3 py-2 text-slate-800 dark:text-white outline-none" />
                        </div>
                        <div className="space-y-1 col-span-2">
                          <label className="text-[11px] font-semibold text-slate-500">Notes (info)</label>
                          <textarea rows={3} value={modifyFormData.notes} onChange={e => setModifyFormData({...modifyFormData, notes: e.target.value})} className="w-full text-xs bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-white/5 rounded-xl px-3 py-2 text-slate-800 dark:text-white outline-none resize-none" />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[11px] font-semibold text-slate-500">Target OU DN</label>
                          <input type="text" value={modifyFormData.targetOu} onChange={e => setModifyFormData({...modifyFormData, targetOu: e.target.value})} className="w-full text-xs bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-white/5 rounded-xl px-3 py-2 text-slate-800 dark:text-white outline-none" />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[11px] font-semibold text-slate-500">Group Scope</label>
                          <select value={modifyFormData.groupScope} onChange={e => setModifyFormData({...modifyFormData, groupScope: e.target.value})} className="w-full text-xs bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-white/5 rounded-xl px-3 py-2 text-slate-850 outline-none">
                            <option value="Global">Global</option>
                            <option value="Universal">Universal</option>
                            <option value="Domain Local">Domain Local</option>
                          </select>
                        </div>
                      </>
                    )}

                    {modifyActiveTab === "Exchange" && (
                      <>
                        <div className="col-span-2 space-y-3 p-4 bg-slate-55/20 border border-slate-200 dark:border-white/5 rounded-xl">
                          <label className="flex items-center gap-3 cursor-pointer">
                            <input type="checkbox" checked={modifyFormData.mailEnabled} onChange={e => setModifyFormData({...modifyFormData, mailEnabled: e.target.checked})} className="rounded text-indigo-650 w-4 h-4" />
                            <div>
                              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">Mail Enabled Group Account</span>
                            </div>
                          </label>
                        </div>
                        {modifyFormData.mailEnabled && (
                          <div className="col-span-2 space-y-1">
                            <label className="text-[11px] font-semibold text-slate-500">Email Address</label>
                            <input type="email" value={modifyFormData.mail} onChange={e => setModifyFormData({...modifyFormData, mail: e.target.value})} className="w-full text-xs bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-white/5 rounded-xl px-3 py-2 text-slate-800 dark:text-white outline-none" />
                          </div>
                        )}
                        <div className="col-span-2 space-y-3 p-4 bg-slate-55/20 border border-slate-200 dark:border-white/5 rounded-xl">
                          <label className="flex items-center gap-3 cursor-pointer">
                            <input type="checkbox" checked={modifyFormData.hideFromAddressLists} onChange={e => setModifyFormData({...modifyFormData, hideFromAddressLists: e.target.checked})} className="rounded text-indigo-650 w-4 h-4" />
                            <div>
                              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">Hide from address lists</span>
                            </div>
                          </label>
                        </div>
                      </>
                    )}

                    {modifyActiveTab === "Dynamic Options" && (
                      <>
                        <div className="col-span-2 space-y-3 p-4 bg-slate-55/20 border border-slate-200 dark:border-white/5 rounded-xl">
                          <label className="flex items-center gap-3 cursor-pointer">
                            <input type="checkbox" checked={modifyFormData.isDynamic} onChange={e => setModifyFormData({...modifyFormData, isDynamic: e.target.checked})} className="rounded text-indigo-650 w-4 h-4" />
                            <div>
                              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 block">Dynamic Distribution Group Settings</span>
                            </div>
                          </label>
                        </div>
                        {modifyFormData.isDynamic && (
                          <div className="col-span-2 space-y-1">
                            <label className="text-[11px] font-semibold text-slate-500">Query Filter</label>
                            <input type="text" value={modifyFormData.dynamicQuery} onChange={e => setModifyFormData({...modifyFormData, dynamicQuery: e.target.value})} className="w-full text-xs bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-white/5 rounded-xl px-3 py-2 text-slate-800 dark:text-white outline-none" />
                          </div>
                        )}
                      </>
                    )}
                  </div>

                  <div className="pt-4 border-t border-slate-200 dark:border-white/5 flex justify-end gap-3 shrink-0">
                    <button type="button" onClick={() => setIsSingleModifyOpen(false)} className="px-5 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-xl hover:bg-slate-200 font-semibold text-xs transition-colors">{modifySuccessStatus !== null ? "Close" : "Cancel"}</button>
                    {modifySuccessStatus === null && (
                      <button type="submit" disabled={isModifyingSingle} className="px-5 py-2 bg-indigo-600 text-white rounded-xl font-bold text-xs hover:bg-indigo-500 shadow-lg flex items-center gap-1">
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
          sky: { bg: "bg-sky-500/10", text: "text-sky-500", btn: "bg-sky-655", badge: "bg-sky-100 dark:bg-sky-900/30 text-sky-655" },
          amber: { bg: "bg-amber-500/10", text: "text-amber-500", btn: "bg-amber-500 hover:bg-amber-400", badge: "bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-300" },
          teal: { bg: "bg-teal-500/10", text: "text-teal-500", btn: "bg-teal-600 hover:bg-teal-500", badge: "bg-teal-100 dark:bg-teal-900/30 text-teal-600 dark:text-teal-300" },
          red: { bg: "bg-red-500/10", text: "text-red-500", btn: "bg-red-600 hover:bg-red-500", badge: "bg-red-100 dark:bg-red-900/30 text-red-655" }
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
                      <div className="flex items-center gap-2 text-xs text-slate-400"><Terminal className="h-3.5 w-3.5 text-emerald-400" /> Active Directory Execution Logs</div>
                      <div className="flex items-center gap-2">
                        {bulkActionResults.length > 0 && (
                          <button type="button" onClick={exportResultsCsv} className="text-[10px] px-2.5 py-1 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 rounded font-bold flex items-center gap-1"><Download className="h-3 w-3" /> Export CSV</button>
                        )}
                      </div>
                    </div>
                    <div className="p-4 font-mono text-[11px] space-y-0.5 max-h-52 overflow-y-auto">
                      {bulkActionLogs.map((log, i) => (
                        <div key={i} className={log.includes("[✗]") || log.includes("[ERROR]") ? "text-red-400" : log.includes("[✓]") ? "text-emerald-400" : log.includes("[SIMULATION]") ? "text-amber-400" : "text-slate-350"}>{log}</div>
                      ))}
                      {isBulkActioning && <div className={`${cl.text} animate-pulse mt-1`}>● Operations processing in AD sandbox...</div>}
                      {bulkActionStatus === true && <div className="text-emerald-400 font-bold mt-2">✓ All groups modified successfully.</div>}
                      {bulkActionStatus === false && <div className="text-amber-400 font-bold mt-2">⚠ Completed with some failures. Review logs.</div>}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Left panel: Group selector */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Select Groups</h3>
                      <div className="flex gap-2">
                        <label className={`text-[10px] px-2.5 py-1 rounded-lg font-bold cursor-pointer transition-colors ${cl.badge} flex items-center gap-1`}>
                          <Upload className="h-3 w-3" /> Import CSV
                          <input type="file" accept=".csv" className="hidden" onChange={e => { if (e.target.files?.[0]) { handleCsvImport(e.target.files[0]); e.target.value = ""; } }} />
                        </label>
                        <button type="button" onClick={downloadCsvTemplate} className="text-[10px] px-2.5 py-1 rounded-lg font-bold transition-colors bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200 flex items-center gap-1"><Download className="h-3 w-3" /> Template</button>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <input type="text" placeholder="Search group names…" value={bulkActionSearch} onChange={e => setBulkActionSearch(e.target.value)} onKeyDown={e => { if (e.key === "Enter") searchGroupsBackend(bulkActionSearch, setBulkActionSearchResults, setBulkActionSearchLoading); }} className={inputCls} />
                      <button type="button" onClick={() => searchGroupsBackend(bulkActionSearch, setBulkActionSearchResults, setBulkActionSearchLoading)} className={`px-3 py-2 ${cl.btn} text-white rounded-xl text-xs font-bold`}>
                        {bulkActionSearchLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Search"}
                      </button>
                    </div>

                    {bulkActionSearchResults.length > 0 && (
                      <div className="border border-slate-200 dark:border-white/5 rounded-xl overflow-hidden divide-y divide-slate-150 max-h-48 overflow-y-auto">
                        {bulkActionSearchResults.map(g => {
                          const sel = bulkActionGroups.some(s => s.groupName === (g.name || g.groupName));
                          const grpName = g.name || g.groupName;
                          return (
                            <button key={grpName} type="button" onClick={() => setBulkActionGroups(prev => sel ? prev.filter(s => s.groupName !== grpName) : [...prev, { ...g, groupName: grpName }])} className={`w-full flex items-center justify-between px-3 py-2 text-left hover:bg-slate-50 dark:hover:bg-slate-800/60 text-xs font-medium ${sel ? "bg-slate-50 dark:bg-slate-800/60 text-indigo-500" : "text-slate-800 dark:text-slate-200"}`}>
                              <div>
                                <div>{grpName}</div>
                                <div className="text-[10px] text-slate-400 font-normal">{g.email || g.description || "Active Directory Group"}</div>
                              </div>
                              <input type="checkbox" readOnly checked={sel} className="rounded w-4 h-4 pointer-events-none" />
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {bulkActionGroups.length > 0 && (
                      <div className="space-y-2">
                        <span className="text-[11px] text-slate-500 font-bold">{bulkActionGroups.length} group(s) in selection:</span>
                        <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto">
                          {bulkActionGroups.map(grp => (
                            <span key={grp.groupName} className={`flex items-center gap-1.5 px-2.5 py-1 ${cl.badge} text-[11px] font-bold rounded-full`}>
                              {grp.groupName}
                              <button type="button" onClick={() => setBulkActionGroups(prev => prev.filter(s => s.groupName !== grp.groupName))} className="hover:opacity-60"><X className="h-3 w-3" /></button>
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {bulkActionGroups.length === 0 && (
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
                      <div className={`p-4 rounded-xl border ${cl.bg} border-indigo-200/50 text-xs`}>No configuration required. Select groups and apply.</div>
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
                          {field.type === "checkbox" && (
                            <label className="flex items-center gap-2.5 cursor-pointer mt-1">
                              <input type="checkbox" checked={!!bulkActionForm[field.key]} onChange={e => setBulkActionForm({...bulkActionForm, [field.key]: e.target.checked})} className="rounded w-4 h-4" />
                              <span className="text-xs text-slate-700 dark:text-slate-300">{field.placeholder || "Enable"}</span>
                            </label>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-5 border-t border-slate-200/50 dark:border-white/5 flex items-center justify-between shrink-0">
                <span className="text-xs text-slate-400">{bulkActionGroups.length} group(s) selected.</span>
                <div className="flex gap-2">
                  <button type="button" onClick={() => setBulkActionOpen(false)} className="px-5 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold rounded-xl text-xs">{bulkActionStatus !== null ? "Close" : "Cancel"}</button>
                  {bulkActionStatus === null && (
                    <button type="button" disabled={isBulkActioning || bulkActionGroups.length === 0} onClick={handleBulkActionSubmit} className={`px-5 py-2 ${cl.btn} text-white font-semibold rounded-xl text-xs flex items-center gap-1.5`}>
                      {isBulkActioning && <Loader2 className="h-3.5 w-3.5 animate-spin" />} Apply modifications
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ── GROUP TEMPLATES WORKSPACE MODAL ─────────────────────────── */}
      {isTemplatesWorkspaceOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[94vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-slate-200/50 dark:border-white/5 flex justify-between items-center shrink-0">
              <div className="flex items-center gap-2">
                <FolderTree className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                <h2 className="text-base font-bold text-slate-900 dark:text-white">Group Template Profiles Workspace</h2>
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
                      <input type="text" required value={templateFormFields.name} onChange={e => setTemplateFormFields({...templateFormFields, name: e.target.value})} className="w-full text-xs bg-white dark:bg-slate-950 border border-slate-300 dark:border-white/5 rounded-xl px-3 py-2 text-slate-850 outline-none" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-slate-500">Category</label>
                      <select value={templateFormFields.category} onChange={e => setTemplateFormFields({...templateFormFields, category: e.target.value})} className="w-full text-xs bg-white dark:bg-slate-950 border border-slate-300 dark:border-white/5 rounded-xl px-3 py-2 text-slate-850 outline-none">
                        <option value="Security">Security</option>
                        <option value="Distribution">Distribution</option>
                        <option value="Dynamic Distribution">Dynamic Distribution</option>
                      </select>
                    </div>
                    <div className="col-span-2 space-y-1">
                      <label className="text-[11px] font-semibold text-slate-500">Description</label>
                      <input type="text" value={templateFormFields.description} onChange={e => setTemplateFormFields({...templateFormFields, description: e.target.value})} className="w-full text-xs bg-white dark:bg-slate-950 border border-slate-300 dark:border-white/5 rounded-xl px-3 py-2 text-slate-850 outline-none" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-slate-500">Default Group Type</label>
                      <select value={templateFormFields.groupType} onChange={e => setTemplateFormFields({...templateFormFields, groupType: e.target.value})} className="w-full text-xs bg-white dark:bg-slate-950 border border-slate-300 dark:border-white/5 rounded-xl px-3 py-2 text-slate-850 outline-none">
                        <option value="Security">Security</option>
                        <option value="Distribution">Distribution</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-slate-500">Default Group Scope</label>
                      <select value={templateFormFields.groupScope} onChange={e => setTemplateFormFields({...templateFormFields, groupScope: e.target.value})} className="w-full text-xs bg-white dark:bg-slate-950 border border-slate-300 dark:border-white/5 rounded-xl px-3 py-2 text-slate-850 outline-none">
                        <option value="Global">Global</option>
                        <option value="Universal">Universal</option>
                        <option value="Domain Local">Domain Local</option>
                      </select>
                    </div>
                    <div className="col-span-2 space-y-1">
                      <label className="text-[11px] font-semibold text-slate-500">Default placement OU DN</label>
                      <input type="text" value={templateFormFields.targetOu} onChange={e => setTemplateFormFields({...templateFormFields, targetOu: e.target.value})} className="w-full text-xs bg-white dark:bg-slate-950 border border-slate-300 dark:border-white/5 rounded-xl px-3 py-2 text-slate-850 outline-none" />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 pt-3">
                    <button type="button" onClick={() => setShowTemplateForm(false)} className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-semibold">Cancel</button>
                    <button type="submit" className="px-4 py-2 bg-indigo-650 text-white rounded-xl text-xs font-semibold hover:bg-indigo-500">Save Template</button>
                  </div>
                </form>
              ) : (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-slate-400 font-medium">Standardize group creation properties across all connected Active Directory domains.</span>
                    <button type="button" onClick={() => {
                      setEditingTemplate(null);
                      setTemplateFormFields({ name: "", description: "", category: "Security", groupType: "Security", groupScope: "Global", targetOu: "" });
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
                              <div>Type: <span className="font-semibold text-slate-655">{tpl.data?.groupType || "—"}</span></div>
                              <div>Scope: <span className="font-semibold text-slate-655">{tpl.data?.groupScope || "—"}</span></div>
                            </div>
                          </div>
                          <div className="flex gap-2 justify-end mt-4 pt-2 border-t border-slate-100 dark:border-white/5">
                            <button type="button" onClick={() => {
                              setEditingTemplate(tpl);
                              setTemplateFormFields({
                                name: tpl.name,
                                description: tpl.description || "",
                                category: tpl.category || "Security",
                                groupType: tpl.data?.groupType || "Security",
                                groupScope: tpl.data?.groupScope || "Global",
                                targetOu: tpl.data?.targetOu || ""
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
