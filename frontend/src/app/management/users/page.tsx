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

const EMAIL_TEMPLATES = [
  { id: "firstname.lastname", label: "firstname.lastname@domain.com (e.g. john.doe@...)" },
  { id: "lastname.firstname", label: "lastname.firstname@domain.com (e.g. doe.john@...)" },
  { id: "firstinitial.lastname", label: "firstinitial.lastname@domain.com (e.g. j.doe@...)" },
  { id: "firstname.lastinitial", label: "firstname.lastinitial@domain.com (e.g. john.d@...)" },
  { id: "firstinitiallastname", label: "firstinitiallastname@domain.com (e.g. jdoe@...)" },
  { id: "firstnamelastname", label: "firstnamelastname@domain.com (e.g. johndoe@...)" }
];

const M365_LICENSES = [
  { id: "Microsoft 365 E5", name: "Microsoft 365 E5 (Enterprise Plan)" },
  { id: "Microsoft 365 E3", name: "Microsoft 365 E3 (Standard Enterprise)" },
  { id: "Office 365 F3", name: "Office 365 F3 (Firstline Workers)" },
  { id: "Enterprise Mobility + Security E5", name: "Enterprise Mobility + Security E5" }
];

const TEMPLATE_COMPUTERS: Record<string, (f: string, l: string, fInit: string, lInit: string, initials: string) => string> = {
  "firstname.lastname": (f, l) => `${f}.${l}`,
  "lastname.firstname": (f, l) => `${l}.${f}`,
  "firstinitial.lastname": (f, l, fInit, lInit, initials) => `${initials ? initials.toLowerCase() : fInit}.${l}`,
  "firstname.lastinitial": (f, l, fInit, lInit, initials) => `${f}.${initials ? initials.toLowerCase() : lInit}`,
  "firstinitiallastname": (f, l, fInit, lInit, initials) => `${initials ? initials.toLowerCase() : fInit}${l}`,
  "firstnamelastname": (f, l) => `${f}${l}`,
};



const parseList = (item: any): any[] => {
  if (Array.isArray(item)) return item;
  return item ? [item] : [];
};

const getActiveDomain = (adSettingsList: any[], m365SettingsList: any[], adId: string, m365Id: string) => {
  return adSettingsList.find(a => a.id === adId)?.domainName || 
         m365SettingsList.find(m => m.id === m365Id)?.microsoftDomain || 
         "company.local";
};

const computeEmailByTemplate = (fName: string, lName: string, template: string, activeDomain: string, initials?: string) => {
  const f = fName.toLowerCase().replace(/\s+/g, "");
  const l = lName.toLowerCase().replace(/\s+/g, "");
  if (!f && !l) return "";

  const computer = TEMPLATE_COMPUTERS[template] || TEMPLATE_COMPUTERS["firstname.lastname"];
  const prefix = computer(f, l, f.charAt(0), l.charAt(0), initials || "");
  return `${prefix}@${activeDomain}`;
};

const PREDEFINED_LOCATIONS = [
  {
    name: "Custom Address",
    street: "",
    city: "",
    stateProvince: "",
    zipPostalCode: "",
    country: ""
  },
  {
    name: "Austin Headquarters",
    street: "100 Congress Ave., Suite 2000",
    city: "Austin",
    stateProvince: "TX",
    zipPostalCode: "78701",
    country: "United States"
  },
  {
    name: "New York Office",
    street: "530 7th Ave, Suite 902",
    city: "New York",
    stateProvince: "NY",
    zipPostalCode: "10018",
    country: "United States"
  },
  {
    name: "London Hub",
    street: "30 St Mary Axe, Aldgate",
    city: "London",
    stateProvince: "Greater London",
    zipPostalCode: "EC3A 8BF",
    country: "United Kingdom"
  },
  {
    name: "San Francisco Branch",
    street: "1 Market St, Spear Tower",
    city: "San Francisco",
    stateProvince: "CA",
    zipPostalCode: "94105",
    country: "United States"
  }
];

// --- Extracted Helpers to reduce Cognitive Complexity ---

// Helper: read a value from localStorage safely (client-only)
const readStorage = (key: string): string | null =>
  globalThis.window ? localStorage.getItem(key) : null;

// Helper: derive first available domain from user JWT fallback
const getDomainFromUserStorage = (): string | null => {
  const userStr = readStorage('petrus_user');
  if (!userStr) return null;
  try {
    const user = JSON.parse(userStr);
    if (user.tenantName) return user.tenantName.toLowerCase() + '.com';
    return user.email?.split('@')[1] ?? null;
  } catch {
    return null;
  }
};

const getIntegratedDomains = (adSettingsList: any[], m365SettingsList: any[]): string[] => {
  const domains: string[] = [];
  adSettingsList.forEach(a => {
    if (a.domainName && !domains.includes(a.domainName)) domains.push(a.domainName);
  });
  m365SettingsList.forEach(m => {
    const d = m.microsoftDomain || m.tenantName;
    if (d && !domains.includes(d)) domains.push(d);
  });
  if (domains.length === 0) {
    const fallback = getDomainFromUserStorage();
    if (fallback) domains.push(fallback);
  }
  if (domains.length === 0) domains.push('petrus.io');
  return domains;
};

const initialTemplateForm = {
  name: "",
  description: "",
  domain: "petrus.io",
  category: "Default",
  activeDirectory: true,
  microsoft365: false,
  selectedLocation: "Custom Address",
  
  // General Tab
  firstName: "",
  initials: "",
  lastName: "",
  logonNameFormat: "FirstName + LastName",
  logonPre2000: "PETRUS\\",
  fullNameFormat: "Same as logonname",
  displayNameFormat: "Same as logonname",
  employeeId: "",
  descriptionGeneral: "",
  office: "",
  telephoneNumber: "",
  emailFormat: "Same as logonname",
  webPage: "",
  selectContainer: "CN=Users,DC=petrus,DC=io",
  protectFromDeletion: false,

  // Account Tab
  passwordOption: "Random",
  customPassword: "",
  memberOf: "Domain Users",
  logonScript: "",
  profilePath: "",
  homeFolderOption: "Local",
  homeFolderPath: "",
  userMustChangePassword: true,
  userCannotChangePassword: false,
  passwordNeverExpires: false,
  accountDisabled: false,
  smartCardRequired: false,

  // Contact Tab
  homePhone: "",
  pager: "",
  mobile: "",
  fax: "",
  ipPhone: "",
  notes: "",
  title: "",
  department: "",
  company: "",
  manager: "",
  street: "",
  poBox: "",
  city: "",
  stateProvince: "",
  zipPostalCode: "",
  country: "",

  // Microsoft 365 Tab
  m365License: "Microsoft 365 E5",
  createWithoutLicense: false
};

const getInitialTemplateFormWithDomain = (adSettingsList: any[], m365SettingsList: any[]) => {
  const domains = getIntegratedDomains(adSettingsList, m365SettingsList);
  const defaultDomain = domains[0] || "petrus.io";
  const defaultPrefix = defaultDomain.split('.')[0].toUpperCase() + "\\";
  return {
    ...initialTemplateForm,
    domain: defaultDomain,
    logonPre2000: defaultPrefix
  };
};

// Shared GPO-compliant password generator
const buildGpoPassword = (): string => {
  const upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lower = 'abcdefghijklmnopqrstuvwxyz';
  const numbers = '0123456789';
  const symbols = '!@#$%^&*()_+=-';
  const pick = (pool: string) => {
    const randomArray = new Uint32Array(1);
    crypto.getRandomValues(randomArray);
    return pool.charAt(randomArray[0] % pool.length);
  };
  const raw = [
    ...Array.from({ length: 3 }, () => pick(upper)),
    ...Array.from({ length: 3 }, () => pick(lower)),
    ...Array.from({ length: 3 }, () => pick(numbers)),
    ...Array.from({ length: 3 }, () => pick(symbols)),
    ...Array.from({ length: 2 }, () => pick(lower)),
  ];
  for (let i = raw.length - 1; i > 0; i--) {
    const randomArray = new Uint32Array(1);
    crypto.getRandomValues(randomArray);
    const j = randomArray[0] % (i + 1);
    [raw[i], raw[j]] = [raw[j], raw[i]];
  }
  return raw.join('');
};

const getAttrBtnClass = (required: boolean | undefined, enabled: boolean): string => {
  if (required) return 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed';
  if (enabled)  return 'bg-red-50 dark:bg-red-900/20 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/40';
  return 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/40';
};
const getAttrBtnLabel = (required: boolean | undefined, enabled: boolean): string => {
  if (required) return 'Required';
  return enabled ? 'Remove' : 'Add';
};


type JobModalProps = { isOpen: boolean, onClose: () => void, successStatus: boolean | null, message?: string };
const JobCompletionModal = ({ isOpen, onClose, successStatus, message }: JobModalProps) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl max-w-md w-full p-6 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex flex-col items-center text-center space-y-4">
          <div className={`h-16 w-16 rounded-full flex items-center justify-center ${successStatus ? 'bg-emerald-100 dark:bg-emerald-900/30' : 'bg-red-100 dark:bg-red-900/30'}`}>
            {successStatus ? <CheckCircle2 className="h-8 w-8 text-emerald-600 dark:text-emerald-400" /> : <XCircle className="h-8 w-8 text-red-600 dark:text-red-400" />}
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">
              {successStatus ? 'Job Completed Successfully' : 'Job Failed'}
            </h3>
            <p className="text-sm text-slate-500 mt-2">
              {message || (successStatus ? 'The operation was executed successfully.' : 'There were errors during the operation.')}
            </p>
          </div>
          <button onClick={onClose} className="w-full mt-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl py-2.5 font-medium transition-colors">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

type ManagerSelectProps = { value: string, onChange: (val: string) => void, options: { name: string, dn: string }[] };
const ManagerSelect = ({ value, onChange, options }: ManagerSelectProps) => {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");
  const filtered = options.filter(o => o.name.toLowerCase().includes(search.toLowerCase()));
  const selected = options.find(o => o.dn === value);

  return (
    <div className="relative">
      <div 
        className="w-full bg-slate-50 dark:bg-slate-950/70 border border-slate-300 dark:border-slate-700/50 rounded-xl px-3 py-1.5 text-xs text-slate-800 dark:text-white cursor-pointer flex justify-between items-center"
        onClick={() => setOpen(!open)}
      >
        <span>{selected ? selected.name : "Select Manager"}</span>
      </div>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute z-50 w-full mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg max-h-48 overflow-y-auto">
            <input 
              type="text" 
              placeholder="Search..." 
              className="w-full p-2 text-xs border-b border-slate-200 dark:border-slate-700 bg-transparent text-slate-800 dark:text-white outline-none"
              value={search}
              onChange={e => setSearch(e.target.value)}
              onClick={e => e.stopPropagation()}
            />
            {filtered.map(opt => (
              <div 
                key={opt.dn} 
                className="px-3 py-2 text-xs cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-300"
                onClick={() => { onChange(opt.dn); setOpen(false); setSearch(""); }}
              >
                {opt.name}
              </div>
            ))}
            {filtered.length === 0 && <div className="px-3 py-2 text-xs text-slate-500">No users found</div>}
          </div>
        </>
      )}
    </div>
  );
};

type AdGroupMultiSelectProps = { selectedDns: string[], onChange: (val: string[]) => void, options: { name: string, dn: string }[] };
const AdGroupMultiSelect = ({ selectedDns, onChange, options }: AdGroupMultiSelectProps) => {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");
  const filtered = options.filter(o => o.name.toLowerCase().includes(search.toLowerCase()));

  const toggleSelection = (dn: string) => {
    if (selectedDns.includes(dn)) {
      onChange(selectedDns.filter(d => d !== dn));
    } else {
      onChange([...selectedDns, dn]);
    }
  };

  return (
    <div className="relative">
      <div 
        className="w-full text-xs bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg px-2.5 py-2 text-slate-800 dark:text-white cursor-pointer"
        onClick={() => setOpen(!open)}
      >
        {selectedDns.length > 0 ? `${selectedDns.length} groups selected` : "-- Select Groups --"}
      </div>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute z-50 w-full mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg max-h-48 overflow-y-auto">
            <input 
              type="text" 
              placeholder="Search groups..." 
              className="w-full p-2 text-xs border-b border-slate-200 dark:border-slate-700 bg-transparent text-slate-800 dark:text-white outline-none"
              value={search}
              onChange={e => setSearch(e.target.value)}
              onClick={e => e.stopPropagation()}
            />
            {filtered.map(opt => (
              <div 
                key={opt.dn} 
                className="px-3 py-2 text-xs cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2 text-slate-800 dark:text-slate-300"
                onClick={(e) => { e.stopPropagation(); toggleSelection(opt.dn); }}
              >
                <input type="checkbox" checked={selectedDns.includes(opt.dn)} readOnly className="rounded border-slate-300 dark:border-slate-700" />
                {opt.name}
              </div>
            ))}
            {filtered.length === 0 && <div className="px-3 py-2 text-xs text-slate-500">No groups found</div>}
          </div>
        </>
      )}
    </div>
  );
};

export default function UserManagementPage() {
  const [jobModal, setJobModal] = React.useState<{isOpen: boolean, success: boolean | null, message: string}>({isOpen: false, success: null, message: ''});

  const router = useRouter();

  // Integrations settings state
  const [adSettingsList, setAdSettingsList] = useState<any[]>([]);
  const [m365SettingsList, setM365SettingsList] = useState<any[]>([]);
  const [adUserList, setAdUserList] = useState<{ name: string; dn: string; email?: string }[]>([]);

  // OU Browser modal state
  const [showOuBrowser, setShowOuBrowser] = useState(false);
  const [ouBrowserTarget, setOuBrowserTarget] = useState<"template" | "form">("template");
  const [ouBrowserSearch, setOuBrowserSearch] = useState("");
  const [ouList, setOuList] = useState<{ name: string; dn: string; path: string }[]>([]);
  const [ouListLoading, setOuListLoading] = useState(false);
  const [groupList, setGroupList] = useState<{ name: string; dn: string; path: string }[]>([]);

  const openOuBrowser = async (target: "template" | "form") => {
    setOuBrowserTarget(target);
    setShowOuBrowser(true);
    setOuBrowserSearch("");
    setOuList([]);
    // Pick the first connected AD settings ID
    const adId = adSettingsList[0]?.id;
    if (!adId) return;
    setOuListLoading(true);
    try {
      const token = readStorage('petrus_token');
      const res = await fetch(`http://localhost:3001/settings/ad/${adId}/ou`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setOuList(data);
      }
    } catch {
      setOuList([]);
    } finally {
      setOuListLoading(false);
    }
  };

  // Attributes panel state
  const [attrSearch, setAttrSearch] = useState("");
  const [enabledAttributes, setEnabledAttributes] = useState<string[]>([
    "firstName", "lastName", "initials", "logonNameFormat", "logonPre2000",
    "fullNameFormat", "displayNameFormat", "employeeId", "office", "telephoneNumber",
    "emailFormat", "selectContainer", "protectFromDeletion",
    "passwordOption", "memberOf", "logonScript", "profilePath",
    "userMustChangePassword", "userCannotChangePassword", "passwordNeverExpires",
    "accountDisabled", "smartCardRequired",
    "homePhone", "mobile", "fax", "title", "department", "company",
    "street", "city", "stateProvince", "zipPostalCode", "country",
    "m365License"
  ]);

  const [officesList, setOfficesList] = useState<any[]>([]);
  const [departmentsList, setDepartmentsList] = useState<any[]>([]);

  // User Creation Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCreatingUser, setIsCreatingUser] = useState(false);
  const [showTerminal, setShowTerminal] = useState(false);
  const [creationLogs, setCreationLogs] = useState<string[]>([]);
  const [creationSuccessStatus, setCreationSuccessStatus] = useState<boolean | null>(null);
 
  // Bulk Creation modal states
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [bulkUsersList, setBulkUsersList] = useState<any[]>([]);
  const [globalBulkConfig, setGlobalBulkConfig] = useState({
    createInAd: true,
    createInM365: false,
    adSettingsId: "",
    m365SettingsId: "",
    m365License: "Microsoft 365 E5",
    createWithoutLicense: false,
    targetOu: "",
    adGroupDns: [] as string[]
  });

  // Email check state
  const [emailAvailable, setEmailAvailable] = useState<boolean | null>(null);
  const [checkingEmail, setCheckingEmail] = useState(false);
  const [emailTemplate, setEmailTemplate] = useState("firstname.lastname");

  // Custom User Creation Templates workspace states
  const [showTemplatesWorkspace, setShowTemplatesWorkspace] = useState(false);
  const [showTemplateEditor, setShowTemplateEditor] = useState(false);
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null);
  const [activeTemplateTab, setActiveTemplateTab] = useState("General");
  
  const [customTemplates, setCustomTemplates] = useState<any[]>([
    {
      id: "tpl-1",
      name: "Mobile User Creation",
      createdBy: String.raw`Petrus Directory Authority\admin`,
      createdOn: "2016-07-28 22:59:27",
      lastModified: "2016-07-28 22:59:27",
      category: "Default",
      description: "Default Template to create user with mobile application.",
      domainName: "All Domains",
      data: {
        jobTitle: "Mobile Engineer",
        department: "Engineering",
        office: "San Francisco HQ",
        createInAd: true,
        createInM365: true,
        targetOu: "OU=Mobile,OU=Employees",
        adGroupDns: ["CN=Mobile-Users,CN=Users"],
        m365License: "Microsoft 365 E5",
        createWithoutLicense: false
      }
    },
    {
      id: "tpl-2",
      name: "Mailbox Enabled Template",
      createdBy: String.raw`Petrus Directory Authority\admin`,
      createdOn: "2013-10-29 18:30:00",
      lastModified: "2013-10-29 19:30:00",
      category: "Default",
      description: "Domain users with mail box",
      domainName: "All Domains",
      data: {
        jobTitle: "Staff Associate",
        department: "Operations",
        office: "New York HQ",
        createInAd: true,
        createInM365: true,
        targetOu: "OU=Operations,OU=Employees",
        adGroupDns: ["CN=Domain Users,CN=Users"],
        m365License: "Microsoft 365 E3",
        createWithoutLicense: false
      }
    },
    {
      id: "tpl-3",
      name: "User Creation with basic Attributes",
      createdBy: String.raw`Petrus Directory Authority\admin`,
      createdOn: "2013-10-29 18:30:00",
      lastModified: "2013-10-29 19:30:00",
      category: "test",
      description: "Template to create user with essential attributes",
      domainName: "All Domains",
      data: {
        jobTitle: "Business Analyst",
        department: "Product Management",
        office: "Austin Branch",
        createInAd: true,
        createInM365: false,
        targetOu: "OU=Product,OU=Employees",
        adGroupDns: ["CN=Product-Group,CN=Users"],
        m365License: "Microsoft 365 E5",
        createWithoutLicense: false
      }
    }
  ]);



  const [templateForm, setTemplateForm] = useState<typeof initialTemplateForm>(getInitialTemplateFormWithDomain(adSettingsList, m365SettingsList));

  const initialFormData = {
    email: "",
    firstName: "",
    initials: "",
    lastName: "",
    displayName: "",
    password: "",
    createInAd: true,
    createInM365: false,
    adSettingsId: "",
    m365SettingsId: "",
    selectedTemplate: "default",
    
    // Profile info
    jobTitle: "",
    department: "",
    office: "",
    officePhone: "",
    faxNumber: "",
    mobileNumber: "",
    streetAddress: "",
    city: "",
    stateProvince: "",
    zipPostalCode: "",
    countryRegion: "",
    
    // Additional profile info
    employeeId: "",
    descriptionGeneral: "",
    webPage: "",
    homePhone: "",
    pager: "",
    ipPhone: "",
    notes: "",
    company: "",
    manager: "",
    poBox: "",


    // Licensing info
    m365License: "Microsoft 365 E5",
    createWithoutLicense: false,
    
    // AD placement info
    targetOu: "",
    adGroupDns: [] as string[]
  };
  const [singleUserFormData, setSingleUserFormData] = useState(initialFormData);

  useEffect(() => {
    fetchIntegrations();
  }, []);

  useEffect(() => {
    if (singleUserFormData.email) {
      checkEmailAvailability(singleUserFormData.email);
    } else {
      setEmailAvailable(null);
    }
  }, [singleUserFormData.email]);

  useEffect(() => {
    const fetchOusForWizard = async () => {
      const adId = singleUserFormData.adSettingsId;
      if (!adId) return;
      setOuListLoading(true);
      try {
        const token = localStorage.getItem('petrus_token');
        const res = await fetch(`http://localhost:3001/settings/ad/${adId}/ou`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setOuList(data);
        }
      } catch {
        setOuList([]);
      } finally {
        setOuListLoading(false);
      }
    };
    fetchOusForWizard();
  }, [singleUserFormData.adSettingsId]);

  useEffect(() => {
    const fetchGroupsForWizard = async () => {
      const adId = singleUserFormData.adSettingsId;
      if (!adId) return;
      try {
        const token = localStorage.getItem('petrus_token');
        const res = await fetch(`http://localhost:3001/settings/ad/${adId}/groups`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setGroupList(data);
        }
      } catch {
        setGroupList([]);
      }
    };
    fetchGroupsForWizard();
  }, [singleUserFormData.adSettingsId]);

  useEffect(() => {
    const fetchAdUsersForWizard = async () => {
      const adId = singleUserFormData.adSettingsId;
      if (!adId) return;
      try {
        const token = localStorage.getItem('petrus_token');
        const res = await fetch(`http://localhost:3001/settings/ad/${adId}/users`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setAdUserList(data);
        }
      } catch {
        setAdUserList([]);
      }
    };
    fetchAdUsersForWizard();
  }, [singleUserFormData.adSettingsId]);

  const fetchTemplates = async () => {
    try {
      const token = localStorage.getItem("petrus_token");
      const res = await fetch("http://localhost:3001/users/templates", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        const customTpls = Array.isArray(data) ? data : [];
        setCustomTemplates(prev => {
          const map = new Map();
          prev.forEach(t => map.set(t.id, t));
          customTpls.forEach((t: any) => map.set(t.id, t));
          return Array.from(map.values());
        });
      }
    } catch (e) {
      console.error("Failed to load templates", e);
    }
  };

  const saveTemplateToBackend = async (tpl: any) => {
    // Optimistic/Local state update first
    setCustomTemplates(prev => {
      const idx = prev.findIndex(t => t.id === tpl.id);
      if (idx !== -1) {
        const copy = [...prev];
        copy[idx] = tpl;
        return copy;
      }
      return [tpl, ...prev];
    });

    try {
      const token = localStorage.getItem("petrus_token");
      await fetch("http://localhost:3001/users/templates", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(tpl)
      });
      await fetchTemplates();
    } catch (e) {
      console.error("Failed to save template", e);
    }
  };

  const deleteTemplateFromBackend = async (id: string) => {
    // Optimistic / local state fallback deletion
    setCustomTemplates(prev => prev.filter(t => t.id !== id));
    try {
      const token = localStorage.getItem("petrus_token");
      await fetch(`http://localhost:3001/users/templates/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      await fetchTemplates();
    } catch (e) {
      console.error("Failed to delete template", e);
    }
  };

  const handleSettingsData = (data: any) => {
    const adList = parseList(data.adSettings);
    const m365List = parseList(data.m365Settings);

    setAdSettingsList(adList);
    setM365SettingsList(m365List);
    
    if (adList.length > 0) {
      setSingleUserFormData(prev => ({ ...prev, adSettingsId: adList[0].id }));
    }
    if (m365List.length > 0) {
      setSingleUserFormData(prev => ({ ...prev, m365SettingsId: m365List[0].id }));
    }

    const domains: string[] = [];
    adList.forEach(a => {
      if (a.domainName && !domains.includes(a.domainName)) domains.push(a.domainName);
    });
    m365List.forEach(m => {
      const d = m.microsoftDomain || m.tenantName;
      if (d && !domains.includes(d)) domains.push(d);
    });

    if (domains.length > 0) {
      const defaultDomain = domains[0];
      const defaultPrefix = defaultDomain.split('.')[0].toUpperCase() + "\\";
      setTemplateForm(prev => ({ ...prev, domain: defaultDomain, logonPre2000: defaultPrefix }));
    } else {
      const fallbackDomain = getDomainFromUserStorage();
      if (fallbackDomain) {
        const defaultPrefix = fallbackDomain.split('.')[0].toUpperCase() + "\\";
        setTemplateForm(prev => ({ ...prev, domain: fallbackDomain, logonPre2000: defaultPrefix }));
      }
    }
  };

  const fetchIntegrations = async () => {
    try {
      const token = localStorage.getItem("petrus_token");
      const headers = { Authorization: `Bearer ${token}` };

      await fetchTemplates();

      const resSettings = await fetch("http://localhost:3001/settings", { headers });
      if (resSettings.ok) {
        handleSettingsData(await resSettings.json());
      }

      // 2. Fetch departments
      const resDep = await fetch("http://localhost:3001/settings/departments", { headers });
      if (resDep.ok) {
        const depData = await resDep.json();
        setDepartmentsList(Array.isArray(depData) ? depData : []);
      }

      // 3. Fetch offices
      const resOff = await fetch("http://localhost:3001/settings/offices", { headers });
      if (resOff.ok) {
        const offData = await resOff.json();
        setOfficesList(Array.isArray(offData) ? offData : []);
      }
    } catch (e) {
      console.error("Failed to load platform settings", e);
    }
  };

  // AD GPO Compliant Secure Password Generator
  const generateAdGpoPassword = () => {
    setSingleUserFormData(prev => ({ ...prev, password: buildGpoPassword() }));
  };

  const checkEmailAvailability = async (emailToCheck: string) => {
    if (!emailToCheck?.includes("@")) return;
    setCheckingEmail(true);
    setEmailAvailable(null);
    try {
      const token = localStorage.getItem("petrus_token");
      const res = await fetch(`http://localhost:3001/users/check-availability?email=${encodeURIComponent(emailToCheck)}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.ok) {
        const data = await res.json();
        setEmailAvailable(data.available);
      }
    } catch (e) {
      console.error("Availability check failed", e);
    } finally {
      setCheckingEmail(false);
    }
  };

  const handleNameChange = (field: "firstName" | "lastName", value: string) => {
    setSingleUserFormData(prev => {
      const updated = { ...prev, [field]: value };
      const fName = field === "firstName" ? value : prev.firstName;
      const lName = field === "lastName" ? value : prev.lastName;
      
      // Auto-compute READ-ONLY display name
      const displayInitials = prev.initials ? ` ${prev.initials}` : "";
      updated.displayName = `${fName}${displayInitials} ${lName}`.trim().replace(/\s+/g, " ");
      
      // Auto-compute principal email using template selection
      updated.email = computeEmailByTemplate(
        fName, 
        lName, 
        emailTemplate, 
        getActiveDomain(adSettingsList, m365SettingsList, prev.adSettingsId, prev.m365SettingsId),
        prev.initials
      );
      
      return updated;
    });
  };

  const handleInitialsChange = (value: string) => {
    setSingleUserFormData(prev => {
      const updated = { ...prev, initials: value };
      
      // Auto-compute READ-ONLY display name
      const displayInitials = value ? ` ${value}` : "";
      updated.displayName = `${prev.firstName}${displayInitials} ${prev.lastName}`.trim().replace(/\s+/g, " ");
      
      // Auto-compute principal email using template selection
      updated.email = computeEmailByTemplate(
        prev.firstName, 
        prev.lastName, 
        emailTemplate, 
        getActiveDomain(adSettingsList, m365SettingsList, prev.adSettingsId, prev.m365SettingsId),
        value
      );
      
      return updated;
    });
  };

  const handleTemplateChange = (templateId: string) => {
    setEmailTemplate(templateId);
    setSingleUserFormData(prev => {
      const updatedEmail = computeEmailByTemplate(
        prev.firstName,
        prev.lastName,
        templateId,
        getActiveDomain(adSettingsList, m365SettingsList, prev.adSettingsId, prev.m365SettingsId),
        prev.initials
      );
      return { ...prev, email: updatedEmail };
    });
  };

  const allTemplates = [
    ...customTemplates.map(t => ({
      id: t.id,
      name: t.name,
      data: t.data
    }))
  ];

  const handleUserTemplateChange = (templateId: string) => {
    const template = allTemplates.find(t => t.id === templateId);
    if (!template) {
      setSingleUserFormData(prev => ({ ...prev, selectedTemplate: templateId }));
      return;
    }
    const customTpl = customTemplates.find(t => t.id === templateId);
    const tplData = template.data || {};
    setSingleUserFormData(prev => ({
      ...prev,
      selectedTemplate: templateId,
      jobTitle:             tplData.jobTitle ?? prev.jobTitle,
      department:           tplData.department ?? prev.department,
      office:               tplData.office ?? prev.office,
      createInAd:           tplData.createInAd ?? prev.createInAd,
      createInM365:         tplData.createInM365 ?? prev.createInM365,
      targetOu:             tplData.targetOu ?? prev.targetOu,
      adGroupDn:            tplData.adGroupDn ?? prev.adGroupDn,
      m365License:          tplData.m365License ?? prev.m365License,
      createWithoutLicense: tplData.createWithoutLicense ?? prev.createWithoutLicense,
      ...(customTpl ? {
        officePhone:   customTpl.data?.telephoneNumber ?? prev.officePhone,
        streetAddress: customTpl.data?.street ?? prev.streetAddress,
        city:          customTpl.data?.city ?? prev.city,
        stateProvince: customTpl.data?.stateProvince ?? prev.stateProvince,
        zipPostalCode: customTpl.data?.zipPostalCode ?? prev.zipPostalCode,
        countryRegion: customTpl.data?.country ?? prev.countryRegion,
      } : {})
    }));
  };

  const handleDomainChange = (settingsType: "ad" | "m365", selectedId: string) => {
    setSingleUserFormData(prev => {
      const updated = { ...prev };
      if (settingsType === "ad") {
        updated.adSettingsId = selectedId;
      } else {
        updated.m365SettingsId = selectedId;
      }
      
      // Update email UPN based on updated domains
      updated.email = computeEmailByTemplate(
        prev.firstName,
        prev.lastName,
        emailTemplate,
        getActiveDomain(adSettingsList, m365SettingsList, updated.adSettingsId, updated.m365SettingsId),
        prev.initials
      );
      
      return updated;
    });
  };

  const filterSingleUserPayload = (formData: any, enabledAttrs: string[]) => {
    const payload = { ...formData };
    const mappings: Record<string, string> = {
      initials: "initials",
      title: "jobTitle",
      department: "department",
      office: "office",
      telephoneNumber: "officePhone",
      fax: "faxNumber",
      mobile: "mobileNumber",
      street: "streetAddress",
      city: "city",
      stateProvince: "stateProvince",
      zipPostalCode: "zipPostalCode",
      country: "countryRegion",
      m365License: "m365License"
    };
    for (const [attrKey, payloadKey] of Object.entries(mappings)) {
      if (!enabledAttrs.includes(attrKey)) {
        payload[payloadKey] = "";
      }
    }
    return payload;
  };

  const handleCreateUserSubmit = async (e: any) => {
    e.preventDefault();
    if (!singleUserFormData.createInAd && !singleUserFormData.createInM365) {
      setJobModal({isOpen: true, success: false, message: "Please select at least one target directory (Active Directory or Microsoft 365)."});
      return;
    }

    if (emailAvailable === false) {
      setJobModal({isOpen: true, success: false, message: "Please choose a unique email. The currently selected address is already taken."});
      return;
    }
    
    setIsCreatingUser(true);
    setCreationLogs([]);
    setCreationSuccessStatus(null);
    setShowTerminal(true);
    
    const activeTemplate = allTemplates.find(t => t.id === singleUserFormData.selectedTemplate);
    const activeEnabledAttributes = activeTemplate?.data?.enabledAttributes || [
      "firstName", "lastName", "initials", "logonNameFormat", "logonPre2000",
      "fullNameFormat", "displayNameFormat", "employeeId", "office", "telephoneNumber",
      "emailFormat", "selectContainer", "protectFromDeletion",
      "passwordOption", "memberOf", "logonScript", "profilePath",
      "userMustChangePassword", "userCannotChangePassword", "passwordNeverExpires",
      "accountDisabled", "smartCardRequired",
      "homePhone", "mobile", "fax", "title", "department", "company",
      "street", "city", "stateProvince", "zipPostalCode", "country",
      "m365License"
    ];

    const payload = filterSingleUserPayload(singleUserFormData, activeEnabledAttributes);

    try {
      const token = localStorage.getItem("petrus_token");
      const res = await fetch("http://localhost:3001/users/create-single", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      
      const data = await res.json();
      if (data.logs) {
        for (const log of data.logs) {
          await new Promise(r => setTimeout(r, 200));
          setCreationLogs(prev => [...prev, log]);
        }
      }
      
      if (res.ok && data.success) {
        setCreationSuccessStatus(true);
      } else {
        const errorMsg = data.message || "Failed to create user.";
        setCreationLogs(prev => [...prev, `[ERROR] ${errorMsg}`]);
        setCreationSuccessStatus(false);
      }
    } catch (err: any) {
      console.error(err);
      setCreationLogs(prev => [...prev, `[ERROR] Connection failed: ${err.message}`]);
      setCreationSuccessStatus(false);
    } finally {
      setIsCreatingUser(false);
    }
  };

  const createEmptyBulkUserRow = () => {
    return {
      id: crypto.randomUUID(),
      firstName: "",
      initials: "",
      lastName: "",
      displayName: "",
      email: "",
      password: buildGpoPassword(),
      jobTitle: "Systems Engineer",
      department: departmentsList[0]?.name || "Engineering",
      office: officesList[0]?.name || "New York HQ",
      officePhone: "",
      faxNumber: "",
      mobileNumber: "555-0199",
      streetAddress: "100 Main St",
      city: "New York",
      stateProvince: "NY",
      zipPostalCode: "10001",
      countryRegion: "United States"
    };
  };

  const handleBulkRowFieldChange = (rowId: string, field: string, value: string) => {
    setBulkUsersList(prev => prev.map(row => {
      if (row.id !== rowId) return row;
      const updated = { ...row, [field]: value };
      if (field === "firstName" || field === "lastName" || field === "initials") {
        const displayInitials = updated.initials ? ` ${updated.initials}` : "";
        updated.displayName = `${updated.firstName}${displayInitials} ${updated.lastName}`.trim().replace(/\s+/g, " ");
        updated.email = computeEmailByTemplate(
          updated.firstName,
          updated.lastName,
          emailTemplate,
          getActiveDomain(adSettingsList, m365SettingsList, globalBulkConfig.adSettingsId, globalBulkConfig.m365SettingsId),
          updated.initials
        );
      }
      return updated;
    }));
  };

  const handleBulkRowPasswordGenerate = (rowId: string) => {
    const shuffled = buildGpoPassword();
    setBulkUsersList(prev => prev.map(row => {
      if (row.id === rowId) return { ...row, password: shuffled };
      return row;
    }));
  };

  const handleAddBulkRow = () => {
    setBulkUsersList(prev => [...prev, createEmptyBulkUserRow()]);
  };

  const handleRemoveBulkRow = (rowId: string) => {
    setBulkUsersList(prev => prev.filter(r => r.id !== rowId));
  };

  const handleLoadBulkSampleData = () => {
    const sampleNames = [
      { first: "Alice", last: "Smith", initials: "K", title: "HR Business Partner", dep: "Human Resources", phone: "555-0101", office: officesList[0]?.name || "New York HQ" },
      { first: "Bob", last: "Johnson", initials: "M", title: "Sales Director", dep: "Sales", phone: "555-0102", office: officesList[0]?.name || "New York HQ" },
      { first: "Charlie", last: "Williams", initials: "", title: "Lead Architect", dep: "Engineering", phone: "555-0103", office: officesList[0]?.name || "New York HQ" },
      { first: "Diana", last: "Brown", initials: "A", title: "Financial Analyst", dep: "Finance", phone: "555-0104", office: officesList[0]?.name || "New York HQ" },
      { first: "Ethan", last: "Davis", initials: "T", title: "Support Lead", dep: "Support", phone: "555-0105", office: officesList[0]?.name || "New York HQ" }
    ];
    
    const mapped = sampleNames.map((item, idx) => {
      const displayInitials = item.initials ? ` ${item.initials}` : "";
      const dName = `${item.first}${displayInitials} ${item.last}`.trim().replace(/\s+/g, " ");
      const email = computeEmailByTemplate(
        item.first,
        item.last,
        emailTemplate,
        getActiveDomain(adSettingsList, m365SettingsList, globalBulkConfig.adSettingsId, globalBulkConfig.m365SettingsId),
        item.initials
      );
      
      return {
        id: crypto.randomUUID(),
        firstName: item.first,
        initials: item.initials,
        lastName: item.last,
        displayName: dName,
        email: email,
        password: buildGpoPassword(),
        jobTitle: item.title,
        department: item.dep,
        office: item.office,
        officePhone: item.phone,
        faxNumber: "",
        mobileNumber: `555-019${idx}`,
        streetAddress: "100 Main St",
        city: "New York",
        stateProvince: "NY",
        zipPostalCode: "10001",
        countryRegion: "United States"
      };
    });
    
    setBulkUsersList(mapped);
  };

  const handleDownloadSampleCSV = () => {
    const csvHeaders = "FirstName,Initials,LastName,JobTitle,Department,Office,MobileNumber,Email\n";
    const csvRows = [
      "Jane,A,Smith,Marketing Specialist,Marketing,Bangalore HQ,555-0201,jane.smith@company.local",
      "John,,Doe,Systems Engineer,Engineering,Bangalore HQ,555-0202,john.doe@company.local",
      "Robert,M,Johnson,Sales Manager,Sales,Bangalore HQ,555-0203,robert.johnson@company.local",
    ].join("\n");
    
    const csvBlob = new Blob([csvHeaders + csvRows], { type: "text/csv;charset=utf-8;" });
    const csvUrl = URL.createObjectURL(csvBlob);
    const link = document.createElement("a");
    link.href = csvUrl;
    link.setAttribute("download", "petrus_bulk_users_sample.csv");
    document.body.appendChild(link);
    link.click();
  };

  const handleAttributeToggle = (key: string, required?: boolean, isEnabled?: boolean) => {
    if (required) return;
    setEnabledAttributes(prev =>
      isEnabled ? prev.filter(k => k !== key) : [...prev, key]
    );
  };

  const handleCSVUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      if (!text) return;

      const lines = text.split(/\r?\n/);
      if (lines.length <= 1) {
        setJobModal({isOpen: true, success: false, message: "CSV file seems to be empty or missing header rows."});
        return;
      }

      const headers = lines[0].split(",").map(h => h.trim().toLowerCase());
      const parsedRows: any[] = [];

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        const cols = line.split(",").map(c => c.trim());
        if (cols.length < headers.length) continue;

        const rowData: Record<string, string> = {};
        headers.forEach((header, index) => {
          rowData[header] = cols[index] || "";
        });

        const shuffledPassword = buildGpoPassword();

        const displayInitials = rowData.initials ? ` ${rowData.initials}` : "";
        const firstName = rowData.firstname || rowData["first name"] || "";
        const lastName = rowData.lastname || rowData["last name"] || "";
        const initials = rowData.initials || "";

        const dName = `${firstName}${displayInitials} ${lastName}`.trim().replace(/\s+/g, " ");
        const email = rowData.email || computeEmailByTemplate(
          firstName,
          lastName,
          emailTemplate,
          getActiveDomain(adSettingsList, m365SettingsList, globalBulkConfig.adSettingsId, globalBulkConfig.m365SettingsId) || "petrus.io",
          initials
        );

        parsedRows.push({
          id: crypto.randomUUID(),
          firstName,
          initials,
          lastName,
          displayName: dName,
          email: email,
          password: shuffledPassword,
          jobTitle: rowData.jobtitle || rowData["job title"] || "Systems Engineer",
          department: rowData.department || departmentsList[0]?.name || "Engineering",
          office: rowData.office || officesList[0]?.name || "Bangalore HQ",
          officePhone: rowData.officephone || rowData["office phone"] || "",
          faxNumber: "",
          mobileNumber: rowData.mobilenumber || rowData["mobile number"] || "555-0199",
          streetAddress: "100 Main St",
          city: "Bangalore",
          stateProvince: "KA",
          zipPostalCode: "560001",
          countryRegion: "India"
        });
      }

      if (parsedRows.length === 0) {
        setJobModal({isOpen: true, success: false, message: "Could not parse any valid rows from the CSV file."});
        return;
      }

      setBulkUsersList(parsedRows);
      setJobModal({isOpen: true, success: false, message: `Successfully imported ${parsedRows.length} users from CSV!`});
    } catch (err) {
      console.error("Error reading CSV file:", err);
      setJobModal({isOpen: true, success: false, message: "Failed to parse the CSV file. Please make sure the structure is correct."});
    } finally {
      e.target.value = "";
    }
  };

  const handleBulkCreateUserSubmit = async (e: any) => {
    e.preventDefault();
    if (!globalBulkConfig.createInAd && !globalBulkConfig.createInM365) {
      setJobModal({isOpen: true, success: false, message: "Please select at least one target directory (Active Directory or Microsoft 365)."});
      return;
    }
    
    const invalidRow = bulkUsersList.find(r => !r.firstName || !r.lastName || !r.email || !r.password || !r.jobTitle || !r.office);
    if (invalidRow) {
      setJobModal({isOpen: true, success: false, message: "Please ensure all rows have First Name, Last Name, Email, Password, Job Title and Office."});
      return;
    }

    setIsCreatingUser(true);
    setCreationLogs([]);
    setCreationSuccessStatus(null);
    setShowTerminal(true);

    try {
      const payloadUsers = bulkUsersList.map(row => ({
        ...row,
        createInAd: globalBulkConfig.createInAd,
        createInM365: globalBulkConfig.createInM365,
        adSettingsId: globalBulkConfig.adSettingsId,
        m365SettingsId: globalBulkConfig.m365SettingsId,
        m365License: globalBulkConfig.m365License,
        createWithoutLicense: globalBulkConfig.createWithoutLicense,
        targetOu: globalBulkConfig.targetOu,
        adGroupDn: globalBulkConfig.adGroupDn
      }));

      const token = localStorage.getItem("petrus_token");
      const res = await fetch("http://localhost:3001/users/create-bulk", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ users: payloadUsers }),
      });

      const data = await res.json();
      if (data.logs) {
        for (const log of data.logs) {
          await new Promise(r => setTimeout(r, 200));
          setCreationLogs(prev => [...prev, log]);
        }
      }
      
      if (res.ok && data.success) {
        setCreationSuccessStatus(true);
      } else {
        const errorMsg = data.message || "Failed to execute bulk user creation.";
        setCreationLogs(prev => [...prev, `[ERROR] ${errorMsg}`]);
        setCreationSuccessStatus(false);
      }
    } catch (err: any) {
      console.error(err);
      setCreationLogs(prev => [...prev, `[ERROR] Batch connection failed: ${err.message}`]);
      setCreationSuccessStatus(false);
    } finally {
      setIsCreatingUser(false);
    }
  };

  const setupSingleUserCreation = () => {
    const adId = adSettingsList[0]?.id || "";
    const m365Id = m365SettingsList[0]?.id || "";
    
    const defaultTplId = customTemplates.length > 0 ? customTemplates[0].id : "";
    
    const newForm = {
      ...initialFormData,
      password: buildGpoPassword(),
      adSettingsId: adId,
      m365SettingsId: m365Id,
      office: officesList[0]?.name || "",
      department: departmentsList[0]?.name || "",
      selectedTemplate: defaultTplId
    };
    
    if (defaultTplId) {
      const tplData = customTemplates[0].data || {};
      newForm.jobTitle = tplData.jobTitle ?? newForm.jobTitle;
      newForm.department = tplData.department ?? newForm.department;
      newForm.office = tplData.office ?? newForm.office;
      newForm.createInAd = tplData.createInAd ?? newForm.createInAd;
      newForm.createInM365 = tplData.createInM365 ?? newForm.createInM365;
      newForm.targetOu = tplData.targetOu ?? newForm.targetOu;
      newForm.adGroupDn = tplData.adGroupDn ?? newForm.adGroupDn;
      newForm.m365License = tplData.m365License ?? newForm.m365License;
      newForm.createWithoutLicense = tplData.createWithoutLicense ?? newForm.createWithoutLicense;
      newForm.officePhone = customTemplates[0].data?.telephoneNumber ?? newForm.officePhone;
      newForm.streetAddress = customTemplates[0].data?.street ?? newForm.streetAddress;
      newForm.city = customTemplates[0].data?.city ?? newForm.city;
      newForm.stateProvince = customTemplates[0].data?.stateProvince ?? newForm.stateProvince;
      newForm.zipPostalCode = customTemplates[0].data?.zipPostalCode ?? newForm.zipPostalCode;
      newForm.countryRegion = customTemplates[0].data?.country ?? newForm.countryRegion;
    }
    
    setSingleUserFormData(newForm);
    setEmailTemplate("firstname.lastname");
    setEmailAvailable(null);
    setShowTerminal(false);
    setCreationLogs([]);
    setCreationSuccessStatus(null);
    setIsModalOpen(true);
  };

  const setupBulkUserCreation = () => {
    const adId = adSettingsList[0]?.id || "";
    const m365Id = m365SettingsList[0]?.id || "";
    
    setGlobalBulkConfig({
      createInAd: true,
      createInM365: false,
      adSettingsId: adId,
      m365SettingsId: m365Id,
      m365License: "Microsoft 365 E5",
      createWithoutLicense: false,
      targetOu: "",
      adGroupDn: ""
    });
    
    setBulkUsersList([
      {
        id: crypto.randomUUID(),
        firstName: "",
        initials: "",
        lastName: "",
        displayName: "",
        email: "",
        password: buildGpoPassword(),
        jobTitle: "Systems Engineer",
        department: departmentsList[0]?.name || "",
        office: officesList[0]?.name || "",
        officePhone: "",
        faxNumber: "",
        mobileNumber: "",
        streetAddress: "",
        city: "",
        stateProvince: "",
        zipPostalCode: "",
        countryRegion: ""
      }
    ]);
    
    setShowTerminal(false);
    setCreationLogs([]);
    setCreationSuccessStatus(null);
    setIsBulkModalOpen(true);
  };

  const handleItemClick = (item: string) => {
    if (item === "Create Single User") {
      setupSingleUserCreation();
      return;
    }

    if (item === "User Creation Templates") {
      setShowTemplatesWorkspace(true);
      return;
    }

    if (item === "Create Bulk Users" || item === "Create Users") {
      setupBulkUserCreation();
      return;
    }

    if (item === "Manage Tenants" || item === "Add New Tenant" || item === "Tenant Isolation Profiles") {
      router.push("/tenants");
      return;
    }

    if (item === "Platform Audit Logs" || item === "System Audit Logs") {
      router.push("/audit");
      return;
    }

    if (item === "SMTP Integrations") {
      router.push("/settings/smtp");
      return;
    }

    if (item === "Global RBAC Roles") {
      router.push("/settings/rbac");
      return;
    }

    if (item === "MFA Enforcement Settings") {
      router.push("/settings/mfa");
      return;
    }

    const mappedPath = PATH_MAP[item];
    if (mappedPath) {
      router.push(mappedPath);
    } else {
      setJobModal({isOpen: true, success: false, message: `${item} functionality is coming soon.`});
    }
  };

  const renderAttributeRow = (attr: any) => {
    const isEnabled = enabledAttributes.includes(attr.key);
    return (
      <div key={attr.key} className={`flex items-center justify-between px-4 py-2.5 transition-colors ${
        isEnabled ? 'bg-white dark:bg-slate-900/60' : 'bg-slate-50/50 dark:bg-slate-950/30 opacity-60'
      }`}>
        <div className="flex items-center gap-2.5 min-w-0">
          <div className={`w-2 h-2 rounded-full shrink-0 ${
            isEnabled ? 'bg-indigo-500' : 'bg-slate-300 dark:bg-slate-700'
          }`} />
          <span className="text-[11px] text-slate-700 dark:text-slate-300 truncate">{attr.label}</span>
          {attr.required && <span className="text-[9px] text-red-500 font-bold shrink-0">REQ</span>}
        </div>
        <button
          type="button"
          disabled={attr.required}
          onClick={() => handleAttributeToggle(attr.key, attr.required, isEnabled)}
          className={`shrink-0 ml-2 text-[10px] px-2.5 py-1 rounded-lg font-bold transition-all ${getAttrBtnClass(attr.required, isEnabled)}`}
        >
          {getAttrBtnLabel(attr.required, isEnabled)}
        </button>
      </div>
    );
  };

  const sections = [
    {
      title: "User Management",
      groups: [
        {
          name: "User Creation",
          color: "text-emerald-600 dark:text-emerald-400",
          items: ["Create Single User", "Create Bulk Users"]
        },
        {
          name: "User Modification",
          color: "text-emerald-600 dark:text-emerald-400",
          items: ["Modify Single User", "Modify Bulk Users", "Modify Users Using Template"]
        },
        {
          name: "User Templates",
          color: "text-emerald-600 dark:text-emerald-400",
          items: ["User Creation Templates", "User Modification Templates"]
        },
        {
          name: "CSV Import",
          color: "text-emerald-600 dark:text-emerald-400",
          items: ["Create Users", "Modify Users", "Modify Users Using Template"]
        }
      ]
    },
    {
      title: "Bulk User Modification",
      groups: [
        {
          name: "General Attributes",
          color: "text-emerald-600 dark:text-emerald-400",
          items: ["Reset Password", "Unlock Users", "Profile Attributes", "Custom Attributes", "Manage User Photos"]
        },
        {
          name: "Group Attributes",
          color: "text-emerald-600 dark:text-emerald-400",
          items: ["Group Attributes", "Move Users", "Move/Delete HomeFolders", "Logon Hours"]
        },
        {
          name: "Account Actions",
          color: "text-emerald-600 dark:text-emerald-400",
          items: ["Enable/Disable Users", "Delete Users", "Restore Deleted Users", "Enable/Disable/Delete Skype Users", "Modify Skype policies"]
        },
        {
          name: "Other Attributes",
          color: "text-emerald-600 dark:text-emerald-400",
          items: ["Contact Attributes", "Address/Organization Attributes", "Naming Attributes", "User Workstations", "Inheritable Permissions"]
        }
      ]
    }
  ];

  return (
    <>
      <JobCompletionModal 
        isOpen={jobModal.isOpen} 
        onClose={() => setJobModal({...jobModal, isOpen: false})} 
        successStatus={jobModal.success} 
        message={jobModal.message} 
      />
      <ManagementConsoleLayout
        sections={sections}
        searchPlaceholder="Search User Tasks..."
        primaryActionLabel="Create User"
        tabs={[
          { name: "User Management", active: true },
          { name: "Bulk User Modification", active: false }
        ]}
        onItemClick={handleItemClick}
        onPrimaryActionClick={() => handleItemClick("Create Single User")}
      />

      {/* Single User Creation Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[94vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="p-5 border-b border-slate-200/50 dark:border-white/5 flex justify-between items-center shrink-0">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-indigo-600 dark:text-indigo-400 animate-pulse" />
                <h2 className="text-lg font-bold text-slate-800 dark:text-white font-outfit">
                  User Creation Wizard
                </h2>
              </div>
              <button 
                type="button" 
                onClick={() => setIsModalOpen(false)} 
                className="text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto flex-1 space-y-6">
              {showTerminal ? (
                /* Interactive Terminal Output logs */
                <div className="space-y-6">
                  <div className="bg-slate-950 border border-white/5 rounded-2xl p-6 font-mono text-xs text-emerald-400 min-h-[300px] max-h-[420px] overflow-y-auto space-y-2 shadow-inner">
                    <div className="flex items-center justify-between pb-3 border-b border-white/5 mb-3">
                      <span className="flex items-center gap-1 text-[10px] uppercase font-bold tracking-widest text-slate-400">
                        <Terminal className="h-3.5 w-3.5 text-emerald-500" /> Active Provisioning Channel
                      </span>
                      {isCreatingUser && (
                        <Loader2 className="h-3.5 w-3.5 animate-spin text-indigo-400" />
                      )}
                    </div>
                    {creationLogs.map((log, index) => {
                      let color = "text-emerald-400/90";
                      if (log.includes("[ERROR]")) color = "text-red-400 font-semibold";
                      if (log.includes("[M365]")) color = "text-sky-400";
                      if (log.includes("[AD]")) color = "text-indigo-400";
                      if (log.includes("[SIMULATION]")) color = "text-amber-400 italic";
                      if (log.includes("[Database]")) color = "text-emerald-500 font-medium";
                      return (
                        <p key={`log-${index}-${log.slice(0, 10)}`} className={`leading-relaxed ${color}`}>
                          {log}
                        </p>
                      );
                    })}
                    {creationLogs.length === 0 && (
                      <p className="text-slate-500 italic">Initializing provisioning scripts... please wait</p>
                    )}
                  </div>

                  {/* Status Banner */}
                  {creationSuccessStatus !== null && (
                    <div className={`p-4 rounded-xl border flex items-start gap-3 ${
                      creationSuccessStatus 
                        ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300" 
                        : "bg-red-500/10 border-red-500/30 text-red-300"
                    }`}>
                      {creationSuccessStatus ? (
                        <>
                          <Check className="h-5 w-5 shrink-0 text-emerald-400 mt-0.5" />
                          <div>
                            <h4 className="font-bold text-sm">Identity Synchronized</h4>
                            <p className="text-xs text-emerald-400/80 mt-1">
                              Account created successfully across your selected Active Directory domain and/or Microsoft Entra cloud directory!
                            </p>
                          </div>
                        </>
                      ) : (
                        <>
                          <ShieldAlert className="h-5 w-5 shrink-0 text-red-400 mt-0.5" />
                          <div>
                            <h4 className="font-bold text-sm">Provisioning Error</h4>
                            <p className="text-xs text-red-400/80 mt-1">
                              One or more integrations failed during the workflow validation. Please verify network routing or connection credentials.
                            </p>
                          </div>
                        </>
                      )}
                    </div>
                  )}

                  {/* Finish buttons */}
                  <div className="pt-4 border-t border-white/5 flex gap-3">
                    <button 
                      type="button" 
                      onClick={() => setShowTerminal(false)}
                      disabled={isCreatingUser}
                      className="flex-1 px-4 py-2.5 bg-slate-800 text-slate-200 rounded-xl hover:bg-slate-700 transition-colors font-semibold text-sm disabled:opacity-50"
                    >
                      Back to Form
                    </button>
                    <button 
                      type="button" 
                      onClick={() => setIsModalOpen(false)}
                      disabled={isCreatingUser}
                      className="flex-1 px-4 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-500 transition-all font-semibold text-sm shadow-lg shadow-indigo-500/20 disabled:opacity-50 disabled:opacity-50"
                    >
                      Close Wizard
                    </button>
                  </div>
                </div>
              ) : (() => {
                const activeTemplate = allTemplates.find(t => t.id === singleUserFormData.selectedTemplate);
                const activeEnabledAttributes = activeTemplate?.data?.enabledAttributes || [
                  "firstName", "lastName", "initials", "logonNameFormat", "logonPre2000",
                  "fullNameFormat", "displayNameFormat", "employeeId", "office", "telephoneNumber",
                  "emailFormat", "selectContainer", "protectFromDeletion",
                  "passwordOption", "memberOf", "logonScript", "profilePath",
                  "userMustChangePassword", "userCannotChangePassword", "passwordNeverExpires",
                  "accountDisabled", "smartCardRequired",
                  "homePhone", "mobile", "fax", "title", "department", "company",
                  "street", "city", "stateProvince", "zipPostalCode", "country",
                  "m365License"
                ];

                return (
                <form onSubmit={handleCreateUserSubmit} className="space-y-6">
                  {/* Grid Layout for Forms */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* LEFT PANEL: ACCOUNT BASICS & TARGETING */}
                    <div className="space-y-6">
                      <div className="bg-slate-50/50 dark:bg-slate-950/40 p-4 border border-slate-200/50 dark:border-white/5 rounded-2xl space-y-4">
                        <h3 className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest flex items-center gap-1.5 pb-2 border-b border-slate-200/50 dark:border-white/5">
                          <Info className="h-3.5 w-3.5" /> 1. Account Basics
                        </h3>

                        {/* User Creation Template Dropdown */}
                        <div className="space-y-1.5">
                          <label htmlFor="user-template-select" className="text-xs font-medium text-slate-600 dark:text-slate-300">User Creation Template</label>
                          <select 
                            id="user-template-select"
                            value={singleUserFormData.selectedTemplate}
                            onChange={e => handleUserTemplateChange(e.target.value)}
                            className="w-full bg-slate-50 dark:bg-slate-950/70 border border-slate-300 dark:border-slate-700/60 focus:border-indigo-500 rounded-xl px-3.5 py-2 text-sm text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/20"
                          >
                            {allTemplates.map(t => (
                              <option key={t.id} value={t.id}>{t.name}</option>
                            ))}
                          </select>
                        </div>

                        {/* First Name, Initials & Last Name */}
                        <div className="grid grid-cols-12 gap-3">
                          <div className="col-span-5 space-y-1.5">
                            <label htmlFor="user-first-name" className="text-xs font-medium text-slate-600 dark:text-slate-300">First Name</label>
                            <input 
                              id="user-first-name"
                              type="text" 
                              required
                              value={singleUserFormData.firstName} 
                              onChange={e => handleNameChange("firstName", e.target.value)}
                              className="w-full bg-slate-50 dark:bg-slate-950/70 border border-slate-300 dark:border-slate-700/60 focus:border-indigo-500 rounded-xl px-3.5 py-2 text-sm text-slate-800 dark:text-white focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
                              placeholder="e.g. John"
                            />
                          </div>
                          {activeEnabledAttributes.includes("initials") && (
                          <div className="col-span-2 space-y-1.5">
                            <label htmlFor="user-initials" className="text-xs font-medium text-slate-600 dark:text-slate-300">Initials</label>
                            <input 
                              id="user-initials"
                              type="text" 
                              value={singleUserFormData.initials} 
                              onChange={e => handleInitialsChange(e.target.value)}
                              className="w-full bg-slate-50 dark:bg-slate-950/70 border border-slate-300 dark:border-slate-700/60 focus:border-indigo-500 rounded-xl px-2 py-2 text-sm text-center text-slate-800 dark:text-white focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all font-semibold"
                              placeholder="M"
                              maxLength={3}
                            />
                          </div>
                          )}
                          <div className="col-span-5 space-y-1.5">
                            <label htmlFor="user-last-name" className="text-xs font-medium text-slate-600 dark:text-slate-300">Last Name</label>
                            <input 
                              id="user-last-name"
                              type="text" 
                              required
                              value={singleUserFormData.lastName} 
                              onChange={e => handleNameChange("lastName", e.target.value)}
                              className="w-full bg-slate-50 dark:bg-slate-950/70 border border-slate-300 dark:border-slate-700/60 focus:border-indigo-500 rounded-xl px-3.5 py-2 text-sm text-slate-800 dark:text-white focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
                              placeholder="e.g. Doe"
                            />
                          </div>
                        </div>

                        {/* Display Name (Strictly Calculated and Read-Only) */}
                        {(activeEnabledAttributes.includes("displayName") || activeEnabledAttributes.includes("displayNameFormat")) && (
                        <div className="space-y-1.5">
                          <label htmlFor="user-display-name" className="text-xs font-medium text-slate-600 dark:text-slate-300 flex items-center justify-between">
                            <span>Display Name</span>
                            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">(Read Only)</span>
                          </label>
                          <input 
                            id="user-display-name"
                            type="text" 
                            disabled
                            value={singleUserFormData.displayName}
                            className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-xl px-3.5 py-2 text-sm text-slate-500 dark:text-slate-400 outline-none cursor-not-allowed opacity-80"
                            placeholder="Automatically compiled"
                          />
                        </div>
                        )}

                        {activeEnabledAttributes.includes("emailFormat") && (
                        <>
                        {/* Email Format Template Selection */}
                        <div className="space-y-1.5">
                          <label htmlFor="email-template-select" className="text-xs font-medium text-slate-600 dark:text-slate-300">Email Format Template</label>
                          <select 
                            id="email-template-select"
                            value={emailTemplate}
                            onChange={e => handleTemplateChange(e.target.value)}
                            className="w-full bg-slate-50 dark:bg-slate-950/70 border border-slate-300 dark:border-slate-700/60 focus:border-indigo-500 rounded-xl px-3.5 py-2 text-sm text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500/20"
                          >
                            {EMAIL_TEMPLATES.map(t => (
                              <option key={t.id} value={t.id}>{t.label}</option>
                            ))}
                          </select>
                        </div>

                        {/* Email ID & Availability Checker */}
                        <div className="space-y-1.5">
                          <label htmlFor="user-email" className="text-xs font-medium text-slate-600 dark:text-slate-300">Email Address (UPN)</label>
                          <div className="relative">
                            <input 
                              id="user-email"
                              type="email" 
                              required
                              value={singleUserFormData.email}
                              onChange={e => {
                                setSingleUserFormData({ ...singleUserFormData, email: e.target.value });
                                checkEmailAvailability(e.target.value);
                              }}
                              className="w-full bg-slate-50 dark:bg-slate-950/70 border border-slate-300 dark:border-slate-700/60 focus:border-indigo-500 rounded-xl pl-3.5 pr-28 py-2 text-sm text-slate-800 dark:text-white focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
                              placeholder="e.g. john.doe@company.com"
                            />
                            
                            {/* Availability status badge inside input */}
                            <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                              {checkingEmail && (
                                <span className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                                  <Loader2 className="h-3 w-3 animate-spin text-indigo-500" /> checking
                                </span>
                              )}
                              {!checkingEmail && emailAvailable === true && (
                                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                                  <CheckCircle2 className="h-2.5 w-2.5" /> Available
                                </span>
                              )}
                              {!checkingEmail && emailAvailable === false && (
                                <span className="text-[10px] text-red-600 dark:text-red-400 font-bold bg-red-500/10 border border-red-500/20 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                                  <XCircle className="h-2.5 w-2.5" /> Taken
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        </>
                        )}

                        {/* Automatic GPO-Based Password Generator */}
                        {activeEnabledAttributes.includes("passwordOption") && (
                        <div className="space-y-1.5">
                          <label htmlFor="user-password" className="text-xs font-medium text-slate-600 dark:text-slate-300 flex items-center justify-between">
                            <span>Password</span>
                            <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold uppercase tracking-wider flex items-center gap-0.5">
                              <Key className="h-2.5 w-2.5" /> AD GPO Policy Enforced
                            </span>
                          </label>
                          <div className="flex gap-2">
                            <input 
                              id="user-password"
                              type="text" 
                              required
                              value={singleUserFormData.password}
                              onChange={e => setSingleUserFormData({ ...singleUserFormData, password: e.target.value })}
                              className="flex-1 bg-slate-50 dark:bg-slate-950/70 border border-slate-300 dark:border-slate-700/60 focus:border-indigo-500 rounded-xl px-3.5 py-2 text-sm text-slate-800 dark:text-white focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all font-mono"
                              placeholder="AD complexity rule"
                            />
                            <button
                              type="button"
                              onClick={generateAdGpoPassword}
                              className="px-3.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white rounded-xl flex items-center gap-1 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all font-semibold text-xs whitespace-nowrap"
                            >
                              Generate
                            </button>
                          </div>
                        </div>
                        )}
                      </div>

                      {/* DIRECTORIES TARGETS & M365 LICENSE MANAGEMENT */}
                      <div className="bg-slate-50/50 dark:bg-slate-950/40 p-4 border border-slate-200/50 dark:border-white/5 rounded-2xl space-y-4">
                        <h3 className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest flex items-center gap-1.5 pb-2 border-b border-slate-200/50 dark:border-white/5">
                          <Server className="h-3.5 w-3.5" /> 2. Directory Connections & Licensing
                        </h3>

                        {/* Active Directory target switch */}
                        <div className={`p-4 rounded-xl border transition-all ${
                          singleUserFormData.createInAd 
                            ? "bg-indigo-500/5 dark:bg-indigo-500/5 border-indigo-500/25" 
                            : "bg-slate-50/50 dark:bg-slate-950/20 border-slate-200/50 dark:border-white/5 hover:border-slate-300 dark:hover:border-white/10"
                        }`}>
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-sm font-medium text-slate-800 dark:text-white flex items-center gap-1.5">
                              
                              <Server className="h-4 w-4 text-indigo-600 dark:text-indigo-400" /> Active Directory (AD)
                              {adSettingsList.length > 0 && singleUserFormData.adSettingsId && (
                                <span className="ml-2 flex h-2 w-2 relative">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                </span>
                              )}

                            </span>
                            <input 
                              type="checkbox"
                              checked={singleUserFormData.createInAd}
                              onChange={e => setSingleUserFormData({ ...singleUserFormData, createInAd: e.target.checked })}
                              className="h-4.5 w-4.5 rounded border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                            />
                          </div>
                          {singleUserFormData.createInAd && (
                            <div className="space-y-3">
                              <div className="space-y-1.5">
                                <label htmlFor="ad-domain-select" className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Target AD Domain Settings</label>
                                {adSettingsList.length > 0 ? (
                                  <select 
                                    id="ad-domain-select"
                                    value={singleUserFormData.adSettingsId}
                                    onChange={e => handleDomainChange("ad", e.target.value)}
                                    className="w-full text-xs bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg px-2.5 py-2 text-slate-800 dark:text-white outline-none focus:ring-1 focus:ring-indigo-500"
                                  >
                                    {adSettingsList.map(a => (
                                      <option key={a.id} value={a.id}>{a.domainName} ({a.adServerIp})</option>
                                    ))}
                                  </select>
                                ) : (
                                  <p className="text-[11px] text-amber-600 dark:text-amber-400 flex items-center gap-1">
                                    <ShieldAlert className="h-3 w-3" /> No AD integrations configured.
                                  </p>
                                )}
                              </div>

                              <div className="space-y-1.5">
                                <div className="flex items-center justify-between">
                                  <label htmlFor="ad-target-ou" className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Target Organizational Unit (OU)</label>
                                  <button 
                                    type="button" 
                                    onClick={() => openOuBrowser("form")}
                                    className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 flex items-center gap-1"
                                  >
                                    <FolderTree className="h-3 w-3" /> Browse Directory
                                  </button>
                                </div>
                                <select 
                                  id="ad-target-ou"
                                  value={singleUserFormData.targetOu}
                                  onChange={e => setSingleUserFormData({ ...singleUserFormData, targetOu: e.target.value })}
                                  className="w-full text-xs bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg px-2.5 py-2 text-slate-800 dark:text-white outline-none focus:ring-1 focus:ring-indigo-500"
                                >
                                  {ouList.length > 0 ? (
                                    <>
                                      <option value="">-- Select OU --</option>
                                      {ouList.map((ou, idx) => {
                                        const depth = Math.max(0, (ou.path.match(/=/g) || []).length - 1);
                                        const prefix = depth > 0 ? '\u00A0\u00A0\u00A0\u00A0'.repeat(depth) + '↳ ' : '';
                                        return <option key={ou.dn} value={ou.dn}>{prefix}{ou.name}</option>;
                                      })}
                                      {singleUserFormData.targetOu && !ouList.some(ou => ou.dn === singleUserFormData.targetOu) && (
                                        <option value={singleUserFormData.targetOu}>
                                          {singleUserFormData.targetOu.split(',')[0].replace(/^(OU=|CN=)/i, '')}
                                        </option>
                                      )}
                                    </>
                                  ) : (
                                    <>
                                      <option value={singleUserFormData.targetOu}>
                                        {singleUserFormData.targetOu ? singleUserFormData.targetOu.split(',')[0].replace(/^(OU=|CN=)/i, '') : "-- Select OU --"}
                                      </option>
                                      {singleUserFormData.targetOu !== "CN=Users,DC=petrus,DC=io" && <option value="CN=Users,DC=petrus,DC=io">Users</option>}
                                      {singleUserFormData.targetOu !== "OU=Employees,DC=petrus,DC=io" && <option value="OU=Employees,DC=petrus,DC=io">Employees</option>}
                                      {singleUserFormData.targetOu !== "OU=Engineering,OU=Employees,DC=petrus,DC=io" && <option value="OU=Engineering,OU=Employees,DC=petrus,DC=io">Engineering</option>}
                                    </>
                                  )}
                                </select>
                              </div>

                              <div className="space-y-1.5">
                                <label htmlFor="ad-target-group" className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Target AD Security Group</label>
                                <AdGroupMultiSelect 
                                  selectedDns={singleUserFormData.adGroupDns || []} 
                                  onChange={(val) => setSingleUserFormData({ ...singleUserFormData, adGroupDns: val })} 
                                  options={groupList} 
                                />
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Microsoft 365 / Entra ID target switch & dynamic license */}
                        <div className={`p-4 rounded-xl border transition-all ${
                          singleUserFormData.createInM365 
                            ? "bg-sky-500/5 dark:bg-sky-500/5 border-sky-500/25" 
                            : "bg-slate-50/50 dark:bg-slate-950/20 border-slate-200/50 dark:border-white/5 hover:border-slate-300 dark:hover:border-white/10"
                        }`}>
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-sm font-medium text-slate-800 dark:text-white flex items-center gap-1.5">
                              <Cloud className="h-4 w-4 text-sky-600 dark:text-sky-400" /> Microsoft 365 / O365
                            </span>
                            <input 
                              type="checkbox"
                              checked={singleUserFormData.createInM365}
                              onChange={e => setSingleUserFormData({ ...singleUserFormData, createInM365: e.target.checked })}
                              className="h-4.5 w-4.5 rounded border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                            />
                          </div>
                          {singleUserFormData.createInM365 && (
                            <div className="space-y-4 pt-1">
                              {/* Domain select */}
                              <div className="space-y-1.5">
                                <label htmlFor="m365-tenant-select" className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Target Microsoft Tenant</label>
                                {m365SettingsList.length > 0 ? (
                                  <select 
                                    id="m365-tenant-select"
                                    value={singleUserFormData.m365SettingsId}
                                    onChange={e => handleDomainChange("m365", e.target.value)}
                                    className="w-full text-xs bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded-lg px-2.5 py-2 text-slate-800 dark:text-white outline-none focus:ring-1 focus:ring-indigo-500"
                                  >
                                    {m365SettingsList.map(m => (
                                      <option key={m.id} value={m.id}>{m.microsoftDomain || m.azureTenantId}</option>
                                    ))}
                                  </select>
                                ) : (
                                  <p className="text-[11px] text-amber-600 dark:text-amber-400 flex items-center gap-1">
                                    <ShieldAlert className="h-3 w-3" /> No M365 integrations configured.
                                  </p>
                                )}
                              </div>

                              {/* License Checkbox & Dropdown selection */}
                              <div className="bg-slate-100/80 dark:bg-slate-950/60 p-3 rounded-lg border border-slate-200/50 dark:border-white/5 space-y-3">
                                <div className="flex items-center justify-between">
                                  <label htmlFor="user-no-license" className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">Create user without license</label>
                                  {activeEnabledAttributes.includes("createWithoutLicense") && (
                                  <input 
                                    id="user-no-license"
                                    type="checkbox"
                                    checked={singleUserFormData.createWithoutLicense}
                                    onChange={e => setSingleUserFormData({ ...singleUserFormData, createWithoutLicense: e.target.checked })}
                                    className="h-4 w-4 rounded border-slate-300 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-sky-600 focus:ring-sky-500 cursor-pointer"
                                  />
                                  )}
                                </div>

                                {!singleUserFormData.createWithoutLicense && activeEnabledAttributes.includes("m365License") && (
                                  <div className="space-y-1.5 animate-in fade-in slide-in-from-top-1 duration-150">
                                    <label htmlFor="m365-license-select" className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Available Licenses SKU</label>
                                    <select 
                                      id="m365-license-select"
                                      value={singleUserFormData.m365License}
                                      onChange={e => setSingleUserFormData({ ...singleUserFormData, m365License: e.target.value })}
                                      className="w-full text-xs bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 rounded px-2 py-1.5 text-slate-800 dark:text-white outline-none focus:ring-1 focus:ring-sky-500"
                                    >
                                      {M365_LICENSES.map(l => (
                                        <option key={l.id} value={l.id}>{l.name}</option>
                                      ))}
                                    </select>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* RIGHT PANEL: ENTERPRISE PROFILE INFORMATION */}
                    <div className="space-y-6">
                      <div className="bg-slate-50/50 dark:bg-slate-950/40 p-4 border border-slate-200/50 dark:border-white/5 rounded-2xl space-y-4">
                        <h3 className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest flex items-center gap-1.5 pb-2 border-b border-slate-200/50 dark:border-white/5">
                          <Sparkles className="h-3.5 w-3.5" /> 3. Profile Information
                        </h3>

                        {/* Job Title & Department */}
                        <div className="grid grid-cols-2 gap-3">
                          {activeEnabledAttributes.includes("title") && (
                          <div className="space-y-1.5">
                            <label htmlFor="user-job-title" className="text-xs font-medium text-slate-600 dark:text-slate-300">Job Title / Designation *</label>
                            <input 
                              id="user-job-title"
                              type="text" 
                              required
                              value={singleUserFormData.jobTitle} 
                              onChange={e => setSingleUserFormData({ ...singleUserFormData, jobTitle: e.target.value })}
                              className="w-full bg-slate-50 dark:bg-slate-950/70 border border-slate-300 dark:border-slate-700/60 focus:border-indigo-500 rounded-xl px-3.5 py-2 text-sm text-slate-800 dark:text-white focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
                              placeholder="e.g. Systems Engineer"
                            />
                          </div>
                          )}
                          {activeEnabledAttributes.includes("department") && (
                          <div className="space-y-1.5">
                            <label htmlFor="user-department" className="text-xs font-medium text-slate-600 dark:text-slate-300">Department</label>
                            {departmentsList.length > 0 ? (
                              <select 
                                id="user-department"
                                value={singleUserFormData.department}
                                onChange={e => setSingleUserFormData({ ...singleUserFormData, department: e.target.value })}
                                className="w-full bg-slate-50 dark:bg-slate-950/70 border border-slate-300 dark:border-slate-700/60 focus:border-indigo-500 rounded-xl px-3.5 py-2 text-sm text-slate-800 dark:text-white focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
                              >
                                <option value="">-- Choose Department --</option>
                                {departmentsList.map(d => (
                                  <option key={d.id} value={d.name}>{d.name}</option>
                                ))}
                              </select>
                            ) : (
                              <input 
                                id="user-department"
                                type="text"
                                value={singleUserFormData.department} 
                                onChange={e => setSingleUserFormData({ ...singleUserFormData, department: e.target.value })}
                                className="w-full bg-slate-50 dark:bg-slate-950/70 border border-slate-300 dark:border-slate-700/60 focus:border-indigo-500 rounded-xl px-3.5 py-2 text-sm text-slate-800 dark:text-white focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
                                placeholder="e.g. Engineering"
                              />
                            )}
                          </div>
                          )}
                        </div>

                        {/* Office Selection */}
                        {activeEnabledAttributes.includes("office") && (
                        <div className="space-y-1.5">
                          <label htmlFor="user-office" className="text-xs font-medium text-slate-600 dark:text-slate-300">Office / Location *</label>
                          {officesList.length > 0 ? (
                            <select 
                              id="user-office"
                              required
                              value={singleUserFormData.office}
                              onChange={e => setSingleUserFormData({ ...singleUserFormData, office: e.target.value })}
                              className="w-full bg-slate-50 dark:bg-slate-950/70 border border-slate-300 dark:border-slate-700/60 focus:border-indigo-500 rounded-xl px-3.5 py-2 text-sm text-slate-800 dark:text-white focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
                            >
                              <option value="">-- Choose Office --</option>
                              {officesList.map(o => (
                                <option key={o.id} value={o.name}>{o.name} ({o.city || 'Headquarters'})</option>
                              ))}
                            </select>
                           ) : (
                            <input 
                              id="user-office"
                              type="text" 
                              required
                              value={singleUserFormData.office} 
                              onChange={e => setSingleUserFormData({ ...singleUserFormData, office: e.target.value })}
                              className="w-full bg-slate-50 dark:bg-slate-950/70 border border-slate-300 dark:border-slate-700/60 focus:border-indigo-500 rounded-xl px-3.5 py-2 text-sm text-slate-800 dark:text-white focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
                              placeholder="e.g. New York HQ"
                            />
                          )}
                        </div>
                        )}

                        {/* Phones & Fax */}
                        <div className="grid grid-cols-3 gap-2">
                          {activeEnabledAttributes.includes("telephoneNumber") && (
                          <div className="col-span-1 space-y-1.5">
                            <label htmlFor="user-office-phone" className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Office Phone</label>
                            <input 
                              id="user-office-phone"
                              type="text" 
                              value={singleUserFormData.officePhone} 
                              onChange={e => setSingleUserFormData({ ...singleUserFormData, officePhone: e.target.value })}
                              className="w-full bg-slate-50 dark:bg-slate-950/70 border border-slate-300 dark:border-slate-700/50 focus:border-indigo-500 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 dark:text-white focus:ring-1 focus:ring-indigo-500 outline-none transition-all"
                              placeholder="Phone"
                            />
                          </div>
                          )}
                          {activeEnabledAttributes.includes("fax") && (
                          <div className="col-span-1 space-y-1.5">
                            <label htmlFor="user-fax" className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Fax Number</label>
                            <input 
                              id="user-fax"
                              type="text" 
                              value={singleUserFormData.faxNumber} 
                              onChange={e => setSingleUserFormData({ ...singleUserFormData, faxNumber: e.target.value })}
                              className="w-full bg-slate-50 dark:bg-slate-950/70 border border-slate-300 dark:border-slate-700/50 focus:border-indigo-500 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 dark:text-white focus:ring-1 focus:ring-indigo-500 outline-none transition-all"
                              placeholder="Fax"
                            />
                          </div>
                          )}
                          {activeEnabledAttributes.includes("mobile") && (
                          <div className="col-span-1 space-y-1.5">
                            <label htmlFor="user-mobile" className="text-[11px] font-semibold text-slate-600 dark:text-slate-350">Mobile Phone *</label>
                            <input 
                              id="user-mobile"
                              type="text" 
                              required
                              value={singleUserFormData.mobileNumber} 
                              onChange={e => setSingleUserFormData({ ...singleUserFormData, mobileNumber: e.target.value })}
                              className="w-full bg-slate-50 dark:bg-slate-950/70 border border-slate-300 dark:border-slate-700/50 focus:border-indigo-500 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 dark:text-white focus:ring-1 focus:ring-indigo-500 outline-none transition-all"
                              placeholder="Mobile"
                            />
                          </div>
                          )}
                        </div>

                        {/* Mailing Address Section */}
                        <div className="pt-2 border-t border-slate-200/50 dark:border-white/5 space-y-3">
                          {activeEnabledAttributes.includes("street") && (
                          <div className="space-y-1.5">
                            <label htmlFor="user-street" className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Street Address</label>
                            <input 
                              id="user-street"
                              type="text" 
                              value={singleUserFormData.streetAddress} 
                              onChange={e => setSingleUserFormData({ ...singleUserFormData, streetAddress: e.target.value })}
                              className="w-full bg-slate-50 dark:bg-slate-950/70 border border-slate-300 dark:border-slate-700/50 focus:border-indigo-500 rounded-xl px-3 py-1.5 text-xs text-slate-800 dark:text-white focus:ring-1 focus:ring-indigo-500 outline-none transition-all"
                              placeholder="e.g. 100 Main St"
                            />
                          </div>
                          )}

                          <div className="grid grid-cols-2 gap-3">
                            {activeEnabledAttributes.includes("city") && (
                            <div className="space-y-1.5">
                              <label htmlFor="user-city" className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">City</label>
                              <input 
                                id="user-city"
                                type="text" 
                                value={singleUserFormData.city} 
                                onChange={e => setSingleUserFormData({ ...singleUserFormData, city: e.target.value })}
                                className="w-full bg-slate-50 dark:bg-slate-950/70 border border-slate-300 dark:border-slate-700/50 focus:border-indigo-500 rounded-xl px-3 py-1.5 text-xs text-slate-800 dark:text-white focus:ring-1 focus:ring-indigo-500 outline-none transition-all"
                                placeholder="City"
                              />
                            </div>
                            )}
                            {activeEnabledAttributes.includes("stateProvince") && (
                            <div className="space-y-1.5">
                              <label htmlFor="user-state" className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">State / Province</label>
                              <input 
                                id="user-state"
                                type="text" 
                                value={singleUserFormData.stateProvince} 
                                onChange={e => setSingleUserFormData({ ...singleUserFormData, stateProvince: e.target.value })}
                                className="w-full bg-slate-50 dark:bg-slate-950/70 border border-slate-300 dark:border-slate-700/50 focus:border-indigo-500 rounded-xl px-3 py-1.5 text-xs text-slate-800 dark:text-white focus:ring-1 focus:ring-indigo-500 outline-none transition-all"
                                placeholder="State"
                              />
                            </div>
                            )}
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            {activeEnabledAttributes.includes("zipPostalCode") && (
                            <div className="space-y-1.5">
                              <label htmlFor="user-zip" className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Zip / Postal Code</label>
                              <input 
                                id="user-zip"
                                type="text" 
                                value={singleUserFormData.zipPostalCode} 
                                onChange={e => setSingleUserFormData({ ...singleUserFormData, zipPostalCode: e.target.value })}
                                className="w-full bg-slate-50 dark:bg-slate-950/70 border border-slate-300 dark:border-slate-700/50 focus:border-indigo-500 rounded-xl px-3 py-1.5 text-xs text-slate-800 dark:text-white focus:ring-1 focus:ring-indigo-500 outline-none transition-all"
                                placeholder="Zip"
                              />
                            </div>
                            )}
                            {activeEnabledAttributes.includes("country") && (
                            <div className="space-y-1.5">
                              <label htmlFor="user-country" className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Country / Region</label>
                              <input 
                                id="user-country"
                                type="text" 
                                value={singleUserFormData.countryRegion} 
                                onChange={e => setSingleUserFormData({ ...singleUserFormData, countryRegion: e.target.value })}
                                className="w-full bg-slate-50 dark:bg-slate-950/70 border border-slate-300 dark:border-slate-700/50 focus:border-indigo-500 rounded-xl px-3 py-1.5 text-xs text-slate-800 dark:text-white focus:ring-1 focus:ring-indigo-500 outline-none transition-all"
                                placeholder="Country"
                              />
                            </div>
                            )}
                          </div>
                        </div>

                        {/* Additional Attributes Section */}
                        <div className="pt-2 border-t border-slate-200/50 dark:border-white/5 space-y-3">
                          <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Additional Attributes</h4>
                          <div className="grid grid-cols-2 gap-3">
                            {activeEnabledAttributes.includes("employeeId") && (
                              <div className="space-y-1.5">
                                <label htmlFor="user-employeeId" className="text-[11px] font-semibold text-slate-500">Employee ID</label>
                                <input id="user-employeeId" type="text" value={singleUserFormData.employeeId} onChange={e => setSingleUserFormData({ ...singleUserFormData, employeeId: e.target.value })} className="w-full bg-slate-50 dark:bg-slate-950/70 border border-slate-300 dark:border-slate-700/50 focus:border-indigo-500 rounded-xl px-3 py-1.5 text-xs text-slate-800 dark:text-white focus:ring-1 focus:ring-indigo-500 outline-none transition-all" />
                              </div>
                            )}
                            {activeEnabledAttributes.includes("descriptionGeneral") && (
                              <div className="space-y-1.5">
                                <label htmlFor="user-description" className="text-[11px] font-semibold text-slate-500">Description</label>
                                <input id="user-description" type="text" value={singleUserFormData.descriptionGeneral} onChange={e => setSingleUserFormData({ ...singleUserFormData, descriptionGeneral: e.target.value })} className="w-full bg-slate-50 dark:bg-slate-950/70 border border-slate-300 dark:border-slate-700/50 focus:border-indigo-500 rounded-xl px-3 py-1.5 text-xs text-slate-800 dark:text-white focus:ring-1 focus:ring-indigo-500 outline-none transition-all" />
                              </div>
                            )}
                            {activeEnabledAttributes.includes("webPage") && (
                              <div className="space-y-1.5">
                                <label htmlFor="user-webpage" className="text-[11px] font-semibold text-slate-500">Web Page</label>
                                <input id="user-webpage" type="text" value={singleUserFormData.webPage} onChange={e => setSingleUserFormData({ ...singleUserFormData, webPage: e.target.value })} className="w-full bg-slate-50 dark:bg-slate-950/70 border border-slate-300 dark:border-slate-700/50 focus:border-indigo-500 rounded-xl px-3 py-1.5 text-xs text-slate-800 dark:text-white focus:ring-1 focus:ring-indigo-500 outline-none transition-all" />
                              </div>
                            )}
                            {activeEnabledAttributes.includes("company") && (
                              <div className="space-y-1.5">
                                <label htmlFor="user-company" className="text-[11px] font-semibold text-slate-500">Company</label>
                                <input id="user-company" type="text" value={singleUserFormData.company} onChange={e => setSingleUserFormData({ ...singleUserFormData, company: e.target.value })} className="w-full bg-slate-50 dark:bg-slate-950/70 border border-slate-300 dark:border-slate-700/50 focus:border-indigo-500 rounded-xl px-3 py-1.5 text-xs text-slate-800 dark:text-white focus:ring-1 focus:ring-indigo-500 outline-none transition-all" />
                              </div>
                            )}
                            {activeEnabledAttributes.includes("manager") && (
                              <div className="space-y-1.5">
                                <label htmlFor="user-manager" className="text-[11px] font-semibold text-slate-500">Manager</label>
                                <ManagerSelect 
                                  value={singleUserFormData.manager} 
                                  onChange={(val) => setSingleUserFormData({ ...singleUserFormData, manager: val })} 
                                  options={adUserList} 
                                />
                              </div>
                            )}
                            {activeEnabledAttributes.includes("poBox") && (
                              <div className="space-y-1.5">
                                <label htmlFor="user-pobox" className="text-[11px] font-semibold text-slate-500">PO Box</label>
                                <input id="user-pobox" type="text" value={singleUserFormData.poBox} onChange={e => setSingleUserFormData({ ...singleUserFormData, poBox: e.target.value })} className="w-full bg-slate-50 dark:bg-slate-950/70 border border-slate-300 dark:border-slate-700/50 focus:border-indigo-500 rounded-xl px-3 py-1.5 text-xs text-slate-800 dark:text-white focus:ring-1 focus:ring-indigo-500 outline-none transition-all" />
                              </div>
                            )}
                            {activeEnabledAttributes.includes("homePhone") && (
                              <div className="space-y-1.5">
                                <label htmlFor="user-homephone" className="text-[11px] font-semibold text-slate-500">Home Phone</label>
                                <input id="user-homephone" type="text" value={singleUserFormData.homePhone} onChange={e => setSingleUserFormData({ ...singleUserFormData, homePhone: e.target.value })} className="w-full bg-slate-50 dark:bg-slate-950/70 border border-slate-300 dark:border-slate-700/50 focus:border-indigo-500 rounded-xl px-3 py-1.5 text-xs text-slate-800 dark:text-white focus:ring-1 focus:ring-indigo-500 outline-none transition-all" />
                              </div>
                            )}
                            {activeEnabledAttributes.includes("pager") && (
                              <div className="space-y-1.5">
                                <label htmlFor="user-pager" className="text-[11px] font-semibold text-slate-500">Pager</label>
                                <input id="user-pager" type="text" value={singleUserFormData.pager} onChange={e => setSingleUserFormData({ ...singleUserFormData, pager: e.target.value })} className="w-full bg-slate-50 dark:bg-slate-950/70 border border-slate-300 dark:border-slate-700/50 focus:border-indigo-500 rounded-xl px-3 py-1.5 text-xs text-slate-800 dark:text-white focus:ring-1 focus:ring-indigo-500 outline-none transition-all" />
                              </div>
                            )}
                            {activeEnabledAttributes.includes("ipPhone") && (
                              <div className="space-y-1.5">
                                <label htmlFor="user-ipphone" className="text-[11px] font-semibold text-slate-500">IP Phone</label>
                                <input id="user-ipphone" type="text" value={singleUserFormData.ipPhone} onChange={e => setSingleUserFormData({ ...singleUserFormData, ipPhone: e.target.value })} className="w-full bg-slate-50 dark:bg-slate-950/70 border border-slate-300 dark:border-slate-700/50 focus:border-indigo-500 rounded-xl px-3 py-1.5 text-xs text-slate-800 dark:text-white focus:ring-1 focus:ring-indigo-500 outline-none transition-all" />
                              </div>
                            )}
                            {activeEnabledAttributes.includes("notes") && (
                              <div className="space-y-1.5">
                                <label htmlFor="user-notes" className="text-[11px] font-semibold text-slate-500">Notes</label>
                                <input id="user-notes" type="text" value={singleUserFormData.notes} onChange={e => setSingleUserFormData({ ...singleUserFormData, notes: e.target.value })} className="w-full bg-slate-50 dark:bg-slate-950/70 border border-slate-300 dark:border-slate-700/50 focus:border-indigo-500 rounded-xl px-3 py-1.5 text-xs text-slate-800 dark:text-white focus:ring-1 focus:ring-indigo-500 outline-none transition-all" />
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Submission buttons */}
                  <div className="pt-4 border-t border-slate-200/50 dark:border-white/5 flex gap-3 justify-end shrink-0">
                    <button 
                      type="button" 
                      onClick={() => setIsModalOpen(false)}
                      className="px-5 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors font-semibold text-sm"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit"
                      disabled={emailAvailable === false}
                      className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-500 transition-all font-semibold text-sm shadow-lg shadow-indigo-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Create User
                    </button>
                  </div>
                </form>
              );
              })()}
            </div>
          </div>
        </div>
      )}
      {/* Bulk User Creation Modal */}
      {isBulkModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl shadow-2xl w-full max-w-7xl max-h-[96vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="p-5 border-b border-slate-200/50 dark:border-white/5 flex justify-between items-center shrink-0">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-indigo-600 dark:text-indigo-400 animate-pulse" />
                <h2 className="text-lg font-bold text-slate-800 dark:text-white font-outfit">
                  Bulk User Creation Wizard
                </h2>
              </div>
              <button 
                type="button" 
                onClick={() => setIsBulkModalOpen(false)} 
                className="text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto flex-1 space-y-6">
              {showTerminal ? (
                /* Interactive Terminal Output logs */
                <div className="bg-black/90 rounded-2xl border border-white/10 p-6 font-mono text-xs text-slate-300 min-h-[400px] flex flex-col justify-between shadow-inner">
                  <div className="space-y-2 max-h-[350px] overflow-y-auto flex-1 scrollbar-thin scrollbar-thumb-slate-800">
                    <div className="text-indigo-400 border-b border-white/5 pb-1.5 flex items-center justify-between">
                      <span>⚡ PETRUS BATCH PROVISIONING SYSTEM v2.1</span>
                      <span className="text-[10px] bg-indigo-500/20 px-2 py-0.5 rounded text-indigo-300 animate-pulse">Running Batch...</span>
                    </div>
                    {creationLogs.map((log) => {
                      let logClass = "text-slate-300";
                      if (log.includes("[ERROR]")) {
                        logClass = "text-red-400 font-bold";
                      } else if (log.includes("[SIMULATION]")) {
                        logClass = "text-amber-400/90";
                      } else if (log.includes("[System] Successfully") || log.includes("completed successfully")) {
                        logClass = "text-emerald-400 font-semibold";
                      }
                      return (
                        <div key={log} className={`leading-relaxed ${logClass}`}>
                          {log}
                        </div>
                      );
                    })}
                    {isCreatingUser && (
                      <div className="flex items-center gap-2 text-indigo-400 mt-2">
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        <span>Synchronizing objects with Active Directory & Graph endpoints...</span>
                      </div>
                    )}
                  </div>

                  {/* Finish buttons */}
                  <div className="pt-4 border-t border-white/5 flex gap-3">
                    <button 
                      type="button" 
                      onClick={() => setShowTerminal(false)}
                      disabled={isCreatingUser}
                      className="flex-1 px-4 py-2.5 bg-slate-800 text-slate-200 rounded-xl hover:bg-slate-700 transition-colors font-semibold text-sm disabled:opacity-50"
                    >
                      Back to Table
                    </button>
                    <button 
                      type="button" 
                      onClick={() => setIsBulkModalOpen(false)}
                      disabled={isCreatingUser}
                      className="flex-1 px-4 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-500 transition-all font-semibold text-sm shadow-lg shadow-indigo-500/20 disabled:opacity-50"
                    >
                      Close Wizard
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleBulkCreateUserSubmit} className="space-y-6">
                  {/* Top Bar Configs */}
                  <div className="bg-slate-50/50 dark:bg-slate-950/40 p-5 border border-slate-200/50 dark:border-white/5 rounded-2xl space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      {/* Active Directory Global Toggle */}
                      <div className="space-y-1.5">
                        <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">1. Target AD Connection</span>
                        <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-white/5 rounded-xl px-3 py-2.5">
                          <input 
                            type="checkbox"
                            checked={globalBulkConfig.createInAd}
                            onChange={e => setGlobalBulkConfig({ ...globalBulkConfig, createInAd: e.target.checked })}
                            className="h-4 w-4 rounded border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-indigo-650 focus:ring-indigo-500 cursor-pointer"
                          />
                          <select 
                            value={globalBulkConfig.adSettingsId}
                            disabled={!globalBulkConfig.createInAd}
                            onChange={e => setGlobalBulkConfig({ ...globalBulkConfig, adSettingsId: e.target.value })}
                            className="text-xs bg-transparent text-slate-800 dark:text-white outline-none flex-1 disabled:opacity-40"
                          >
                            {adSettingsList.map(a => (
                              <option key={a.id} value={a.id} className="bg-white dark:bg-slate-900 text-slate-800 dark:text-white">{a.domainName}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* M365 Global Toggle */}
                      <div className="space-y-1.5">
                        <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">2. Target Microsoft 365</span>
                        <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-white/5 rounded-xl px-3 py-2.5">
                          <input 
                            type="checkbox"
                            checked={globalBulkConfig.createInM365}
                            onChange={e => setGlobalBulkConfig({ ...globalBulkConfig, createInM365: e.target.checked })}
                            className="h-4 w-4 rounded border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-indigo-650 focus:ring-indigo-500 cursor-pointer"
                          />
                          <select 
                            value={globalBulkConfig.m365SettingsId}
                            disabled={!globalBulkConfig.createInM365}
                            onChange={e => setGlobalBulkConfig({ ...globalBulkConfig, m365SettingsId: e.target.value })}
                            className="text-xs bg-transparent text-slate-800 dark:text-white outline-none flex-1 disabled:opacity-40"
                          >
                            {m365SettingsList.map(m => (
                              <option key={m.id} value={m.id} className="bg-white dark:bg-slate-900 text-slate-800 dark:text-white">{m.microsoftDomain}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* Global Email Format Template Selection */}
                      <div className="space-y-1.5">
                        <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">3. Email Pattern</span>
                        <select 
                          value={emailTemplate}
                          onChange={e => {
                            const newTemplate = e.target.value;
                            setEmailTemplate(newTemplate);
                            // Recalculate email for all rows
                            setBulkUsersList(prev => prev.map(row => ({
                              ...row,
                              email: computeEmailByTemplate(
                                row.firstName,
                                row.lastName,
                                newTemplate,
                                getActiveDomain(adSettingsList, m365SettingsList, globalBulkConfig.adSettingsId, globalBulkConfig.m365SettingsId),
                                row.initials
                              )
                            })));
                          }}
                          className="w-full text-xs bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-white/5 rounded-xl px-3 py-2.5 text-slate-800 dark:text-white outline-none"
                        >
                          {EMAIL_TEMPLATES.map(t => (
                            <option key={t.id} value={t.id} className="bg-white dark:bg-slate-900 text-slate-800 dark:text-white">{t.label.split(" (")[0]}</option>
                          ))}
                        </select>
                      </div>

                      {/* M365 Licenses */}
                      <div className="space-y-1.5">
                        <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">4. License Option</span>
                        <div className="flex items-center gap-2">
                          <select 
                            value={globalBulkConfig.m365License}
                            disabled={!globalBulkConfig.createInM365 || globalBulkConfig.createWithoutLicense}
                            onChange={e => setGlobalBulkConfig({ ...globalBulkConfig, m365License: e.target.value })}
                            className="text-xs bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-white/5 rounded-xl px-3 py-2.5 text-slate-800 dark:text-white outline-none flex-1 disabled:opacity-40"
                          >
                            {M365_LICENSES.map(l => (
                              <option key={l.id} value={l.id} className="bg-white dark:bg-slate-900 text-slate-800 dark:text-white">{l.id}</option>
                            ))}
                          </select>
                          <label className="text-[10px] text-slate-600 dark:text-slate-400 flex items-center gap-1 shrink-0 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-white/5 rounded-xl px-2 py-2.5 cursor-pointer">
                            <input 
                              type="checkbox"
                              checked={globalBulkConfig.createWithoutLicense}
                              onChange={e => setGlobalBulkConfig({ ...globalBulkConfig, createWithoutLicense: e.target.checked })}
                              className="h-3 w-3 rounded border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-indigo-650 cursor-pointer"
                            /> No License
                          </label>
                        </div>
                      </div>
                    </div>

                    {globalBulkConfig.createInAd && (
                      <div className="pt-4 border-t border-slate-200/50 dark:border-white/5 grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Target Organizational Unit (OU)</span>
                          <input 
                            type="text"
                            value={globalBulkConfig.targetOu}
                            onChange={e => setGlobalBulkConfig({ ...globalBulkConfig, targetOu: e.target.value })}
                            placeholder="e.g. CN=Users (default) or OU=Employees"
                            className="w-full text-xs bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-white/5 focus:border-indigo-500 rounded-xl px-3.5 py-2 text-slate-800 dark:text-white outline-none transition-all"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Target AD Security Group (CN / DN)</span>
                          <input 
                            type="text"
                            value={globalBulkConfig.adGroupDn}
                            onChange={e => setGlobalBulkConfig({ ...globalBulkConfig, adGroupDn: e.target.value })}
                            placeholder="e.g. CN=Domain Admins,CN=Users"
                            className="w-full text-xs bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-white/5 focus:border-indigo-500 rounded-xl px-3.5 py-2 text-slate-800 dark:text-white outline-none transition-all"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Batch Action Tools Toolbar */}
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-slate-50/50 dark:bg-slate-950/30 p-4 border border-slate-200/50 dark:border-white/5 rounded-2xl">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Batch Operations:</span>
                      <button
                        type="button"
                        onClick={handleLoadBulkSampleData}
                        className="px-3.5 py-2 bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 text-indigo-600 dark:text-indigo-400 rounded-xl hover:bg-indigo-100 dark:hover:bg-indigo-500/20 transition-all font-semibold text-xs flex items-center gap-1.5 shadow-sm"
                      >
                        <Sparkles className="h-3.5 w-3.5 animate-pulse text-indigo-500 dark:text-indigo-400" /> Load Sample Batch (5 Users)
                      </button>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      {/* Reference download */}
                      <button
                        type="button"
                        onClick={handleDownloadSampleCSV}
                        className="px-3.5 py-2 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-xl hover:bg-emerald-100 dark:hover:bg-emerald-500/20 transition-all font-semibold text-xs flex items-center gap-1.5 shadow-sm"
                      >
                        <Download className="h-3.5 w-3.5 text-emerald-500 dark:text-emerald-400" /> Download Sample CSV
                      </button>

                      {/* Import CSV */}
                      <label
                        htmlFor="bulk-csv-upload"
                        className="px-3.5 py-2 bg-sky-50 dark:bg-sky-500/10 border border-sky-200 dark:border-sky-500/20 text-sky-650 dark:text-sky-400 rounded-xl hover:bg-sky-100 dark:hover:bg-sky-500/20 transition-all font-semibold text-xs flex items-center gap-1.5 shadow-sm cursor-pointer"
                      >
                        <Upload className="h-3.5 w-3.5 text-sky-500 dark:text-sky-400" /> Import CSV File
                      </label>
                      <input
                        type="file"
                        id="bulk-csv-upload"
                        accept=".csv"
                        className="hidden"
                        onChange={handleCSVUpload}
                      />
                    </div>
                  </div>


                  {/* Bulk Table Container */}
                  <div className="border border-slate-200 dark:border-white/5 rounded-2xl overflow-hidden bg-slate-50/50 dark:bg-slate-950/20 max-h-[450px] overflow-y-auto">
                    <table className="w-full text-left border-collapse min-w-[1000px]">
                      <thead>
                        <tr className="bg-slate-100 dark:bg-slate-950/70 border-b border-slate-200 dark:border-white/5 text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">
                          <th className="py-3.5 px-4 w-[140px]">First Name</th>
                          <th className="py-3.5 px-2 w-[70px] text-center">Initials</th>
                          <th className="py-3.5 px-4 w-[140px]">Last Name</th>
                          <th className="py-3.5 px-4 w-[220px]">Email ID (UPN Suffix)</th>
                          <th className="py-3.5 px-4 w-[150px]">Complex Password</th>
                          <th className="py-3.5 px-4 w-[130px]">Job Title</th>
                          <th className="py-3.5 px-4 w-[120px]">Office</th>
                          <th className="py-3.5 px-4 w-[40px] text-center"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 dark:divide-white/5 text-sm text-slate-700 dark:text-slate-300">
                        {bulkUsersList.map((row, idx) => (
                          <tr key={row.id} className="hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors">
                            {/* First Name */}
                            <td className="py-2.5 px-4">
                              <input 
                                type="text"
                                required
                                value={row.firstName}
                                onChange={e => handleBulkRowFieldChange(row.id, "firstName", e.target.value)}
                                className="w-full bg-white dark:bg-slate-950/40 border border-slate-300 dark:border-slate-800/80 focus:border-indigo-500 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 dark:text-white outline-none"
                                placeholder="First"
                              />
                            </td>

                            {/* Initials */}
                            <td className="py-2.5 px-2">
                              <input 
                                type="text"
                                value={row.initials}
                                onChange={e => handleBulkRowFieldChange(row.id, "initials", e.target.value)}
                                className="w-full bg-white dark:bg-slate-950/40 border border-slate-300 dark:border-slate-800/80 focus:border-indigo-500 rounded-lg px-1 py-1.5 text-xs text-center text-slate-800 dark:text-white outline-none font-bold uppercase"
                                placeholder="M"
                                maxLength={3}
                              />
                            </td>

                            {/* Last Name */}
                            <td className="py-2.5 px-4">
                              <input 
                                type="text"
                                required
                                value={row.lastName}
                                onChange={e => handleBulkRowFieldChange(row.id, "lastName", e.target.value)}
                                className="w-full bg-white dark:bg-slate-950/40 border border-slate-300 dark:border-slate-800/80 focus:border-indigo-500 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 dark:text-white outline-none"
                                placeholder="Last"
                              />
                            </td>

                            {/* Email */}
                            <td className="py-2.5 px-4">
                              <input 
                                type="email"
                                required
                                value={row.email}
                                onChange={e => handleBulkRowFieldChange(row.id, "email", e.target.value)}
                                className="w-full bg-slate-100 dark:bg-slate-950/80 border border-slate-300 dark:border-slate-800/60 text-slate-500 dark:text-slate-400 rounded-lg px-2.5 py-1.5 text-xs outline-none"
                                placeholder="e.g. john.doe@domain.com"
                              />
                            </td>

                            {/* Password */}
                            <td className="py-2.5 px-4">
                              <div className="flex items-center gap-1.5">
                                <input 
                                  type="text"
                                  required
                                  value={row.password}
                                  onChange={e => handleBulkRowFieldChange(row.id, "password", e.target.value)}
                                  className="w-full bg-white dark:bg-slate-950/40 border border-slate-300 dark:border-slate-800/80 focus:border-indigo-500 rounded-lg px-2 py-1.5 text-[10px] text-slate-800 dark:text-white outline-none font-mono"
                                  placeholder="Auto-generated"
                                />
                                <button
                                  type="button"
                                  onClick={() => handleBulkRowPasswordGenerate(row.id)}
                                  title="Regenerate complex password"
                                  className="p-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded hover:text-slate-900 dark:hover:text-white transition-colors shrink-0"
                                >
                                  <Key className="h-3 w-3" />
                                </button>
                              </div>
                            </td>

                            {/* Job Title */}
                            <td className="py-2.5 px-4">
                              <input 
                                type="text"
                                required
                                value={row.jobTitle}
                                onChange={e => handleBulkRowFieldChange(row.id, "jobTitle", e.target.value)}
                                className="w-full bg-white dark:bg-slate-950/40 border border-slate-300 dark:border-slate-800/80 focus:border-indigo-500 rounded-lg px-2 py-1.5 text-xs text-slate-800 dark:text-white outline-none"
                                placeholder="e.g. Analyst"
                              />
                            </td>

                            {/* Office */}
                            <td className="py-2.5 px-4">
                              {officesList.length > 0 ? (
                                <select 
                                  value={row.office}
                                  onChange={e => handleBulkRowFieldChange(row.id, "office", e.target.value)}
                                  className="w-full bg-white dark:bg-slate-950/40 border border-slate-300 dark:border-slate-800/80 rounded-lg px-1.5 py-1.5 text-xs text-slate-800 dark:text-white outline-none"
                                >
                                  {officesList.map(o => (
                                    <option key={o.id} value={o.name} className="bg-white dark:bg-slate-900 text-slate-800 dark:text-white">{o.name}</option>
                                  ))}
                                </select>
                              ) : (
                                <input 
                                  type="text"
                                  required
                                  value={row.office}
                                  onChange={e => handleBulkRowFieldChange(row.id, "office", e.target.value)}
                                  className="w-full bg-white dark:bg-slate-950/40 border border-slate-300 dark:border-slate-800/80 focus:border-indigo-500 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 dark:text-white outline-none"
                                  placeholder="Office Location"
                                />
                              )}
                            </td>

                            {/* Trash Row Button */}
                            <td className="py-2.5 px-4 text-center">
                              <button
                                type="button"
                                onClick={() => handleRemoveBulkRow(row.id)}
                                disabled={bulkUsersList.length <= 1}
                                className="p-1 text-slate-500 hover:text-red-400 disabled:opacity-20 transition-colors"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Add Row Button */}
                  <div className="flex justify-start">
                    <button
                      type="button"
                      onClick={handleAddBulkRow}
                      className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white rounded-xl transition-all font-semibold text-xs flex items-center gap-1.5 shadow"
                    >
                      <Plus className="h-4 w-4" /> Add Row
                    </button>
                  </div>

                  {/* Submission buttons */}
                  <div className="pt-4 border-t border-slate-200/50 dark:border-white/5 flex gap-3 justify-end shrink-0">
                    <button 
                      type="button" 
                      onClick={() => setIsBulkModalOpen(false)}
                      className="px-5 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors font-semibold text-sm"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit"
                      disabled={bulkUsersList.length === 0}
                      className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-500 transition-all font-semibold text-sm shadow-lg shadow-indigo-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Create Batch of {bulkUsersList.length} Users
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* User Creation Templates Workspace Modal Overlay */}
      {showTemplatesWorkspace && (
        <div className="fixed inset-0 z-50 bg-slate-50 dark:bg-slate-950/95 overflow-y-auto flex flex-col font-outfit text-slate-800 dark:text-white animate-in fade-in duration-200">
          {/* Top Navbar */}
          <div className="p-4 border-b border-slate-200 dark:border-white/5 bg-white dark:bg-slate-900/60 sticky top-0 backdrop-blur-md z-10 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <span className="p-2 bg-indigo-500/10 rounded-xl border border-indigo-500/20 text-indigo-600 dark:text-indigo-400">
                <Sparkles className="h-5 w-5 animate-pulse" />
              </span>
              <div>
                <h1 className="text-md font-bold tracking-tight text-slate-900 dark:text-white">Petrus Enterprise Template Manager</h1>
                <p className="text-xs text-slate-500 dark:text-slate-400">Manage, map, and customize directory attributes for Active Directory and Microsoft 365 provisioning.</p>
              </div>
            </div>
            <button
              onClick={() => {
                setShowTemplatesWorkspace(false);
                setShowTemplateEditor(false);
              }}
              className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl border border-slate-200 dark:border-white/5 transition-all text-xs font-semibold"
            >
              Back to User Management
            </button>
          </div>

          <div className="p-6 max-w-7xl mx-auto w-full flex-1 flex flex-col">
            {/* VIEW 1: TEMPLATE LIST VIEW */}
            {showTemplateEditor === false ? (
              <div className="space-y-6 flex-1 flex flex-col">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-xl font-bold font-outfit text-indigo-600 dark:text-indigo-400">User Creation Templates</h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Standardize account attributes, group memberships, GPO passwords, and Microsoft licenses.</p>
                  </div>
                  <button
                    onClick={() => {
                      setTemplateForm({ ...getInitialTemplateFormWithDomain(adSettingsList, m365SettingsList) });
                      setEnabledAttributes([
                        "firstName", "lastName", "initials", "logonNameFormat", "logonPre2000",
                        "fullNameFormat", "displayNameFormat", "employeeId", "office", "telephoneNumber",
                        "emailFormat", "selectContainer", "protectFromDeletion",
                        "passwordOption", "memberOf", "logonScript", "profilePath",
                        "userMustChangePassword", "userCannotChangePassword", "passwordNeverExpires",
                        "accountDisabled", "smartCardRequired",
                        "homePhone", "mobile", "fax", "title", "department", "company",
                        "street", "city", "stateProvince", "zipPostalCode", "country",
                        "m365License"
                      ]);
                      setEditingTemplateId(null);
                      setActiveTemplateTab("General");
                      setShowTemplateEditor(true);
                    }}
                    className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl transition-all text-xs font-bold shadow-lg shadow-indigo-500/25 flex items-center gap-2"
                  >
                    <Plus className="h-4 w-4" /> Create New Template
                  </button>
                </div>

                {/* Grid list or Table of Templates */}
                <div className="border border-slate-200 dark:border-white/10 rounded-2xl overflow-hidden bg-white dark:bg-slate-900/40 backdrop-blur-md shadow-xl flex-1">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[1000px]">
                      <thead>
                        <tr className="bg-slate-50 dark:bg-slate-950/70 border-b border-slate-200 dark:border-white/5 text-[10px] text-indigo-600 dark:text-indigo-300 font-bold uppercase tracking-wider">
                          <th className="py-4 px-5">Template Name</th>
                          <th className="py-4 px-4">Created By</th>
                          <th className="py-4 px-4">Created On</th>
                          <th className="py-4 px-4">Last Modified</th>
                          <th className="py-4 px-4">Category</th>
                          <th className="py-4 px-4">Target Domain</th>
                          <th className="py-4 px-4">Description</th>
                          <th className="py-4 px-5 text-right w-[150px]">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 dark:divide-white/5 text-xs text-slate-600 dark:text-slate-300">
                        {customTemplates.map(t => (
                          <tr key={t.id} className="hover:bg-slate-50 dark:hover:bg-white/[0.01] transition-colors">
                            <td className="py-4 px-5 font-semibold text-slate-900 dark:text-white">{t.name}</td>
                            <td className="py-4 px-4 text-slate-500 dark:text-slate-400">{t.createdBy}</td>
                            <td className="py-4 px-4 text-slate-500 dark:text-slate-400">{t.createdOn}</td>
                            <td className="py-4 px-4 text-slate-500 dark:text-slate-400">{t.lastModified}</td>
                            <td className="py-4 px-4">
                              <span className="px-2 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-md font-semibold border border-slate-200 dark:border-white/5">{t.category}</span>
                            </td>
                            <td className="py-4 px-4 text-indigo-600 dark:text-indigo-400 font-semibold">{t.domainName}</td>
                            <td className="py-4 px-4 text-slate-500 dark:text-slate-400 max-w-[200px] truncate">{t.description}</td>
                            <td className="py-4 px-5 text-right space-x-2.5">
                              {/* Edit */}
                              <button
                                onClick={() => {
                                  // Populate form with template attributes mapped from t.data or defaults
                                  setTemplateForm({
                                    name: t.name,
                                    description: t.description,
                                    domain: t.domainName === "All Domains" ? "petrus.io" : t.domainName,
                                    category: t.category,
                                    activeDirectory: t.data.createInAd,
                                    microsoft365: t.data.createInM365,
                                    selectedLocation: "Custom Address",
                                    
                                    // General
                                    firstName: "",
                                    initials: "",
                                    lastName: "",
                                    logonNameFormat: "FirstName + LastName",
                                    logonPre2000: "PETRUS\\",
                                    fullNameFormat: "Same as logonname",
                                    displayNameFormat: "Same as logonname",
                                    employeeId: "",
                                    descriptionGeneral: "",
                                    office: t.data.office ?? "",
                                    telephoneNumber: "",
                                    emailFormat: "Same as logonname",
                                    webPage: "",
                                    selectContainer: t.data.targetOu ?? "CN=Users,DC=petrus,DC=io",
                                    protectFromDeletion: false,

                                    // Account
                                    passwordOption: "Random",
                                    customPassword: "",
                                    memberOf: t.data.adGroupDn?.replace("CN=", "").split(",")[0] ?? "Domain Users",
                                    logonScript: "",
                                    profilePath: "",
                                    homeFolderOption: "Local",
                                    homeFolderPath: "",
                                    userMustChangePassword: true,
                                    userCannotChangePassword: false,
                                    passwordNeverExpires: false,
                                    accountDisabled: false,
                                    smartCardRequired: false,

                                    // Contact
                                    homePhone: "",
                                    pager: "",
                                    mobile: "",
                                    fax: "",
                                    ipPhone: "",
                                    notes: "",
                                    title: t.data.jobTitle ?? "",
                                    department: t.data.department ?? "",
                                    company: "",
                                    manager: "",
                                    street: "",
                                    poBox: "",
                                    city: "",
                                    stateProvince: "",
                                    zipPostalCode: "",
                                    country: "",

                                    // Microsoft 365
                                    m365License: t.data.m365License || "Microsoft 365 E5",
                                    createWithoutLicense: t.data.createWithoutLicense || false
                                  });
                                  if (t.data.enabledAttributes) {
                                    setEnabledAttributes(t.data.enabledAttributes);
                                  } else {
                                    setEnabledAttributes([
                                      "firstName", "lastName", "initials", "logonNameFormat", "logonPre2000",
                                      "fullNameFormat", "displayNameFormat", "employeeId", "office", "telephoneNumber",
                                      "emailFormat", "selectContainer", "protectFromDeletion",
                                      "passwordOption", "memberOf", "logonScript", "profilePath",
                                      "userMustChangePassword", "userCannotChangePassword", "passwordNeverExpires",
                                      "accountDisabled", "smartCardRequired",
                                      "homePhone", "mobile", "fax", "title", "department", "company",
                                      "street", "city", "stateProvince", "zipPostalCode", "country",
                                      "m365License"
                                    ]);
                                  }
                                  setEditingTemplateId(t.id);
                                  setActiveTemplateTab("General");
                                  setShowTemplateEditor(true);
                                }}
                                className="px-2.5 py-1.5 bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 text-indigo-600 dark:text-indigo-400 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-500/20 transition-all font-semibold"
                              >
                                Edit
                              </button>

                              {/* Duplicate */}
                              <button
                                onClick={async () => {
                                  const dateStr = new Date().toISOString().slice(0, 19).replace('T', ' ');
                                  const duplicate = {
                                    ...t,
                                    id: crypto.randomUUID(),
                                    name: `Copy of ${t.name}`,
                                    createdOn: dateStr,
                                    lastModified: dateStr,
                                  };
                                  await saveTemplateToBackend(duplicate);
                                  setJobModal({isOpen: true, success: false, message: `Successfully duplicated template as 'Copy of ${t.name}'!`});
                                }}
                                className="px-2.5 py-1.5 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-lg hover:bg-emerald-100 dark:hover:bg-emerald-500/20 transition-all font-semibold"
                              >
                                Copy
                              </button>

                              {/* Delete */}
                              <button
                                onClick={async () => {
                                  if (confirm(`Are you sure you want to delete template '${t.name}'?`)) {
                                    await deleteTemplateFromBackend(t.id);
                                  }
                                }}
                                className="px-2.5 py-1.5 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-100 dark:hover:bg-red-500/20 transition-all font-semibold"
                              >
                                Delete
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            ) : (
              /* VIEW 2: TEMPLATE CREATOR / EDITOR WIZARD */
              <div className="space-y-6 flex-1 flex flex-col bg-white dark:bg-slate-900/40 p-6 border border-slate-200 dark:border-white/5 rounded-3xl backdrop-blur-md">
                <div className="flex justify-between items-center border-b border-slate-200 dark:border-white/5 pb-4">
                  <div>
                    <h2 className="text-lg font-bold font-outfit text-indigo-600 dark:text-indigo-400">
                      {editingTemplateId ? "Modify Template Properties" : "Create New User Provisioning Template"}
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Configure default properties across Active Directory and O365 fields.</p>
                  </div>
                  <button
                    onClick={() => setShowTemplateEditor(false)}
                    className="px-3.5 py-2 bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-slate-100 dark:text-slate-200 rounded-xl transition-all text-xs font-semibold border border-slate-700 dark:border-white/5 shadow-sm"
                  >
                    View Templates
                  </button>
                </div>

                {/* Domain & Template Basics Inputs */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-slate-50 dark:bg-slate-950/30 p-5 border border-slate-200 dark:border-white/5 rounded-2xl">
                  <div className="space-y-1.5">
                    <span className="block text-xs font-medium text-slate-700 dark:text-slate-300">Template Name *</span>
                    <input
                      type="text"
                      required
                      value={templateForm.name}
                      onChange={e => setTemplateForm(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full bg-white dark:bg-slate-950/70 border border-slate-200 dark:border-slate-700/60 focus:border-indigo-500 rounded-xl px-3.5 py-2 text-xs text-slate-800 dark:text-white focus:ring-2 focus:ring-indigo-500/20 outline-none"
                      placeholder="e.g. Finance Staff Template"
                    />
                  </div>
                  
                  <div className="space-y-1.5">
                    <span className="block text-xs font-medium text-slate-700 dark:text-slate-300">Description</span>
                    <textarea
                      value={templateForm.description}
                      onChange={e => setTemplateForm(prev => ({ ...prev, description: e.target.value }))}
                      className="w-full bg-white dark:bg-slate-950/70 border border-slate-200 dark:border-slate-700/60 focus:border-indigo-500 rounded-xl px-3.5 py-1.5 text-xs text-slate-800 dark:text-white focus:ring-2 focus:ring-indigo-500/20 outline-none h-9 resize-none"
                      placeholder="Template purpose..."
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <span className="block text-xs font-medium text-slate-700 dark:text-slate-300">Select Domain</span>
                      <select
                        value={templateForm.domain}
                        onChange={e => {
                          const selectedDomain = e.target.value;
                          const prefix = selectedDomain.split('.')[0].toUpperCase() + "\\";
                          setTemplateForm(prev => ({ 
                            ...prev, 
                            domain: selectedDomain,
                            logonPre2000: prefix
                          }));
                        }}
                        className="w-full bg-white dark:bg-slate-950/70 border border-slate-200 dark:border-slate-700/60 focus:border-indigo-500 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-white focus:ring-2 focus:ring-indigo-500/20 outline-none"
                      >
                        {getIntegratedDomains(adSettingsList, m365SettingsList).map((d: string) => (
                          <option key={d} value={d}>{d}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <span className="block text-xs font-medium text-slate-700 dark:text-slate-300">Category</span>
                      <select
                        value={templateForm.category}
                        onChange={e => setTemplateForm(prev => ({ ...prev, category: e.target.value }))}
                        className="w-full bg-white dark:bg-slate-950/70 border border-slate-200 dark:border-slate-700/60 focus:border-indigo-500 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-white focus:ring-2 focus:ring-indigo-500/20 outline-none"
                      >
                        <option value="Default">Default</option>
                        <option value="test">test</option>
                        <option value="Location">Location</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Target Directories checkboxes */}
                <div className="flex gap-6 items-center bg-slate-50 dark:bg-slate-950/20 p-4 border border-slate-200 dark:border-white/5 rounded-2xl text-xs font-semibold">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="active-directory-cb"
                      checked={templateForm.activeDirectory}
                      onChange={e => setTemplateForm(prev => ({ ...prev, activeDirectory: e.target.checked }))}
                      className="rounded border-slate-300 dark:border-slate-700/80 bg-white dark:bg-slate-950 text-indigo-500 focus:ring-0 w-4 h-4 cursor-pointer"
                    />
                    <label htmlFor="active-directory-cb" className="text-slate-700 dark:text-slate-200 cursor-pointer">Active Directory</label>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="microsoft-365-cb"
                      checked={templateForm.microsoft365}
                      onChange={e => setTemplateForm(prev => ({ ...prev, microsoft365: e.target.checked }))}
                      className="rounded border-slate-300 dark:border-slate-700/80 bg-white dark:bg-slate-950 text-indigo-500 focus:ring-0 w-4 h-4 cursor-pointer"
                    />
                    <label htmlFor="microsoft-365-cb" className="text-slate-700 dark:text-slate-200 cursor-pointer">Microsoft 365</label>
                  </div>
                </div>

                <div className="flex border-b border-slate-200 dark:border-white/5 shrink-0 overflow-x-auto gap-1">
                  {["General", "Account", "Contact", "Microsoft 365", "Attributes"].map(tab => (
                    <button
                      key={tab}
                      onClick={() => setActiveTemplateTab(tab)}
                      className={`px-5 py-3 text-xs font-bold transition-all relative ${
                        activeTemplateTab === tab
                          ? "text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-500"
                          : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
                      } ${tab === "Attributes" ? "flex items-center gap-1.5" : ""}`}
                    >
                      {tab === "Attributes" && (
                        <span className="inline-flex items-center justify-center w-4 h-4 rounded bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 text-[8px] font-black">+</span>
                      )}
                      {tab}
                    </button>
                  ))}
                </div>

                {/* Dynamic Tab Body Container */}
                <div className="flex-1 overflow-y-auto p-2">
                  
                  {/* TAB 1: GENERAL */}
                  {activeTemplateTab === "General" && (
                    <div className="space-y-6 max-w-4xl">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                        <div className="space-y-1.5">
                          <span className="block text-[11px] font-medium text-slate-600 dark:text-slate-300">First Name *</span>
                          <input
                            type="text"
                            required
                            value={templateForm.firstName}
                            onChange={e => setTemplateForm(prev => ({ ...prev, firstName: e.target.value }))}
                            className="w-full bg-white dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 focus:border-indigo-500 rounded-xl px-3 py-1.5 text-xs text-slate-800 dark:text-white focus:ring-1 focus:ring-indigo-500/20 outline-none"
                            placeholder=""
                          />
                        </div>
                        <div className="space-y-1.5">
                          <span className="block text-[11px] font-medium text-slate-600 dark:text-slate-300">Initials</span>
                          <input
                            type="text"
                            value={templateForm.initials}
                            onChange={e => setTemplateForm(prev => ({ ...prev, initials: e.target.value }))}
                            className="w-full bg-white dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 focus:border-indigo-500 rounded-xl px-3 py-1.5 text-xs text-slate-800 dark:text-white focus:ring-1 focus:ring-indigo-500/20 outline-none"
                            placeholder=""
                          />
                        </div>
                        <div className="space-y-1.5">
                          <span className="block text-[11px] font-medium text-slate-600 dark:text-slate-300">Last Name *</span>
                          <input
                            type="text"
                            required
                            value={templateForm.lastName}
                            onChange={e => setTemplateForm(prev => ({ ...prev, lastName: e.target.value }))}
                            className="w-full bg-white dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 focus:border-indigo-500 rounded-xl px-3 py-1.5 text-xs text-slate-800 dark:text-white focus:ring-1 focus:ring-indigo-500/20 outline-none"
                            placeholder=""
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div className="space-y-1.5">
                          <span className="block text-[11px] font-medium text-slate-600 dark:text-slate-300">Logon Name Format *</span>
                          <div className="flex gap-2">
                            <select
                              value={templateForm.logonNameFormat}
                              onChange={e => setTemplateForm(prev => ({ ...prev, logonNameFormat: e.target.value }))}
                              className="flex-1 bg-white dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 focus:border-indigo-500 rounded-xl px-3 py-1.5 text-xs text-slate-800 dark:text-white focus:ring-1 focus:ring-indigo-500/20 outline-none"
                            >
                               <option value="firstname.lastname">firstname.lastname (e.g. john.doe)</option>
                               <option value="lastname.firstname">lastname.firstname (e.g. doe.john)</option>
                               <option value="firstinitial.lastname">firstinitial.lastname (e.g. j.doe)</option>
                               <option value="firstname.lastinitial">firstname.lastinitial (e.g. john.d)</option>
                               <option value="firstinitiallastname">firstinitiallastname (e.g. jdoe)</option>
                               <option value="firstnamelastname">firstnamelastname (e.g. johndoe)</option>
                               <option value="FirstName + LastName">FirstName + LastName</option>
                               <option value="LastName + FirstName">LastName + FirstName</option>
                               <option value="FirstInitial + LastName">FirstInitial + LastName</option>
                               <option value="FirstName + LastInitial">FirstName + LastInitial</option>
                            </select>
                            <span className="text-slate-400 py-1.5">@</span>
                            <input
                              type="text"
                              value={templateForm.domain}
                              onChange={e => setTemplateForm(prev => ({ ...prev, domain: e.target.value }))}
                              className="w-[180px] bg-white dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 focus:border-indigo-500 rounded-xl px-3 py-1.5 text-xs text-slate-800 dark:text-white outline-none"
                            />
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <span className="block text-[11px] font-medium text-slate-600 dark:text-slate-300">Logon name (pre-Windows 2000)</span>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={templateForm.logonPre2000}
                              onChange={e => setTemplateForm(prev => ({ ...prev, logonPre2000: e.target.value }))}
                              className="w-[120px] bg-white dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 focus:border-indigo-500 rounded-xl px-3 py-1.5 text-xs text-slate-800 dark:text-white outline-none font-mono"
                            />
                            <select
                              className="flex-1 bg-white dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 focus:border-indigo-500 rounded-xl px-3 py-1.5 text-xs text-slate-800 dark:text-white outline-none"
                            >
                              <option>Same as logonname</option>
                            </select>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div className="space-y-1.5">
                          <span className="block text-[11px] font-medium text-slate-600 dark:text-slate-300">Full name format</span>
                          <select
                            value={templateForm.fullNameFormat}
                            onChange={e => setTemplateForm(prev => ({ ...prev, fullNameFormat: e.target.value }))}
                            className="w-full bg-white dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 focus:border-indigo-500 rounded-xl px-3 py-1.5 text-xs text-slate-800 dark:text-white outline-none"
                          >
                            <option value="Same as logonname">Same as logonname</option>
                            <option value="FirstName + LastName">FirstName + LastName</option>
                          </select>
                        </div>
                        
                        <div className="space-y-1.5">
                          <span className="block text-[11px] font-medium text-slate-600 dark:text-slate-300">Display name format</span>
                          <select
                            value={templateForm.displayNameFormat}
                            onChange={e => setTemplateForm(prev => ({ ...prev, displayNameFormat: e.target.value }))}
                            className="w-full bg-white dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 focus:border-indigo-500 rounded-xl px-3 py-1.5 text-xs text-slate-800 dark:text-white outline-none"
                          >
                            <option value="Same as logonname">Same as logonname</option>
                            <option value="FirstName + LastName">FirstName + LastName</option>
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                        <div className="space-y-1.5">
                          <span className="block text-[11px] font-medium text-slate-600 dark:text-slate-300">Employee ID</span>
                          <input
                            type="text"
                            value={templateForm.employeeId}
                            onChange={e => setTemplateForm(prev => ({ ...prev, employeeId: e.target.value }))}
                            className="w-full bg-white dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 focus:border-indigo-500 rounded-xl px-3 py-1.5 text-xs text-slate-800 dark:text-white outline-none"
                            placeholder="Employee ID"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <span className="block text-[11px] font-medium text-slate-600 dark:text-slate-300">Description</span>
                          <input
                            type="text"
                            value={templateForm.descriptionGeneral}
                            onChange={e => setTemplateForm(prev => ({ ...prev, descriptionGeneral: e.target.value }))}
                            className="w-full bg-white dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 focus:border-indigo-500 rounded-xl px-3 py-1.5 text-xs text-slate-800 dark:text-white outline-none"
                            placeholder="AD Object Description"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <span className="block text-[11px] font-medium text-slate-600 dark:text-slate-300">Office</span>
                          <select
                            value={templateForm.office}
                            onChange={e => setTemplateForm(prev => ({ ...prev, office: e.target.value }))}
                            className="w-full bg-white dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 focus:border-indigo-500 rounded-xl px-3 py-1.5 text-xs text-slate-800 dark:text-white outline-none"
                          >
                            <option value="">-- Select/specify a value --</option>
                            <option value="San Francisco HQ">San Francisco HQ</option>
                            <option value="New York HQ">New York HQ</option>
                            <option value="Austin Branch">Austin Branch</option>
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div className="space-y-1.5">
                          <span className="block text-[11px] font-medium text-slate-600 dark:text-slate-300">Telephone number</span>
                          <input
                            type="text"
                            value={templateForm.telephoneNumber}
                            onChange={e => setTemplateForm(prev => ({ ...prev, telephoneNumber: e.target.value }))}
                            className="w-full bg-white dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 focus:border-indigo-500 rounded-xl px-3 py-1.5 text-xs text-slate-800 dark:text-white outline-none"
                            placeholder="Office phone"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <span className="block text-[11px] font-medium text-slate-600 dark:text-slate-300">Email Format</span>
                          <select
                            value={templateForm.emailFormat}
                            onChange={e => setTemplateForm(prev => ({ ...prev, emailFormat: e.target.value }))}
                            className="w-full bg-white dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 focus:border-indigo-500 rounded-xl px-3 py-1.5 text-xs text-slate-800 dark:text-white outline-none"
                          >
                            <option value="Same as logonname">Same as logonname</option>
                          </select>
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <span className="block text-[11px] font-medium text-slate-600 dark:text-slate-300">Select Container (OU Path) *</span>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            required
                            value={templateForm.selectContainer}
                            onChange={e => setTemplateForm(prev => ({ ...prev, selectContainer: e.target.value }))}
                            className="flex-1 bg-white dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 focus:border-indigo-500 rounded-xl px-3 py-1.5 text-xs text-slate-800 dark:text-white outline-none font-mono"
                          />
                          <button
                            type="button"
                            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold border border-indigo-500"
                            onClick={() => openOuBrowser("template")}
                          >
                            Browse OU
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 pt-2">
                        <input
                          type="checkbox"
                          id="protect-del-cb"
                          checked={templateForm.protectFromDeletion}
                          onChange={e => setTemplateForm(prev => ({ ...prev, protectFromDeletion: e.target.checked }))}
                          className="rounded border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-950 text-indigo-500 w-4 h-4"
                        />
                        <label htmlFor="protect-del-cb" className="text-xs text-slate-600 dark:text-slate-300 cursor-pointer">Protect object from accidental deletion</label>
                      </div>
                    </div>
                  )}

                  {/* TAB 2: ACCOUNT */}
                  {activeTemplateTab === "Account" && (
                    <div className="space-y-6 max-w-4xl">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 dark:bg-slate-950/20 p-5 border border-slate-200 dark:border-white/5 rounded-2xl">
                        {/* Left Column: Password settings */}
                        <div className="space-y-4">
                          <h4 className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest pb-1 border-b border-slate-200 dark:border-white/5">Password/Group/Profile</h4>
                          
                          <div className="space-y-3 text-xs text-slate-700 dark:text-slate-300">
                            <div className="flex items-center gap-2">
                              <input
                                type="radio"
                                id="pwd-opt-rand"
                                name="pwd-opt"
                                checked={templateForm.passwordOption === "Random"}
                                onChange={() => setTemplateForm(prev => ({ ...prev, passwordOption: "Random" }))}
                                className="bg-white dark:bg-slate-950 border-slate-300 dark:border-slate-800 text-indigo-500"
                              />
                              <label htmlFor="pwd-opt-rand" className="cursor-pointer">Random Password (AD GPO Compliant)</label>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              <input
                                type="radio"
                                id="pwd-opt-policy"
                                name="pwd-opt"
                                checked={templateForm.passwordOption === "Policy"}
                                onChange={() => setTemplateForm(prev => ({ ...prev, passwordOption: "Policy" }))}
                                className="bg-white dark:bg-slate-950 border-slate-300 dark:border-slate-800 text-indigo-500"
                              />
                              <label htmlFor="pwd-opt-policy" className="cursor-pointer">Use Password Policy</label>
                            </div>

                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <input
                                  type="radio"
                                  id="pwd-opt-custom"
                                  name="pwd-opt"
                                  checked={templateForm.passwordOption === "Custom"}
                                  onChange={() => setTemplateForm(prev => ({ ...prev, passwordOption: "Custom" }))}
                                  className="bg-white dark:bg-slate-950 border-slate-300 dark:border-slate-800 text-indigo-500"
                                />
                                <label htmlFor="pwd-opt-custom" className="cursor-pointer">Type a Password</label>
                              </div>
                              {templateForm.passwordOption === "Custom" && (
                                <input
                                  type="password"
                                  value={templateForm.customPassword}
                                  onChange={e => setTemplateForm(prev => ({ ...prev, customPassword: e.target.value }))}
                                  className="w-full bg-white dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 focus:border-indigo-500 rounded-xl px-3 py-1.5 text-xs text-slate-800 dark:text-white outline-none"
                                  placeholder="Enter custom default password"
                                />
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Right Column: Group & Profile */}
                        <div className="space-y-4">
                          <h4 className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest pb-1 border-b border-slate-200 dark:border-white/5">AD Security Group (Member Of)</h4>
                          <div className="space-y-1.5">
                            <span className="block text-[11px] font-medium text-slate-600 dark:text-slate-300">Member of Group CN *</span>
                            <input
                              type="text"
                              value={templateForm.memberOf}
                              onChange={e => setTemplateForm(prev => ({ ...prev, memberOf: e.target.value }))}
                              className="w-full bg-white dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 focus:border-indigo-500 rounded-xl px-3 py-1.5 text-xs text-slate-800 dark:text-white outline-none font-mono"
                              placeholder="Domain Users"
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-3 pt-2">
                            <div className="space-y-1.5">
                              <span className="block text-[11px] font-medium text-slate-600 dark:text-slate-300">Logon script</span>
                              <input
                                type="text"
                                value={templateForm.logonScript}
                                onChange={e => setTemplateForm(prev => ({ ...prev, logonScript: e.target.value }))}
                                className="w-full bg-white dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 focus:border-indigo-500 rounded-xl px-3 py-1.5 text-xs text-slate-800 dark:text-white outline-none"
                                placeholder="script.bat"
                              />
                            </div>
                            <div className="space-y-1.5">
                              <span className="block text-[11px] font-medium text-slate-600 dark:text-slate-300">Profile Path</span>
                              <input
                                type="text"
                                value={templateForm.profilePath}
                                onChange={e => setTemplateForm(prev => ({ ...prev, profilePath: e.target.value }))}
                                className="w-full bg-white dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 focus:border-indigo-500 rounded-xl px-3 py-1.5 text-xs text-slate-800 dark:text-white outline-none"
                                placeholder="\\server\profiles\"
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Account Properties */}
                      <div className="bg-slate-50 dark:bg-slate-950/20 p-5 border border-slate-200 dark:border-white/5 rounded-2xl space-y-4">
                        <h4 className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest pb-1 border-b border-slate-200 dark:border-white/5">Account Properties</h4>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-700 dark:text-slate-300">
                          <div className="space-y-3">
                            <div className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                id="ac-prop-change"
                                checked={templateForm.userMustChangePassword}
                                onChange={e => setTemplateForm(prev => ({ ...prev, userMustChangePassword: e.target.checked }))}
                                className="rounded bg-white dark:bg-slate-950 border-slate-300 dark:border-slate-800 text-indigo-500 w-4 h-4"
                              />
                              <label htmlFor="ac-prop-change" className="cursor-pointer">User must change password at next logon</label>
                            </div>
                            <div className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                id="ac-prop-no-change"
                                checked={templateForm.userCannotChangePassword}
                                onChange={e => setTemplateForm(prev => ({ ...prev, userCannotChangePassword: e.target.checked }))}
                                className="rounded bg-white dark:bg-slate-950 border-slate-300 dark:border-slate-800 text-indigo-500 w-4 h-4"
                              />
                              <label htmlFor="ac-prop-no-change" className="cursor-pointer">User cannot change password</label>
                            </div>
                            <div className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                id="ac-prop-expire"
                                checked={templateForm.passwordNeverExpires}
                                onChange={e => setTemplateForm(prev => ({ ...prev, passwordNeverExpires: e.target.checked }))}
                                className="rounded bg-white dark:bg-slate-950 border-slate-300 dark:border-slate-800 text-indigo-500 w-4 h-4"
                              />
                              <label htmlFor="ac-prop-expire" className="cursor-pointer">Password never expires</label>
                            </div>
                          </div>

                          <div className="space-y-3">
                            <div className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                id="ac-prop-disabled"
                                checked={templateForm.accountDisabled}
                                onChange={e => setTemplateForm(prev => ({ ...prev, accountDisabled: e.target.checked }))}
                                className="rounded bg-white dark:bg-slate-950 border-slate-300 dark:border-slate-800 text-indigo-500 w-4 h-4"
                              />
                              <label htmlFor="ac-prop-disabled" className="cursor-pointer">Account is disabled</label>
                            </div>
                            <div className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                id="ac-prop-smart"
                                checked={templateForm.smartCardRequired}
                                onChange={e => setTemplateForm(prev => ({ ...prev, smartCardRequired: e.target.checked }))}
                                className="rounded bg-white dark:bg-slate-950 border-slate-300 dark:border-slate-800 text-indigo-500 w-4 h-4"
                              />
                              <label htmlFor="ac-prop-smart" className="cursor-pointer">Smart card is required for interactive login</label>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* TAB 3: CONTACT */}
                  {activeTemplateTab === "Contact" && (
                    <div className="space-y-6 max-w-4xl">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 dark:bg-slate-950/20 p-5 border border-slate-200 dark:border-white/5 rounded-2xl">
                        {/* Telephone / Organization */}
                        <div className="space-y-4">
                          <h4 className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest pb-1 border-b border-slate-200 dark:border-white/5">Telephone/Organization</h4>
                          
                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                              <span className="block text-[11px] font-medium text-slate-600 dark:text-slate-300">Home Phone</span>
                              <input
                                type="text"
                                value={templateForm.homePhone}
                                onChange={e => setTemplateForm(prev => ({ ...prev, homePhone: e.target.value }))}
                                className="w-full bg-white dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 focus:border-indigo-500 rounded-xl px-3 py-1.5 text-xs text-slate-800 dark:text-white outline-none"
                              />
                            </div>
                            <div className="space-y-1.5">
                              <span className="block text-[11px] font-medium text-slate-600 dark:text-slate-300">Mobile</span>
                              <input
                                type="text"
                                value={templateForm.mobile}
                                onChange={e => setTemplateForm(prev => ({ ...prev, mobile: e.target.value }))}
                                className="w-full bg-white dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 focus:border-indigo-500 rounded-xl px-3 py-1.5 text-xs text-slate-800 dark:text-white outline-none"
                              />
                            </div>
                            <div className="space-y-1.5">
                              <span className="block text-[11px] font-medium text-slate-600 dark:text-slate-300">Fax</span>
                              <input
                                type="text"
                                value={templateForm.fax}
                                onChange={e => setTemplateForm(prev => ({ ...prev, fax: e.target.value }))}
                                className="w-full bg-white dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 focus:border-indigo-500 rounded-xl px-3 py-1.5 text-xs text-slate-800 dark:text-white outline-none"
                              />
                            </div>
                            <div className="space-y-1.5">
                              <span className="block text-[11px] font-medium text-slate-600 dark:text-slate-300">Pager</span>
                              <input
                                type="text"
                                value={templateForm.pager}
                                onChange={e => setTemplateForm(prev => ({ ...prev, pager: e.target.value }))}
                                className="w-full bg-white dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 focus:border-indigo-500 rounded-xl px-3 py-1.5 text-xs text-slate-800 dark:text-white outline-none"
                              />
                            </div>
                          </div>

                          <div className="space-y-1.5">
                            <span className="block text-[11px] font-medium text-slate-600 dark:text-slate-300">Designation / Title</span>
                            <input
                              type="text"
                              value={templateForm.title}
                              onChange={e => setTemplateForm(prev => ({ ...prev, title: e.target.value }))}
                              className="w-full bg-white dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 focus:border-indigo-500 rounded-xl px-3 py-1.5 text-xs text-slate-800 dark:text-white outline-none"
                              placeholder="e.g. Sales Specialist"
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                              <span className="block text-[11px] font-medium text-slate-600 dark:text-slate-300">Department</span>
                              <input
                                type="text"
                                value={templateForm.department}
                                onChange={e => setTemplateForm(prev => ({ ...prev, department: e.target.value }))}
                                className="w-full bg-white dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 focus:border-indigo-500 rounded-xl px-3 py-1.5 text-xs text-slate-800 dark:text-white outline-none"
                                placeholder="Sales"
                              />
                            </div>
                            <div className="space-y-1.5">
                              <span className="block text-[11px] font-medium text-slate-600 dark:text-slate-300">Company</span>
                              <input
                                type="text"
                                value={templateForm.company}
                                onChange={e => setTemplateForm(prev => ({ ...prev, company: e.target.value }))}
                                className="w-full bg-white dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 focus:border-indigo-500 rounded-xl px-3 py-1.5 text-xs text-slate-800 dark:text-white outline-none"
                                placeholder="Petrus Corp"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Address */}
                        <div className="space-y-4">
                          <h4 className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest pb-1 border-b border-slate-200 dark:border-white/5">Address</h4>
                          
                          <div className="space-y-1.5">
                            <span className="block text-[11px] font-medium text-slate-600 dark:text-slate-300">Select Location Template</span>
                            <select
                              value={templateForm.selectedLocation || "Custom Address"}
                              onChange={e => {
                                const locName = e.target.value;
                                const found = PREDEFINED_LOCATIONS.find(l => l.name === locName);
                                if (found) {
                                  setTemplateForm(prev => ({
                                    ...prev,
                                    selectedLocation: locName,
                                    street: found.street,
                                    city: found.city,
                                    stateProvince: found.stateProvince,
                                    zipPostalCode: found.zipPostalCode,
                                    country: found.country
                                  }));
                                }
                              }}
                              className="w-full bg-white dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 focus:border-indigo-500 rounded-xl px-3 py-1.5 text-xs text-slate-800 dark:text-white outline-none"
                            >
                              {PREDEFINED_LOCATIONS.map(loc => (
                                <option key={loc.name} value={loc.name}>{loc.name}</option>
                              ))}
                            </select>
                          </div>

                          <div className="space-y-1.5">
                            <span className="block text-[11px] font-medium text-slate-600 dark:text-slate-300">Street</span>
                            <textarea
                              value={templateForm.street}
                              onChange={e => setTemplateForm(prev => ({ ...prev, street: e.target.value, selectedLocation: "Custom Address" }))}
                              className="w-full bg-white dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 focus:border-indigo-500 rounded-xl px-3 py-1 text-xs text-slate-800 dark:text-white outline-none h-11 resize-none"
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                              <span className="block text-[11px] font-medium text-slate-600 dark:text-slate-300">City</span>
                              <input
                                type="text"
                                value={templateForm.city}
                                onChange={e => setTemplateForm(prev => ({ ...prev, city: e.target.value, selectedLocation: "Custom Address" }))}
                                className="w-full bg-white dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 focus:border-indigo-500 rounded-xl px-3 py-1.5 text-xs text-slate-800 dark:text-white outline-none"
                              />
                            </div>
                            <div className="space-y-1.5">
                              <span className="block text-[11px] font-medium text-slate-600 dark:text-slate-300">State/Province</span>
                              <input
                                type="text"
                                value={templateForm.stateProvince}
                                onChange={e => setTemplateForm(prev => ({ ...prev, stateProvince: e.target.value, selectedLocation: "Custom Address" }))}
                                className="w-full bg-white dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 focus:border-indigo-500 rounded-xl px-3 py-1.5 text-xs text-slate-800 dark:text-white outline-none"
                              />
                            </div>
                            <div className="space-y-1.5">
                              <span className="block text-[11px] font-medium text-slate-600 dark:text-slate-300">Zip/Postal Code</span>
                              <input
                                type="text"
                                value={templateForm.zipPostalCode}
                                onChange={e => setTemplateForm(prev => ({ ...prev, zipPostalCode: e.target.value, selectedLocation: "Custom Address" }))}
                                className="w-full bg-white dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 focus:border-indigo-500 rounded-xl px-3 py-1.5 text-xs text-slate-800 dark:text-white outline-none"
                              />
                            </div>
                            <div className="space-y-1.5">
                              <span className="block text-[11px] font-medium text-slate-600 dark:text-slate-300">Country</span>
                              <input
                                type="text"
                                value={templateForm.country}
                                onChange={e => setTemplateForm(prev => ({ ...prev, country: e.target.value, selectedLocation: "Custom Address" }))}
                                className="w-full bg-white dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 focus:border-indigo-500 rounded-xl px-3 py-1.5 text-xs text-slate-800 dark:text-white outline-none"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* TAB 4: MICROSOFT 365 */}
                  {activeTemplateTab === "Microsoft 365" && (
                    <div className="space-y-6 max-w-4xl bg-slate-50 dark:bg-slate-950/20 p-5 border border-slate-200 dark:border-white/5 rounded-2xl">
                      <h4 className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest pb-1 border-b border-slate-200 dark:border-white/5">Microsoft 365 / Entra ID Licensing</h4>
                      
                      <div className="space-y-4 max-w-md">
                        <div className="space-y-1.5">
                          <span className="block text-xs font-medium text-slate-600 dark:text-slate-300">M365 Licensing SKU</span>
                          <select
                            value={templateForm.m365License}
                            onChange={e => setTemplateForm(prev => ({ ...prev, m365License: e.target.value }))}
                            className="w-full bg-white dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 focus:border-indigo-500 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-white outline-none"
                          >
                            {M365_LICENSES.map(lic => (
                              <option key={lic.id} value={lic.id}>{lic.name}</option>
                            ))}
                          </select>
                        </div>

                        <div className="flex items-center gap-2 pt-2">
                          <input
                            type="checkbox"
                            id="tpl-no-lic-cb"
                            checked={templateForm.createWithoutLicense}
                            onChange={e => setTemplateForm(prev => ({ ...prev, createWithoutLicense: e.target.checked }))}
                            className="rounded bg-white dark:bg-slate-950 border-slate-300 dark:border-slate-800 text-indigo-500 w-4 h-4 cursor-pointer"
                          />
                          <label htmlFor="tpl-no-lic-cb" className="text-xs text-slate-600 dark:text-slate-300 cursor-pointer">Create user without license (assign SKU manually later)</label>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* TAB 5: ATTRIBUTES */}
                  {activeTemplateTab === "Attributes" && (() => {
                    const AD_ATTRIBUTES = [
                      { key: "firstName", label: "First Name", category: "AD – Identity", required: true },
                      { key: "lastName", label: "Last Name", category: "AD – Identity", required: true },
                      { key: "initials", label: "Initials", category: "AD – Identity" },
                      { key: "displayName", label: "Display Name", category: "AD – Identity" },
                      { key: "logonNameFormat", label: "Logon Name Format (UPN prefix)", category: "AD – Identity" },
                      { key: "logonPre2000", label: "Logon Name (pre-Windows 2000)", category: "AD – Identity" },
                      { key: "fullNameFormat", label: "Full Name Format", category: "AD – Identity" },
                      { key: "displayNameFormat", label: "Display Name Format", category: "AD – Identity" },
                      { key: "employeeId", label: "Employee ID", category: "AD – Identity" },
                      { key: "descriptionGeneral", label: "Description", category: "AD – Identity" },
                      { key: "office", label: "Office", category: "AD – Identity" },
                      { key: "telephoneNumber", label: "Telephone Number", category: "AD – Identity" },
                      { key: "emailFormat", label: "Email Format", category: "AD – Identity" },
                      { key: "webPage", label: "Web Page", category: "AD – Identity" },
                      { key: "selectContainer", label: "OU Container (AD Path)", category: "AD – Identity" },
                      { key: "protectFromDeletion", label: "Protect from Accidental Deletion", category: "AD – Identity" },
                      { key: "passwordOption", label: "Password Option", category: "AD – Account" },
                      { key: "customPassword", label: "Custom Password", category: "AD – Account" },
                      { key: "memberOf", label: "Member Of (Group)", category: "AD – Account" },
                      { key: "logonScript", label: "Logon Script", category: "AD – Account" },
                      { key: "profilePath", label: "Profile Path", category: "AD – Account" },
                      { key: "homeFolderPath", label: "Home Folder Path", category: "AD – Account" },
                      { key: "userMustChangePassword", label: "User Must Change Password", category: "AD – Account" },
                      { key: "userCannotChangePassword", label: "User Cannot Change Password", category: "AD – Account" },
                      { key: "passwordNeverExpires", label: "Password Never Expires", category: "AD – Account" },
                      { key: "accountDisabled", label: "Account is Disabled", category: "AD – Account" },
                      { key: "smartCardRequired", label: "Smart Card Required", category: "AD – Account" },
                      { key: "homePhone", label: "Home Phone", category: "AD – Contact" },
                      { key: "mobile", label: "Mobile", category: "AD – Contact" },
                      { key: "fax", label: "Fax", category: "AD – Contact" },
                      { key: "pager", label: "Pager", category: "AD – Contact" },
                      { key: "ipPhone", label: "IP Phone", category: "AD – Contact" },
                      { key: "notes", label: "Notes", category: "AD – Contact" },
                      { key: "title", label: "Job Title", category: "AD – Contact" },
                      { key: "department", label: "Department", category: "AD – Contact" },
                      { key: "company", label: "Company", category: "AD – Contact" },
                      { key: "manager", label: "Manager", category: "AD – Contact" },
                      { key: "street", label: "Street", category: "AD – Address" },
                      { key: "poBox", label: "PO Box", category: "AD – Address" },
                      { key: "city", label: "City", category: "AD – Address" },
                      { key: "stateProvince", label: "State / Province", category: "AD – Address" },
                      { key: "zipPostalCode", label: "Zip / Postal Code", category: "AD – Address" },
                      { key: "country", label: "Country", category: "AD – Address" },
                      { key: "m365License", label: "M365 License SKU", category: "O365 – Licensing" },
                      { key: "createWithoutLicense", label: "Create Without License", category: "O365 – Licensing" },
                      { key: "usageLocation", label: "Usage Location", category: "O365 – Licensing" },
                      { key: "m365JobTitle", label: "M365 Job Title", category: "O365 – Profile" },
                      { key: "m365Department", label: "M365 Department", category: "O365 – Profile" },
                      { key: "m365OfficeLocation", label: "M365 Office Location", category: "O365 – Profile" },
                      { key: "m365BusinessPhone", label: "M365 Business Phone", category: "O365 – Profile" },
                      { key: "m365MobilePhone", label: "M365 Mobile Phone", category: "O365 – Profile" },
                      { key: "m365StreetAddress", label: "M365 Street Address", category: "O365 – Profile" },
                      { key: "m365City", label: "M365 City", category: "O365 – Profile" },
                      { key: "m365State", label: "M365 State", category: "O365 – Profile" },
                      { key: "m365PostalCode", label: "M365 Postal Code", category: "O365 – Profile" },
                      { key: "m365Country", label: "M365 Country", category: "O365 – Profile" },
                      { key: "m365Manager", label: "M365 Manager", category: "O365 – Profile" },
                      { key: "m365CompanyName", label: "M365 Company Name", category: "O365 – Profile" },
                      { key: "mfaEnabled", label: "MFA Enabled", category: "O365 – Security" },
                      { key: "conditionalAccessPolicy", label: "Conditional Access Policy", category: "O365 – Security" },
                      { key: "mailboxAlias", label: "Mailbox Alias (SMTP)", category: "O365 – Exchange" },
                      { key: "mailboxType", label: "Mailbox Type", category: "O365 – Exchange" },
                      { key: "sharedMailboxDelegate", label: "Shared Mailbox Delegate", category: "O365 – Exchange" },
                      { key: "distributionGroup", label: "Distribution Group Membership", category: "O365 – Exchange" },
                      { key: "teams", label: "Teams Enabled", category: "O365 – Teams" },
                      { key: "teamsPolicy", label: "Teams Policy", category: "O365 – Teams" },
                      { key: "sharePointSite", label: "SharePoint Site Access", category: "O365 – SharePoint" },
                    ];
                    const categories = [...new Set(AD_ATTRIBUTES.map(a => a.category))];
                    const filtered = attrSearch
                      ? AD_ATTRIBUTES.filter(a => a.label.toLowerCase().includes(attrSearch.toLowerCase()) || a.category.toLowerCase().includes(attrSearch.toLowerCase()))
                      : AD_ATTRIBUTES;
                    return (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="text-sm font-bold text-slate-800 dark:text-white">Template Attributes Library</h4>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Toggle which AD and O365 attributes are included in this template. Required attributes cannot be removed.</p>
                          </div>
                          <div className="text-[11px] text-indigo-600 dark:text-indigo-400 font-semibold bg-indigo-50 dark:bg-indigo-900/20 px-3 py-1 rounded-full">
                            {enabledAttributes.length} / {AD_ATTRIBUTES.length} active
                          </div>
                        </div>

                        <input
                          type="text"
                          placeholder="Search attributes (e.g. phone, address, M365)..."
                          value={attrSearch}
                          onChange={e => setAttrSearch(e.target.value)}
                          className="w-full bg-white dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 focus:border-indigo-500 rounded-xl px-4 py-2.5 text-xs text-slate-800 dark:text-white outline-none"
                        />

                        <div className="flex gap-3 flex-wrap">
                          <button type="button" onClick={() => setEnabledAttributes(AD_ATTRIBUTES.map(a => a.key))}
                            className="text-[11px] px-3 py-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 transition-colors font-semibold">
                            Enable All
                          </button>
                          <button type="button" onClick={() => setEnabledAttributes(AD_ATTRIBUTES.filter(a => a.required).map(a => a.key))}
                            className="text-[11px] px-3 py-1.5 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors font-semibold">
                            Required Only
                          </button>
                        </div>

                        <div className="space-y-5">
                          {(attrSearch ? ["Search Results"] : categories).map(cat => {
                            const items = attrSearch
                              ? filtered
                              : filtered.filter(a => a.category === cat);
                            if (items.length === 0) return null;
                            const catColorMap: Record<string, string> = {
                              "AD – Identity": "text-blue-600 dark:text-blue-400",
                              "AD – Account": "text-violet-600 dark:text-violet-400",
                              "AD – Contact": "text-emerald-600 dark:text-emerald-400",
                              "AD – Address": "text-orange-600 dark:text-orange-400",
                              "O365 – Licensing": "text-yellow-600 dark:text-yellow-400",
                              "O365 – Profile": "text-pink-600 dark:text-pink-400",
                              "O365 – Security": "text-red-600 dark:text-red-400",
                              "O365 – Exchange": "text-cyan-600 dark:text-cyan-400",
                              "O365 – Teams": "text-purple-600 dark:text-purple-400",
                              "O365 – SharePoint": "text-teal-600 dark:text-teal-400",
                            };
                            return (
                              <div key={cat} className="bg-slate-50 dark:bg-slate-950/20 border border-slate-200 dark:border-white/5 rounded-2xl overflow-hidden">
                                <div className={`px-4 py-2 border-b border-slate-200 dark:border-white/5 text-[10px] font-bold uppercase tracking-widest ${catColorMap[cat] || 'text-slate-500'}`}>
                                  {cat}
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-0 divide-y divide-slate-100 dark:divide-white/5">
                                  {items.map(renderAttributeRow)}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })()}

                </div>

                {/* Footer Save / Cancel buttons */}
                <div className="pt-4 border-t border-slate-200 dark:border-white/5 flex gap-3 justify-end shrink-0">
                  <button
                    type="button"
                    onClick={() => setShowTemplateEditor(false)}
                    className="px-5 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl transition-all font-semibold text-xs border border-slate-200 dark:border-white/5"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      if (!templateForm.name) {
                        setJobModal({isOpen: true, success: false, message: "Please enter a Template Name."});
                        return;
                      }
                      
                      const dateStr = new Date().toISOString().slice(0, 19).replace('T', ' ');
                      
                      const tplData = {
                        jobTitle: templateForm.title ?? "Systems Engineer",
                        department: templateForm.department ?? "Engineering",
                        office: templateForm.office ?? "San Francisco HQ",
                        createInAd: templateForm.activeDirectory,
                        createInM365: templateForm.microsoft365,
                        targetOu: templateForm.selectContainer ?? "CN=Users,DC=petrus,DC=io",
                        adGroupDn: templateForm.memberOf ? `CN=${templateForm.memberOf},CN=Users` : "CN=Domain Users,CN=Users",
                        m365License: templateForm.m365License,
                        createWithoutLicense: templateForm.createWithoutLicense,
                        enabledAttributes: enabledAttributes
                      };

                      if (editingTemplateId) {
                        const updatedTpl = {
                          id: editingTemplateId,
                          name: templateForm.name,
                          description: templateForm.description,
                          domainName: templateForm.domain === "petrus.io" ? "All Domains" : templateForm.domain,
                          category: templateForm.category,
                          lastModified: dateStr,
                          createdBy: String.raw`Petrus Directory Authority\admin`,
                          createdOn: dateStr, // Will fall back or be preserved
                          data: tplData
                        };
                        await saveTemplateToBackend(updatedTpl);
                        setJobModal({isOpen: true, success: false, message: `Successfully modified template '${templateForm.name}'!`});
                      } else {
                        const newTpl = {
                          id: crypto.randomUUID(),
                          name: templateForm.name,
                          createdBy: String.raw`Petrus Directory Authority\admin`,
                          createdOn: dateStr,
                          lastModified: dateStr,
                          category: templateForm.category,
                          description: templateForm.description,
                          domainName: templateForm.domain === "petrus.io" ? "All Domains" : templateForm.domain,
                          data: tplData
                        };
                        await saveTemplateToBackend(newTpl);
                        setJobModal({isOpen: true, success: false, message: `Successfully created template '${templateForm.name}'!`});
                      }

                      setShowTemplateEditor(false);
                    }}
                    className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl transition-all font-semibold text-xs shadow-lg shadow-indigo-500/20"
                  >
                    Save Template
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      {/* OU Browser Modal */}
      {showOuBrowser && (() => {
        const adSettings = adSettingsList[0];
        const baseDn = adSettings?.baseDn || adSettings?.ldapPath || 'DC=domain,DC=local';

        // Fallback static tree (used when AD is unreachable or loading)
        const staticOus = [
          { name: 'Users', dn: `CN=Users,${baseDn}`, path: 'CN=Users' },
          { name: 'Computers', dn: `CN=Computers,${baseDn}`, path: 'CN=Computers' },
          { name: 'Employees', dn: `OU=Employees,${baseDn}`, path: 'OU=Employees' },
          { name: 'Engineering', dn: `OU=Engineering,OU=Employees,${baseDn}`, path: 'OU=Engineering,OU=Employees' },
          { name: 'Sales', dn: `OU=Sales,OU=Employees,${baseDn}`, path: 'OU=Sales,OU=Employees' },
          { name: 'HR', dn: `OU=HR,OU=Employees,${baseDn}`, path: 'OU=HR,OU=Employees' },
          { name: 'IT', dn: `OU=IT,OU=Employees,${baseDn}`, path: 'OU=IT,OU=Employees' },
          { name: 'Finance', dn: `OU=Finance,OU=Employees,${baseDn}`, path: 'OU=Finance,OU=Employees' },
          { name: 'Contractors', dn: `OU=Contractors,${baseDn}`, path: 'OU=Contractors' },
          { name: 'Service Accounts', dn: `OU=ServiceAccounts,${baseDn}`, path: 'OU=ServiceAccounts' },
          { name: 'Disabled Accounts', dn: `OU=Disabled,${baseDn}`, path: 'OU=Disabled' },
          { name: 'Groups', dn: `OU=Groups,${baseDn}`, path: 'OU=Groups' },
        ];

        const displayOus = ouList.length > 0 ? ouList : staticOus;

        const filtered = ouBrowserSearch
          ? displayOus.filter(o =>
              o.name.toLowerCase().includes(ouBrowserSearch.toLowerCase()) ||
              o.path.toLowerCase().includes(ouBrowserSearch.toLowerCase())
            )
          : displayOus;

        const getIndent = (ou: { path: string }) => {
          // Count commas to determine depth (each comma = one level deeper)
          const commas = (ou.path.match(/,/g) || []).length;
          return commas * 16;
        };

        const handleSelect = (dn: string) => {
          if (ouBrowserTarget === 'template') {
            setTemplateForm(prev => ({ ...prev, selectContainer: dn }));
          } else {
            setSingleUserFormData(prev => ({ ...prev, targetOu: dn }));
          }
          setShowOuBrowser(false);
        };

        return (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
              {/* Header */}
              <div className="p-5 border-b border-slate-100 dark:border-white/5 flex justify-between items-center">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">Browse Organizational Units</h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Domain: <span className="font-mono text-indigo-600 dark:text-indigo-400">{baseDn}</span>
                    {ouList.length > 0 && <span className="ml-2 text-emerald-500">✓ Live from AD ({ouList.length} OUs)</span>}
                    {ouListLoading && <span className="ml-2 text-yellow-500 animate-pulse">Fetching from AD...</span>}
                  </p>
                </div>
                <button onClick={() => setShowOuBrowser(false)} className="text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Search */}
              <div className="p-4 border-b border-slate-100 dark:border-white/5">
                <input
                  type="text"
                  placeholder="Search OUs (e.g. Engineering, Sales)..."
                  value={ouBrowserSearch}
                  onChange={e => setOuBrowserSearch(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/5 rounded-xl px-4 py-2 text-xs text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* OU Tree List */}
              <div className="max-h-80 overflow-y-auto p-2 space-y-0.5">
                {ouListLoading ? (
                  <div className="flex items-center justify-center py-12 gap-3 text-xs text-slate-400">
                    <Loader2 className="h-5 w-5 animate-spin text-indigo-500" />
                    Connecting to Active Directory...
                  </div>
                ) : filtered.map(ou => (
                  <button
                    key={ou.dn}
                    type="button"
                    onClick={() => handleSelect(ou.dn)}
                    className="w-full text-left rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors group"
                    style={{ paddingLeft: `${12 + getIndent(ou)}px` }}
                  >
                    <div className="flex items-center gap-2 py-2 pr-3">
                      <span className="text-amber-500 shrink-0">📁</span>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 group-hover:text-indigo-700 dark:group-hover:text-indigo-300">
                          {ou.name}
                        </div>
                        <div className="text-[10px] text-slate-400 dark:text-slate-500 font-mono truncate">
                          {ou.path}
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
                {!ouListLoading && filtered.length === 0 && (
                  <div className="text-center py-8 text-xs text-slate-400 dark:text-slate-500">No OUs match your search.</div>
                )}
              </div>

              {/* Footer preview + Confirm */}
              <div className="p-4 border-t border-slate-100 dark:border-white/5 flex gap-3">
                <input
                  type="text"
                  value={ouBrowserTarget === 'template' ? templateForm.selectContainer : singleUserFormData.targetOu}
                  readOnly
                  placeholder="Select an OU above..."
                  className="flex-1 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/5 rounded-xl px-3 py-2 text-xs font-mono text-slate-700 dark:text-slate-300 outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowOuBrowser(false)}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-colors"
                >
                  Confirm
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </>
  );
}
