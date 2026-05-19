"use client";

import { useEffect, useState } from "react";
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
  Upload
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

export default function UserManagementPage() {
  const router = useRouter();

  // Integrations settings state
  const [adSettingsList, setAdSettingsList] = useState<any[]>([]);
  const [m365SettingsList, setM365SettingsList] = useState<any[]>([]);
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
    adGroupDn: ""
  });

  // Email check state
  const [emailAvailable, setEmailAvailable] = useState<boolean | null>(null);
  const [checkingEmail, setCheckingEmail] = useState(false);
  const [emailTemplate, setEmailTemplate] = useState("firstname.lastname");

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

    // Licensing info
    m365License: "Microsoft 365 E5",
    createWithoutLicense: false,
    
    // AD placement info
    targetOu: "",
    adGroupDn: ""
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

  const parseList = (item: any): any[] => {
    if (Array.isArray(item)) return item;
    return item ? [item] : [];
  };

  const fetchIntegrations = async () => {
    try {
      const token = localStorage.getItem("petrus_token");
      const headers = { Authorization: `Bearer ${token}` };

      // 1. Fetch integrations configs
      const resSettings = await fetch("http://localhost:3001/settings", { headers });
      if (resSettings.ok) {
        const data = await resSettings.json();
        const adList = parseList(data.adSettings);
        const m365List = parseList(data.m365Settings);

        setAdSettingsList(adList);
        setM365SettingsList(m365List);
        
        // Auto-select first domain
        if (adList.length > 0) {
          setSingleUserFormData(prev => ({ ...prev, adSettingsId: adList[0].id }));
        }
        if (m365List.length > 0) {
          setSingleUserFormData(prev => ({ ...prev, m365SettingsId: m365List[0].id }));
        }
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
    const upper = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const lower = "abcdefghijklmnopqrstuvwxyz";
    const numbers = "0123456789";
    const symbols = "!@#$%^&*()_+=-";
    
    let pass = "";
    // Ensure AD complexity requirements: at least 3 of each class
    for (let i = 0; i < 3; i++) pass += upper.charAt(Math.floor(Math.random() * upper.length));
    for (let i = 0; i < 3; i++) pass += lower.charAt(Math.floor(Math.random() * lower.length));
    for (let i = 0; i < 3; i++) pass += numbers.charAt(Math.floor(Math.random() * numbers.length));
    for (let i = 0; i < 3; i++) pass += symbols.charAt(Math.floor(Math.random() * symbols.length));
    // pad to 14 chars
    for (let i = 0; i < 2; i++) pass += lower.charAt(Math.floor(Math.random() * lower.length));
    
    // Shuffle characters
    const shuffled = pass.split('').sort(() => 0.5 - Math.random()).join('');
    setSingleUserFormData(prev => ({ ...prev, password: shuffled }));
  };

  const computeEmailByTemplate = (fName: string, lName: string, template: string, adId: string, m365Id: string, initials?: string) => {
    const f = fName.toLowerCase().replace(/\s+/g, "");
    const l = lName.toLowerCase().replace(/\s+/g, "");
    if (!f && !l) return "";

    // Get Active Domain Suffix
    const activeDomain = adSettingsList.find(a => a.id === adId)?.domainName || 
                         m365SettingsList.find(m => m.id === m365Id)?.microsoftDomain || 
                         "company.local";

    const computer = TEMPLATE_COMPUTERS[template] || TEMPLATE_COMPUTERS["firstname.lastname"];
    const prefix = computer(f, l, f.charAt(0), l.charAt(0), initials || "");
    return `${prefix}@${activeDomain}`;
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
        prev.adSettingsId, 
        prev.m365SettingsId,
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
        prev.adSettingsId, 
        prev.m365SettingsId,
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
        prev.adSettingsId,
        prev.m365SettingsId,
        prev.initials
      );
      return { ...prev, email: updatedEmail };
    });
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
        updated.adSettingsId,
        updated.m365SettingsId,
        prev.initials
      );
      
      return updated;
    });
  };

  const handleCreateUserSubmit = async (e: any) => {
    e.preventDefault();
    if (!singleUserFormData.createInAd && !singleUserFormData.createInM365) {
      alert("Please select at least one target directory (Active Directory or Microsoft 365).");
      return;
    }

    if (emailAvailable === false) {
      alert("Please choose a unique email. The currently selected address is already taken.");
      return;
    }
    
    setIsCreatingUser(true);
    setCreationLogs([]);
    setCreationSuccessStatus(null);
    setShowTerminal(true);
    
    try {
      const token = localStorage.getItem("petrus_token");
      const res = await fetch("http://localhost:3001/users/create-single", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(singleUserFormData),
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
    const upper = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const lower = "abcdefghijklmnopqrstuvwxyz";
    const numbers = "0123456789";
    const symbols = "!@#$%^&*()_+=-";
    let pass = "";
    for (let i = 0; i < 3; i++) pass += upper.charAt(Math.floor(Math.random() * upper.length));
    for (let i = 0; i < 3; i++) pass += lower.charAt(Math.floor(Math.random() * lower.length));
    for (let i = 0; i < 3; i++) pass += numbers.charAt(Math.floor(Math.random() * numbers.length));
    for (let i = 0; i < 3; i++) pass += symbols.charAt(Math.floor(Math.random() * symbols.length));
    for (let i = 0; i < 2; i++) pass += lower.charAt(Math.floor(Math.random() * lower.length));
    const shuffledPassword = pass.split('').sort(() => 0.5 - Math.random()).join('');

    return {
      id: Math.random().toString(36).substring(2, 9),
      firstName: "",
      initials: "",
      lastName: "",
      displayName: "",
      email: "",
      password: shuffledPassword,
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
          globalBulkConfig.adSettingsId,
          globalBulkConfig.m365SettingsId,
          updated.initials
        );
      }
      return updated;
    }));
  };

  const handleBulkRowPasswordGenerate = (rowId: string) => {
    const upper = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const lower = "abcdefghijklmnopqrstuvwxyz";
    const numbers = "0123456789";
    const symbols = "!@#$%^&*()_+=-";
    let pass = "";
    for (let i = 0; i < 3; i++) pass += upper.charAt(Math.floor(Math.random() * upper.length));
    for (let i = 0; i < 3; i++) pass += lower.charAt(Math.floor(Math.random() * lower.length));
    for (let i = 0; i < 3; i++) pass += numbers.charAt(Math.floor(Math.random() * numbers.length));
    for (let i = 0; i < 3; i++) pass += symbols.charAt(Math.floor(Math.random() * symbols.length));
    for (let i = 0; i < 2; i++) pass += lower.charAt(Math.floor(Math.random() * lower.length));
    const shuffled = pass.split('').sort(() => 0.5 - Math.random()).join('');
    
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
        globalBulkConfig.adSettingsId,
        globalBulkConfig.m365SettingsId,
        item.initials
      );
      
      const upper = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
      const lower = "abcdefghijklmnopqrstuvwxyz";
      const numbers = "0123456789";
      const symbols = "!@#$%^&*()_+=-";
      let pass = "";
      for (let i = 0; i < 3; i++) pass += upper.charAt(Math.floor(Math.random() * upper.length));
      for (let i = 0; i < 3; i++) pass += lower.charAt(Math.floor(Math.random() * lower.length));
      for (let i = 0; i < 3; i++) pass += numbers.charAt(Math.floor(Math.random() * numbers.length));
      for (let i = 0; i < 3; i++) pass += symbols.charAt(Math.floor(Math.random() * symbols.length));
      for (let i = 0; i < 2; i++) pass += lower.charAt(Math.floor(Math.random() * lower.length));
      const shuffledPassword = pass.split('').sort(() => 0.5 - Math.random()).join('');
      
      return {
        id: `sample-${idx}-${Math.random().toString(36).substring(2, 6)}`,
        firstName: item.first,
        initials: item.initials,
        lastName: item.last,
        displayName: dName,
        email: email,
        password: shuffledPassword,
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
    document.body.removeChild(link);
  };

  const handleCSVUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        if (!text) return;

        const lines = text.split(/\r?\n/);
        if (lines.length <= 1) {
          alert("CSV file seems to be empty or missing header rows.");
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

          // Generate complex GPO password
          const upper = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
          const lower = "abcdefghijklmnopqrstuvwxyz";
          const numbers = "0123456789";
          const symbols = "!@#$%^&*()_+=-";
          let pass = "";
          for (let k = 0; k < 3; k++) pass += upper.charAt(Math.floor(Math.random() * upper.length));
          for (let k = 0; k < 3; k++) pass += lower.charAt(Math.floor(Math.random() * lower.length));
          for (let k = 0; k < 3; k++) pass += numbers.charAt(Math.floor(Math.random() * numbers.length));
          for (let k = 0; k < 3; k++) pass += symbols.charAt(Math.floor(Math.random() * symbols.length));
          for (let k = 0; k < 2; k++) pass += lower.charAt(Math.floor(Math.random() * lower.length));
          const shuffledPassword = pass.split('').sort(() => 0.5 - Math.random()).join('');

          const displayInitials = rowData.initials ? ` ${rowData.initials}` : "";
          const firstName = rowData.firstname || rowData["first name"] || "";
          const lastName = rowData.lastname || rowData["last name"] || "";
          const initials = rowData.initials || "";

          const dName = `${firstName}${displayInitials} ${lastName}`.trim().replace(/\s+/g, " ");
          const email = rowData.email || computeEmailByTemplate(
            firstName,
            lastName,
            emailTemplate,
            globalBulkConfig.adSettingsId,
            globalBulkConfig.m365SettingsId,
            initials
          );

          parsedRows.push({
            id: `csv-${i}-${Math.random().toString(36).substring(2, 6)}`,
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
          alert("Could not parse any valid rows from the CSV file.");
          return;
        }

        setBulkUsersList(parsedRows);
        alert(`Successfully imported ${parsedRows.length} users from CSV!`);
      } catch (err) {
        console.error("Error reading CSV file:", err);
        alert("Failed to parse the CSV file. Please make sure the structure is correct.");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const handleBulkCreateUserSubmit = async (e: any) => {
    e.preventDefault();
    if (!globalBulkConfig.createInAd && !globalBulkConfig.createInM365) {
      alert("Please select at least one target directory (Active Directory or Microsoft 365).");
      return;
    }
    
    const invalidRow = bulkUsersList.find(r => !r.firstName || !r.lastName || !r.email || !r.password || !r.jobTitle || !r.office);
    if (invalidRow) {
      alert("Please ensure all rows have First Name, Last Name, Email, Password, Job Title and Office.");
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

  const handleItemClick = (item: string) => {
    if (item === "Create Single User") {
      const adId = adSettingsList[0]?.id || "";
      const m365Id = m365SettingsList[0]?.id || "";
      
      // Auto-compute random AD GPO password on initialization
      const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()";
      let pass = "";
      for (let i = 0; i < 14; i++) {
        pass += chars.charAt(Math.floor(Math.random() * chars.length));
      }

      setSingleUserFormData({
        ...initialFormData,
        password: pass,
        adSettingsId: adId,
        m365SettingsId: m365Id,
        office: officesList[0]?.name || "",
        department: departmentsList[0]?.name || ""
      });
      setEmailTemplate("firstname.lastname");
      setEmailAvailable(null);
      setShowTerminal(false);
      setCreationLogs([]);
      setCreationSuccessStatus(null);
      setIsModalOpen(true);
      return;
    }

    if (item === "Create Bulk Users" || item === "Create Users") {
      const adId = adSettingsList[0]?.id || "";
      const m365Id = m365SettingsList[0]?.id || "";
      
      setGlobalBulkConfig({
        createInAd: true,
        createInM365: false,
        adSettingsId: adId,
        m365SettingsId: m365Id,
        m365License: "Microsoft 365 E5",
        createWithoutLicense: false
      });
      
      setBulkUsersList([
        {
          id: Math.random().toString(36).substring(2, 9),
          firstName: "",
          initials: "",
          lastName: "",
          displayName: "",
          email: "",
          password: "",
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
      alert(`${item} functionality is coming soon.`);
    }
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
    },
    {
      title: "Exchange Tasks",
      groups: [
        {
          name: "Exchange Tasks",
          color: "text-emerald-600 dark:text-emerald-400",
          items: ["Exchange Features", "Set Mailbox Rights", "Modify SMTP Address", "Exchange Offline Address Book", "Exchange Policies"]
        },
        {
          name: "Exchange Mailbox Tasks",
          color: "text-emerald-600 dark:text-emerald-400",
          items: ["Create/Archive User Mailbox", "Disable/Delete User Mailbox", "Migrate Mailbox", "Mailbox conversion", "Auto reply", "Enable Remote Mailbox"]
        },
        {
          name: "Exchange Limits",
          color: "text-emerald-600 dark:text-emerald-400",
          items: ["Naming Attributes", "Delivery Options", "Storage Limits", "Delivery Restrictions"]
        }
      ]
    },
    {
      title: "Terminal Services",
      groups: [
        {
          name: "Terminal Services",
          color: "text-emerald-600 dark:text-emerald-400",
          items: ["Dial-in or VPN Properties", "Move/Delete TS HomeFolders", "Terminal Services Profile", "Terminal Services Remote Control", "Terminal Services Session", "Terminal Services Environment"]
        }
      ]
    }
  ];

  return (
    <>
      <ManagementConsoleLayout
        sections={sections}
        searchPlaceholder="Search User Tasks..."
        primaryActionLabel="Create User"
        tabs={[
          { name: "User Management", active: true },
          { name: "Bulk User Modification", active: false }
        ]}
        onItemClick={handleItemClick}
      />

      {/* Single User Creation Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="bg-slate-900 border border-white/10 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[94vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="p-5 border-b border-white/5 flex justify-between items-center shrink-0">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-indigo-400 animate-pulse" />
                <h2 className="text-lg font-bold text-white font-outfit">
                  User Creation Wizard
                </h2>
              </div>
              <button 
                type="button" 
                onClick={() => setIsModalOpen(false)} 
                className="text-slate-400 hover:text-white transition-colors"
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
                      className="flex-1 px-4 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-500 transition-all font-semibold text-sm shadow-lg shadow-indigo-500/20 disabled:opacity-50"
                    >
                      Close Wizard
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleCreateUserSubmit} className="space-y-6">
                  {/* Grid Layout for Forms */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* LEFT PANEL: ACCOUNT BASICS & TARGETING */}
                    <div className="space-y-6">
                      <div className="bg-slate-950/40 p-4 border border-white/5 rounded-2xl space-y-4">
                        <h3 className="text-xs font-bold text-indigo-400 uppercase tracking-widest flex items-center gap-1.5 pb-2 border-b border-white/5">
                          <Info className="h-3.5 w-3.5" /> 1. Account Basics
                        </h3>

                        {/* First Name, Initials & Last Name */}
                        <div className="grid grid-cols-12 gap-3">
                          <div className="col-span-5 space-y-1.5">
                            <label htmlFor="user-first-name" className="text-xs font-medium text-slate-300">First Name</label>
                            <input 
                              id="user-first-name"
                              type="text" 
                              required
                              value={singleUserFormData.firstName} 
                              onChange={e => handleNameChange("firstName", e.target.value)}
                              className="w-full bg-slate-950/70 border border-slate-700/60 focus:border-indigo-500 rounded-xl px-3.5 py-2 text-sm text-white focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
                              placeholder="e.g. John"
                            />
                          </div>
                          <div className="col-span-2 space-y-1.5">
                            <label htmlFor="user-initials" className="text-xs font-medium text-slate-300">Initials</label>
                            <input 
                              id="user-initials"
                              type="text" 
                              value={singleUserFormData.initials} 
                              onChange={e => handleInitialsChange(e.target.value)}
                              className="w-full bg-slate-950/70 border border-slate-700/60 focus:border-indigo-500 rounded-xl px-2 py-2 text-sm text-center text-white focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all font-semibold"
                              placeholder="M"
                              maxLength={3}
                            />
                          </div>
                          <div className="col-span-5 space-y-1.5">
                            <label htmlFor="user-last-name" className="text-xs font-medium text-slate-300">Last Name</label>
                            <input 
                              id="user-last-name"
                              type="text" 
                              required
                              value={singleUserFormData.lastName} 
                              onChange={e => handleNameChange("lastName", e.target.value)}
                              className="w-full bg-slate-950/70 border border-slate-700/60 focus:border-indigo-500 rounded-xl px-3.5 py-2 text-sm text-white focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
                              placeholder="e.g. Doe"
                            />
                          </div>
                        </div>

                        {/* Display Name (Strictly Calculated and Read-Only) */}
                        <div className="space-y-1.5">
                          <label htmlFor="user-display-name" className="text-xs font-medium text-slate-300 flex items-center justify-between">
                            <span>Display Name</span>
                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">(Read Only)</span>
                          </label>
                          <input 
                            id="user-display-name"
                            type="text" 
                            disabled
                            value={singleUserFormData.displayName}
                            className="w-full bg-slate-900 border border-white/5 rounded-xl px-3.5 py-2 text-sm text-slate-400 outline-none cursor-not-allowed opacity-80"
                            placeholder="Automatically compiled"
                          />
                        </div>

                        {/* Email Format Template Selection */}
                        <div className="space-y-1.5">
                          <label htmlFor="email-template-select" className="text-xs font-medium text-slate-300">Email Format Template</label>
                          <select 
                            id="email-template-select"
                            value={emailTemplate}
                            onChange={e => handleTemplateChange(e.target.value)}
                            className="w-full bg-slate-950/70 border border-slate-700/60 focus:border-indigo-500 rounded-xl px-3.5 py-2 text-sm text-white outline-none focus:ring-2 focus:ring-indigo-500/20"
                          >
                            {EMAIL_TEMPLATES.map(t => (
                              <option key={t.id} value={t.id}>{t.label}</option>
                            ))}
                          </select>
                        </div>

                        {/* Email ID & Availability Checker */}
                        <div className="space-y-1.5">
                          <label htmlFor="user-email" className="text-xs font-medium text-slate-300">Email Address (UPN)</label>
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
                              className="w-full bg-slate-950/70 border border-slate-700/60 focus:border-indigo-500 rounded-xl pl-3.5 pr-28 py-2 text-sm text-white focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
                              placeholder="e.g. john.doe@company.com"
                            />
                            
                            {/* Availability status badge inside input */}
                            <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                              {checkingEmail && (
                                <span className="text-[10px] text-slate-400 flex items-center gap-1">
                                  <Loader2 className="h-3 w-3 animate-spin text-indigo-400" /> checking
                                </span>
                              )}
                              {!checkingEmail && emailAvailable === true && (
                                <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                                  <CheckCircle2 className="h-2.5 w-2.5" /> Available
                                </span>
                              )}
                              {!checkingEmail && emailAvailable === false && (
                                <span className="text-[10px] text-red-400 font-bold bg-red-500/10 border border-red-500/20 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                                  <XCircle className="h-2.5 w-2.5" /> Taken
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Automatic GPO-Based Password Generator */}
                        <div className="space-y-1.5">
                          <label htmlFor="user-password" className="text-xs font-medium text-slate-300 flex items-center justify-between">
                            <span>Password</span>
                            <span className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider flex items-center gap-0.5">
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
                              className="flex-1 bg-slate-950/70 border border-slate-700/60 focus:border-indigo-500 rounded-xl px-3.5 py-2 text-sm text-white focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all font-mono"
                              placeholder="AD complexity rule"
                            />
                            <button
                              type="button"
                              onClick={generateAdGpoPassword}
                              className="px-3.5 bg-slate-800 border border-slate-700 text-slate-200 hover:text-white rounded-xl flex items-center gap-1 hover:bg-slate-700 transition-all font-semibold text-xs whitespace-nowrap"
                            >
                              Generate
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* DIRECTORIES TARGETS & M365 LICENSE MANAGEMENT */}
                      <div className="bg-slate-950/40 p-4 border border-white/5 rounded-2xl space-y-4">
                        <h3 className="text-xs font-bold text-indigo-400 uppercase tracking-widest flex items-center gap-1.5 pb-2 border-b border-white/5">
                          <Server className="h-3.5 w-3.5" /> 2. Directory Connections & Licensing
                        </h3>

                        {/* Active Directory target switch */}
                        <div className={`p-4 rounded-xl border transition-all ${
                          singleUserFormData.createInAd 
                            ? "bg-indigo-500/5 border-indigo-500/25" 
                            : "bg-slate-950/20 border-white/5 hover:border-white/10"
                        }`}>
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-sm font-medium text-white flex items-center gap-1.5">
                              <Server className="h-4 w-4 text-indigo-400" /> Active Directory (AD)
                            </span>
                            <input 
                              type="checkbox"
                              checked={singleUserFormData.createInAd}
                              onChange={e => setSingleUserFormData({ ...singleUserFormData, createInAd: e.target.checked })}
                              className="h-4.5 w-4.5 rounded border-slate-700 bg-slate-950 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                            />
                          </div>
                          {singleUserFormData.createInAd && (
                            <div className="space-y-3">
                              <div className="space-y-1.5">
                                <label htmlFor="ad-domain-select" className="text-[11px] font-semibold text-slate-400">Target AD Domain Settings</label>
                                {adSettingsList.length > 0 ? (
                                  <select 
                                    id="ad-domain-select"
                                    value={singleUserFormData.adSettingsId}
                                    onChange={e => handleDomainChange("ad", e.target.value)}
                                    className="w-full text-xs bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-2 text-white outline-none focus:ring-1 focus:ring-indigo-500"
                                  >
                                    {adSettingsList.map(a => (
                                      <option key={a.id} value={a.id}>{a.domainName} ({a.adServerIp})</option>
                                    ))}
                                  </select>
                                ) : (
                                  <p className="text-[11px] text-amber-400 flex items-center gap-1">
                                    <ShieldAlert className="h-3 w-3" /> No AD integrations configured.
                                  </p>
                                )}
                              </div>

                              <div className="space-y-1.5">
                                <label htmlFor="ad-target-ou" className="text-[11px] font-semibold text-slate-400">Target Organizational Unit (OU)</label>
                                <input 
                                  id="ad-target-ou"
                                  type="text" 
                                  value={singleUserFormData.targetOu}
                                  onChange={e => setSingleUserFormData({ ...singleUserFormData, targetOu: e.target.value })}
                                  className="w-full text-xs bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-2 text-white outline-none focus:ring-1 focus:ring-indigo-500"
                                  placeholder="e.g. CN=Users (default) or OU=Employees"
                                />
                              </div>

                              <div className="space-y-1.5">
                                <label htmlFor="ad-target-group" className="text-[11px] font-semibold text-slate-400">Target AD Security Group (CN / DN)</label>
                                <input 
                                  id="ad-target-group"
                                  type="text" 
                                  value={singleUserFormData.adGroupDn}
                                  onChange={e => setSingleUserFormData({ ...singleUserFormData, adGroupDn: e.target.value })}
                                  className="w-full text-xs bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-2 text-white outline-none focus:ring-1 focus:ring-indigo-500"
                                  placeholder="e.g. CN=Domain Admins,CN=Users"
                                />
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Microsoft 365 / Entra ID target switch & dynamic license */}
                        <div className={`p-4 rounded-xl border transition-all ${
                          singleUserFormData.createInM365 
                            ? "bg-sky-500/5 border-sky-500/25" 
                            : "bg-slate-950/20 border-white/5 hover:border-white/10"
                        }`}>
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-sm font-medium text-white flex items-center gap-1.5">
                              <Cloud className="h-4 w-4 text-sky-400" /> Microsoft 365 / O365
                            </span>
                            <input 
                              type="checkbox"
                              checked={singleUserFormData.createInM365}
                              onChange={e => setSingleUserFormData({ ...singleUserFormData, createInM365: e.target.checked })}
                              className="h-4.5 w-4.5 rounded border-slate-700 bg-slate-950 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                            />
                          </div>
                          {singleUserFormData.createInM365 && (
                            <div className="space-y-4 pt-1">
                              {/* Domain select */}
                              <div className="space-y-1.5">
                                <label htmlFor="m365-tenant-select" className="text-[11px] font-semibold text-slate-400">Target Microsoft Tenant</label>
                                {m365SettingsList.length > 0 ? (
                                  <select 
                                    id="m365-tenant-select"
                                    value={singleUserFormData.m365SettingsId}
                                    onChange={e => handleDomainChange("m365", e.target.value)}
                                    className="w-full text-xs bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-2 text-white outline-none focus:ring-1 focus:ring-indigo-500"
                                  >
                                    {m365SettingsList.map(m => (
                                      <option key={m.id} value={m.id}>{m.microsoftDomain || m.azureTenantId}</option>
                                    ))}
                                  </select>
                                ) : (
                                  <p className="text-[11px] text-amber-400 flex items-center gap-1">
                                    <ShieldAlert className="h-3 w-3" /> No M365 integrations configured.
                                  </p>
                                )}
                              </div>

                              {/* License Checkbox & Dropdown selection */}
                              <div className="bg-slate-950/60 p-3 rounded-lg border border-white/5 space-y-3">
                                <div className="flex items-center justify-between">
                                  <label htmlFor="user-no-license" className="text-[11px] font-semibold text-slate-300">Create user without license</label>
                                  <input 
                                    id="user-no-license"
                                    type="checkbox"
                                    checked={singleUserFormData.createWithoutLicense}
                                    onChange={e => setSingleUserFormData({ ...singleUserFormData, createWithoutLicense: e.target.checked })}
                                    className="h-4 w-4 rounded border-slate-800 bg-slate-950 text-sky-600 focus:ring-sky-500 cursor-pointer"
                                  />
                                </div>

                                {!singleUserFormData.createWithoutLicense && (
                                  <div className="space-y-1.5 animate-in fade-in slide-in-from-top-1 duration-150">
                                    <label htmlFor="m365-license-select" className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Available Licenses SKU</label>
                                    <select 
                                      id="m365-license-select"
                                      value={singleUserFormData.m365License}
                                      onChange={e => setSingleUserFormData({ ...singleUserFormData, m365License: e.target.value })}
                                      className="w-full text-xs bg-slate-950 border border-slate-800 rounded px-2 py-1.5 text-white outline-none focus:ring-1 focus:ring-sky-500"
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
                      <div className="bg-slate-950/40 p-4 border border-white/5 rounded-2xl space-y-4">
                        <h3 className="text-xs font-bold text-indigo-400 uppercase tracking-widest flex items-center gap-1.5 pb-2 border-b border-white/5">
                          <Sparkles className="h-3.5 w-3.5" /> 3. Profile Information
                        </h3>

                        {/* Job Title & Department */}
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1.5">
                            <label htmlFor="user-job-title" className="text-xs font-medium text-slate-300">Job Title / Designation *</label>
                            <input 
                              id="user-job-title"
                              type="text" 
                              required
                              value={singleUserFormData.jobTitle} 
                              onChange={e => setSingleUserFormData({ ...singleUserFormData, jobTitle: e.target.value })}
                              className="w-full bg-slate-950/70 border border-slate-700/60 focus:border-indigo-500 rounded-xl px-3.5 py-2 text-sm text-white focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
                              placeholder="e.g. Systems Engineer"
                            />
                          </div>
                          <div className="space-y-1.5">
                            <label htmlFor="user-department" className="text-xs font-medium text-slate-300">Department</label>
                            {departmentsList.length > 0 ? (
                              <select 
                                id="user-department"
                                value={singleUserFormData.department}
                                onChange={e => setSingleUserFormData({ ...singleUserFormData, department: e.target.value })}
                                className="w-full bg-slate-950/70 border border-slate-700/60 focus:border-indigo-500 rounded-xl px-3.5 py-2 text-sm text-white focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
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
                                className="w-full bg-slate-950/70 border border-slate-700/60 focus:border-indigo-500 rounded-xl px-3.5 py-2 text-sm text-white focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
                                placeholder="e.g. Engineering"
                              />
                            )}
                          </div>
                        </div>

                        {/* Office Selection */}
                        <div className="space-y-1.5">
                          <label htmlFor="user-office" className="text-xs font-medium text-slate-300">Office / Location *</label>
                          {officesList.length > 0 ? (
                            <select 
                              id="user-office"
                              required
                              value={singleUserFormData.office}
                              onChange={e => setSingleUserFormData({ ...singleUserFormData, office: e.target.value })}
                              className="w-full bg-slate-950/70 border border-slate-700/60 focus:border-indigo-500 rounded-xl px-3.5 py-2 text-sm text-white focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
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
                              className="w-full bg-slate-950/70 border border-slate-700/60 focus:border-indigo-500 rounded-xl px-3.5 py-2 text-sm text-white focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
                              placeholder="e.g. New York HQ"
                            />
                          )}
                        </div>

                        {/* Phones & Fax */}
                        <div className="grid grid-cols-3 gap-2">
                          <div className="col-span-1 space-y-1.5">
                            <label htmlFor="user-office-phone" className="text-[11px] font-semibold text-slate-400">Office Phone</label>
                            <input 
                              id="user-office-phone"
                              type="text" 
                              value={singleUserFormData.officePhone} 
                              onChange={e => setSingleUserFormData({ ...singleUserFormData, officePhone: e.target.value })}
                              className="w-full bg-slate-950/70 border border-slate-700/50 focus:border-indigo-500 rounded-lg px-2.5 py-1.5 text-xs text-white focus:ring-1 focus:ring-indigo-500 outline-none transition-all"
                              placeholder="Phone"
                            />
                          </div>
                          <div className="col-span-1 space-y-1.5">
                            <label htmlFor="user-fax" className="text-[11px] font-semibold text-slate-400">Fax Number</label>
                            <input 
                              id="user-fax"
                              type="text" 
                              value={singleUserFormData.faxNumber} 
                              onChange={e => setSingleUserFormData({ ...singleUserFormData, faxNumber: e.target.value })}
                              className="w-full bg-slate-950/70 border border-slate-700/50 focus:border-indigo-500 rounded-lg px-2.5 py-1.5 text-xs text-white focus:ring-1 focus:ring-indigo-500 outline-none transition-all"
                              placeholder="Fax"
                            />
                          </div>
                          <div className="col-span-1 space-y-1.5">
                            <label htmlFor="user-mobile" className="text-[11px] font-semibold text-slate-300">Mobile Phone *</label>
                            <input 
                              id="user-mobile"
                              type="text" 
                              required
                              value={singleUserFormData.mobileNumber} 
                              onChange={e => setSingleUserFormData({ ...singleUserFormData, mobileNumber: e.target.value })}
                              className="w-full bg-slate-950/70 border border-slate-700/50 focus:border-indigo-500 rounded-lg px-2.5 py-1.5 text-xs text-white focus:ring-1 focus:ring-indigo-500 outline-none transition-all"
                              placeholder="Mobile"
                            />
                          </div>
                        </div>

                        {/* Mailing Address Section */}
                        <div className="pt-2 border-t border-white/5 space-y-3">
                          <div className="space-y-1.5">
                            <label htmlFor="user-street" className="text-[11px] font-semibold text-slate-400">Street Address</label>
                            <input 
                              id="user-street"
                              type="text" 
                              value={singleUserFormData.streetAddress} 
                              onChange={e => setSingleUserFormData({ ...singleUserFormData, streetAddress: e.target.value })}
                              className="w-full bg-slate-950/70 border border-slate-700/50 focus:border-indigo-500 rounded-xl px-3 py-1.5 text-xs text-white focus:ring-1 focus:ring-indigo-500 outline-none transition-all"
                              placeholder="e.g. 100 Main St"
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                              <label htmlFor="user-city" className="text-[11px] font-semibold text-slate-400">City</label>
                              <input 
                                id="user-city"
                                type="text" 
                                value={singleUserFormData.city} 
                                onChange={e => setSingleUserFormData({ ...singleUserFormData, city: e.target.value })}
                                className="w-full bg-slate-950/70 border border-slate-700/50 focus:border-indigo-500 rounded-xl px-3 py-1.5 text-xs text-white focus:ring-1 focus:ring-indigo-500 outline-none transition-all"
                                placeholder="City"
                              />
                            </div>
                            <div className="space-y-1.5">
                              <label htmlFor="user-state" className="text-[11px] font-semibold text-slate-400">State / Province</label>
                              <input 
                                id="user-state"
                                type="text" 
                                value={singleUserFormData.stateProvince} 
                                onChange={e => setSingleUserFormData({ ...singleUserFormData, stateProvince: e.target.value })}
                                className="w-full bg-slate-950/70 border border-slate-700/50 focus:border-indigo-500 rounded-xl px-3 py-1.5 text-xs text-white focus:ring-1 focus:ring-indigo-500 outline-none transition-all"
                                placeholder="State"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                              <label htmlFor="user-zip" className="text-[11px] font-semibold text-slate-400">Zip / Postal Code</label>
                              <input 
                                id="user-zip"
                                type="text" 
                                value={singleUserFormData.zipPostalCode} 
                                onChange={e => setSingleUserFormData({ ...singleUserFormData, zipPostalCode: e.target.value })}
                                className="w-full bg-slate-950/70 border border-slate-700/50 focus:border-indigo-500 rounded-xl px-3 py-1.5 text-xs text-white focus:ring-1 focus:ring-indigo-500 outline-none transition-all"
                                placeholder="Zip"
                              />
                            </div>
                            <div className="space-y-1.5">
                              <label htmlFor="user-country" className="text-[11px] font-semibold text-slate-400">Country / Region</label>
                              <input 
                                id="user-country"
                                type="text" 
                                value={singleUserFormData.countryRegion} 
                                onChange={e => setSingleUserFormData({ ...singleUserFormData, countryRegion: e.target.value })}
                                className="w-full bg-slate-950/70 border border-slate-700/50 focus:border-indigo-500 rounded-xl px-3 py-1.5 text-xs text-white focus:ring-1 focus:ring-indigo-500 outline-none transition-all"
                                placeholder="Country"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Submission buttons */}
                  <div className="pt-4 border-t border-white/5 flex gap-3 justify-end shrink-0">
                    <button 
                      type="button" 
                      onClick={() => setIsModalOpen(false)}
                      className="px-5 py-2.5 bg-slate-800 text-slate-200 rounded-xl hover:bg-slate-700 transition-colors font-semibold text-sm"
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
              )}
            </div>
          </div>
        </div>
      )}
      {/* Bulk User Creation Modal */}
      {isBulkModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="bg-slate-900 border border-white/10 rounded-2xl shadow-2xl w-full max-w-7xl max-h-[96vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="p-5 border-b border-white/5 flex justify-between items-center shrink-0">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-indigo-400 animate-pulse" />
                <h2 className="text-lg font-bold text-white font-outfit">
                  Bulk User Creation Wizard
                </h2>
              </div>
              <button 
                type="button" 
                onClick={() => setIsBulkModalOpen(false)} 
                className="text-slate-400 hover:text-white transition-colors"
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
                    {creationLogs.map((log, idx) => (
                      <div key={idx} className={`leading-relaxed ${
                        log.includes("[ERROR]") ? "text-red-400 font-bold" :
                        log.includes("[SIMULATION]") ? "text-amber-400/90" :
                        log.includes("[System] Successfully") || log.includes("completed successfully") ? "text-emerald-400 font-semibold" :
                        "text-slate-300"
                      }`}>
                        {log}
                      </div>
                    ))}
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
                  <div className="bg-slate-950/40 p-5 border border-white/5 rounded-2xl space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      {/* Active Directory Global Toggle */}
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">1. Target AD Connection</label>
                        <div className="flex items-center gap-3 bg-slate-900 border border-white/5 rounded-xl px-3 py-2.5">
                          <input 
                            type="checkbox"
                            checked={globalBulkConfig.createInAd}
                            onChange={e => setGlobalBulkConfig({ ...globalBulkConfig, createInAd: e.target.checked })}
                            className="h-4 w-4 rounded border-slate-700 bg-slate-950 text-indigo-650 focus:ring-indigo-500 cursor-pointer"
                          />
                          <select 
                            value={globalBulkConfig.adSettingsId}
                            disabled={!globalBulkConfig.createInAd}
                            onChange={e => setGlobalBulkConfig({ ...globalBulkConfig, adSettingsId: e.target.value })}
                            className="text-xs bg-transparent text-white outline-none flex-1 disabled:opacity-40"
                          >
                            {adSettingsList.map(a => (
                              <option key={a.id} value={a.id} className="bg-slate-900">{a.domainName}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* M365 Global Toggle */}
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">2. Target Microsoft 365</label>
                        <div className="flex items-center gap-3 bg-slate-900 border border-white/5 rounded-xl px-3 py-2.5">
                          <input 
                            type="checkbox"
                            checked={globalBulkConfig.createInM365}
                            onChange={e => setGlobalBulkConfig({ ...globalBulkConfig, createInM365: e.target.checked })}
                            className="h-4 w-4 rounded border-slate-700 bg-slate-950 text-indigo-650 focus:ring-indigo-500 cursor-pointer"
                          />
                          <select 
                            value={globalBulkConfig.m365SettingsId}
                            disabled={!globalBulkConfig.createInM365}
                            onChange={e => setGlobalBulkConfig({ ...globalBulkConfig, m365SettingsId: e.target.value })}
                            className="text-xs bg-transparent text-white outline-none flex-1 disabled:opacity-40"
                          >
                            {m365SettingsList.map(m => (
                              <option key={m.id} value={m.id} className="bg-slate-900">{m.microsoftDomain}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* Global Email Format Template Selection */}
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">3. Email Pattern</label>
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
                                globalBulkConfig.adSettingsId,
                                globalBulkConfig.m365SettingsId,
                                row.initials
                              )
                            })));
                          }}
                          className="w-full text-xs bg-slate-900 border border-white/5 rounded-xl px-3 py-2.5 text-white outline-none"
                        >
                          {EMAIL_TEMPLATES.map(t => (
                            <option key={t.id} value={t.id} className="bg-slate-900">{t.label.split(" (")[0]}</option>
                          ))}
                        </select>
                      </div>

                      {/* M365 Licenses */}
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">4. License Option</label>
                        <div className="flex items-center gap-2">
                          <select 
                            value={globalBulkConfig.m365License}
                            disabled={!globalBulkConfig.createInM365 || globalBulkConfig.createWithoutLicense}
                            onChange={e => setGlobalBulkConfig({ ...globalBulkConfig, m365License: e.target.value })}
                            className="text-xs bg-slate-900 border border-white/5 rounded-xl px-3 py-2.5 text-white outline-none flex-1 disabled:opacity-40"
                          >
                            {M365_LICENSES.map(l => (
                              <option key={l.id} value={l.id} className="bg-slate-900">{l.id}</option>
                            ))}
                          </select>
                          <label className="text-[10px] text-slate-400 flex items-center gap-1 shrink-0 bg-slate-900 border border-white/5 rounded-xl px-2 py-2.5 cursor-pointer">
                            <input 
                              type="checkbox"
                              checked={globalBulkConfig.createWithoutLicense}
                              onChange={e => setGlobalBulkConfig({ ...globalBulkConfig, createWithoutLicense: e.target.checked })}
                              className="h-3 w-3 rounded border-slate-700 bg-slate-950 text-indigo-650 cursor-pointer"
                            /> No License
                          </label>
                        </div>
                      </div>
                    </div>

                    {globalBulkConfig.createInAd && (
                      <div className="pt-4 border-t border-white/5 grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">Target Organizational Unit (OU)</label>
                          <input 
                            type="text"
                            value={globalBulkConfig.targetOu}
                            onChange={e => setGlobalBulkConfig({ ...globalBulkConfig, targetOu: e.target.value })}
                            placeholder="e.g. CN=Users (default) or OU=Employees"
                            className="w-full text-xs bg-slate-900 border border-white/5 focus:border-indigo-500 rounded-xl px-3.5 py-2 text-white outline-none transition-all"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">Target AD Security Group (CN / DN)</label>
                          <input 
                            type="text"
                            value={globalBulkConfig.adGroupDn}
                            onChange={e => setGlobalBulkConfig({ ...globalBulkConfig, adGroupDn: e.target.value })}
                            placeholder="e.g. CN=Domain Admins,CN=Users"
                            className="w-full text-xs bg-slate-900 border border-white/5 focus:border-indigo-500 rounded-xl px-3.5 py-2 text-white outline-none transition-all"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Batch Action Tools Toolbar */}
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-slate-950/30 p-4 border border-white/5 rounded-2xl">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Batch Operations:</span>
                      <button
                        type="button"
                        onClick={handleLoadBulkSampleData}
                        className="px-3.5 py-2 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-xl hover:bg-indigo-500/20 transition-all font-semibold text-xs flex items-center gap-1.5 shadow-sm"
                      >
                        <Sparkles className="h-3.5 w-3.5 animate-pulse text-indigo-400" /> Load Sample Batch (5 Users)
                      </button>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      {/* Reference download */}
                      <button
                        type="button"
                        onClick={handleDownloadSampleCSV}
                        className="px-3.5 py-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl hover:bg-emerald-500/20 transition-all font-semibold text-xs flex items-center gap-1.5 shadow-sm"
                      >
                        <Download className="h-3.5 w-3.5 text-emerald-400" /> Download Sample CSV
                      </button>

                      {/* Import CSV */}
                      <label
                        htmlFor="bulk-csv-upload"
                        className="px-3.5 py-2 bg-sky-500/10 border border-sky-500/20 text-sky-400 rounded-xl hover:bg-sky-500/20 transition-all font-semibold text-xs flex items-center gap-1.5 shadow-sm cursor-pointer"
                      >
                        <Upload className="h-3.5 w-3.5 text-sky-400" /> Import CSV File
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
                  <div className="border border-white/5 rounded-2xl overflow-hidden bg-slate-950/20 max-h-[450px] overflow-y-auto">
                    <table className="w-full text-left border-collapse min-w-[1000px]">
                      <thead>
                        <tr className="bg-slate-950/70 border-b border-white/5 text-xs text-slate-400 font-bold uppercase tracking-wider">
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
                      <tbody className="divide-y divide-white/5 text-sm text-slate-300">
                        {bulkUsersList.map((row, idx) => (
                          <tr key={row.id} className="hover:bg-white/[0.02] transition-colors">
                            {/* First Name */}
                            <td className="py-2.5 px-4">
                              <input 
                                type="text"
                                required
                                value={row.firstName}
                                onChange={e => handleBulkRowFieldChange(row.id, "firstName", e.target.value)}
                                className="w-full bg-slate-950/40 border border-slate-800/80 focus:border-indigo-500 rounded-lg px-2.5 py-1.5 text-xs text-white outline-none"
                                placeholder="First"
                              />
                            </td>

                            {/* Initials */}
                            <td className="py-2.5 px-2">
                              <input 
                                type="text"
                                value={row.initials}
                                onChange={e => handleBulkRowFieldChange(row.id, "initials", e.target.value)}
                                className="w-full bg-slate-950/40 border border-slate-800/80 focus:border-indigo-500 rounded-lg px-1 py-1.5 text-xs text-center text-white outline-none font-bold uppercase"
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
                                className="w-full bg-slate-950/40 border border-slate-800/80 focus:border-indigo-500 rounded-lg px-2.5 py-1.5 text-xs text-white outline-none"
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
                                className="w-full bg-slate-950/80 border border-slate-800/60 text-slate-400 rounded-lg px-2.5 py-1.5 text-xs outline-none"
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
                                  className="w-full bg-slate-950/40 border border-slate-800/80 focus:border-indigo-500 rounded-lg px-2 py-1.5 text-[10px] text-white outline-none font-mono"
                                  placeholder="Auto-generated"
                                />
                                <button
                                  type="button"
                                  onClick={() => handleBulkRowPasswordGenerate(row.id)}
                                  title="Regenerate complex password"
                                  className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded hover:text-white transition-colors shrink-0"
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
                                className="w-full bg-slate-950/40 border border-slate-800/80 focus:border-indigo-500 rounded-lg px-2 py-1.5 text-xs text-white outline-none"
                                placeholder="e.g. Analyst"
                              />
                            </td>

                            {/* Office */}
                            <td className="py-2.5 px-4">
                              {officesList.length > 0 ? (
                                <select 
                                  value={row.office}
                                  onChange={e => handleBulkRowFieldChange(row.id, "office", e.target.value)}
                                  className="w-full bg-slate-950/40 border border-slate-800/80 rounded-lg px-1.5 py-1.5 text-xs text-white outline-none"
                                >
                                  {officesList.map(o => (
                                    <option key={o.id} value={o.name}>{o.name}</option>
                                  ))}
                                </select>
                              ) : (
                                <input 
                                  type="text"
                                  required
                                  value={row.office}
                                  onChange={e => handleBulkRowFieldChange(row.id, "office", e.target.value)}
                                  className="w-full bg-slate-950/40 border border-slate-800/80 focus:border-indigo-500 rounded-lg px-2.5 py-1.5 text-xs text-white outline-none"
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
                      className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-xl transition-all font-semibold text-xs flex items-center gap-1.5 shadow"
                    >
                      <Plus className="h-4 w-4" /> Add Row
                    </button>
                  </div>

                  {/* Submission buttons */}
                  <div className="pt-4 border-t border-white/5 flex gap-3 justify-end shrink-0">
                    <button 
                      type="button" 
                      onClick={() => setIsBulkModalOpen(false)}
                      className="px-5 py-2.5 bg-slate-800 text-slate-200 rounded-xl hover:bg-slate-700 transition-colors font-semibold text-sm"
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
    </>
  );
}
