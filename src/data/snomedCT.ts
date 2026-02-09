// SNOMED CT medical coding suggestions
// These are simplified codes for demo - full implementation would use SNOMED CT API

export interface SnomedCode {
  code: string;
  term: string;
  category: 'complaint' | 'diagnosis' | 'treatment' | 'lab';
}

// Common complaints with SNOMED CT codes
export const SNOMED_COMPLAINTS: SnomedCode[] = [
  { code: '29857009', term: 'Chest Pain', category: 'complaint' },
  { code: '267036007', term: 'Shortness of Breath', category: 'complaint' },
  { code: '80313002', term: 'Palpitations', category: 'complaint' },
  { code: '404640003', term: 'Dizziness', category: 'complaint' },
  { code: '84229001', term: 'Fatigue', category: 'complaint' },
  { code: '102594003', term: 'Swelling in Legs (Edema)', category: 'complaint' },
  { code: '38341003', term: 'Elevated Blood Pressure', category: 'complaint' },
  { code: '61086009', term: 'Irregular Heartbeat', category: 'complaint' },
  { code: '25064002', term: 'Headache', category: 'complaint' },
  { code: '422587007', term: 'Nausea', category: 'complaint' },
  { code: '267060006', term: 'Syncope (Fainting)', category: 'complaint' },
  { code: '22298006', term: 'Myocardial Infarction (Chest Pain)', category: 'complaint' },
  { code: '13213009', term: 'Anxiety with Palpitations', category: 'complaint' },
  { code: '371807002', term: 'Chest Tightness', category: 'complaint' },
  { code: '49727002', term: 'Cough', category: 'complaint' },
];

// Common diagnoses with SNOMED CT codes
export const SNOMED_DIAGNOSES: SnomedCode[] = [
  { code: '38341003', term: 'Hypertension (HTN)', category: 'diagnosis' },
  { code: '73211009', term: 'Diabetes Mellitus Type 2', category: 'diagnosis' },
  { code: '53741008', term: 'Coronary Artery Disease (CAD)', category: 'diagnosis' },
  { code: '84114007', term: 'Heart Failure', category: 'diagnosis' },
  { code: '49436004', term: 'Atrial Fibrillation', category: 'diagnosis' },
  { code: '22298006', term: 'Myocardial Infarction (MI)', category: 'diagnosis' },
  { code: '194828000', term: 'Angina Pectoris', category: 'diagnosis' },
  { code: '85898001', term: 'Cardiomyopathy', category: 'diagnosis' },
  { code: '233817007', term: 'Hyperlipidemia (HLP)', category: 'diagnosis' },
  { code: '40930008', term: 'Hypothyroidism', category: 'diagnosis' },
  { code: '13644009', term: 'Hyperthyroidism', category: 'diagnosis' },
  { code: '44054006', term: 'Type 1 Diabetes Mellitus', category: 'diagnosis' },
  { code: '59621000', term: 'Essential Hypertension', category: 'diagnosis' },
  { code: '426396005', term: 'Cardiac Arrhythmia', category: 'diagnosis' },
  { code: '399211009', term: 'Rheumatic Heart Disease', category: 'diagnosis' },
  { code: '195967001', term: 'Unstable Angina', category: 'diagnosis' },
  { code: '64715009', term: 'Hypertensive Heart Disease', category: 'diagnosis' },
  { code: '233873004', term: 'Acute Coronary Syndrome', category: 'diagnosis' },
  { code: '48601002', term: 'Mitral Valve Prolapse', category: 'diagnosis' },
  { code: '427889009', term: 'Heart Valve Disorder', category: 'diagnosis' },
];

// Common treatments/medicines with SNOMED CT codes
export const SNOMED_TREATMENTS: SnomedCode[] = [
  { code: '372756006', term: 'Amlodipine 5mg', category: 'treatment' },
  { code: '372912004', term: 'Atorvastatin 10mg', category: 'treatment' },
  { code: '387458008', term: 'Aspirin 75mg', category: 'treatment' },
  { code: '372826007', term: 'Metoprolol 50mg', category: 'treatment' },
  { code: '373747008', term: 'Losartan 50mg', category: 'treatment' },
  { code: '372806008', term: 'Clopidogrel 75mg', category: 'treatment' },
  { code: '372805007', term: 'Ramipril 5mg', category: 'treatment' },
  { code: '387475002', term: 'Furosemide 40mg', category: 'treatment' },
  { code: '386873009', term: 'Carvedilol 12.5mg', category: 'treatment' },
  { code: '387551004', term: 'Digoxin 0.25mg', category: 'treatment' },
  { code: '387207008', term: 'Telmisartan 40mg', category: 'treatment' },
  { code: '387364008', term: 'Rosuvastatin 10mg', category: 'treatment' },
  { code: '387517004', term: 'Metformin 500mg', category: 'treatment' },
  { code: '387509009', term: 'Glimepiride 1mg', category: 'treatment' },
  { code: '373254001', term: 'Enalapril 5mg', category: 'treatment' },
  { code: '372584003', term: 'Bisoprolol 5mg', category: 'treatment' },
  { code: '395892004', term: 'Pantoprazole 40mg', category: 'treatment' },
  { code: '409145001', term: 'Amlodipine 10mg', category: 'treatment' },
  { code: '387278002', term: 'Atenolol 50mg', category: 'treatment' },
  { code: '387160004', term: 'Spironolactone 25mg', category: 'treatment' },
];

// Common lab tests with SNOMED CT codes
export const SNOMED_LABS: SnomedCode[] = [
  { code: '29303009', term: 'ECG (Electrocardiogram)', category: 'lab' },
  { code: '40701008', term: 'ECHO (Echocardiogram)', category: 'lab' },
  { code: '104091002', term: 'TMT (Treadmill Test)', category: 'lab' },
  { code: '252465000', term: 'HOLTER Monitor (24hr)', category: 'lab' },
  { code: '252466004', term: 'ABPM (Ambulatory BP Monitor)', category: 'lab' },
  { code: '252150008', term: 'Lipid Profile', category: 'lab' },
  { code: '43396009', term: 'HbA1c', category: 'lab' },
  { code: '104093004', term: 'Thyroid Profile (T3/T4/TSH)', category: 'lab' },
  { code: '26604007', term: 'Complete Blood Count (CBC)', category: 'lab' },
  { code: '104095006', term: 'Kidney Function Test (KFT)', category: 'lab' },
  { code: '33747003', term: 'Blood Glucose Fasting', category: 'lab' },
  { code: '271061004', term: 'Blood Glucose PP', category: 'lab' },
  { code: '104082008', term: 'Liver Function Test (LFT)', category: 'lab' },
  { code: '271244007', term: 'Uric Acid', category: 'lab' },
  { code: '271236005', term: 'Serum Creatinine', category: 'lab' },
  { code: '104091002', term: '2D ECHO', category: 'lab' },
  { code: '418799008', term: 'Stress ECHO', category: 'lab' },
  { code: '169324008', term: 'Coronary Angiogram', category: 'lab' },
  { code: '37931006', term: 'CT Coronary Angiography', category: 'lab' },
  { code: '40701008', term: 'Doppler Study', category: 'lab' },
];

// Search function for SNOMED codes
export function searchSnomedCodes(query: string, category?: SnomedCode['category']): SnomedCode[] {
  const lowerQuery = query.toLowerCase().trim();
  if (lowerQuery.length < 2) return [];
  
  let allCodes: SnomedCode[] = [];
  
  if (!category || category === 'complaint') {
    allCodes = [...allCodes, ...SNOMED_COMPLAINTS];
  }
  if (!category || category === 'diagnosis') {
    allCodes = [...allCodes, ...SNOMED_DIAGNOSES];
  }
  if (!category || category === 'treatment') {
    allCodes = [...allCodes, ...SNOMED_TREATMENTS];
  }
  if (!category || category === 'lab') {
    allCodes = [...allCodes, ...SNOMED_LABS];
  }
  
  return allCodes.filter(code => 
    code.term.toLowerCase().includes(lowerQuery) ||
    code.code.includes(lowerQuery)
  ).slice(0, 10);
}
