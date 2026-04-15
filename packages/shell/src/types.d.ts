declare module "*.css";

declare module "home/Home" {
  const Home: import("react").ComponentType;
  export default Home;
}

declare module "home/StreamingHome" {
  const StreamingHome: import("react").ComponentType;
  export function __resetHomeStreamingResourceCache(): void;
  export default StreamingHome;
}

declare module "records/MedicalRecords" {
  const MedicalRecords: import("react").ComponentType;
  export default MedicalRecords;
}

declare module "records/StreamingMedicalRecords" {
  const StreamingMedicalRecords: import("react").ComponentType;
  export function __resetRecordsStreamingResourceCache(): void;
  export default StreamingMedicalRecords;
}

declare module "prescriptions/PrescriptionOrders" {
  const PrescriptionOrders: import("react").ComponentType;
  export default PrescriptionOrders;
}

declare module "prescriptions/StreamingPrescriptionOrders" {
  const StreamingPrescriptionOrders: import("react").ComponentType;
  export function __resetPrescriptionsStreamingResourceCache(): void;
  export default StreamingPrescriptionOrders;
}

declare module "analytics/ClinicalAnalytics" {
  const ClinicalAnalytics: import("react").ComponentType;
  export default ClinicalAnalytics;
}

declare module "analytics/StreamingClinicalAnalytics" {
  const StreamingClinicalAnalytics: import("react").ComponentType;
  export function __resetAnalyticsStreamingResourceCache(): void;
  export default StreamingClinicalAnalytics;
}

interface Window {
  __MF_THEME__?: {
    getTheme: () => "dark" | "light";
    setTheme: (theme: "dark" | "light") => void;
  };
}

interface WindowEventMap {
  moduleChange: CustomEvent<{
    newModule: "home" | "records" | "prescriptions" | "analytics";
  }>;
  navigateToModule: CustomEvent<{
    module: "home" | "records" | "prescriptions" | "analytics";
  }>;
  themeChange: CustomEvent<{
    theme: "dark" | "light";
    colorScheme: "dark" | "light";
  }>;
  showNotification: CustomEvent<{
    type: "success" | "error" | "info" | "warning";
    message: string;
  }>;
  addPrescription: CustomEvent<{
    id: number;
    patientName: string;
    provider: string;
    quantity: number;
  }>;
}
